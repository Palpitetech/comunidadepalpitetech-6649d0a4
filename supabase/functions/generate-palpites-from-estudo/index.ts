import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { extrairBaseGeracaoLotofacil } from "../_shared/guide-post/lotofacil/base-geracao.ts";
import { extrairBaseGeracaoMegasena } from "../_shared/guide-post/megasena/base-geracao.ts";
import type { BaseGeracao, Concurso } from "../_shared/guide-post/types.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// =============================================================================
// Gerador de Palpites a partir de Estudo da Comunidade — V2 (determinístico).
//
// Pipeline:
//   1. Carrega o post + fatos_snapshot.
//   2. Lê base_geracao (canônica). Se ausente, recalcula on-the-fly
//      a partir dos concursos do banco (rehidratação retro-compatível).
//   3. Gating premium + quota.
//   4. Aplica algoritmo determinístico:
//        - FIXAR: 100% dos jogos
//        - APOIO: cota mínima por jogo
//        - EXCLUIR: 0% dos jogos
//        - filtros opcionais: qtd_repetidas_alvo, qtd_moldura_alvo
//        - diversidade: Hamming ≥3 vs jogos já gerados
//   5. Monta EstrategiaData detalhada (fixas/evitadas/filtros).
//   6. Humaniza apenas a `conclusao` via IA (timeout 4s; fallback template).
// =============================================================================

const TOTAL_BY_LOTERIA: Record<string, {
  total: number;
  sorteadasMin: number;
  sorteadasMax: number;
  defaultDezenas: number;
  moldura: number[];
}> = {
  lotofacil: {
    total: 25, sorteadasMin: 15, sorteadasMax: 20, defaultDezenas: 15,
    moldura: [1, 2, 3, 4, 5, 6, 10, 11, 15, 16, 20, 21, 22, 23, 24, 25],
  },
  megasena: {
    total: 60, sorteadasMin: 6, sorteadasMax: 10, defaultDezenas: 6,
    moldura: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 21, 31, 41, 20, 30, 40, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60],
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
  base_geracao?: BaseGeracao | null;
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

// =============================================================================
// Helpers
// =============================================================================

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function intersecCount(a: number[], b: number[]): number {
  const set = new Set(a);
  let n = 0;
  for (const x of b) if (set.has(x)) n++;
  return n;
}

function hamming(a: number[], b: number[]): number {
  // distance = qtd em A não presentes em B (sets de mesmo tamanho)
  const setB = new Set(b);
  let diff = 0;
  for (const x of a) if (!setB.has(x)) diff++;
  return diff;
}

function rotuloTema(tema: string): string {
  const map: Record<string, string> = {
    analise_moldura: "Análise da Moldura",
    analise_movimentacao: "Quentes & Frias",
    analise_repetidas: "Repetidas do Concurso Anterior",
    analise_ciclo: "Ciclo de Dezenas",
    analise_cenarios: "Cenários do Dia (Equilibrado)",
    analise_ficar_de_olho: "Ficar de Olho — Desaceleração",
    analise_linhas: "Distribuição por Linhas",
    analise_colunas: "Distribuição por Colunas",
    analise_posicoes_iniciais: "Posições Iniciais",
    analise_posicoes_finais: "Posições Finais",
    analise_como_calculamos: "Como Calculamos",
  };
  return map[tema] || "Análise do Estudo";
}

// =============================================================================
// Algoritmo determinístico
// =============================================================================

interface GerarOpts {
  total: number;
  qtdDezenas: number;
  base: BaseGeracao;
  cotaApoioMin: number;
  jaGerados: number[][];
}

function gerarJogo(opts: GerarOpts): number[] | null {
  const { total, qtdDezenas, base, cotaApoioMin, jaGerados } = opts;
  const fixarSet = new Set(base.fixar.filter((d) => d >= 1 && d <= total));
  const excluirSet = new Set(base.excluir.filter((d) => d >= 1 && d <= total && !fixarSet.has(d)));
  const apoioPool = base.apoio.filter((d) => d >= 1 && d <= total && !fixarSet.has(d) && !excluirSet.has(d));
  const olhoPool = (base.ficar_de_olho || []).filter(
    (d) => d >= 1 && d <= total && !fixarSet.has(d) && !excluirSet.has(d) && !apoioPool.includes(d),
  );

  // Universo livre = 1..total fora de fixar/excluir/apoio/olho
  const universoLivre: number[] = [];
  for (let d = 1; d <= total; d++) {
    if (!fixarSet.has(d) && !excluirSet.has(d) && !apoioPool.includes(d) && !olhoPool.includes(d)) {
      universoLivre.push(d);
    }
  }

  const espacoLivre = qtdDezenas - fixarSet.size;
  if (espacoLivre < 0) return null; // fixar maior que qtd: impossível

  const TENT_MAX = 80;
  for (let t = 0; t < TENT_MAX; t++) {
    const dezenas = new Set<number>(fixarSet);

    // 1) Apoio: sortear até cota mínima
    const cotaReal = Math.min(cotaApoioMin, apoioPool.length, espacoLivre);
    for (const d of shuffle(apoioPool).slice(0, cotaReal)) dezenas.add(d);

    // 2) Coringa "ficar_de_olho": injeta 0-1 com 50% de chance
    if (olhoPool.length > 0 && dezenas.size < qtdDezenas && Math.random() < 0.5) {
      const c = olhoPool[Math.floor(Math.random() * olhoPool.length)];
      dezenas.add(c);
    }

    // 3) Completar com universo livre + apoio remanescente
    const restantes = [
      ...apoioPool.filter((d) => !dezenas.has(d)),
      ...universoLivre,
      ...olhoPool.filter((d) => !dezenas.has(d)),
    ];
    for (const d of shuffle(restantes)) {
      if (dezenas.size >= qtdDezenas) break;
      dezenas.add(d);
    }

    if (dezenas.size !== qtdDezenas) continue;
    const arr = Array.from(dezenas).sort((a, b) => a - b);

    // Validações
    if (base.qtd_repetidas_alvo && base.ultimo_sorteio && base.ultimo_sorteio.length > 0) {
      const rep = intersecCount(arr, base.ultimo_sorteio);
      const { min, max } = base.qtd_repetidas_alvo;
      if (rep < min || rep > max) continue;
    }
    if (base.qtd_moldura_alvo) {
      // Lotofácil: moldura fixa
      const moldSet = new Set([1, 2, 3, 4, 5, 6, 10, 11, 15, 16, 20, 21, 22, 23, 24, 25]);
      const qm = arr.filter((d) => moldSet.has(d)).length;
      const { min, max } = base.qtd_moldura_alvo;
      if (qm < min || qm > max) continue;
    }

    // Diversidade vs jogos já gerados (Hamming ≥3)
    let okDiv = true;
    for (const prev of jaGerados) {
      if (hamming(arr, prev) < 3) { okDiv = false; break; }
    }
    if (!okDiv) continue;

    return arr;
  }

  return null;
}

// =============================================================================
// EstrategiaData
// =============================================================================

function montarEstrategia(
  base: BaseGeracao,
  snapshot: FatosSnapshot,
  qtdDezenas: number,
  quantidade: number,
  cotaApoioMin: number,
): EstrategiaData {
  const labelTema = rotuloTema(base.tema);
  const ferramentas = [
    labelTema,
    `Estudo do concurso ${snapshot.proximo_concurso}`,
    `Base ${snapshot.ultimo_concurso} → ${snapshot.proximo_concurso}`,
    "Motor determinístico v2",
  ];

  const dezenas_fixas: DezenaInfo[] = [];
  if (base.fixar.length > 0) {
    dezenas_fixas.push({
      dezenas: [...base.fixar].sort((a, b) => a - b),
      motivo: `${base.motivo_fixar || "Núcleo do estudo"}. Entram em TODOS os ${quantidade} jogo(s).`,
    });
  }
  if (base.apoio.length > 0) {
    dezenas_fixas.push({
      dezenas: [...base.apoio].sort((a, b) => a - b),
      motivo: `${base.motivo_apoio || "Apoio do estudo"}. Cada jogo carrega no mínimo ${cotaApoioMin} destas.`,
    });
  }

  const dezenas_evitadas: DezenaInfo[] = [];
  if (base.excluir.length > 0) {
    dezenas_evitadas.push({
      dezenas: [...base.excluir].sort((a, b) => a - b),
      motivo: `${base.motivo_excluir || "Excluídas pelo estudo"}. NÃO aparecem em nenhum jogo.`,
    });
  }

  const filtros_aplicados: FiltroInfo[] = [];
  if (base.fixar.length > 0) {
    filtros_aplicados.push({
      filtro: "Núcleo obrigatório",
      valor_alvo: `${base.fixar.length} dezena(s) em 100% dos jogos`,
      motivo: `Definidas pelo estudo "${labelTema}" como núcleo de maior probabilidade.`,
    });
  }
  if (base.apoio.length > 0) {
    filtros_aplicados.push({
      filtro: "Apoio mínimo por jogo",
      valor_alvo: `${cotaApoioMin}+ por jogo`,
      motivo: `Cada jogo precisa carregar pelo menos ${cotaApoioMin} dezena(s) do grupo de apoio.`,
    });
  }
  if (base.excluir.length > 0) {
    filtros_aplicados.push({
      filtro: "Exclusão definitiva",
      valor_alvo: `${base.excluir.length} dezena(s)`,
      motivo: `Padrão histórico mostra baixa probabilidade dessas dezenas no próximo sorteio.`,
    });
  }
  if (base.qtd_repetidas_alvo) {
    filtros_aplicados.push({
      filtro: "Repetidas do último sorteio",
      valor_alvo: `entre ${base.qtd_repetidas_alvo.min} e ${base.qtd_repetidas_alvo.max}`,
      motivo: `Histórico aponta essa faixa como mais provável (concurso ${snapshot.ultimo_concurso}).`,
    });
  }
  if (base.qtd_moldura_alvo) {
    filtros_aplicados.push({
      filtro: "Dezenas da moldura",
      valor_alvo: `entre ${base.qtd_moldura_alvo.min} e ${base.qtd_moldura_alvo.max}`,
      motivo: `Janela analisada mostra esse range como padrão dominante.`,
    });
  }
  filtros_aplicados.push({
    filtro: "Diversidade entre jogos",
    valor_alvo: "Hamming ≥3",
    motivo: "Cada jogo difere do anterior em pelo menos 3 dezenas — evita palpites quase iguais.",
  });

  return {
    ferramentas,
    dezenas_fixas,
    dezenas_evitadas: dezenas_evitadas.length > 0 ? dezenas_evitadas : undefined,
    filtros_aplicados,
    conclusao: conclusaoTemplate(base, snapshot, qtdDezenas, quantidade),
  };
}

function conclusaoTemplate(
  base: BaseGeracao,
  snapshot: FatosSnapshot,
  qtdDezenas: number,
  quantidade: number,
): string {
  const labelTema = rotuloTema(base.tema);
  const partes = [
    `Geramos ${quantidade} jogo(s) de ${qtdDezenas} dezenas seguindo o estudo "${labelTema}" do concurso ${snapshot.proximo_concurso}.`,
  ];
  if (base.fixar.length > 0) partes.push(`Fixamos ${base.fixar.length} dezena(s) do núcleo em 100% dos jogos.`);
  if (base.excluir.length > 0) partes.push(`Excluímos ${base.excluir.length} dezena(s) que o estudo desaconselha.`);
  if (base.observacao_principal) partes.push(base.observacao_principal);
  return partes.join(" ");
}

async function humanizarConclusao(
  base: EstrategiaData,
  snapshot: FatosSnapshot,
  baseGen: BaseGeracao,
  quantidade: number,
  qtdDezenas: number,
): Promise<string> {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) return base.conclusao;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4000);

  try {
    const prompt = `Reescreva esta conclusão em 2-3 frases naturais e diretas (máx 280 caracteres). Mantenha os números e o tema. NÃO mencione IA.

Tema: ${rotuloTema(baseGen.tema)}
Concurso: ${snapshot.proximo_concurso}
Quantidade: ${quantidade} jogos de ${qtdDezenas} dezenas
Núcleo fixado: ${baseGen.fixar.length} dezenas
Excluídas: ${baseGen.excluir.length} dezenas
Conclusão atual: ${base.conclusao}

Responda APENAS o texto reescrito, sem aspas, sem markdown.`;

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      signal: controller.signal,
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 200,
      }),
    });
    clearTimeout(timeout);
    if (!resp.ok) return base.conclusao;
    const data = await resp.json();
    const texto = data?.choices?.[0]?.message?.content?.trim();
    return texto && texto.length > 10 ? texto : base.conclusao;
  } catch {
    clearTimeout(timeout);
    return base.conclusao;
  }
}

// =============================================================================
// Rehidratação retro-compatível: reconstrói BaseGeracao a partir do banco
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

    const cfg = TOTAL_BY_LOTERIA[snapshot.loteria];
    if (!cfg) {
      return new Response(JSON.stringify({
        error: `Loteria "${snapshot.loteria}" ainda não suportada pelo gerador de estudos.`,
      }), {
        status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Bloqueio explícito de "como calculamos"
    if ((snapshot.tipo_post || "").includes("como_calculamos")) {
      return new Response(JSON.stringify({
        error: "Este estudo é um post explicativo e não tem regras de geração. Escolha outro estudo.",
      }), {
        status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const qtdDezenasReq = Number(body.qtd_dezenas) || cfg.defaultDezenas;
    const qtdDezenas = Math.min(Math.max(qtdDezenasReq, cfg.sorteadasMin), cfg.sorteadasMax);

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
    let base: BaseGeracao | null = snapshot.base_geracao || null;
    let viaRehidratacao = false;
    if (!base) {
      base = await rehidratarBaseGeracao(supabaseAdmin, snapshot);
      viaRehidratacao = true;
    }

    if (!base || (base.fixar.length === 0 && base.apoio.length === 0)) {
      return new Response(JSON.stringify({
        error: "Este estudo é da versão anterior e não pode gerar palpites. Selecione um estudo a partir de hoje.",
      }), { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ---- Gerar jogos ----
    const espacoLivre = qtdDezenas - base.fixar.length;
    const cotaApoioMin = Math.max(0, Math.min(
      base.apoio.length,
      Math.ceil(espacoLivre * 0.6),
    ));

    const jogosArr: number[][] = [];
    let tentativasTotais = 0;
    while (jogosArr.length < quantidade && tentativasTotais < quantidade * 30) {
      tentativasTotais++;
      const jogo = gerarJogo({
        total: cfg.total,
        qtdDezenas,
        base,
        cotaApoioMin,
        jaGerados: jogosArr,
      });
      if (jogo) jogosArr.push(jogo);
    }

    // Fallback de emergência: se diversidade impediu, gera relaxando Hamming
    if (jogosArr.length < quantidade) {
      console.warn(`[gerador-estudo] só ${jogosArr.length}/${quantidade} com diversidade; relaxando.`);
      while (jogosArr.length < quantidade) {
        const jogo = gerarJogo({
          total: cfg.total, qtdDezenas, base, cotaApoioMin, jaGerados: [],
        });
        if (!jogo) break;
        jogosArr.push(jogo);
      }
    }

    if (jogosArr.length === 0) {
      return new Response(JSON.stringify({
        error: "Não foi possível gerar palpites com as regras deste estudo. Tente outro estudo.",
      }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ---- Estratégia + humanização ----
    const estrategiaBase = montarEstrategia(base, snapshot, qtdDezenas, jogosArr.length, cotaApoioMin);
    const conclusaoFinal = await humanizarConclusao(estrategiaBase, snapshot, base, jogosArr.length, qtdDezenas);
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
