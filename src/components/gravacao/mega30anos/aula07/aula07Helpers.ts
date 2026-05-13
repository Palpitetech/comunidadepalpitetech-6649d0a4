// Helpers da Aula 07 — Dezenas de Início (Top Geral, Pares e Ímpares).
// Universo: a MENOR dezena de cada concurso (1 dezena por concurso).

import type { ConcursoMega } from "@/lib/megaEspecialEngine";

export interface DezenaInicialFreq {
  dezena: number;
  freq: number;
  pct: number; // sobre o total de concursos
}

export const dezenaInicialDe = (c: ConcursoMega): number | null => {
  if (!c.dezenas?.length) return null;
  return Math.min(...c.dezenas);
};

/** Mapa dezena -> ocorrências como inicial. */
export function freqInicialPorDezena(concursos: ConcursoMega[]): Map<number, number> {
  const m = new Map<number, number>();
  for (const c of concursos) {
    const d = dezenaInicialDe(c);
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
): DezenaInicialFreq[] {
  const arr: DezenaInicialFreq[] = [];
  for (const [dezena, freq] of m.entries()) {
    if (!filtro(dezena)) continue;
    arr.push({ dezena, freq, pct: total ? (freq / total) * 100 : 0 });
  }
  arr.sort((a, b) => b.freq - a.freq || a.dezena - b.dezena);
  return arr.slice(0, topN);
}

export function topInicialGeral(concursos: ConcursoMega[], topN = 10): DezenaInicialFreq[] {
  return rankFromMap(freqInicialPorDezena(concursos), concursos.length, () => true, topN);
}

export function topInicialPares(concursos: ConcursoMega[], topN = 10): DezenaInicialFreq[] {
  return rankFromMap(freqInicialPorDezena(concursos), concursos.length, (d) => d % 2 === 0, topN);
}

export function topInicialImpares(concursos: ConcursoMega[], topN = 10): DezenaInicialFreq[] {
  return rankFromMap(freqInicialPorDezena(concursos), concursos.length, (d) => d % 2 !== 0, topN);
}
