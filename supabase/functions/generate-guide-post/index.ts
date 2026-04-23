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

// =============================================================================
// MOLDURA: análise detalhada (frequência + coocorrências + fracas + recomendação)
// =============================================================================

interface MolduraDezenaForte {
  dezena: number;
  vezes: number;
  perc: number;
}
interface MolduraDezenaFraca {
  dezena: number;
  vezes: number;
  perc: number;
  companheirasFrequentes: number[];
}
interface MolduraPar {
  a: number;
  b: number;
  vezes: number;
}
interface MolduraTrio {
  a: number;
  b: number;
  c: number;
  vezes: number;
}
interface MolduraRecomendacao {
  qtdRecomendada: number;
  nucleoForte: number[];
  apoio: number[];
  coringas: number[];
  deixarFora: number[];
  justNucleo: string;
  justApoio: string;
  justCoringas: string;
  justFora: string;
}
interface MolduraAnalise {
  totalConcursos: number;
  mediaMoldura: number;
  faixaMaisComum: { qtd1: number; qtd2: number; perc: number };
  fortes: MolduraDezenaForte[];
  fracas: MolduraDezenaFraca[];
  melhoresPares: MolduraPar[];
  melhoresTrios: MolduraTrio[];
  padraoFalha: { vezesFraca: number; ausentesTop: number[] };
  recomendacao: MolduraRecomendacao;
}

function analisarMolduraDetalhado(concursos: Concurso[]): MolduraAnalise {
  const N = concursos.length;
  const moldSet = new Set(MOLDURA);

  // 1) Frequência por dezena da moldura
  const freq = new Map<number, number>();
  for (const d of MOLDURA) freq.set(d, 0);
  // Quantidade de moldura por sorteio
  const qtdMoldPorSorteio: number[] = [];
  for (const c of concursos) {
    let qtd = 0;
    for (const d of c.dezenas) {
      if (moldSet.has(d)) {
        freq.set(d, (freq.get(d) || 0) + 1);
        qtd++;
      }
    }
    qtdMoldPorSorteio.push(qtd);
  }
  const mediaMoldura = qtdMoldPorSorteio.reduce((a, b) => a + b, 0) / N;

  // 2) Faixa mais comum (top 2 quantidades de moldura por sorteio)
  const distQtd = new Map<number, number>();
  for (const q of qtdMoldPorSorteio) distQtd.set(q, (distQtd.get(q) || 0) + 1);
  const topFaixa = Array.from(distQtd.entries())
    .sort((a, b) => b[1] - a[1] || b[0] - a[0])
    .slice(0, 2);
  const q1 = topFaixa[0]?.[0] ?? 0;
  const q2 = topFaixa[1]?.[0] ?? q1;
  const faixaMaisComum = {
    qtd1: Math.min(q1, q2),
    qtd2: Math.max(q1, q2),
    perc: Math.round((((topFaixa[0]?.[1] ?? 0) + (q1 !== q2 ? topFaixa[1]?.[1] ?? 0 : 0)) / N) * 100),
  };

  // 3) Fortes (top 8)
  const ordenadasDesc = Array.from(freq.entries())
    .sort((a, b) => b[1] - a[1] || a[0] - b[0]);
  const fortes: MolduraDezenaForte[] = ordenadasDesc.slice(0, 8).map(([dezena, vezes]) => ({
    dezena,
    vezes,
    perc: Math.round((vezes / N) * 100),
  }));

  // 4) Matriz de coocorrência da moldura (apenas dezenas da moldura entre si)
  const coOc = new Map<string, number>(); // "a-b" com a<b
  const keyPair = (a: number, b: number) => (a < b ? `${a}-${b}` : `${b}-${a}`);
  const coTrio = new Map<string, number>(); // "a-b-c" ordenado
  for (const c of concursos) {
    const dsMold = c.dezenas.filter((d) => moldSet.has(d)).sort((x, y) => x - y);
    for (let i = 0; i < dsMold.length; i++) {
      for (let j = i + 1; j < dsMold.length; j++) {
        const k = keyPair(dsMold[i], dsMold[j]);
        coOc.set(k, (coOc.get(k) || 0) + 1);
        for (let l = j + 1; l < dsMold.length; l++) {
          const tk = `${dsMold[i]}-${dsMold[j]}-${dsMold[l]}`;
          coTrio.set(tk, (coTrio.get(tk) || 0) + 1);
        }
      }
    }
  }

  // 5) Melhores pares e trios
  const melhoresPares: MolduraPar[] = Array.from(coOc.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 3)
    .map(([k, vezes]) => {
      const [a, b] = k.split("-").map(Number);
      return { a, b, vezes };
    });

  const melhoresTrios: MolduraTrio[] = Array.from(coTrio.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 2)
    .map(([k, vezes]) => {
      const [a, b, c] = k.split("-").map(Number);
      return { a, b, c, vezes };
    });

  // 6) Fracas: ≤ 30% de presença
  const limiteFraca = N * 0.3;
  const fracasBase = ordenadasDesc.filter(([, v]) => v <= limiteFraca && v > 0).slice(-4);
  // Se nenhuma com v>0 ≤30%, usa as menos frequentes (até 3)
  const fracasFonte = fracasBase.length > 0 ? fracasBase : ordenadasDesc.slice(-3);
  const fracas: MolduraDezenaFraca[] = fracasFonte.map(([dezena, vezes]) => {
    // Companheiras = outras dezenas da moldura que mais saíram NOS sorteios em que essa fraca apareceu
    const compFreq = new Map<number, number>();
    for (const c of concursos) {
      if (!c.dezenas.includes(dezena)) continue;
      for (const d of c.dezenas) {
        if (d === dezena || !moldSet.has(d)) continue;
        compFreq.set(d, (compFreq.get(d) || 0) + 1);
      }
    }
    const companheirasFrequentes = Array.from(compFreq.entries())
      .sort((a, b) => b[1] - a[1] || a[0] - b[0])
      .slice(0, 3)
      .map(([d]) => d);
    return {
      dezena,
      vezes,
      perc: Math.round((vezes / N) * 100),
      companheirasFrequentes,
    };
  }).sort((a, b) => a.vezes - b.vezes || a.dezena - b.dezena).slice(0, 3);

  // 7) Padrão de falha: sorteios com moldura ≤ (mediaMoldura - 1)
  const limiarFalha = Math.floor(mediaMoldura - 1);
  let vezesFraca = 0;
  const ausentesContador = new Map<number, number>();
  for (let i = 0; i < concursos.length; i++) {
    if (qtdMoldPorSorteio[i] <= limiarFalha) {
      vezesFraca++;
      const presentes = new Set(concursos[i].dezenas);
      for (const d of MOLDURA) {
        if (!presentes.has(d)) ausentesContador.set(d, (ausentesContador.get(d) || 0) + 1);
      }
    }
  }
  const ausentesTop = Array.from(ausentesContador.entries())
    .sort((a, b) => b[1] - a[1] || a[0] - b[0])
    .slice(0, 4)
    .map(([d]) => d);

  // 8) Recomendação por classificação (núcleo / apoio / coringas / fora)
  const qtdRecomendada = Math.max(7, Math.min(11, Math.round(mediaMoldura)));
  const fortesPercSorted = fortes; // já ordenado desc por vezes
  const nucleoForte = fortesPercSorted.filter((f) => f.perc >= 70).slice(0, 4).map((f) => f.dezena);
  const apoio = fortesPercSorted
    .filter((f) => f.perc >= 50 && f.perc < 70 && !nucleoForte.includes(f.dezena))
    .slice(0, 3)
    .map((f) => f.dezena);

  // Coringas: dezenas da moldura com freq média-baixa (30-50%) e que NÃO estão fracas
  const fracasIds = new Set(fracas.map((x) => x.dezena));
  const coringas = ordenadasDesc
    .map(([d, v]) => ({ d, perc: Math.round((v / N) * 100) }))
    .filter((x) =>
      x.perc >= 30 && x.perc < 50 &&
      !nucleoForte.includes(x.d) && !apoio.includes(x.d) && !fracasIds.has(x.d)
    )
    .slice(0, 2)
    .map((x) => x.d);

  const deixarFora = fracas.map((f) => f.dezena);

  const recomendacao: MolduraRecomendacao = {
    qtdRecomendada,
    nucleoForte,
    apoio,
    coringas,
    deixarFora,
    justNucleo: "top frequência (70%+) e formam pares/trios consistentes",
    justApoio: "frequência média (50-70%), reforçam a estrutura",
    justCoringas: "atrasadas no momento, com tendência de retorno",
    justFora: "padrão fraco recente, baixa coocorrência com o núcleo",
  };

  return {
    totalConcursos: N,
    mediaMoldura,
    faixaMaisComum,
    fortes,
    fracas,
    melhoresPares,
    melhoresTrios,
    padraoFalha: { vezesFraca, ausentesTop },
    recomendacao,
  };
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

function montarFatos(
  tipoPost: string,
  concursos: Concurso[],
  historicoCiclos?: CicloHistorico[],
): {
  resumo: string;
  recomendacaoDireta: string;
  extras?: { totalCiclos?: number };
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

      // Concursos já jogados no ciclo atual = quantos concursos no histórico têm o mesmo ciclo_numero
      // historicoCiclos vem agrupado: { ciclo_numero, duracao }. duracao do ciclo atual = concursos já jogados.
      const cicloAtualEntry = historicoCiclos?.find((h) => h.ciclo_numero === ciclo);
      const concursosNoCicloAtual = cicloAtualEntry?.duracao ?? 0;

      if (!historicoCiclos || historicoCiclos.length === 0 || faltantes.length === 0) {
        const resumo = `Concurso ${ultimo.concurso_id} | Ciclo: ${ciclo ?? "n/d"} | ` +
          (faltantes.length > 0
            ? `${faltantes.length} dezena(s) faltam: [${faltantes.map(fmt).join(", ")}]`
            : "Ciclo COMPLETO — novo ciclo iniciando.");
        const recomendacaoDireta = faltantes.length > 0
          ? `Para o concurso ${proxConcurso}: inclua estas ${Math.min(faltantes.length, 5)} dezenas faltantes prioritárias: [${faltantes.slice(0, 5).map(fmt).join(", ")}].`
          : `Para o concurso ${proxConcurso}: o ciclo zerou. Use as dezenas mais quentes da última janela.`;
        return { resumo, recomendacaoDireta };
      }

      const est = calcularEstatisticasCiclo(historicoCiclos, ciclo, concursosNoCicloAtual);
      const rec = montarRecomendacaoCiclo(est, faltantes, concursos);

      // Listar concursos já jogados neste ciclo (dos últimos 10)
      const concursosDoCiclo = concursos
        .filter((c) => c.ciclo_numero === ciclo)
        .map((c) => c.concurso_id)
        .sort((a, b) => a - b);

      const blocoStatus = `📊 Onde estamos\n` +
        `Estamos no Ciclo ${ciclo}, atualmente com ${concursosNoCicloAtual} concurso(s) jogado(s)` +
        (concursosDoCiclo.length > 0 ? ` (${concursosDoCiclo.join(", ")})` : "") + `.\n` +
        `O próximo sorteio (${proxConcurso}) será o ${est.posicaoAtual}º concurso deste ciclo.\n` +
        `Faltam ${faltantes.length} dezena(s) para fechar: ${faltantes.map(fmt).join(", ")}.`;

      const linhasDist = est.distribuicao.map((d) => {
        const label = d.duracao === 6 ? "6+ concursos" : `${d.duracao} concursos`;
        return `• ${label}: ${d.vezes} vez${d.vezes === 1 ? "" : "es"} (${d.perc}%)`;
      }).join("\n");

      const labelTop = est.topDuracoes
        .map((t) => (t.duracao === 6 ? "6+" : `${t.duracao}`))
        .join(" ou ");

      const blocoHistorico = `📈 Histórico (${est.totalCiclos} ciclos fechados)\n` +
        linhasDist + `\n` +
        `Mais comum: ciclo fecha em ${labelTop} concursos (${est.somaPercTop2}% dos casos).`;

      const blocoRecomendacao = `💡 Como montar seu palpite para o ${proxConcurso}\n` + rec.recomendacaoTexto;

      const blocoPrioritarias = `🎯 Faltantes prioritárias (${rec.prioritarias.length}): ${rec.prioritarias.map(fmt).join(", ")}\n` +
        `   → ${rec.justificativaPrioritarias}`;

      const blocoDeixadas = rec.deixadasDeFora.length > 0
        ? `❌ Deixadas de fora desta rodada: ${rec.deixadasDeFora.map(fmt).join(", ")}\n` +
          `   → ${rec.justificativaDeixadas}`
        : "";

      const resumo = [blocoStatus, blocoHistorico, blocoRecomendacao, blocoPrioritarias, blocoDeixadas]
        .filter(Boolean).join("\n\n");

      const recomendacaoDireta = `Para o concurso ${proxConcurso}: use ${rec.prioritarias.length} faltantes prioritárias [${rec.prioritarias.map(fmt).join(", ")}]` +
        (rec.deixadasDeFora.length > 0 ? `; deixe de fora [${rec.deixadasDeFora.map(fmt).join(", ")}]` : "") + `.`;

      return { resumo, recomendacaoDireta, extras: { totalCiclos: est.totalCiclos } };
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
      const a = analisarMolduraDetalhado(concursos);

      const blocoPanorama = `📊 Panorama da Moldura (últimos ${a.totalConcursos} sorteios)\n` +
        `A moldura tem 16 dezenas (01-05, 06, 10, 11, 15, 16, 20, 21-25).\n` +
        `Média de moldura por concurso: ${a.mediaMoldura.toFixed(1)} dezenas.\n` +
        `Faixa mais comum: ${a.faixaMaisComum.qtd1}${a.faixaMaisComum.qtd1 !== a.faixaMaisComum.qtd2 ? ` a ${a.faixaMaisComum.qtd2}` : ""} dezenas (${a.faixaMaisComum.perc}% dos sorteios).`;

      const blocoFortes = `🔥 Top dezenas fortes da moldura\n` +
        a.fortes.slice(0, 6).map((f) =>
          `• ${fmt(f.dezena)} — saiu em ${f.vezes} dos ${a.totalConcursos} concursos (${f.perc}%)`
        ).join("\n");

      const blocoPares = a.melhoresPares.length > 0
        ? `🤝 Melhores pares (saíram juntos com mais frequência)\n` +
          a.melhoresPares.map((p) => `• ${fmt(p.a)} + ${fmt(p.b)} — juntas ${p.vezes}x`).join("\n")
        : "";

      const blocoTrios = a.melhoresTrios.length > 0
        ? `🎯 Melhores trios\n` +
          a.melhoresTrios.map((t) => `• ${fmt(t.a)} + ${fmt(t.b)} + ${fmt(t.c)} — juntos ${t.vezes}x`).join("\n")
        : "";

      const blocoFracas = a.fracas.length > 0
        ? `❄️ Dezenas fracas da moldura (atenção)\n` +
          a.fracas.map((f) => {
            const comp = f.companheirasFrequentes.length > 0
              ? ` → quando saiu, veio com ${f.companheirasFrequentes.map(fmt).join(" e ")}`
              : "";
            return `• ${fmt(f.dezena)} — saiu apenas ${f.vezes}x (${f.perc}%)${comp}`;
          }).join("\n")
        : "";

      const limiarFalha = Math.floor(a.mediaMoldura - 1);
      const blocoFalha = a.padraoFalha.vezesFraca > 0
        ? `📉 Padrão de falha\n` +
          `Quando a moldura veio fraca (≤${limiarFalha} dezenas), aconteceu em ${a.padraoFalha.vezesFraca} dos ${a.totalConcursos} concursos.\n` +
          `Nesses casos, as ausentes foram principalmente: ${a.padraoFalha.ausentesTop.map(fmt).join(", ")}.`
        : "";

      const r = a.recomendacao;
      const blocoRecomendacao = `💡 Como montar seu palpite para o ${proxConcurso}\n` +
        `Recomendamos usar ${r.qtdRecomendada} dezenas da moldura, distribuídas assim:`;

      const linhaNucleo = r.nucleoForte.length > 0
        ? `🎯 Núcleo forte (${r.nucleoForte.length} fixas): ${r.nucleoForte.map(fmt).join(", ")}\n   → ${r.justNucleo}`
        : "";
      const linhaApoio = r.apoio.length > 0
        ? `➕ Apoio (${r.apoio.length} dezenas): ${r.apoio.map(fmt).join(", ")}\n   → ${r.justApoio}`
        : "";
      const linhaCoringas = r.coringas.length > 0
        ? `🎲 Coringas (${r.coringas.length} a girar): ${r.coringas.map(fmt).join(", ")}\n   → ${r.justCoringas}`
        : "";
      const linhaFora = r.deixarFora.length > 0
        ? `❌ Deixe de fora desta rodada: ${r.deixarFora.map(fmt).join(", ")}\n   → ${r.justFora}`
        : "";

      const resumo = [
        blocoPanorama, blocoFortes, blocoPares, blocoTrios, blocoFracas, blocoFalha,
        blocoRecomendacao, linhaNucleo, linhaApoio, linhaCoringas, linhaFora,
      ].filter(Boolean).join("\n\n");

      const recomendacaoDireta = `Para o concurso ${proxConcurso}: use ${r.qtdRecomendada} dezenas da moldura — núcleo [${r.nucleoForte.map(fmt).join(", ")}], apoio [${r.apoio.map(fmt).join(", ")}], coringas [${r.coringas.map(fmt).join(", ")}], fora [${r.deixarFora.map(fmt).join(", ")}].`;

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

${tipoPost === "analise_ciclo" ? `IMPORTANTE — TIPO CICLO: REPRODUZA LITERALMENTE os blocos "📊 Onde estamos", "📈 Histórico", "💡 Como montar seu palpite", "🎯 Faltantes prioritárias" e "❌ Deixadas de fora" exatamente como aparecem em DADOS REAIS, sem resumir, sem omitir e sem alterar nenhum número, dezena ou percentual. Você só pode escrever a abertura (1 linha) e o disclaimer final.\n\n` : ""}${tipoPost === "analise_moldura" ? `IMPORTANTE — TIPO MOLDURA: REPRODUZA LITERALMENTE todos os blocos de DADOS REAIS ("📊 Panorama", "🔥 Top dezenas fortes", "🤝 Melhores pares", "🎯 Melhores trios", "❄️ Dezenas fracas", "📉 Padrão de falha", "💡 Como montar seu palpite", "🎯 Núcleo forte", "➕ Apoio", "🎲 Coringas", "❌ Deixe de fora") sem resumir, sem omitir e sem alterar nenhum número, dezena ou percentual. Você só pode escrever a abertura (1 linha) e o disclaimer final.\n\n` : ""}ESTRUTURA OBRIGATÓRIA do conteúdo:
1) Abertura curta (1 linha) com gancho diferente a cada vez.
2) Bloco principal — para "Análise por Linhas", "Análise por Colunas", "Análise de Ciclo" e "Análise de Moldura", REPRODUZA LITERALMENTE o conteúdo de "DADOS REAIS", sem resumir nem omitir nenhum item. Para os outros tipos, resuma os dados em 2-3 linhas sob o título "📊 O que aconteceu nos últimos 10".
3) Bloco "💡 Como montar seu palpite" — escreva a RECOMENDAÇÃO DIRETA acima, em destaque (pular se já estiver no bloco literal acima).
4) Disclaimer curto: "Loteria envolve sorte. Use como guia, não como certeza."

REGRAS CRÍTICAS:
- Use SOMENTE os números fornecidos. NUNCA invente um número novo nem altere dígitos.
- Se citar o concurso, use exatamente ${proxConcurso}.
- Tom humano, acolhedor, em primeira pessoa. Varie a abertura.
- Use **negrito** nas dezenas e na recomendação.
- Máximo ${tipoPost === "analise_ciclo" || tipoPost === "analise_moldura" ? "2000" : "1500"} caracteres no conteúdo.
- Apenas dezenas de 01 a 25.
- NUNCA mencione IA, bot, modelo, GPT ou Gemini.

Responda APENAS o CONTEÚDO em texto puro (sem título, sem JSON, sem aspas).`;
}

// =============================================================================
// VALIDADOR ANTI-ALUCINAÇÃO
// =============================================================================

function extrairNumerosPermitidos(
  concursos: Concurso[],
  proxConcurso: number,
  extras?: { totalCiclos?: number },
): Set<number> {
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
  if (extras?.totalCiclos) permitidos.add(extras.totalCiclos);
  // Pequenos números livres (contagens, frequências, ocorrências por linha/coluna, percentuais)
  for (let i = 0; i <= 100; i++) permitidos.add(i);
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
  const conteudo = `Olá pessoal! Trago um resumo direto do tema.\n\n${fatos.resumo}\n\n` +
    (fatos.resumo.includes("Como montar") ? "" : `💡 Como montar seu palpite\n${fatos.recomendacaoDireta}\n\n`) +
    `Loteria envolve sorte. Use como guia, não como certeza.`;
  return conteudo.substring(0, 2000);
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

    // 2. Buscar últimos 10 concursos + (em paralelo) histórico completo de ciclos quando for analise_ciclo
    const [resResp, ciclosResp] = await Promise.all([
      supabaseAdmin
        .from("resultados_loterias")
        .select("concurso_id:concurso, dezenas, data_sorteio, ciclo_numero, dezenas_faltantes_ciclo, qtd_pares, qtd_impares, qtd_repetidas, qtd_primos, qtd_moldura")
        .eq("loteria", "lotofacil")
        .order("concurso", { ascending: false })
        .limit(PERIODO_ANALISE),
      tipoPost === "analise_ciclo"
        ? supabaseAdmin
            .from("resultados_loterias")
            .select("ciclo_numero")
            .eq("loteria", "lotofacil")
            .not("ciclo_numero", "is", null)
        : Promise.resolve({ data: null, error: null }),
    ]);

    const { data: resultados, error: resErr } = resResp;
    if (resErr || !resultados || resultados.length === 0) {
      throw new Error(`Erro ao buscar resultados: ${resErr?.message || "vazio"}`);
    }

    const concursos = resultados as Concurso[];
    const ultimoConcurso = concursos[0].concurso_id;

    // Agrupa histórico de ciclos { ciclo_numero -> duracao }
    let historicoCiclos: CicloHistorico[] | undefined;
    if (tipoPost === "analise_ciclo" && ciclosResp.data) {
      const cnt = new Map<number, number>();
      for (const row of ciclosResp.data as Array<{ ciclo_numero: number | null }>) {
        if (row.ciclo_numero == null) continue;
        cnt.set(row.ciclo_numero, (cnt.get(row.ciclo_numero) || 0) + 1);
      }
      historicoCiclos = Array.from(cnt.entries()).map(([ciclo_numero, duracao]) => ({
        ciclo_numero,
        duracao,
      }));
      console.log(`[generate-guide-post] ciclos carregados: ${historicoCiclos.length}`);
    }

    // 3. Calcular fatos determinísticos
    const fatos = montarFatos(tipoPost, concursos, historicoCiclos);

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

    const numerosPermitidos = extrairNumerosPermitidos(concursos, proxConcurso, fatos.extras);
    const ia = await chamarIAComRetry(SYSTEM_PROMPT_BASE, userPrompt, apiKey);

    if (!ia.ok) {
      viaFallback = true;
      motivoFallback = `IA falhou: ${ia.status}`;
      console.warn(`[generate-guide-post] ⚠️ ${motivoFallback}`);
      conteudo = fallbackConteudo(fatos);
    } else {
      const limiteConteudo = tipoPost === "analise_ciclo" ? 2000 : 1500;
      const conteudoIA = sanitizar(ia.content || "").substring(0, limiteConteudo);
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
          conteudo = (conteudo + `\n\n💡 Como montar seu palpite\n${fatos.recomendacaoDireta}\n\nLoteria envolve sorte.`).substring(0, limiteConteudo);
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
