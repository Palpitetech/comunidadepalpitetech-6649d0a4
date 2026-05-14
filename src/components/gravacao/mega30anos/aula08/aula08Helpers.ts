// Helpers da Aula 08 — Dezenas Pares (Top Inicial Par, Final Par e Geral).
// Universo: as dezenas pares de cada concurso da Mega-Sena.

import type { ConcursoMega } from "@/lib/megaEspecialEngine";

export interface DezenaParFreq {
  dezena: number;
  freq: number;
  pct: number; // sobre o total de concursos
}

export const paresDoConcurso = (c: ConcursoMega): number[] => {
  if (!c.dezenas?.length) return [];
  return c.dezenas.filter((d) => d % 2 === 0).sort((a, b) => a - b);
};

export const inicialParDe = (c: ConcursoMega): number | null => {
  const pares = paresDoConcurso(c);
  return pares.length ? pares[0] : null;
};

export const finalParDe = (c: ConcursoMega): number | null => {
  const pares = paresDoConcurso(c);
  return pares.length ? pares[pares.length - 1] : null;
};

export function freqInicialParPorDezena(concursos: ConcursoMega[]): Map<number, number> {
  const m = new Map<number, number>();
  for (const c of concursos) {
    const d = inicialParDe(c);
    if (d == null) continue;
    m.set(d, (m.get(d) ?? 0) + 1);
  }
  return m;
}

export function freqFinalParPorDezena(concursos: ConcursoMega[]): Map<number, number> {
  const m = new Map<number, number>();
  for (const c of concursos) {
    const d = finalParDe(c);
    if (d == null) continue;
    m.set(d, (m.get(d) ?? 0) + 1);
  }
  return m;
}

export function freqParGeralPorDezena(concursos: ConcursoMega[]): Map<number, number> {
  const m = new Map<number, number>();
  for (const c of concursos) {
    for (const d of paresDoConcurso(c)) {
      m.set(d, (m.get(d) ?? 0) + 1);
    }
  }
  return m;
}

function rankFromMap(
  m: Map<number, number>,
  total: number,
  topN: number,
): DezenaParFreq[] {
  const arr: DezenaParFreq[] = [];
  for (const [dezena, freq] of m.entries()) {
    arr.push({ dezena, freq, pct: total ? (freq / total) * 100 : 0 });
  }
  arr.sort((a, b) => b.freq - a.freq || a.dezena - b.dezena);
  return arr.slice(0, topN);
}

export function topInicialPar(concursos: ConcursoMega[], topN = 10): DezenaParFreq[] {
  return rankFromMap(freqInicialParPorDezena(concursos), concursos.length, topN);
}

export function topFinalPar(concursos: ConcursoMega[], topN = 10): DezenaParFreq[] {
  return rankFromMap(freqFinalParPorDezena(concursos), concursos.length, topN);
}

export function topParGeral(concursos: ConcursoMega[], topN = 10): DezenaParFreq[] {
  return rankFromMap(freqParGeralPorDezena(concursos), concursos.length, topN);
}
