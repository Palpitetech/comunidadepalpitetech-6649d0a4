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

// Detalhamento por linha/coluna nos últimos N sorteios:
// Para cada índice 0..4, calcula:
//   - total: total de ocorrências (soma das dezenas daquele eixo nos N sorteios)
//   - distribuicao: Map quantidade(0..5) -> quantos sorteios tiveram aquela quantidade
//   - top2: as 2 quantidades mais frequentes [{ qtd, vezes }, ...]
function detalharLinhasColunas(
  concursos: Concurso[],
  eixo: "linha" | "coluna",
): Array<{
  indice: number; // 1..5
  faixa: string; // "01-05" ou "01,06,11,16,21"
  total: number;
  top2: Array<{ qtd: number; vezes: number }>;
}> {
  const resultado: Array<{
    indice: number;
    faixa: string;
    total: number;
    top2: Array<{ qtd: number; vezes: number }>;
  }> = [];

  for (let i = 0; i < 5; i++) {
    let total = 0;
    const dist = new Map<number, number>(); // qtd -> sorteios com aquela qtd
    for (const c of concursos) {
      let qtdNoSorteio = 0;
      for (const d of c.dezenas) {
        const grupo = eixo === "linha" ? Math.ceil(d / 5) - 1 : ((d - 1) % 5);
        if (grupo === i) qtdNoSorteio++;
      }
      total += qtdNoSorteio;
      dist.set(qtdNoSorteio, (dist.get(qtdNoSorteio) || 0) + 1);
    }
    const top2 = Array.from(dist.entries())
      .sort((a, b) => b[1] - a[1] || b[0] - a[0])
      .slice(0, 2)
      .map(([qtd, vezes]) => ({ qtd, vezes }));

    let faixa: string;
    if (eixo === "linha") {
      const ini = i * 5 + 1;
      const fim = ini + 4;
      faixa = `${fmt(ini)}-${fmt(fim)}`;
    } else {
      const dezenas: number[] = [];
      for (let l = 0; l < 5; l++) dezenas.push(l * 5 + i + 1);
      faixa = dezenas.map(fmt).join(",");
    }

    resultado.push({ indice: i + 1, faixa, total, top2 });
  }
  return resultado;
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
// CICLO: estatísticas históricas + recomendação
// =============================================================================

interface CicloHistorico {
  ciclo_numero: number;
  duracao: number;
}

interface EstatisticasCiclo {
  totalCiclos: number;
  distribuicao: Array<{ duracao: number; vezes: number; perc: number }>; // ordenado por duracao
  topDuracoes: Array<{ duracao: number; vezes: number; perc: number }>; // top 2
  somaPercTop2: number;
  percentil25: number;
  percentil75: number;
  posicaoAtual: number; // qual concurso (1, 2, 3...) será o próximo no ciclo atual
  cicloAtual: number | null;
  concursosNoCicloAtual: number; // já jogados neste ciclo
}

// Agrupa por faixas legíveis: 2,3,4,5,6+
function calcularEstatisticasCiclo(
  historicoCiclos: CicloHistorico[],
  cicloAtual: number | null,
  concursosNoCicloAtual: number,
): EstatisticasCiclo {
  // Excluir o ciclo em andamento (não está fechado ainda)
  const fechados = historicoCiclos.filter((c) => c.ciclo_numero !== cicloAtual);
  const total = fechados.length;

  // Distribuição agrupando 6+
  const buckets = new Map<number, number>(); // chave: duracao (ou 6 para "6+")
  for (const c of fechados) {
    const key = c.duracao >= 6 ? 6 : c.duracao;
    buckets.set(key, (buckets.get(key) || 0) + 1);
  }
  const distribuicao = Array.from(buckets.entries())
    .map(([duracao, vezes]) => ({
      duracao,
      vezes,
      perc: total > 0 ? Math.round((vezes / total) * 100) : 0,
    }))
    .sort((a, b) => a.duracao - b.duracao);

  const topDuracoes = [...distribuicao]
    .sort((a, b) => b.vezes - a.vezes || a.duracao - b.duracao)
    .slice(0, 2);
  const somaPercTop2 = topDuracoes.reduce((s, t) => s + t.perc, 0);

  // Percentis sobre as durações reais (não agrupadas)
  const duracoesOrdenadas = fechados.map((c) => c.duracao).sort((a, b) => a - b);
  const percentil = (p: number): number => {
    if (duracoesOrdenadas.length === 0) return 0;
    const idx = Math.floor((p / 100) * (duracoesOrdenadas.length - 1));
    return duracoesOrdenadas[idx];
  };

  return {
    totalCiclos: total,
    distribuicao,
    topDuracoes,
    somaPercTop2,
    percentil25: percentil(25),
    percentil75: percentil(75),
    posicaoAtual: concursosNoCicloAtual + 1,
    cicloAtual,
    concursosNoCicloAtual,
  };
}

function montarRecomendacaoCiclo(
  est: EstatisticasCiclo,
  faltantes: number[],
  concursos: Concurso[],
): {
  recomendacaoTexto: string;
  prioritarias: number[];
  deixadasDeFora: number[];
  justificativaPrioritarias: string;
  justificativaDeixadas: string;
  percChanceFecharAgora: number;
} {
  const pos = est.posicaoAtual;

  // Chance de o ciclo fechar exatamente neste próximo concurso (na posição atual)
  const bucketAtual = est.distribuicao.find((d) =>
    d.duracao === 6 ? pos >= 6 : d.duracao === pos
  );
  const percChanceFecharAgora = bucketAtual?.perc ?? 0;

  // Faltantes prioritárias = as MAIS quentes nos últimos 10 (saíram mais vezes recentemente)
  const freq = calcularFrequencias(concursos);
  const faltantesOrdenadas = [...faltantes].sort((a, b) => {
    const fb = freq.get(b) || 0;
    const fa = freq.get(a) || 0;
    if (fb !== fa) return fb - fa;
    return a - b;
  });

  let nPrioritarias: number;
  let recomendacaoTexto: string;
  let justificativaPrioritarias: string;
  let justificativaDeixadas: string;

  if (pos < est.percentil25 || pos < est.topDuracoes[0]?.duracao) {
    // Ainda é cedo
    nPrioritarias = Math.min(faltantes.length, 6);
    recomendacaoTexto =
      `Como ainda estamos cedo no ciclo (${pos}º concurso), a chance de fechamento agora é baixa ` +
      `(somente ${percChanceFecharAgora}% dos ciclos fecharam nesta posição). ` +
      `👉 Recomendação: NÃO aposte tudo nas faltantes ainda. Use ${nPrioritarias} dezenas faltantes prioritárias e complete com quentes.`;
    justificativaPrioritarias = "escolhidas porque saíram mais vezes nos últimos 10 sorteios (estão em ritmo)";
    justificativaDeixadas = "ainda há tempo no ciclo, dá pra incluí-las nos próximos concursos";
  } else if (pos >= est.topDuracoes[0]?.duracao && pos <= (est.topDuracoes[1]?.duracao ?? est.topDuracoes[0]?.duracao)) {
    // Estamos na faixa mais comum de fechamento
    nPrioritarias = Math.min(faltantes.length, 10);
    recomendacaoTexto =
      `Estamos na faixa mais comum de fechamento (${est.somaPercTop2}% dos ciclos fecham até aqui). ` +
      `👉 Recomendação: APOSTE no fechamento. Inclua ${nPrioritarias} das faltantes prioritárias.`;
    justificativaPrioritarias = "alta probabilidade de o ciclo fechar agora — priorize as faltantes que estão mais aquecidas";
    justificativaDeixadas = "se preferir reduzir custo, estas podem ficar de fora — ainda assim recomendamos cobrir o máximo possível";
  } else {
    // Ciclo demorando (acima do percentil 75)
    nPrioritarias = Math.min(faltantes.length, 8);
    recomendacaoTexto =
      `O ciclo está demorando para fechar (${pos}º concurso, acima da média histórica). ` +
      `👉 Recomendação: ainda dá pra entrar — use ${nPrioritarias} faltantes prioritárias.`;
    justificativaPrioritarias = "escolhidas pelas mais quentes nos últimos 10 sorteios";
    justificativaDeixadas = "menor frequência recente — risco maior de continuar fora";
  }

  const prioritarias = faltantesOrdenadas.slice(0, nPrioritarias);
  const deixadasDeFora = faltantesOrdenadas.slice(nPrioritarias);

  return {
    recomendacaoTexto,
    prioritarias,
    deixadasDeFora,
    justificativaPrioritarias,
    justificativaDeixadas,
    percChanceFecharAgora,
  };
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
      const det = detalharLinhasColunas(concursos, "linha");
      const blocoDetalhe = det.map((d) => {
        const top = d.top2.map((t) => `${t.qtd} dezena${t.qtd === 1 ? "" : "s"} (${t.vezes}x)`).join(" e ");
        return `Linha ${d.indice} (${d.faixa}): ${d.total} ocorrências — mais comum: ${top}`;
      }).join("\n");
      const resumo = `📐 Análise por Linhas (últimos ${concursos.length} sorteios)\n\n${blocoDetalhe}\n\n` +
        `Média por linha: ` + l.medias.map((m, i) => `L${i + 1}=${m.toFixed(1)}`).join(", ");
      const recomendacaoDireta = `Para o concurso ${proxConcurso}: distribua ${l.recomendacao.map((v, i) => `${v} na L${i + 1}`).join(", ")}.`;
      return { resumo, recomendacaoDireta };
    }

    case "analise_colunas": {
      const c = calcularDistribuicaoColunas(concursos);
      const det = detalharLinhasColunas(concursos, "coluna");
      const blocoDetalhe = det.map((d) => {
        const top = d.top2.map((t) => `${t.qtd} dezena${t.qtd === 1 ? "" : "s"} (${t.vezes}x)`).join(" e ");
        return `Coluna ${d.indice} (${d.faixa}): ${d.total} ocorrências — mais comum: ${top}`;
      }).join("\n");
      const resumo = `📊 Análise por Colunas (últimos ${concursos.length} sorteios)\n\n${blocoDetalhe}\n\n` +
        `Média por coluna: ` + c.medias.map((m, i) => `C${i + 1}=${m.toFixed(1)}`).join(", ");
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

// Título 100% determinístico (impossível alucinar)
function montarTituloDeterministico(tipoPost: string, proxConcurso: number): string {
  const titulosBase: Record<string, string> = {
    analise_ciclo: `🔄 Ciclo da Lotofácil — Concurso ${proxConcurso}`,
    analise_movimentacao: `🔥 Quentes e Frias — Concurso ${proxConcurso}`,
    analise_moldura: `🖼️ Análise de Moldura — Concurso ${proxConcurso}`,
    analise_repetidas: `🔁 Análise de Repetidas — Concurso ${proxConcurso}`,
    analise_linhas: `📐 Análise por Linhas — Concurso ${proxConcurso}`,
    analise_colunas: `📊 Análise por Colunas — Concurso ${proxConcurso}`,
  };
  return (titulosBase[tipoPost] || `Análise Lotofácil — Concurso ${proxConcurso}`).substring(0, 100);
}

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
  const proxConcurso = ultimoConcurso + 1;

  return `Você é Augusto Angelis, especialista em Lotofácil da equipe Palpite Tech. Escreva APENAS o CONTEÚDO de um post curto da comunidade com tema: "${tema}".

DADOS REAIS (use exatamente estes números, sem inventar nem alterar dígitos):
${fatos.resumo}

RECOMENDAÇÃO DIRETA QUE VOCÊ DEVE INCLUIR LITERALMENTE NO TEXTO:
${fatos.recomendacaoDireta}

ESTRUTURA OBRIGATÓRIA do conteúdo:
1) Abertura curta (1 linha) com gancho diferente a cada vez.
2) Bloco "📊 O que aconteceu nos últimos 10" — para os tipos "Análise por Linhas" e "Análise por Colunas", REPRODUZA LITERALMENTE o bloco detalhado de "DADOS REAIS" (linha por linha ou coluna por coluna), sem resumir nem omitir nenhuma linha/coluna. Para os outros tipos, resuma os dados em 2-3 linhas.
3) Bloco "💡 Como montar seu palpite" — escreva a RECOMENDAÇÃO DIRETA acima, em destaque.
4) Disclaimer curto: "Loteria envolve sorte. Use como guia, não como certeza."

REGRAS CRÍTICAS:
- Use SOMENTE os números fornecidos. NUNCA invente um número novo nem altere dígitos.
- Se citar o concurso, use exatamente ${proxConcurso}.
- Tom humano, acolhedor, em primeira pessoa. Varie a abertura.
- Use **negrito** nas dezenas e na recomendação.
- Máximo 1200 caracteres no conteúdo.
- Apenas dezenas de 01 a 25.
- NUNCA mencione IA, bot, modelo, GPT ou Gemini.

Responda APENAS o CONTEÚDO em texto puro (sem título, sem JSON, sem aspas).`;
}

// =============================================================================
// VALIDADOR ANTI-ALUCINAÇÃO
// =============================================================================

function extrairNumerosPermitidos(concursos: Concurso[], proxConcurso: number): Set<number> {
  const permitidos = new Set<number>();
  permitidos.add(proxConcurso);
  for (const c of concursos) {
    permitidos.add(c.concurso_id);
    if (c.ciclo_numero) permitidos.add(c.ciclo_numero);
    permitidos.add(c.qtd_pares);
    permitidos.add(c.qtd_impares);
    permitidos.add(c.qtd_moldura);
    permitidos.add(c.qtd_primos);
    permitidos.add(c.qtd_repetidas);
  }
  // Pequenos números livres (contagens, frequências, ocorrências por linha/coluna)
  for (let i = 0; i <= 80; i++) permitidos.add(i);
  return permitidos;
}

function validarConteudoNumerico(texto: string, permitidos: Set<number>): { ok: boolean; motivo?: string } {
  // Números de 3-5 dígitos (concursos): TODOS devem estar na whitelist
  const matches = texto.match(/\b\d{3,5}\b/g) || [];
  for (const m of matches) {
    const n = parseInt(m, 10);
    if (!permitidos.has(n)) {
      return { ok: false, motivo: `Número não permitido: ${n}` };
    }
  }
  return { ok: true };
}

// =============================================================================
// SANITIZAÇÃO E FALLBACK
// =============================================================================

function sanitizar(texto: string): string {
  return texto
    .replace(/\b(IA|bot|robô|robot|modelo de linguagem|GPT[\w-]*|Gemini[\w-]*|ChatGPT|inteligência artificial)\b/gi, "análise")
    .replace(/\s{3,}/g, "  ")
    .trim();
}

function fallbackConteudo(fatos: { resumo: string; recomendacaoDireta: string }): string {
  const conteudo = `Olá pessoal! Trago um resumo direto do tema.\n\n` +
    `📊 O que aconteceu nos últimos 10\n${fatos.resumo}\n\n` +
    `💡 Como montar seu palpite\n${fatos.recomendacaoDireta}\n\n` +
    `Loteria envolve sorte. Use como guia, não como certeza.`;
  return conteudo.substring(0, 1500);
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

// Autor único da comunidade
const AUGUSTO_PERFIL_ID = "41b58d48-2ef1-4bf7-a536-ed8a49607fa9";
const AUGUSTO_NOME = "Augusto Angelis";

const SYSTEM_PROMPT_BASE = `Você é Augusto Angelis, especialista em Lotofácil da equipe Palpite Tech.
Tom acolhedor e direto, em primeira pessoa. Nunca mencione IA, bot, modelo, GPT ou Gemini.
Fale como um analista humano que estuda os números todos os dias.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  let tipoPost = "geral";

  try {
    const body = await req.json().catch(() => ({}));
    tipoPost = body.tipo_post || "geral";
    console.log(`[generate-guide-post] tipo=${tipoPost}`);

    // 1. Lock de duplicação por tipo+dia (BRT) — Augusto não posta o mesmo tipo 2x no dia
    const agora = new Date();
    const inicioDiaBRT = new Date(agora);
    inicioDiaBRT.setUTCHours(3, 0, 0, 0); // 00h BRT = 03h UTC
    if (agora.getTime() < inicioDiaBRT.getTime()) inicioDiaBRT.setUTCDate(inicioDiaBRT.getUTCDate() - 1);

    const { data: jaPostou } = await supabaseAdmin
      .from("postagens")
      .select("id, created_at")
      .eq("user_id", AUGUSTO_PERFIL_ID)
      .eq("tipo", tipoPost)
      .gte("created_at", inicioDiaBRT.toISOString())
      .limit(1)
      .maybeSingle();

    if (jaPostou) {
      console.log(`[generate-guide-post] ⏭️ Já postou tipo=${tipoPost} hoje (post ${jaPostou.id})`);
      return new Response(
        JSON.stringify({ skipped: true, reason: "duplicate_today", postId: jaPostou.id }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 2. Buscar últimos 10 concursos
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

    // 3. Calcular fatos determinísticos
    const fatos = montarFatos(tipoPost, concursos);

    // 4. Chamar IA com retry
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY não configurada");

    const userPrompt = montarPrompt(tipoPost, fatos, ultimoConcurso);
    const proxConcurso = ultimoConcurso + 1;

    // ===== TÍTULO 100% DETERMINÍSTICO =====
    const titulo = montarTituloDeterministico(tipoPost, proxConcurso);

    // ===== CONTEÚDO: IA + validação anti-alucinação + fallback =====
    let conteudo = "";
    let viaFallback = false;
    let motivoFallback = "";

    const numerosPermitidos = extrairNumerosPermitidos(concursos, proxConcurso);
    const ia = await chamarIAComRetry(SYSTEM_PROMPT_BASE, userPrompt, apiKey);

    if (!ia.ok) {
      viaFallback = true;
      motivoFallback = `IA falhou: ${ia.status}`;
      console.warn(`[generate-guide-post] ⚠️ ${motivoFallback}`);
      conteudo = fallbackConteudo(fatos);
    } else {
      const conteudoIA = sanitizar(ia.content || "").substring(0, 1500);
      const validacao = validarConteudoNumerico(conteudoIA, numerosPermitidos);

      if (!validacao.ok || conteudoIA.length < 50) {
        viaFallback = true;
        motivoFallback = validacao.motivo || "conteúdo curto";
        console.warn(`[generate-guide-post] ⚠️ Fallback: ${motivoFallback}`);
        conteudo = fallbackConteudo(fatos);
      } else {
        conteudo = conteudoIA;
        // Guardrail: garante que a recomendação direta apareça
        if (!conteudo.includes("Como montar") && !conteudo.includes("montar seu palpite")) {
          conteudo = (conteudo + `\n\n💡 Como montar seu palpite\n${fatos.recomendacaoDireta}\n\nLoteria envolve sorte.`).substring(0, 1500);
        }
      }

      // Log de uso de IA
      if (ia.usage) {
        const pt = ia.usage.prompt_tokens || 0;
        const ct = ia.usage.completion_tokens || 0;
        const cost = (pt / 1e6) * 0.15 + (ct / 1e6) * 0.6;
        supabaseAdmin.from("ai_usage_logs").insert({
          bot_name: AUGUSTO_NOME,
          edge_function: "generate-guide-post",
          action_type: "post_analitico_comunidade",
          prompt_tokens: pt,
          completion_tokens: ct,
          total_tokens: ia.usage.total_tokens || pt + ct,
          model: "google/gemini-3-flash-preview",
          cost_usd: cost,
          metadata: { tipo_post: tipoPost, viaFallback, motivoFallback },
        }).then(() => {}).catch(() => {});
      }
    }

    // 5. Inserir post (autor sempre = Augusto)
    const { data: novoPost, error: postError } = await supabaseAdmin
      .from("postagens")
      .insert({
        user_id: AUGUSTO_PERFIL_ID,
        titulo,
        conteudo,
        loteria_tag: "Lotofácil",
        tipo: tipoPost,
      })
      .select("id")
      .single();

    if (postError) throw new Error(`Erro ao inserir post: ${postError.message}`);

    console.log(`[generate-guide-post] ✅ Post ${novoPost.id} tipo=${tipoPost} fallback=${viaFallback}`);

    return new Response(
      JSON.stringify({
        success: true,
        postId: novoPost.id,
        autor: AUGUSTO_NOME,
        tipo_post: tipoPost,
        titulo,
        viaFallback,
        ultimo_concurso: ultimoConcurso,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("[generate-guide-post] Erro:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido", tipo_post: tipoPost }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
