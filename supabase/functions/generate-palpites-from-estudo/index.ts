import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// =============================================================================
// Gerador de palpites baseado em um post de estudo da comunidade.
//
// Lê fatos_snapshot do post e produz N jogos alinhados ao tema:
//   • analise_moldura  → força ≥X dezenas da moldura
//   • analise_repetidas → força N repetidas do último concurso
//   • analise_movimentacao / analise_quentes → puxa quentes do snapshot
//   • analise_ciclo → prioriza dezenas faltantes do ciclo
//   • outros → distribuição balanceada usando dezenas_chave do snapshot
//
// Determinístico (sem IA). Reusa o gating premium do gerador clássico.
// =============================================================================

const TOTAL_BY_LOTERIA: Record<string, { total: number; sorteadas: number; moldura: number[] }> = {
  lotofacil: {
    total: 25,
    sorteadas: 15,
    moldura: [1, 2, 3, 4, 5, 6, 10, 11, 15, 16, 20, 21, 22, 23, 24, 25],
  },
  megasena: {
    total: 60,
    sorteadas: 6,
    moldura: [
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
      11, 21, 31, 41,
      20, 30, 40, 50,
      51, 52, 53, 54, 55, 56, 57, 58, 59, 60,
    ],
  },
};

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
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function gerarJogo(
  total: number,
  sorteadas: number,
  preferenciais: number[],
  excluidas: Set<number>,
  minPreferenciais: number,
): number[] {
  const universo = Array.from({ length: total }, (_, i) => i + 1).filter((n) => !excluidas.has(n));
  const prefDisponivel = preferenciais.filter((n) => !excluidas.has(n));

  const escolhidas = new Set<number>();
  // 1) garantir mínimo de preferenciais
  const prefShuf = shuffle(prefDisponivel);
  for (const n of prefShuf) {
    if (escolhidas.size >= Math.min(minPreferenciais, sorteadas)) break;
    escolhidas.add(n);
  }
  // 2) completar com universo geral
  const restoShuf = shuffle(universo);
  for (const n of restoShuf) {
    if (escolhidas.size >= sorteadas) break;
    escolhidas.add(n);
  }
  return Array.from(escolhidas).sort((a, b) => a - b);
}

function preferenciasDoTema(tema: string, snapshot: FatosSnapshot, loteriaCfg: { moldura: number[]; sorteadas: number }) {
  const ext = snapshot.extras || {};
  // Heurística: extras pode trazer arrays como "moldura", "quentes", "frias", "repetidas", "faltantes_ciclo"
  const arr = (k: string): number[] => Array.isArray((ext as any)[k]) ? ((ext as any)[k] as number[]) : [];

  switch (tema) {
    case "analise_moldura":
      return {
        preferenciais: arr("moldura").length ? arr("moldura") : loteriaCfg.moldura,
        minPreferenciais: Math.ceil(loteriaCfg.sorteadas * 0.55),
      };
    case "analise_repetidas":
      return {
        preferenciais: arr("repetidas_recomendadas").length ? arr("repetidas_recomendadas") : arr("ultimo_concurso_dezenas"),
        minPreferenciais: Math.min(arr("repetidas_recomendadas").length || 6, loteriaCfg.sorteadas - 1),
      };
    case "analise_movimentacao":
    case "analise_quentes":
      return {
        preferenciais: arr("quentes"),
        minPreferenciais: Math.ceil(loteriaCfg.sorteadas * 0.5),
      };
    case "analise_frias":
      return {
        preferenciais: arr("frias"),
        minPreferenciais: Math.ceil(loteriaCfg.sorteadas * 0.4),
      };
    case "analise_ciclo":
      return {
        preferenciais: arr("dezenas_faltantes"),
        minPreferenciais: Math.min(arr("dezenas_faltantes").length, Math.ceil(loteriaCfg.sorteadas * 0.5)),
      };
    case "analise_moldura_megasena":
      return {
        preferenciais: arr("moldura").length ? arr("moldura") : loteriaCfg.moldura,
        minPreferenciais: Math.ceil(loteriaCfg.sorteadas * 0.6),
      };
    default:
      // Fallback: usa numeros_permitidos do snapshot como pool ranqueado
      return {
        preferenciais: snapshot.numeros_permitidos.slice(0, Math.ceil(loteriaCfg.sorteadas * 1.5)),
        minPreferenciais: Math.ceil(loteriaCfg.sorteadas * 0.4),
      };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
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
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json().catch(() => ({}));
    const postId: string | undefined = body.post_id;
    const quantidade = Math.min(Math.max(body.quantidade || 5, 1), 20);

    if (!postId) {
      return new Response(JSON.stringify({ error: "post_id é obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Carrega o post
    const { data: post, error: postErr } = await supabaseAdmin
      .from("postagens")
      .select("id, titulo, loteria_tag, tema_estudo, fatos_snapshot, status")
      .eq("id", postId)
      .maybeSingle();

    if (postErr || !post) {
      return new Response(JSON.stringify({ error: "Post não encontrado" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const snapshot = post.fatos_snapshot as FatosSnapshot | null;
    if (!snapshot || !snapshot.loteria) {
      return new Response(JSON.stringify({
        error: "Este estudo não possui dados de geração disponíveis. Tente um post mais recente.",
      }), {
        status: 422,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const cfg = TOTAL_BY_LOTERIA[snapshot.loteria];
    if (!cfg) {
      return new Response(JSON.stringify({
        error: `Loteria "${snapshot.loteria}" ainda não suportada pelo gerador de estudos.`,
      }), {
        status: 422,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Gating premium reusando o mesmo padrão do gerador clássico
    const { data: userRole } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();
    const isAdmin = !!userRole;

    if (!isAdmin) {
      const { data: perfil } = await supabaseAdmin
        .from("perfis")
        .select("status_assinatura, validade_assinatura")
        .eq("id", user.id)
        .maybeSingle();
      const ativo = perfil?.status_assinatura === "ativa" &&
        (!perfil.validade_assinatura || new Date(perfil.validade_assinatura) > new Date());
      if (!ativo) {
        return new Response(JSON.stringify({
          error: "Recurso premium. Ative seu plano para gerar palpites baseados em estudos.",
          requires_subscription: true,
        }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Gera os jogos
    const tema = post.tema_estudo || snapshot.tipo_post || "geral";
    const { preferenciais, minPreferenciais } = preferenciasDoTema(tema, snapshot, cfg);
    const excluidas = new Set<number>();

    const jogos: number[][] = [];
    const seen = new Set<string>();
    let tentativas = 0;
    while (jogos.length < quantidade && tentativas < quantidade * 10) {
      tentativas++;
      const j = gerarJogo(cfg.total, cfg.sorteadas, preferenciais, excluidas, minPreferenciais);
      const key = j.join("-");
      if (seen.has(key)) continue;
      seen.add(key);
      jogos.push(j);
    }

    return new Response(
      JSON.stringify({
        success: true,
        jogos,
        baseado_em: {
          post_id: post.id,
          titulo: post.titulo,
          loteria: snapshot.loteria,
          loteria_tag: snapshot.loteria_tag,
          tema,
          ultimo_concurso: snapshot.ultimo_concurso,
          proximo_concurso: snapshot.proximo_concurso,
        },
        estrategia: {
          tipo: "estudo",
          preferenciais_usadas: preferenciais.slice(0, 20),
          min_preferenciais_por_jogo: minPreferenciais,
        },
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
