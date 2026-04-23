import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// =============================================================================
// Gerador de Palpites baseado em Estudo da Comunidade.
//
// Pipeline:
//   1. Carrega o post + fatos_snapshot.
//   2. Verifica gating premium e quota separada (gerador_estudo_daily_usage).
//   3. Gera N jogos determinísticos puxando preferências do tema do estudo.
//    4. Monta EstrategiaData (mesmo shape do gerador clássico) por tema.
//    5. Tenta humanizar `conclusao` via Lovable AI Gemini Flash (timeout 4s).
//       Se falhar, mantém a conclusão template.
//   6. Retorna payload no MESMO shape do /generate-palpites:
//       { jogos: [{dezenas:[]}], estrategia, baseado_em, remaining_today, max_per_day }
// =============================================================================

const TOTAL_BY_LOTERIA: Record<string, {
  total: number;
  sorteadasMin: number;
  sorteadasMax: number;
  defaultDezenas: number;
  moldura: number[];
}> = {
  lotofacil: {
    total: 25,
    sorteadasMin: 15,
    sorteadasMax: 20,
    defaultDezenas: 15,
    moldura: [1, 2, 3, 4, 5, 6, 10, 11, 15, 16, 20, 21, 22, 23, 24, 25],
  },
  megasena: {
    total: 60,
    sorteadasMin: 6,
    sorteadasMax: 10,
    defaultDezenas: 6,
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

interface DezenaInfo { dezenas: number[]; motivo: string; }
interface FiltroInfo { filtro: string; valor_alvo?: string; motivo: string; }
interface EstrategiaData {
  ferramentas: string[];
  dezenas_fixas?: DezenaInfo[];
  dezenas_evitadas?: DezenaInfo[];
  filtros_aplicados: FiltroInfo[];
  conclusao: string;
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
  for (const n of shuffle(prefDisponivel)) {
    if (escolhidas.size >= Math.min(minPreferenciais, sorteadas)) break;
    escolhidas.add(n);
  }
  for (const n of shuffle(universo)) {
    if (escolhidas.size >= sorteadas) break;
    escolhidas.add(n);
  }
  return Array.from(escolhidas).sort((a, b) => a - b);
}

function arrFromExtras(ext: Record<string, unknown>, k: string): number[] {
  return Array.isArray((ext as any)[k]) ? ((ext as any)[k] as number[]) : [];
}

function preferenciasDoTema(
  tema: string,
  snapshot: FatosSnapshot,
  cfg: { moldura: number[]; defaultDezenas: number },
  qtdDezenas: number,
) {
  const ext = snapshot.extras || {};
  switch (tema) {
    case "analise_moldura":
    case "analise_moldura_megasena":
      return {
        preferenciais: arrFromExtras(ext, "moldura").length ? arrFromExtras(ext, "moldura") : cfg.moldura,
        minPreferenciais: Math.ceil(qtdDezenas * 0.6),
      };
    case "analise_repetidas":
      return {
        preferenciais: arrFromExtras(ext, "repetidas_recomendadas").length
          ? arrFromExtras(ext, "repetidas_recomendadas")
          : arrFromExtras(ext, "ultimo_concurso_dezenas"),
        minPreferenciais: Math.min(arrFromExtras(ext, "repetidas_recomendadas").length || 6, qtdDezenas - 1),
      };
    case "analise_movimentacao":
    case "analise_quentes":
      return {
        preferenciais: arrFromExtras(ext, "quentes"),
        minPreferenciais: Math.ceil(qtdDezenas * 0.5),
      };
    case "analise_frias":
      return {
        preferenciais: arrFromExtras(ext, "frias"),
        minPreferenciais: Math.ceil(qtdDezenas * 0.4),
      };
    case "analise_ciclo":
      return {
        preferenciais: arrFromExtras(ext, "dezenas_faltantes"),
        minPreferenciais: Math.min(arrFromExtras(ext, "dezenas_faltantes").length, Math.ceil(qtdDezenas * 0.5)),
      };
    default:
      return {
        preferenciais: snapshot.numeros_permitidos.slice(0, Math.ceil(qtdDezenas * 1.5)),
        minPreferenciais: Math.ceil(qtdDezenas * 0.4),
      };
  }
}

function rotuloTema(tema: string): string {
  const map: Record<string, string> = {
    analise_moldura: "Análise da Moldura",
    analise_moldura_megasena: "Análise da Moldura",
    analise_repetidas: "Repetidas do Concurso Anterior",
    analise_movimentacao: "Movimentação das Dezenas",
    analise_quentes: "Dezenas Quentes",
    analise_frias: "Dezenas Frias",
    analise_ciclo: "Ciclo de Dezenas",
  };
  return map[tema] || "Análise Estatística";
}

function montarEstrategia(
  tema: string,
  snapshot: FatosSnapshot,
  preferenciais: number[],
  minPreferenciais: number,
  qtdDezenas: number,
  quantidade: number,
): EstrategiaData {
  const labelTema = rotuloTema(tema);
  const ext = snapshot.extras || {};
  const ferramentas = [labelTema, "Snapshot do estudo", `Concurso ${snapshot.proximo_concurso}`];

  const dezenas_fixas: DezenaInfo[] = [];
  if (preferenciais.length > 0) {
    dezenas_fixas.push({
      dezenas: preferenciais.slice(0, 16),
      motivo: `Dezenas-chave do estudo "${labelTema}", priorizadas em todos os jogos.`,
    });
  }

  const filtros_aplicados: FiltroInfo[] = [
    {
      filtro: "Mínimo de dezenas-chave",
      valor_alvo: `${minPreferenciais}+ por jogo`,
      motivo: `Cada jogo carrega pelo menos ${minPreferenciais} dezenas alinhadas ao estudo do concurso ${snapshot.proximo_concurso}.`,
    },
    {
      filtro: "Tema do estudo",
      valor_alvo: labelTema,
      motivo: snapshot.recomendacao_direta || "Estratégia recomendada pelo estudo da comunidade.",
    },
  ];

  if (Array.isArray((ext as any).dezenas_evitadas) && ((ext as any).dezenas_evitadas as number[]).length > 0) {
    return {
      ferramentas,
      dezenas_fixas,
      dezenas_evitadas: [{
        dezenas: (ext as any).dezenas_evitadas as number[],
        motivo: "Dezenas marcadas como evitadas no estudo.",
      }],
      filtros_aplicados,
      conclusao: conclusaoTemplate(tema, snapshot, qtdDezenas, quantidade),
    };
  }

  return {
    ferramentas,
    dezenas_fixas,
    filtros_aplicados,
    conclusao: conclusaoTemplate(tema, snapshot, qtdDezenas, quantidade),
  };
}

function conclusaoTemplate(tema: string, snapshot: FatosSnapshot, qtdDezenas: number, quantidade: number): string {
  const labelTema = rotuloTema(tema);
  return `Geramos ${quantidade} jogo(s) de ${qtdDezenas} dezenas seguindo o estudo "${labelTema}" do concurso ${snapshot.proximo_concurso}. ${snapshot.recomendacao_direta || "Estratégia baseada nos padrões identificados pelo estudo."}`;
}

async function humanizarConclusao(
  base: EstrategiaData,
  snapshot: FatosSnapshot,
  tema: string,
  quantidade: number,
  qtdDezenas: number,
): Promise<string> {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) return base.conclusao;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4000);

  try {
    const prompt = `Você é um analista de loteria. Reescreva esta conclusão em 2-3 frases naturais, persuasivas e diretas (máx 280 caracteres). Mantenha os números e o tema.

Tema: ${rotuloTema(tema)}
Concurso: ${snapshot.proximo_concurso}
Quantidade: ${quantidade} jogos de ${qtdDezenas} dezenas
Recomendação do estudo: ${snapshot.recomendacao_direta || snapshot.resumo || "—"}
Conclusão atual: ${base.conclusao}

Responda APENAS o texto reescrito, sem aspas, sem markdown.`;

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 200,
      }),
    });
    clearTimeout(timeout);

    if (!resp.ok) {
      console.warn("[humanizar] AI gateway falhou", resp.status);
      return base.conclusao;
    }
    const data = await resp.json();
    const texto = data?.choices?.[0]?.message?.content?.trim();
    return texto && texto.length > 10 ? texto : base.conclusao;
  } catch (e) {
    clearTimeout(timeout);
    console.warn("[humanizar] timeout ou erro:", e instanceof Error ? e.message : e);
    return base.conclusao;
  }
}

const PREMIUM_MAX = 30;

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
    const quantidade = Math.min(Math.max(Number(body.quantidade) || 5, 1), 12);

    if (!postId) {
      return new Response(JSON.stringify({ error: "post_id é obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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
        error: "Este estudo não possui dados de geração disponíveis. Tente um estudo mais recente.",
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

    // qtd_dezenas com clamp pela loteria
    const qtdDezenasReq = Number(body.qtd_dezenas) || cfg.defaultDezenas;
    const qtdDezenas = Math.min(Math.max(qtdDezenasReq, cfg.sorteadasMin), cfg.sorteadasMax);

    // Gating + quota
    const { data: userRole } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();
    const isAdmin = !!userRole;

    let maxPerDay = 0;
    let remainingToday = 0;

    if (isAdmin) {
      maxPerDay = -1; // ∞
      remainingToday = 999;
    } else {
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

      maxPerDay = PREMIUM_MAX;

      // Incrementa quota
      const { data: rest, error: quotaErr } = await supabaseAdmin
        .rpc("incrementar_uso_gerador_estudo", { p_user_id: user.id, p_max: PREMIUM_MAX });

      if (quotaErr) {
        const msg = (quotaErr as any)?.message || "";
        if (msg.includes("LIMIT_REACHED")) {
          return new Response(JSON.stringify({
            error: `Limite diário de ${PREMIUM_MAX} gerações de estudo atingido. Tente novamente amanhã.`,
            remaining_today: 0,
            max_per_day: PREMIUM_MAX,
          }), {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        console.error("[quota] erro:", quotaErr);
        return new Response(JSON.stringify({ error: "Erro ao validar quota" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      remainingToday = typeof rest === "number" ? rest : 0;
    }

    // Geração determinística
    const tema = post.tema_estudo || snapshot.tipo_post || "geral";
    const { preferenciais, minPreferenciais } = preferenciasDoTema(tema, snapshot, cfg, qtdDezenas);
    const excluidas = new Set<number>();

    const jogosArr: number[][] = [];
    const seen = new Set<string>();
    let tentativas = 0;
    while (jogosArr.length < quantidade && tentativas < quantidade * 20) {
      tentativas++;
      const j = gerarJogo(cfg.total, qtdDezenas, preferenciais, excluidas, minPreferenciais);
      if (j.length !== qtdDezenas) continue;
      const key = j.join("-");
      if (seen.has(key)) continue;
      seen.add(key);
      jogosArr.push(j);
    }

    // Estratégia + humanização
    const estrategiaBase = montarEstrategia(tema, snapshot, preferenciais, minPreferenciais, qtdDezenas, quantidade);
    const conclusaoFinal = await humanizarConclusao(estrategiaBase, snapshot, tema, quantidade, qtdDezenas);
    const estrategia: EstrategiaData = { ...estrategiaBase, conclusao: conclusaoFinal };

    // Payload no MESMO shape do /generate-palpites
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
          tema,
          tema_label: rotuloTema(tema),
          ultimo_concurso: snapshot.ultimo_concurso,
          proximo_concurso: snapshot.proximo_concurso,
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
