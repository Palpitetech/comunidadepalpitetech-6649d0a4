// =============================================================================
// Extrator de BaseGeracao para a Mega-Sena.
// Adaptado para 60 dezenas / 6 sorteadas. Espelha a estrutura da Lotofácil,
// mas com cotas e limiares calibrados ao perfil de baixíssima repetição da
// Mega (média ~0.6 repetidas por sorteio).
// =============================================================================

import type { BaseGeracao, Concurso } from "../types.ts";

const TOTAL = 60;

// Moldura Mega: bordas do grid 6×10 (linhas 1 e 6 inteiras + cantos das colunas)
const MOLDURA: number[] = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
  11, 20,
  21, 30,
  31, 40,
  41, 50,
  51, 52, 53, 54, 55, 56, 57, 58, 59, 60,
];

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

function linhaDe(d: number): number { return Math.floor((d - 1) / 10) + 1; }
function colunaDe(d: number): number { return ((d - 1) % 10) + 1; }

// ---------- Builders por tema ----------

function baseMovimentacao(concursos: Concurso[]): BaseGeracao {
  const N = concursos.length;
  const freq = freqMap(concursos);
  // Em Mega, "quente" = perc >= 15% na janela (média esperada ~10%)
  const ranking = Array.from(freq.entries())
    .map(([d, v]) => ({ d, vezes: v, perc: (v / N) * 100 }))
    .sort((a, b) => b.vezes - a.vezes || a.d - b.d);

  const fixar = ranking.slice(0, 2).map((r) => r.d); // top 2 quentíssimas
  const apoio = ranking.slice(2, 8).map((r) => r.d); // próximas 6
  const excluir = topFriasIds(concursos, 4); // 4 mais frias

  return {
    tema: "analise_movimentacao",
    fixar,
    apoio,
    excluir,
    ultimo_sorteio: concursos[0]?.dezenas ?? [],
    observacao_principal: `Quentes & Frias (Mega): ${fixar.length} fixas + ${apoio.length} apoio.`,
    motivo_fixar: `Top dezenas QUENTES nos últimos ${N} sorteios da Mega.`,
    motivo_apoio: `Próximas dezenas com presença sólida na janela.`,
    motivo_excluir: `Dezenas FRIAS — menor presença nos últimos ${N} sorteios.`,
  };
}

function baseMoldura(concursos: Concurso[]): BaseGeracao {
  const N = concursos.length;
  const moldSet = new Set(MOLDURA);
  const freq = new Map<number, number>();
  for (const d of MOLDURA) freq.set(d, 0);
  let totalMold = 0;
  for (const c of concursos) {
    for (const d of c.dezenas) {
      if (moldSet.has(d)) {
        freq.set(d, (freq.get(d) || 0) + 1);
        totalMold++;
      }
    }
  }
  const mediaMold = totalMold / Math.max(1, N);
  const ranked = Array.from(freq.entries()).sort((a, b) => b[1] - a[1] || a[0] - b[0]);

  const fixar = ranked.slice(0, 2).map(([d]) => d);
  const apoio = ranked.slice(2, 6).map(([d]) => d);
  const excluir = ranked.slice(-3).map(([d]) => d);

  // Faixa típica observada: média ± 1, dentro de [1, 4]
  const min = Math.max(1, Math.round(mediaMold) - 1);
  const max = Math.min(5, Math.round(mediaMold) + 1);

  return {
    tema: "analise_moldura",
    fixar,
    apoio,
    excluir,
    ultimo_sorteio: concursos[0]?.dezenas ?? [],
    qtd_moldura_alvo: { min, max },
    observacao_principal: `Moldura (Mega): média ~${mediaMold.toFixed(1)} dezenas/sorteio (alvo ${min}-${max}).`,
    motivo_fixar: `Top 2 dezenas mais fortes da moldura.`,
    motivo_apoio: `Apoio da moldura — próximas mais frequentes.`,
    motivo_excluir: `Moldura fraca: dezenas com pior presença.`,
  };
}

function baseRepetidas(concursos: Concurso[]): BaseGeracao {
  // Mega quase nunca repete (média ~0.6/sorteio). Estratégia: trocar a maioria.
  const ultimo = concursos[0]?.dezenas ?? [];
  const quentes = topQuentesIds(concursos, 8).filter((d) => !ultimo.includes(d));

  return {
    tema: "analise_repetidas",
    fixar: quentes.slice(0, 2),
    apoio: quentes.slice(2, 6),
    excluir: ultimo.slice(0, 3), // sugere trocar 3 do último (defensivo)
    ultimo_sorteio: ultimo,
    qtd_repetidas_alvo: { min: 0, max: 1 },
    observacao_principal: `Mega: repetir é evento raro. Aposte em renovar a maioria das dezenas.`,
    motivo_fixar: `Dezenas quentes da janela que NÃO saíram no último — alta probabilidade de aparecer.`,
    motivo_apoio: `Apoio com presença sólida fora do último sorteio.`,
    motivo_excluir: `Defensivo: 3 dezenas do último sorteio (Mega quase nunca repete).`,
  };
}

function baseEixo(concursos: Concurso[], eixo: "linha" | "coluna"): BaseGeracao {
  const N = concursos.length;
  const totalEixos = eixo === "linha" ? 6 : 10;
  const getEixo = eixo === "linha" ? linhaDe : colunaDe;

  // Soma dezenas por eixo
  const somaPorEixo = new Array(totalEixos + 1).fill(0);
  for (const c of concursos) for (const d of c.dezenas) somaPorEixo[getEixo(d)]++;
  const mediaPorEixo: { eixo: number; med: number }[] = [];
  for (let i = 1; i <= totalEixos; i++) {
    mediaPorEixo.push({ eixo: i, med: somaPorEixo[i] / N });
  }
  mediaPorEixo.sort((a, b) => b.med - a.med || a.eixo - b.eixo);
  const eixosQuentes = new Set(mediaPorEixo.slice(0, Math.ceil(totalEixos / 2)).map((x) => x.eixo));
  const eixosFrios = new Set(mediaPorEixo.slice(-2).map((x) => x.eixo));

  // Top dezena de cada eixo quente vira fixa/apoio; pior dezena dos eixos frios vira excluída
  const freq = freqMap(concursos);
  const fixar: number[] = [];
  const apoio: number[] = [];
  const excluir: number[] = [];

  for (const e of mediaPorEixo) {
    const dezenasDoEixo: { d: number; v: number }[] = [];
    for (let d = 1; d <= TOTAL; d++) {
      if (getEixo(d) === e.eixo) dezenasDoEixo.push({ d, v: freq.get(d) || 0 });
    }
    dezenasDoEixo.sort((a, b) => b.v - a.v || a.d - b.d);
    if (eixosQuentes.has(e.eixo)) {
      // Top1 dos 2 eixos mais quentes vai pro fixar
      if (fixar.length < 2 && dezenasDoEixo[0]) fixar.push(dezenasDoEixo[0].d);
      else if (apoio.length < 6 && dezenasDoEixo[0]) apoio.push(dezenasDoEixo[0].d);
    }
    if (eixosFrios.has(e.eixo)) {
      const ultima = dezenasDoEixo[dezenasDoEixo.length - 1];
      if (ultima && excluir.length < 3) excluir.push(ultima.d);
    }
  }

  return {
    tema: eixo === "linha" ? "analise_linhas" : "analise_colunas",
    fixar,
    apoio,
    excluir,
    ultimo_sorteio: concursos[0]?.dezenas ?? [],
    observacao_principal: `Distribuição equilibrada por ${eixo === "linha" ? "linhas" : "colunas"} (Mega).`,
    motivo_fixar: `Top dezena dos 2 ${eixo}s mais aquecidos.`,
    motivo_apoio: `Top dezena dos demais ${eixo}s aquecidos.`,
    motivo_excluir: `Pior dezena dos ${eixo}s mais frios.`,
  };
}

function basePosicoes(concursos: Concurso[], modo: "inicial" | "final"): BaseGeracao {
  const indices = modo === "inicial" ? [0, 1, 2] : [3, 4, 5];
  const trios: number[][] = [];
  for (const c of concursos) {
    const ord = [...c.dezenas].sort((a, b) => a - b);
    if (ord.length < 6) continue;
    trios.push([ord[indices[0]], ord[indices[1]], ord[indices[2]]]);
  }

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

  // Alternativas: top2 de cada slot
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

  return {
    tema: modo === "inicial" ? "analise_posicoes_iniciais" : "analise_posicoes_finais",
    fixar: trioRecomendado,
    apoio: alternativas,
    excluir: [],
    ultimo_sorteio: concursos[0]?.dezenas ?? [],
    observacao_principal: `Trio ${modo === "inicial" ? "inicial" : "final"} recomendado para a Mega.`,
    motivo_fixar: `Dezena top1 das 3 posições ${modo === "inicial" ? "iniciais (P1-P3)" : "finais (P4-P6)"}.`,
    motivo_apoio: `Alternativas top2 de cada posição.`,
  };
}

// ---------- Fachada ----------

export function extrairBaseGeracaoMegasena(
  tipoPost: string,
  concursos: Concurso[],
): BaseGeracao | null {
  if (!concursos || concursos.length === 0) return null;

  switch (tipoPost) {
    case "analise_movimentacao": return baseMovimentacao(concursos);
    case "analise_moldura": return baseMoldura(concursos);
    case "analise_repetidas": return baseRepetidas(concursos);
    case "analise_linhas": return baseEixo(concursos, "linha");
    case "analise_colunas": return baseEixo(concursos, "coluna");
    case "analise_posicoes_iniciais": return basePosicoes(concursos, "inicial");
    case "analise_posicoes_finais": return basePosicoes(concursos, "final");
    case "analise_como_calculamos":
      return null; // não tem regra de geração
    default: {
      const quentes = topQuentesIds(concursos, 8);
      const frias = topFriasIds(concursos, 4);
      return {
        tema: tipoPost,
        fixar: quentes.slice(0, 2),
        apoio: quentes.slice(2, 6),
        excluir: frias,
        ultimo_sorteio: concursos[0]?.dezenas ?? [],
        observacao_principal: "Estratégia padrão Mega — quentes/frias da janela.",
        motivo_fixar: "Top dezenas mais quentes da janela.",
        motivo_apoio: "Apoio das próximas mais frequentes.",
        motivo_excluir: "Dezenas mais frias da janela.",
      };
    }
  }
}
