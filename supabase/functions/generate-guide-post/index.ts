import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// =============================================================================
// CONSTANTES
// =============================================================================
const TOTAL_DEZENAS = 25;
const DEZENAS_POR_SORTEIO = 15;
const PERIODO_ANALISE = 10; // janela conforme escopo aprovado
const LIMIAR_QUENTE = 0.6;  // ajustado para janela de 10
const LIMIAR_FRIO = 0.4;

// Moldura visual (16 dezenas — bordas)
const MOLDURA: number[] = [
  1, 2, 3, 4, 5,
  6, 10,
  11, 15,
  16, 20,
  21, 22, 23, 24, 25,
];

interface Concurso {
  concurso_id: number;
  dezenas: number[];
  data_sorteio: string;
  ciclo_numero: number | null;
  dezenas_faltantes_ciclo: number[] | null;
  qtd_pares: number;
  qtd_impares: number;
  qtd_repetidas: number;
  qtd_primos: number;
  qtd_moldura: number;
}

// =============================================================================
// HELPERS DETERMINÍSTICOS (cálculo puro, sem IA)
// =============================================================================

function fmt(d: number): string {
  return d.toString().padStart(2, "0");
}

function calcularFrequencias(concursos: Concurso[]): Map<number, number> {
  const f = new Map<number, number>();
  for (let i = 1; i <= TOTAL_DEZENAS; i++) f.set(i, 0);
  for (const c of concursos) for (const d of c.dezenas) f.set(d, (f.get(d) || 0) + 1);
  return f;
}

function topQuentes(concursos: Concurso[], n = 5): { dezena: number; freq: number; perc: number }[] {
  const f = calcularFrequencias(concursos);
  return Array.from(f.entries())
    .map(([dezena, freq]) => ({ dezena, freq, perc: freq / concursos.length }))
    .sort((a, b) => b.freq - a.freq || a.dezena - b.dezena)
    .slice(0, n);
}

function topFrias(concursos: Concurso[], n = 5): { dezena: number; freq: number; perc: number }[] {
  const f = calcularFrequencias(concursos);
  return Array.from(f.entries())
    .map(([dezena, freq]) => ({ dezena, freq, perc: freq / concursos.length }))
    .sort((a, b) => a.freq - b.freq || a.dezena - b.dezena)
    .slice(0, n);
}

function calcularRepetidasRecomendadas(concursos: Concurso[]): {
  mediaRepetidas: number;
  qtdRecomendada: number;
  topRepetidoras: number[];
  ultimoSorteio: number[];
} {
  if (concursos.length < 2) {
    return { mediaRepetidas: 9, qtdRecomendada: 9, topRepetidoras: [], ultimoSorteio: [] };
  }
  const repetidasPorDezena = new Map<number, number>();
  let totalRep = 0;
  for (let i = 0; i < concursos.length - 1; i++) {
    const atual = new Set(concursos[i].dezenas);
    const ant = new Set(concursos[i + 1].dezenas);
    const inter = [...atual].filter((d) => ant.has(d));
    totalRep += inter.length;
    for (const d of inter) repetidasPorDezena.set(d, (repetidasPorDezena.get(d) || 0) + 1);
  }
  const media = totalRep / (concursos.length - 1);
  const top = Array.from(repetidasPorDezena.entries())
    .sort((a, b) => b[1] - a[1] || a[0] - b[0])
    .slice(0, 8)
    .map(([d]) => d);
  return {
    mediaRepetidas: media,
    qtdRecomendada: Math.round(media),
    topRepetidoras: top,
    ultimoSorteio: concursos[0].dezenas,
  };
}

function calcularMolduraRecomendada(concursos: Concurso[]): {
  mediaMoldura: number;
  qtdRecomendada: number;
  topMoldura: number[];
} {
  const totalMoldura = concursos.reduce((acc, c) => acc + c.qtd_moldura, 0);
  const media = totalMoldura / concursos.length;
  const f = new Map<number, number>();
  for (const d of MOLDURA) f.set(d, 0);
  for (const c of concursos) {
    for (const d of c.dezenas) {
      if (MOLDURA.includes(d)) f.set(d, (f.get(d) || 0) + 1);
    }
  }
  const top = Array.from(f.entries())
    .sort((a, b) => b[1] - a[1] || a[0] - b[0])
    .slice(0, 10)
    .map(([d]) => d);
  return { mediaMoldura: media, qtdRecomendada: Math.round(media), topMoldura: top };
}

function calcularDistribuicaoLinhas(concursos: Concurso[]): {
  medias: number[]; // L1..L5
  recomendacao: number[]; // valores arredondados que somam 15
} {
  const sum = [0, 0, 0, 0, 0];
  for (const c of concursos) {
    for (const d of c.dezenas) {
      const linha = Math.ceil(d / 5) - 1;
      sum[linha]++;
    }
  }
  const medias = sum.map((s) => s / concursos.length);
  return { medias, recomendacao: ajustarPara15(medias) };
}

function calcularDistribuicaoColunas(concursos: Concurso[]): {
  medias: number[]; // C1..C5
  recomendacao: number[];
} {
  const sum = [0, 0, 0, 0, 0];
  for (const c of concursos) {
    for (const d of c.dezenas) {
      const col = ((d - 1) % 5);
      sum[col]++;
    }
  }
  const medias = sum.map((s) => s / concursos.length);
  return { medias, recomendacao: ajustarPara15(medias) };
}

// Arredonda um vetor de médias e ajusta para somar exatamente 15
function ajustarPara15(medias: number[]): number[] {
  const arred = medias.map((m) => Math.round(m));
  let soma = arred.reduce((a, b) => a + b, 0);
  // ajustar pelo maior resíduo
  const residuos = medias.map((m, i) => ({ i, r: m - arred[i] }));
  while (soma !== 15) {
    if (soma < 15) {
      residuos.sort((a, b) => b.r - a.r);
      arred[residuos[0].i]++;
      soma++;
    } else {
      residuos.sort((a, b) => a.r - b.r);
      // não deixar zero virar negativo
      const alvo = residuos.find((x) => arred[x.i] > 0)!;
      arred[alvo.i]--;
      soma--;
    }
  }
  return arred;
}

function dezenasFaltantesCiclo(concursos: Concurso[]): number[] {
  const ultimo = concursos[0];
  if (ultimo?.dezenas_faltantes_ciclo && Array.isArray(ultimo.dezenas_faltantes_ciclo)) {
    return [...ultimo.dezenas_faltantes_ciclo].sort((a, b) => a - b);
  }
  return [];
}

// =============================================================================
// MONTAGEM DE FATOS POR TIPO (entregue à IA)
// =============================================================================

function montarFatos(tipoPost: string, concursos: Concurso[]): {
  resumo: string;
  recomendacaoDireta: string;
} {
  if (!concursos || concursos.length === 0) {
    return { resumo: "Sem dados.", recomendacaoDireta: "Aguarde novos sorteios." };
  }
  const ultimo = concursos[0];
  const proxConcurso = ultimo.concurso_id + 1;

  switch (tipoPost) {
    case "analise_ciclo": {
      const faltantes = dezenasFaltantesCiclo(concursos);
      const ciclo = ultimo.ciclo_numero;
      const resumo = `Concurso ${ultimo.concurso_id} | Ciclo: ${ciclo ?? "n/d"} | ` +
        (faltantes.length > 0
          ? `${faltantes.length} dezena(s) faltam: [${faltantes.map(fmt).join(", ")}]`
          : "Ciclo COMPLETO — novo ciclo iniciando.");
      const recomendacaoDireta = faltantes.length > 0
        ? `Para o concurso ${proxConcurso}: inclua estas ${Math.min(faltantes.length, 5)} dezenas faltantes prioritárias: [${faltantes.slice(0, 5).map(fmt).join(", ")}].`
        : `Para o concurso ${proxConcurso}: o ciclo zerou. Use as dezenas mais quentes da última janela.`;
      return { resumo, recomendacaoDireta };
    }

    case "analise_movimentacao": {
      const quentes = topQuentes(concursos, 5);
      const frias = topFrias(concursos, 5);
      const resumo = `Quentes (10 sorteios): ${quentes.map((q) => `${fmt(q.dezena)} (${q.freq}x)`).join(", ")}\n` +
        `Frias: ${frias.map((f) => `${fmt(f.dezena)} (${f.freq}x)`).join(", ")}`;
      const fixar = quentes.slice(0, 5).map((q) => fmt(q.dezena)).join(", ");
      const excluir = frias.slice(0, 3).map((f) => fmt(f.dezena)).join(", ");
      const recomendacaoDireta = `Para o concurso ${proxConcurso}: FIXAR [${fixar}] e EXCLUIR [${excluir}].`;
      return { resumo, recomendacaoDireta };
    }

    case "analise_moldura": {
      const m = calcularMolduraRecomendada(concursos);
      const resumo = `Média de moldura nos últimos ${concursos.length}: ${m.mediaMoldura.toFixed(1)} dezenas. ` +
        `Top moldura: [${m.topMoldura.slice(0, 8).map(fmt).join(", ")}]`;
      const recomendacaoDireta = `Para o concurso ${proxConcurso}: use ${m.qtdRecomendada} dezenas da moldura, priorizando [${m.topMoldura.slice(0, m.qtdRecomendada).map(fmt).join(", ")}].`;
      return { resumo, recomendacaoDireta };
    }

    case "analise_repetidas": {
      const r = calcularRepetidasRecomendadas(concursos);
      const resumo = `Média de repetidas: ${r.mediaRepetidas.toFixed(1)}. ` +
        `Último sorteio: [${r.ultimoSorteio.map(fmt).join(", ")}]. ` +
        `Mais reincidentes: [${r.topRepetidoras.slice(0, 6).map(fmt).join(", ")}]`;
      const candidatas = r.ultimoSorteio
        .filter((d) => r.topRepetidoras.includes(d))
        .slice(0, r.qtdRecomendada);
      const fallback = r.ultimoSorteio.slice(0, r.qtdRecomendada);
      const escolhidas = candidatas.length >= r.qtdRecomendada ? candidatas : fallback;
      const recomendacaoDireta = `Para o concurso ${proxConcurso}: repita ${r.qtdRecomendada} dezenas do último sorteio, priorizando [${escolhidas.map(fmt).join(", ")}].`;
      return { resumo, recomendacaoDireta };
    }

    case "analise_linhas": {
      const l = calcularDistribuicaoLinhas(concursos);
      const resumo = `Média por linha (10 sorteios): ` +
        l.medias.map((m, i) => `L${i + 1}=${m.toFixed(1)}`).join(", ");
      const recomendacaoDireta = `Para o concurso ${proxConcurso}: distribua ${l.recomendacao.map((v, i) => `${v} na L${i + 1}`).join(", ")}.`;
      return { resumo, recomendacaoDireta };
    }

    case "analise_colunas": {
      const c = calcularDistribuicaoColunas(concursos);
      const resumo = `Média por coluna (10 sorteios): ` +
        c.medias.map((m, i) => `C${i + 1}=${m.toFixed(1)}`).join(", ");
      const recomendacaoDireta = `Para o concurso ${proxConcurso}: distribua ${c.recomendacao.map((v, i) => `${v} na C${i + 1}`).join(", ")}.`;
      return { resumo, recomendacaoDireta };
    }

    default: {
      const quentes = topQuentes(concursos, 5);
      return {
        resumo: `Concurso ${ultimo.concurso_id}. Quentes: [${quentes.map((q) => fmt(q.dezena)).join(", ")}]`,
        recomendacaoDireta: `Acompanhe os próximos sorteios.`,
      };
    }
  }
}

// =============================================================================
// PROMPT POR TIPO
// =============================================================================

function montarPrompt(tipoPost: string, fatos: { resumo: string; recomendacaoDireta: string }, ultimoConcurso: number): string {
  const titulos: Record<string, string> = {
    analise_ciclo: "Análise de Ciclo",
    analise_movimentacao: "Quentes e Frias — Fixas e Excluídas",
    analise_moldura: "Análise de Moldura",
    analise_repetidas: "Análise de Repetidas",
    analise_linhas: "Análise por Linhas",
    analise_colunas: "Análise por Colunas",
  };
  const tema = titulos[tipoPost] || "Análise da Lotofácil";

  return `Você é Augusto Angelis, especialista em Lotofácil da equipe Palpite Tech. Escreva um POST CURTO da comunidade com tema: "${tema}".

DADOS REAIS (use exatamente estes números, sem inventar):
${fatos.resumo}

RECOMENDAÇÃO DIRETA QUE VOCÊ DEVE INCLUIR LITERALMENTE NO TEXTO:
${fatos.recomendacaoDireta}

ESTRUTURA OBRIGATÓRIA do conteúdo:
1) Abertura curta (1 linha) com gancho diferente a cada vez.
2) Bloco "📊 O que aconteceu nos últimos 10" — resuma os dados acima em 2-3 linhas.
3) Bloco "💡 Como montar seu palpite" — escreva a RECOMENDAÇÃO DIRETA acima, em destaque.
4) Disclaimer curto: "Loteria envolve sorte. Use como guia, não como certeza."

REGRAS:
- Tom humano, acolhedor, em primeira pessoa. Varie a abertura.
- Use **negrito** nas dezenas e na recomendação.
- Máximo 800 caracteres no conteúdo.
- Título com no máximo 60 caracteres, mencionando o tema e o concurso ${ultimoConcurso + 1}.
- Apenas dezenas de 01 a 25.
- NUNCA mencione IA, bot, modelo, GPT ou Gemini.

Responda APENAS no formato JSON puro:
{"titulo": "...", "conteudo": "..."}`;
}

// =============================================================================
// SANITIZAÇÃO E VALIDAÇÃO
// =============================================================================

function sanitizar(texto: string): string {
  return texto
    .replace(/\b(IA|bot|robô|robot|modelo de linguagem|GPT[\w-]*|Gemini[\w-]*|ChatGPT|inteligência artificial)\b/gi, "análise")
    .replace(/\s{3,}/g, "  ")
    .trim();
}

function extrairJSON(content: string): { titulo: string; conteudo: string } | null {
  try {
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || content.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]).trim() : content.trim();
    const parsed = JSON.parse(jsonStr);
    if (typeof parsed?.titulo === "string" && typeof parsed?.conteudo === "string") {
      return { titulo: parsed.titulo, conteudo: parsed.conteudo };
    }
    return null;
  } catch {
    return null;
  }
}

function fallbackPost(tipoPost: string, fatos: { resumo: string; recomendacaoDireta: string }, proxConcurso: number): { titulo: string; conteudo: string } {
  const titulosBase: Record<string, string> = {
    analise_ciclo: `🔄 Ciclo da Lotofácil — concurso ${proxConcurso}`,
    analise_movimentacao: `🔥 Quentes e Frias — concurso ${proxConcurso}`,
    analise_moldura: `🖼️ Moldura — concurso ${proxConcurso}`,
    analise_repetidas: `🔁 Repetidas — concurso ${proxConcurso}`,
    analise_linhas: `📐 Linhas — concurso ${proxConcurso}`,
    analise_colunas: `📊 Colunas — concurso ${proxConcurso}`,
  };
  const titulo = (titulosBase[tipoPost] || `Análise Lotofácil — ${proxConcurso}`).substring(0, 60);
  const conteudo = `Olá pessoal! Trago um resumo direto do tema.\n\n` +
    `📊 O que aconteceu nos últimos 10\n${fatos.resumo}\n\n` +
    `💡 Como montar seu palpite\n${fatos.recomendacaoDireta}\n\n` +
    `Loteria envolve sorte. Use como guia, não como certeza.`;
  return { titulo, conteudo: conteudo.substring(0, 1000) };
}

async function chamarIAComRetry(systemPrompt: string, userPrompt: string, apiKey: string): Promise<{ ok: boolean; status: number; content?: string; usage?: any; errorBody?: string }> {
  const delays = [1000, 2000, 4000];
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          temperature: 0.8,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
        }),
      });

      // 402/429 → não retentar; sair limpo
      if (resp.status === 402 || resp.status === 429) {
        const errorBody = await resp.text();
        return { ok: false, status: resp.status, errorBody };
      }

      if (resp.ok) {
        const data = await resp.json();
        return { ok: true, status: 200, content: data.choices?.[0]?.message?.content, usage: data.usage };
      }

      // 5xx → retry
      if (resp.status >= 500 && attempt < 2) {
        await new Promise((r) => setTimeout(r, delays[attempt]));
        continue;
      }

      const errorBody = await resp.text();
      return { ok: false, status: resp.status, errorBody };
    } catch (err) {
      console.error(`[IA] tentativa ${attempt + 1} falhou:`, err);
      if (attempt < 2) await new Promise((r) => setTimeout(r, delays[attempt]));
    }
  }
  return { ok: false, status: 0, errorBody: "Falha de rede após 3 tentativas" };
}

// =============================================================================
// HANDLER
// =============================================================================

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  let guideId: string | null = null;
  let guideName: string | null = null;
  let tipoPost = "geral";

  try {
    const body = await req.json().catch(() => ({}));
    tipoPost = body.tipo_post || "geral";
    const requestedGuideId = body.guide_persona_id;

    console.log(`[generate-guide-post] tipo=${tipoPost} guideId=${requestedGuideId || "auto"}`);

    // 1. Buscar guia
    let query = supabaseAdmin
      .from("guide_personas")
      .select("*, perfis(*)")
      .eq("ativo", true)
      .eq("can_create_posts", true);
    if (requestedGuideId) {
      query = query.eq("id", requestedGuideId);
    } else {
      query = query.order("ultimo_post_em", { ascending: true, nullsFirst: true }).limit(1);
    }
    const { data: guide, error: guideError } = await query.single();

    if (guideError || !guide) {
      console.log("[generate-guide-post] ❌ Nenhum guia ativo:", guideError?.message);
      return new Response(JSON.stringify({ message: "Nenhum guia ativo" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    guideId = guide.id;
    guideName = guide.perfis?.nome || null;

    // Trava: só autor de resultados (Especialista Lotofácil) pode postar pelo motor
    const PALPITE_TECH_ID = "2a827e7d-a3d1-416e-8552-e830dc7e633c";
    if (guide.id !== PALPITE_TECH_ID && !guide.is_result_author) {
      console.warn(`[generate-guide-post] 🚫 Bot não autorizado: ${guideName}`);
      return new Response(JSON.stringify({ error: "Bot não autorizado" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Lock de duplicação por tipo+dia (BRT)
    const agora = new Date();
    const inicioDiaBRT = new Date(agora);
    inicioDiaBRT.setUTCHours(3, 0, 0, 0); // 00h BRT = 03h UTC
    if (agora.getTime() < inicioDiaBRT.getTime()) inicioDiaBRT.setUTCDate(inicioDiaBRT.getUTCDate() - 1);

    const { data: jaPostou } = await supabaseAdmin
      .from("postagens")
      .select("id, created_at")
      .eq("user_id", guide.perfil_id)
      .eq("tipo", tipoPost)
      .gte("created_at", inicioDiaBRT.toISOString())
      .limit(1)
      .maybeSingle();

    if (jaPostou) {
      console.log(`[generate-guide-post] ⏭️ Já postou tipo=${tipoPost} hoje (post ${jaPostou.id})`);
      await supabaseAdmin.from("bot_publishing_logs").insert({
        guide_persona_id: guide.id,
        bot_name: guideName,
        event_type: "skipped",
        reason: "duplicate_today",
        details: { tipo_post: tipoPost, existing_post_id: jaPostou.id },
      });
      return new Response(
        JSON.stringify({ skipped: true, reason: "duplicate_today", postId: jaPostou.id }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 3. Buscar últimos 10 concursos
    const { data: resultados, error: resErr } = await supabaseAdmin
      .from("resultados_loterias")
      .select("concurso_id:concurso, dezenas, data_sorteio, ciclo_numero, dezenas_faltantes_ciclo, qtd_pares, qtd_impares, qtd_repetidas, qtd_primos, qtd_moldura")
      .eq("loteria", "lotofacil")
      .order("concurso", { ascending: false })
      .limit(PERIODO_ANALISE);

    if (resErr || !resultados || resultados.length === 0) {
      throw new Error(`Erro ao buscar resultados: ${resErr?.message || "vazio"}`);
    }

    const concursos = resultados as Concurso[];
    const ultimoConcurso = concursos[0].concurso_id;

    // 4. Calcular fatos determinísticos
    const fatos = montarFatos(tipoPost, concursos);

    // 5. Chamar IA com retry
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY não configurada");

    const systemPrompt = guide.system_prompt || "Você é especialista em Lotofácil da equipe Palpite Tech.";
    const userPrompt = montarPrompt(tipoPost, fatos, ultimoConcurso);

    let titulo = "";
    let conteudo = "";
    let viaFallback = false;

    const ia = await chamarIAComRetry(systemPrompt, userPrompt, apiKey);

    if (!ia.ok && (ia.status === 402 || ia.status === 429)) {
      console.warn(`[generate-guide-post] IA indisponível (${ia.status}). Usando fallback determinístico.`);
      const fb = fallbackPost(tipoPost, fatos, ultimoConcurso + 1);
      titulo = fb.titulo;
      conteudo = fb.conteudo;
      viaFallback = true;

      await supabaseAdmin.from("bot_publishing_logs").insert({
        guide_persona_id: guide.id,
        bot_name: guideName,
        event_type: "fallback",
        reason: ia.status === 402 ? "payment_required" : "rate_limited",
        details: { tipo_post: tipoPost, status: ia.status },
      });
    } else if (!ia.ok) {
      console.error(`[generate-guide-post] IA falhou: ${ia.status} ${ia.errorBody}`);
      const fb = fallbackPost(tipoPost, fatos, ultimoConcurso + 1);
      titulo = fb.titulo;
      conteudo = fb.conteudo;
      viaFallback = true;

      await supabaseAdmin.from("bot_publishing_logs").insert({
        guide_persona_id: guide.id,
        bot_name: guideName,
        event_type: "fallback",
        reason: "ai_error",
        details: { tipo_post: tipoPost, status: ia.status, error: ia.errorBody?.substring(0, 500) },
      });
    } else {
      // Validar JSON da IA
      let parsed = extrairJSON(ia.content || "");

      if (!parsed) {
        console.warn("[generate-guide-post] JSON inválido na 1ª tentativa, retentando...");
        const ia2 = await chamarIAComRetry(
          systemPrompt,
          userPrompt + "\n\nATENÇÃO: sua última resposta não era JSON puro. Devolva APENAS {\"titulo\":\"...\",\"conteudo\":\"...\"} sem texto adicional.",
          apiKey,
        );
        if (ia2.ok) parsed = extrairJSON(ia2.content || "");
      }

      if (!parsed) {
        console.warn("[generate-guide-post] JSON inválido após retentativa. Usando fallback.");
        const fb = fallbackPost(tipoPost, fatos, ultimoConcurso + 1);
        titulo = fb.titulo;
        conteudo = fb.conteudo;
        viaFallback = true;

        await supabaseAdmin.from("bot_publishing_logs").insert({
          guide_persona_id: guide.id,
          bot_name: guideName,
          event_type: "fallback",
          reason: "invalid_json",
          details: { tipo_post: tipoPost },
        });
      } else {
        titulo = sanitizar(parsed.titulo).substring(0, 100);
        conteudo = sanitizar(parsed.conteudo).substring(0, 1000);

        // Guardrail: se a IA esqueceu de incluir a recomendação, anexa o fallback bloco
        if (!conteudo.includes("Como montar") && !conteudo.includes("montar seu palpite")) {
          conteudo = (conteudo + `\n\n💡 Como montar seu palpite\n${fatos.recomendacaoDireta}\n\nLoteria envolve sorte.`).substring(0, 1000);
        }
      }

      // Log de uso de IA (somente quando deu certo)
      if (ia.usage) {
        const pt = ia.usage.prompt_tokens || 0;
        const ct = ia.usage.completion_tokens || 0;
        const cost = (pt / 1e6) * 0.15 + (ct / 1e6) * 0.6;
        supabaseAdmin.from("ai_usage_logs").insert({
          bot_persona_id: guide.id,
          bot_name: guideName,
          edge_function: "generate-guide-post",
          action_type: "post_analitico_comunidade",
          prompt_tokens: pt,
          completion_tokens: ct,
          total_tokens: ia.usage.total_tokens || pt + ct,
          model: "google/gemini-3-flash-preview",
          cost_usd: cost,
          metadata: { tipo_post: tipoPost },
        }).then(() => {}).catch(() => {});
      }
    }

    // 6. Inserir post
    const { data: novoPost, error: postError } = await supabaseAdmin
      .from("postagens")
      .insert({
        user_id: guide.perfil_id,
        titulo,
        conteudo,
        loteria_tag: "Lotofácil",
        tipo: tipoPost,
      })
      .select("id")
      .single();

    if (postError) throw new Error(`Erro ao inserir post: ${postError.message}`);

    // 7. Atualizar bot
    await supabaseAdmin
      .from("guide_personas")
      .update({ ultimo_post_em: new Date().toISOString() })
      .eq("id", guide.id);

    // 8. Log de sucesso
    await supabaseAdmin.from("bot_publishing_logs").insert({
      guide_persona_id: guide.id,
      bot_name: guideName,
      event_type: "success",
      reason: viaFallback ? "fallback_used" : "ai_generated",
      details: { tipo_post: tipoPost, post_id: novoPost.id, ultimo_concurso: ultimoConcurso },
    });

    console.log(`[generate-guide-post] ✅ Post criado ${novoPost.id} tipo=${tipoPost} fallback=${viaFallback}`);

    return new Response(
      JSON.stringify({
        success: true,
        postId: novoPost.id,
        guide: guideName,
        tipo_post: tipoPost,
        titulo,
        viaFallback,
        ultimo_concurso: ultimoConcurso,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("[generate-guide-post] Erro:", error);
    if (guideId) {
      await supabaseAdmin
        .from("bot_publishing_logs")
        .insert({
          guide_persona_id: guideId,
          bot_name: guideName,
          event_type: "error",
          reason: error instanceof Error ? error.message : "unknown",
          details: { tipo_post: tipoPost },
        })
        .then(() => {})
        .catch(() => {});
    }
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
