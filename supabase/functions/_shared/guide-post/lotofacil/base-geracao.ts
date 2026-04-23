// =============================================================================
// Extrator de BaseGeracao para a Lotofácil.
// Reaproveita as funções de análise do engine.ts via passagem por argumento
// das funções já calculadas (ou re-rodando elas a partir dos `concursos`).
//
// O contrato é: dado (tipoPost, concursos, historicoCiclos) retornar uma
// BaseGeracao que o gerador determinístico consegue traduzir em jogos.
// =============================================================================

import type { BaseGeracao, CicloHistorico, Concurso } from "../types.ts";

const TOTAL = 25;
const MOLDURA: number[] = [
  1, 2, 3, 4, 5,
  6, 10,
  11, 15,
  16, 20,
  21, 22, 23, 24, 25,
];

// ---------- helpers genéricos ----------
function freqMap(concursos: Concurso[]): Map<number, number> {
  const f = new Map<number, number>();
  for (let i = 1; i <= TOTAL; i++) f.set(i, 0);
  for (const c of concursos) for (const d of c.dezenas) f.set(d, (f.get(d) || 0) + 1);
  return f;
}

function topQuentesIds(concursos: Concurso[], n: number): number[] {
  return Array.from(freqMap(concursos).entries())
    .sort((a, b) => b[1] - a[1] || a[0] - b[0])
    .slice(0, n)
    .map(([d]) => d);
}

function topFriasIds(concursos: Concurso[], n: number): number[] {
  return Array.from(freqMap(concursos).entries())
    .sort((a, b) => a[1] - b[1] || a[0] - b[0])
    .slice(0, n)
    .map(([d]) => d);
}

// ---------- Builders por tema ----------

function baseMoldura(concursos: Concurso[]): BaseGeracao {
  const N = concursos.length;
  const moldSet = new Set(MOLDURA);
  const freq = new Map<number, number>();
  for (const d of MOLDURA) freq.set(d, 0);
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
  const mediaMoldura = qtdMoldPorSorteio.reduce((a, b) => a + b, 0) / Math.max(1, N);

  const ordenadasDesc = Array.from(freq.entries())
    .sort((a, b) => b[1] - a[1] || a[0] - b[0]);
  const fortes = ordenadasDesc.map(([d, v]) => ({ d, perc: Math.round((v / N) * 100) }));
  const nucleoForte = fortes.filter((f) => f.perc >= 70).slice(0, 4).map((f) => f.d);
  const apoio = fortes
    .filter((f) => f.perc >= 50 && f.perc < 70 && !nucleoForte.includes(f.d))
    .slice(0, 4)
    .map((f) => f.d);

  // Fracas <=30%
  const limiteFraca = Math.max(1, N * 0.3);
  const fracas = ordenadasDesc.filter(([, v]) => v <= limiteFraca && v > 0).slice(-3).map(([d]) => d);

  const qtdRecomendada = Math.max(7, Math.min(11, Math.round(mediaMoldura)));
  const min = Math.max(6, qtdRecomendada - 1);
  const max = Math.min(13, qtdRecomendada + 2);

  return {
    tema: "analise_moldura",
    fixar: nucleoForte,
    apoio,
    excluir: fracas,
    ultimo_sorteio: concursos[0]?.dezenas ?? [],
    qtd_moldura_alvo: { min, max },
    observacao_principal: `Moldura: ${qtdRecomendada} dezenas alvo (faixa ${min}-${max}).`,
    motivo_fixar: `Núcleo forte da moldura (frequência ≥70% nos últimos ${N} sorteios).`,
    motivo_apoio: `Apoio da moldura (frequência 50-70%) — cada jogo carrega pelo menos uma parte.`,
    motivo_excluir: `Moldura fraca: aparece em ≤30% dos sorteios recentes.`,
  };
}

function baseMovimentacao(concursos: Concurso[]): BaseGeracao {
  const N = concursos.length;
  const freq = freqMap(concursos);
  const ranking = Array.from(freq.entries())
    .map(([d, v]) => ({ d, vezes: v, perc: Math.round((v / N) * 100) }))
    .sort((a, b) => b.vezes - a.vezes || a.d - b.d);

  const quentes = ranking.filter((r) => r.perc >= 60).slice(0, 6).map((r) => r.d);
  const frias = ranking.filter((r) => r.perc <= 40).slice(-3).map((r) => r.d);

  // FIXAR: top 5 quentes
  const fixar = quentes.slice(0, 5);
  // APOIO: próximos 4 (perc >= 50 e fora do fixar)
  const apoio = ranking
    .filter((r) => !fixar.includes(r.d) && r.perc >= 50 && !frias.includes(r.d))
    .slice(0, 4)
    .map((r) => r.d);

  // FICAR DE OLHO: dezenas em desaceleração que ainda estavam quentes
  const half = Math.min(5, Math.floor(N / 2));
  const recentes = concursos.slice(0, half);
  const anteriores = concursos.slice(half, half * 2);
  const fRec = freqMap(recentes);
  const fAnt = freqMap(anteriores);
  const desac = [];
  for (let d = 1; d <= TOTAL; d++) {
    const delta = (fRec.get(d) || 0) - (fAnt.get(d) || 0);
    if (delta < 0 && fixar.includes(d) === false && quentes.includes(d)) {
      desac.push({ d, delta });
    }
  }
  const ficarDeOlho = desac.sort((a, b) => a.delta - b.delta).slice(0, 2).map((x) => x.d);

  return {
    tema: "analise_movimentacao",
    fixar,
    apoio,
    excluir: frias.slice(0, 3),
    ficar_de_olho: ficarDeOlho,
    ultimo_sorteio: concursos[0]?.dezenas ?? [],
    observacao_principal: `Quentes & Frias: ${fixar.length} fixas + ${apoio.length} apoio.`,
    motivo_fixar: `Top dezenas QUENTES (presença ≥60% nos últimos ${N} sorteios).`,
    motivo_apoio: `Apoio com presença sólida (≥50%).`,
    motivo_excluir: `Dezenas FRIAS (≤40% de presença nos últimos ${N}).`,
  };
}

function baseRepetidas(concursos: Concurso[]): BaseGeracao {
  const N = concursos.length;
  if (concursos.length < 2) {
    return {
      tema: "analise_repetidas",
      fixar: [], apoio: [], excluir: [],
      ultimo_sorteio: concursos[0]?.dezenas ?? [],
      observacao_principal: "Sem dados suficientes.",
    };
  }
  const ultimo = concursos[0].dezenas;
  const ultimoSet = new Set(ultimo);

  // Por dezena do último: contar transições e repetições
  const vezesRep = new Map<number, number>();
  const vezesEra = new Map<number, number>();
  let totalRep = 0;
  for (let i = 0; i < concursos.length - 1; i++) {
    const seg = new Set(concursos[i].dezenas);
    const ant = concursos[i + 1].dezenas;
    let countTrans = 0;
    for (const d of ant) {
      vezesEra.set(d, (vezesEra.get(d) || 0) + 1);
      if (seg.has(d)) {
        vezesRep.set(d, (vezesRep.get(d) || 0) + 1);
        countTrans++;
      }
    }
    totalRep += countTrans;
  }
  const mediaRep = totalRep / (concursos.length - 1);
  const qtdRecomendada = Math.max(7, Math.min(11, Math.round(mediaRep)));

  const taxas = ultimo.map((d) => {
    const t = vezesEra.get(d) || 0;
    const v = vezesRep.get(d) || 0;
    return { d, perc: t > 0 ? Math.round((v / t) * 100) : 0, vezes: v };
  });

  const fieis = [...taxas].sort((a, b) => b.perc - a.perc || b.vezes - a.vezes || a.d - b.d);
  const repetirNucleo = fieis.filter((x) => x.perc >= 60).slice(0, 5).map((x) => x.d);
  const repetirApoio = fieis
    .filter((x) => !repetirNucleo.includes(x.d) && x.perc >= 40 && x.perc < 60)
    .slice(0, Math.max(0, qtdRecomendada - repetirNucleo.length))
    .map((x) => x.d);

  // Voláteis: do último, perc <=35% — não repetir
  const naoRepetir = taxas.filter((x) => x.perc <= 35).sort((a, b) => a.perc - b.perc).slice(0, 3).map((x) => x.d);

  return {
    tema: "analise_repetidas",
    fixar: repetirNucleo,
    apoio: repetirApoio,
    excluir: naoRepetir,
    ultimo_sorteio: ultimo,
    qtd_repetidas_alvo: { min: qtdRecomendada, max: Math.min(13, qtdRecomendada + 2) },
    observacao_principal: `Repetidas: ${qtdRecomendada} dezenas devem repetir do último (faixa ${qtdRecomendada}-${Math.min(13, qtdRecomendada + 2)}).`,
    motivo_fixar: `Núcleo de repetidoras FIÉIS do último sorteio (taxa ≥60%).`,
    motivo_apoio: `Apoio de repetidoras com taxa média (40-60%).`,
    motivo_excluir: `Voláteis do último: padrão histórico de NÃO repetir (≤35%).`,
  };
}

function baseCiclo(concursos: Concurso[]): BaseGeracao {
  const ultimo = concursos[0];
  const faltantes = (ultimo?.dezenas_faltantes_ciclo && Array.isArray(ultimo.dezenas_faltantes_ciclo))
    ? [...ultimo.dezenas_faltantes_ciclo].sort((a, b) => a - b)
    : [];

  // Prioritárias: faltantes ordenadas pelas mais quentes nos últimos 10
  const freq = freqMap(concursos);
  const prioritarias = [...faltantes].sort((a, b) => (freq.get(b) || 0) - (freq.get(a) || 0) || a - b);
  const fixar = prioritarias.slice(0, Math.min(prioritarias.length, 6));
  const apoio: number[] = []; // não há apoio extra além das faltantes
  const excluir: number[] = []; // ciclo não exclui — só prioriza

  return {
    tema: "analise_ciclo",
    fixar,
    apoio,
    excluir,
    ultimo_sorteio: ultimo?.dezenas ?? [],
    observacao_principal: faltantes.length > 0
      ? `Ciclo ${ultimo?.ciclo_numero ?? "?"} — ${faltantes.length} faltantes priorizadas.`
      : `Ciclo zerou — sem faltantes.`,
    motivo_fixar: `Dezenas faltantes do ciclo atual, ordenadas pelas mais quentes nos últimos sorteios.`,
  };
}

function baseCenarios(concursos: Concurso[]): BaseGeracao {
  // Equilibrado: 8 repete + 7 novas. Usa fiéis como base.
  if (concursos.length < 2) {
    return {
      tema: "analise_cenarios", fixar: [], apoio: [], excluir: [],
      observacao_principal: "Sem dados.",
    };
  }
  const ultimo = concursos[0].dezenas;
  const repCount = new Map<number, number>();
  for (let i = 0; i < concursos.length - 1; i++) {
    const atual = new Set(concursos[i].dezenas);
    const ant = new Set(concursos[i + 1].dezenas);
    for (const d of [...atual].filter((x) => ant.has(x))) {
      repCount.set(d, (repCount.get(d) || 0) + 1);
    }
  }
  const fieisDoUltimo = ultimo
    .map((d) => ({ d, rep: repCount.get(d) || 0 }))
    .sort((a, b) => b.rep - a.rep || a.d - b.d);

  // FIXAR: top 5 fiéis do último (alta repetição) — núcleo equilibrado
  const fixar = fieisDoUltimo.slice(0, 5).map((x) => x.d);
  // APOIO: próximas 3 do último + 2 quentes globais fora do último
  const apoioRep = fieisDoUltimo.slice(5, 8).map((x) => x.d);
  const quentes = topQuentesIds(concursos, 8).filter((d) => !ultimo.includes(d) && !fixar.includes(d));
  const apoio = [...apoioRep, ...quentes.slice(0, 2)];

  return {
    tema: "analise_cenarios",
    fixar,
    apoio,
    excluir: [],
    ultimo_sorteio: ultimo,
    qtd_repetidas_alvo: { min: 7, max: 9 },
    observacao_principal: "Cenário EQUILIBRADO: ~8 repetidas + ~7 novas.",
    motivo_fixar: `Top fiéis do último sorteio (alta taxa de repetição).`,
    motivo_apoio: `Resto do último + dezenas quentes históricas para complementar.`,
  };
}

function baseFicarDeOlho(concursos: Concurso[]): BaseGeracao {
  // topQuedas: dezenas em desaceleração — manter atenção em 1-2, excluir a última.
  if (concursos.length < 10) {
    return {
      tema: "analise_ficar_de_olho", fixar: [], apoio: [], excluir: [],
      observacao_principal: "Sem janela suficiente.",
    };
  }
  const recente = concursos.slice(0, 5);
  const anterior = concursos.slice(5, 10);
  const fRec = freqMap(recente);
  const fAnt = freqMap(anterior);
  const quedas: { d: number; delta: number; ant: number }[] = [];
  for (let d = 1; d <= TOTAL; d++) {
    const r = fRec.get(d) || 0;
    const a = fAnt.get(d) || 0;
    if (r - a < 0 && a >= 2) quedas.push({ d, delta: r - a, ant: a });
  }
  quedas.sort((a, b) => a.delta - b.delta || a.d - b.d);
  const top = quedas.slice(0, 5).map((x) => x.d);
  const apoio = top.slice(0, 2); // manter atenção
  const excluir = top.slice(-1); // a com queda mais branda? não — pega a última (mais fraca rec.)

  return {
    tema: "analise_ficar_de_olho",
    fixar: [],
    apoio,
    excluir,
    ultimo_sorteio: concursos[0]?.dezenas ?? [],
    ficar_de_olho: top,
    observacao_principal: `Atenção: ${apoio.length} dezenas em desaceleração mantidas como apoio (efeito ressaca).`,
    motivo_apoio: `Dezenas com queda recente — efeito "ressaca" costuma trazê-las de volta.`,
    motivo_excluir: `Dezena com movimento mais fraco da rodada.`,
  };
}

function baseEixo(concursos: Concurso[], eixo: "linha" | "coluna"): BaseGeracao {
  const N = concursos.length;
  const grupos: number[][] = [];
  for (let i = 0; i < 5; i++) {
    const arr: number[] = [];
    if (eixo === "linha") {
      for (let d = i * 5 + 1; d < i * 5 + 6; d++) arr.push(d);
    } else {
      for (let l = 0; l < 5; l++) arr.push(l * 5 + i + 1);
    }
    grupos.push(arr);
  }

  const freqGlobal = freqMap(concursos);
  const nucleoFixas: number[] = [];
  const apoio: number[] = [];
  const evitar: number[] = [];

  for (const grupo of grupos) {
    const ranked = grupo
      .map((d) => ({ d, perc: Math.round(((freqGlobal.get(d) || 0) / N) * 100) }))
      .sort((a, b) => b.perc - a.perc || a.d - b.d);
    if (ranked[0]) nucleoFixas.push(ranked[0].d);
    if (ranked[1] && ranked[1].perc >= 50) apoio.push(ranked[1].d);
    const ultima = ranked[ranked.length - 1];
    if (ultima && ultima.perc <= 30) evitar.push(ultima.d);
  }

  return {
    tema: eixo === "linha" ? "analise_linhas" : "analise_colunas",
    fixar: nucleoFixas,
    apoio,
    excluir: evitar.slice(0, 3),
    ultimo_sorteio: concursos[0]?.dezenas ?? [],
    observacao_principal: `Distribuição equilibrada por ${eixo === "linha" ? "linhas" : "colunas"}: 1 fixa do top de cada grupo.`,
    motivo_fixar: `Top dezena de cada ${eixo} (maior frequência no grupo).`,
    motivo_apoio: `Segunda mais forte de cada ${eixo} com presença ≥50%.`,
    motivo_excluir: `Dezenas mais fracas (≤30%) de seus respectivos ${eixo === "linha" ? "linhas" : "colunas"}.`,
  };
}

function basePosicoes(concursos: Concurso[], modo: "inicial" | "final"): BaseGeracao {
  const N = concursos.length;
  const indices = modo === "inicial" ? [0, 1, 2] : [12, 13, 14];
  const trios: number[][] = [];
  for (const c of concursos) {
    const ord = [...c.dezenas].sort((a, b) => a - b);
    if (ord.length < 15) continue;
    trios.push([ord[indices[0]], ord[indices[1]], ord[indices[2]]]);
  }
  // Para cada slot, pega o top1
  const trioRecomendado: number[] = [];
  const usadas = new Set<number>();
  for (let s = 0; s < 3; s++) {
    const fr = new Map<number, number>();
    for (const t of trios) fr.set(t[s], (fr.get(t[s]) || 0) + 1);
    const ord = Array.from(fr.entries()).sort((a, b) => b[1] - a[1] || a[0] - b[0]);
    let escolha: number | null = null;
    for (const [d] of ord) {
      if (!usadas.has(d)) { escolha = d; break; }
    }
    if (escolha == null && ord[0]) escolha = ord[0][0];
    if (escolha != null) { trioRecomendado.push(escolha); usadas.add(escolha); }
  }

  // Alternativas: top2 de cada slot, sem duplicar com trio
  const alternativas: number[] = [];
  for (let s = 0; s < 3; s++) {
    const fr = new Map<number, number>();
    for (const t of trios) fr.set(t[s], (fr.get(t[s]) || 0) + 1);
    const ord = Array.from(fr.entries()).sort((a, b) => b[1] - a[1] || a[0] - b[0]);
    for (const [d] of ord) {
      if (!trioRecomendado.includes(d) && !alternativas.includes(d)) {
        alternativas.push(d);
        break;
      }
    }
  }

  // Evitar: dezenas da faixa relevante com perc <= 20% como início/fim
  const faixaMin = modo === "inicial" ? 1 : 16;
  const faixaMax = modo === "inicial" ? 10 : 25;
  const presenca = new Map<number, number>();
  for (let d = faixaMin; d <= faixaMax; d++) presenca.set(d, 0);
  for (const t of trios) {
    const set = new Set(t);
    for (let d = faixaMin; d <= faixaMax; d++) {
      if (set.has(d)) presenca.set(d, (presenca.get(d) || 0) + 1);
    }
  }
  const evitar = Array.from(presenca.entries())
    .filter(([, v]) => v / N <= 0.2)
    .sort((a, b) => a[1] - b[1] || a[0] - b[0])
    .slice(0, 3)
    .map(([d]) => d);

  return {
    tema: modo === "inicial" ? "analise_posicoes_iniciais" : "analise_posicoes_finais",
    fixar: trioRecomendado,
    apoio: alternativas,
    excluir: evitar,
    ultimo_sorteio: concursos[0]?.dezenas ?? [],
    observacao_principal: `Trio ${modo === "inicial" ? "inicial" : "final"} recomendado nos últimos ${N} sorteios.`,
    motivo_fixar: `Dezena top1 de cada uma das 3 posições ${modo === "inicial" ? "iniciais (P1-P3)" : "finais (P13-P15)"}.`,
    motivo_apoio: `Top2 de cada posição como alternativa de apoio.`,
    motivo_excluir: `Dezenas que raramente (≤20%) aparecem nas posições ${modo === "inicial" ? "iniciais" : "finais"}.`,
  };
}

// ---------- Fachada ----------

export function extrairBaseGeracaoLotofacil(
  tipoPost: string,
  concursos: Concurso[],
  _historicoCiclos?: CicloHistorico[],
): BaseGeracao | null {
  if (!concursos || concursos.length === 0) return null;

  switch (tipoPost) {
    case "analise_moldura": return baseMoldura(concursos);
    case "analise_movimentacao": return baseMovimentacao(concursos);
    case "analise_repetidas": return baseRepetidas(concursos);
    case "analise_ciclo": return baseCiclo(concursos);
    case "analise_cenarios": return baseCenarios(concursos);
    case "analise_ficar_de_olho": return baseFicarDeOlho(concursos);
    case "analise_linhas": return baseEixo(concursos, "linha");
    case "analise_colunas": return baseEixo(concursos, "coluna");
    case "analise_posicoes_iniciais": return basePosicoes(concursos, "inicial");
    case "analise_posicoes_finais": return basePosicoes(concursos, "final");
    case "analise_como_calculamos":
      // Não tem regra de geração — bloqueado pelo gerador.
      return null;
    default: {
      // Default: usar quentes como apoio
      const quentes = topQuentesIds(concursos, 10);
      const frias = topFriasIds(concursos, 3);
      return {
        tema: tipoPost,
        fixar: quentes.slice(0, 3),
        apoio: quentes.slice(3, 8),
        excluir: frias,
        ultimo_sorteio: concursos[0]?.dezenas ?? [],
        observacao_principal: "Estratégia padrão baseada nas quentes/frias da janela.",
        motivo_fixar: "Top dezenas mais quentes da janela analisada.",
        motivo_apoio: "Demais quentes com presença sólida.",
        motivo_excluir: "Top dezenas FRIAS da janela analisada.",
      };
    }
  }
}
