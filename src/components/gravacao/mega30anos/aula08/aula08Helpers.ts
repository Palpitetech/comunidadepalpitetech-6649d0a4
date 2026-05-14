// Helpers da Aula 08 — Dezenas Finais (Top Geral, Pares e Ímpares).
// Universo: a MAIOR dezena de cada concurso (6ª bola).

import type { ConcursoMega } from "@/lib/megaEspecialEngine";

export interface DezenaFinalFreq {
  dezena: number;
  freq: number;
  pct: number; // sobre o total de concursos
}

export const dezenaFinalDe = (c: ConcursoMega): number | null => {
  if (!c.dezenas?.length) return null;
  return Math.max(...c.dezenas);
};

/** Mapa dezena -> ocorrências como final (6ª bola). */
export function freqFinalPorDezena(concursos: ConcursoMega[]): Map<number, number> {
  const m = new Map<number, number>();
  for (const c of concursos) {
    const d = dezenaFinalDe(c);
    if (d == null) continue;
    m.set(d, (m.get(d) ?? 0) + 1);
  }
  return m;
}

function rankFromMap(
  m: Map<number, number>,
  total: number,
  filtro: (d: number) => boolean,
  topN: number,
): DezenaFinalFreq[] {
  const arr: DezenaFinalFreq[] = [];
  for (const [dezena, freq] of m.entries()) {
    if (!filtro(dezena)) continue;
    arr.push({ dezena, freq, pct: total ? (freq / total) * 100 : 0 });
  }
  arr.sort((a, b) => b.freq - a.freq || a.dezena - b.dezena);
  return arr.slice(0, topN);
}

export function topFinalGeral(concursos: ConcursoMega[], topN = 10): DezenaFinalFreq[] {
  return rankFromMap(freqFinalPorDezena(concursos), concursos.length, () => true, topN);
}

export function topFinalPares(concursos: ConcursoMega[], topN = 10): DezenaFinalFreq[] {
  return rankFromMap(freqFinalPorDezena(concursos), concursos.length, (d) => d % 2 === 0, topN);
}

export function topFinalImpares(concursos: ConcursoMega[], topN = 10): DezenaFinalFreq[] {
  return rankFromMap(freqFinalPorDezena(concursos), concursos.length, (d) => d % 2 !== 0, topN);
}
