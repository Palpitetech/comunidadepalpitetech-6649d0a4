import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { extrairBaseGeracaoLotofacil } from "../_shared/guide-post/lotofacil/base-geracao.ts";
import { extrairBaseGeracaoMegasena } from "../_shared/guide-post/megasena/base-geracao.ts";
import type { BaseGeracao, Concurso } from "../_shared/guide-post/types.ts";
import { getLotteryConfig, clampQtdDezenas } from "../_shared/gerador/lottery-config.ts";
import { aplicarFiltrosUsuario, gerarLote } from "../_shared/gerador/validate-jogo.ts";
import { humanizarConclusao, montarEstrategia, rotuloTema } from "../_shared/gerador/strategy-builder.ts";
import type { EstrategiaData } from "../_shared/gerador/types.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// =============================================================================
// Gerador de Palpites a partir de Estudo da Comunidade — V3 (shared primitives).
//
// Pipeline:
//   1. Carrega o post + fatos_snapshot.
//   2. Lê base_geracao (canônica). Se ausente, recalcula on-the-fly
//      a partir dos concursos do banco (rehidratação retro-compatível).
//   3. Aplica filtros do usuário (fixas/excluídas) por cima da base.
//   4. Gating premium + quota atômica via RPC.
//   5. Gera N jogos com motor determinístico shared (Hamming ≥3).
//   6. Monta EstrategiaData rica + humaniza conclusão (4s timeout, log IA).
// =============================================================================

interface FatosSnapshot {
  loteria: string;
  loteria_tag: string;
  tipo_post: string;
  ultimo_concurso: number;
  proximo_concurso: number;
  resumo: string;
  recomendacao_direta: string;
  extras: Record<string, unknown>;
  numeros_permitidos: number[];
  base_geracao?: BaseGeracao | null;
}

// =============================================================================
// Rehidratação retro-compatível
// =============================================================================

async function rehidratarBaseGeracao(
  supabaseAdmin: ReturnType<typeof createClient>,
  snapshot: FatosSnapshot,
): Promise<BaseGeracao | null> {
  if (snapshot.loteria !== "lotofacil" && snapshot.loteria !== "megasena") return null;
  const { data, error } = await supabaseAdmin
    .from("resultados_loterias")
    .select("concurso, dezenas, data_sorteio, ciclo_numero, dezenas_faltantes_ciclo, qtd_pares, qtd_impares, qtd_repetidas, qtd_primos, qtd_moldura")
    .eq("loteria", snapshot.loteria)
    .lte("concurso", snapshot.ultimo_concurso)
    .order("concurso", { ascending: false })
    .limit(snapshot.loteria === "megasena" ? 20 : 10);
  if (error || !data || data.length === 0) return null;
  const concursos: Concurso[] = (data as any[]).map((r) => ({
    concurso_id: r.concurso,
    dezenas: r.dezenas,
    data_sorteio: r.data_sorteio,
    ciclo_numero: r.ciclo_numero,
    dezenas_faltantes_ciclo: r.dezenas_faltantes_ciclo,
    qtd_pares: r.qtd_pares,
    qtd_impares: r.qtd_impares,
    qtd_repetidas: r.qtd_repetidas,
    qtd_primos: r.qtd_primos,
    qtd_moldura: r.qtd_moldura,
  }));
  if (snapshot.loteria === "megasena") {
    return extrairBaseGeracaoMegasena(snapshot.tipo_post, concursos);
  }
  return extrairBaseGeracaoLotofacil(snapshot.tipo_post, concursos);
}

// =============================================================================
// Handler
// =============================================================================

const PREMIUM_MAX = 30;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Usuário não autenticado" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const body = await req.json().catch(() => ({}));
    const postId: string | undefined = body.post_id;
    const quantidade = Math.min(Math.max(Number(body.quantidade) || 5, 1), 12);

    if (!postId) {
      return new Response(JSON.stringify({ error: "post_id é obrigatório" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: post, error: postErr } = await supabaseAdmin
      .from("postagens")
      .select("id, titulo, loteria_tag, tema_estudo, fatos_snapshot, status")
      .eq("id", postId)
      .maybeSingle();

    if (postErr || !post) {
      return new Response(JSON.stringify({ error: "Post não encontrado" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const snapshot = post.fatos_snapshot as FatosSnapshot | null;
    if (!snapshot || !snapshot.loteria) {
      return new Response(JSON.stringify({
        error: "Este estudo não possui dados de geração disponíveis. Selecione um estudo mais recente.",
      }), {
        status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const cfg = getLotteryConfig(snapshot.loteria);
    if (!cfg) {
      return new Response(JSON.stringify({
        error: `Loteria "${snapshot.loteria}" ainda não suportada pelo gerador de estudos.`,
      }), {
        status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if ((snapshot.tipo_post || "").includes("como_calculamos")) {
      return new Response(JSON.stringify({
        error: "Este estudo é um post explicativo e não tem regras de geração. Escolha outro estudo.",
      }), {
        status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const qtdDezenas = clampQtdDezenas(snapshot.loteria, Number(body.qtd_dezenas));

    // ---- Filtros do usuário ----
    const dezenasFixasUser: number[] = (Array.isArray(body.dezenasFiexas) ? body.dezenasFiexas : [])
      .map((d: unknown) => Math.round(Number(d)))
      .filter((d: number) => d >= 1 && d <= cfg.total)
      .slice(0, Math.max(0, qtdDezenas - 1));
    const dezenasExcluidasUser: number[] = (Array.isArray(body.dezenasExcluidas) ? body.dezenasExcluidas : [])
      .map((d: unknown) => Math.round(Number(d)))
      .filter((d: number) => d >= 1 && d <= cfg.total)
      .slice(0, 10);
    const pedidoEspecial: string = typeof body.pedidoEspecial === "string"
      ? body.pedidoEspecial.trim().slice(0, 200)
      : "";

    // ---- Gating + quota ----
    const { data: userRole } = await supabaseAdmin
      .from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
    const isAdmin = !!userRole;

    let maxPerDay = 0;
    let remainingToday = 0;

    if (isAdmin) {
      maxPerDay = -1; remainingToday = 999;
    } else {
      const { data: perfil } = await supabaseAdmin
        .from("perfis").select("status_assinatura, validade_assinatura").eq("id", user.id).maybeSingle();
      const ativo = perfil?.status_assinatura === "ativa" &&
        (!perfil.validade_assinatura || new Date(perfil.validade_assinatura) > new Date());

      if (!ativo) {
        return new Response(JSON.stringify({
          error: "Recurso premium. Ative seu plano para gerar palpites baseados em estudos.",
          requires_subscription: true,
        }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      maxPerDay = PREMIUM_MAX;
      const { data: rest, error: quotaErr } = await supabaseAdmin
        .rpc("incrementar_uso_gerador_estudo", { p_user_id: user.id, p_max: PREMIUM_MAX });
      if (quotaErr) {
        const msg = (quotaErr as any)?.message || "";
        if (msg.includes("LIMIT_REACHED")) {
          return new Response(JSON.stringify({
            error: `Limite diário de ${PREMIUM_MAX} gerações de estudo atingido. Tente novamente amanhã.`,
            remaining_today: 0, max_per_day: PREMIUM_MAX,
          }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        console.error("[quota] erro:", quotaErr);
        return new Response(JSON.stringify({ error: "Erro ao validar quota" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      remainingToday = typeof rest === "number" ? rest : 0;
    }

    // ---- BaseGeracao: persistida ou rehidratada ----
    let baseDoEstudo: BaseGeracao | null = snapshot.base_geracao || null;
    let viaRehidratacao = false;
    if (!baseDoEstudo) {
      baseDoEstudo = await rehidratarBaseGeracao(supabaseAdmin, snapshot);
      viaRehidratacao = true;
    }

    if (!baseDoEstudo || (baseDoEstudo.fixar.length === 0 && baseDoEstudo.apoio.length === 0)) {
      return new Response(JSON.stringify({
        error: "Este estudo é da versão anterior e não pode gerar palpites. Selecione um estudo a partir de hoje.",
      }), { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ---- Mesclar filtros do usuário ----
    const { base, conflitos } = aplicarFiltrosUsuario(
      baseDoEstudo,
      { dezenasFixas: dezenasFixasUser, dezenasExcluidas: dezenasExcluidasUser },
      cfg.total,
    );

    // ---- Gerar jogos ----
    const espacoLivre = qtdDezenas - base.fixar.length;
    const cotaApoioMin = Math.max(0, Math.min(
      base.apoio.length,
      Math.ceil(espacoLivre * 0.6),
    ));

    const jogosArr = gerarLote({
      total: cfg.total,
      qtdDezenas,
      base,
      cotaApoioMin,
      quantidade,
      moldura: cfg.moldura,
    });

    if (jogosArr.length === 0) {
      return new Response(JSON.stringify({
        error: "Não foi possível gerar palpites com as regras deste estudo. Tente outro estudo.",
      }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ---- Estratégia + humanização ----
    const estrategiaBase = montarEstrategia({
      base,
      qtdDezenas,
      quantidade: jogosArr.length,
      cotaApoioMin,
      ferramentasExtras: [`Estudo do concurso ${snapshot.proximo_concurso}`],
      ultimoConcurso: snapshot.ultimo_concurso,
      proximoConcurso: snapshot.proximo_concurso,
      conflitosUsuario: conflitos,
      pedidoEspecial,
    });

    const conclusaoFinal = await humanizarConclusao({
      estrategiaBase,
      base,
      quantidade: jogosArr.length,
      qtdDezenas,
      proximoConcurso: snapshot.proximo_concurso,
      supabaseAdmin,
      userId: user.id,
      edgeFunction: "generate-palpites-from-estudo",
    });

    const estrategia: EstrategiaData = { ...estrategiaBase, conclusao: conclusaoFinal };

    return new Response(
      JSON.stringify({
        success: true,
        jogos: jogosArr.map((dezenas) => ({ dezenas })),
        estrategia,
        baseado_em: {
          post_id: post.id,
          titulo: post.titulo,
          loteria: snapshot.loteria,
          loteria_tag: snapshot.loteria_tag,
          tema: base.tema,
          tema_label: rotuloTema(base.tema),
          ultimo_concurso: snapshot.ultimo_concurso,
          proximo_concurso: snapshot.proximo_concurso,
          via_rehidratacao: viaRehidratacao,
        },
        remaining_today: remainingToday,
        max_per_day: maxPerDay,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("[generate-palpites-from-estudo] erro:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
