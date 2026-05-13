// Helpers da Aula 06 — Colunas Quentes (Início, Fim e Geral).
// Mesma lógica matemática da Aula 05, aplicada às 10 colunas do volante.
//   - Inicial = menor dezena do concurso
//   - Final   = maior dezena do concurso
//   - Geral   = todas as 6 dezenas (com repetição quando 2+ caem na mesma coluna)

import type { ConcursoMega } from "@/lib/megaEspecialEngine";

export const COLUNAS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;
export type Coluna = (typeof COLUNAS)[number];

export const colunaDe = (d: number): Coluna => (((d - 1) % 10) + 1) as Coluna;

const emptyCount = (): Record<Coluna, number> => ({
  1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0,
});

export interface FreqColuna {
  coluna: Coluna;
  freq: number;
  pct: number; // 0..100
}

function rank(counts: Record<Coluna, number>): FreqColuna[] {
  const total = COLUNAS.reduce((acc, c) => acc + counts[c], 0) || 1;
  return COLUNAS.map((c) => ({
    coluna: c,
    freq: counts[c],
    pct: (counts[c] / total) * 100,
  }));
}

export function freqInicioPorColuna(concursos: ConcursoMega[]): FreqColuna[] {
  const c = emptyCount();
  for (const k of concursos) {
    if (!k.dezenas?.length) continue;
    const min = Math.min(...k.dezenas);
    c[colunaDe(min)]++;
  }
  return rank(c);
}

export function freqFimPorColuna(concursos: ConcursoMega[]): FreqColuna[] {
  const c = emptyCount();
  for (const k of concursos) {
    if (!k.dezenas?.length) continue;
    const max = Math.max(...k.dezenas);
    c[colunaDe(max)]++;
  }
  return rank(c);
}

export function freqGeralPorColuna(concursos: ConcursoMega[]): FreqColuna[] {
  const c = emptyCount();
  for (const k of concursos) {
    for (const d of k.dezenas ?? []) c[colunaDe(d)]++;
  }
  return rank(c);
}

export interface TopDezenaColuna {
  coluna: Coluna;
  dezena: number | null;
  freq: number;
}

function topPorColuna(
  concursos: ConcursoMega[],
  pegar: (ds: number[]) => number | null,
): TopDezenaColuna[] {
  const map: Record<Coluna, Record<number, number>> = {
    1: {}, 2: {}, 3: {}, 4: {}, 5: {}, 6: {}, 7: {}, 8: {}, 9: {}, 10: {},
  };
  for (const k of concursos) {
    if (!k.dezenas?.length) continue;
    const d = pegar(k.dezenas);
    if (d == null) continue;
    map[colunaDe(d)][d] = (map[colunaDe(d)][d] ?? 0) + 1;
  }
  return COLUNAS.map((c) => {
    const entries = Object.entries(map[c]);
    if (entries.length === 0) return { coluna: c, dezena: null, freq: 0 };
    entries.sort((a, b) => b[1] - a[1] || Number(a[0]) - Number(b[0]));
    const [dez, freq] = entries[0];
    return { coluna: c, dezena: Number(dez), freq };
  });
}

export function topDezenaInicialPorColuna(concursos: ConcursoMega[]): TopDezenaColuna[] {
  return topPorColuna(concursos, (ds) => Math.min(...ds));
}

export function topDezenaFinalPorColuna(concursos: ConcursoMega[]): TopDezenaColuna[] {
  return topPorColuna(concursos, (ds) => Math.max(...ds));
}

/** Lista de dezenas de uma coluna (col 1 = [1,11,21,31,41,51], etc.) */
export function dezenasDaColuna(c: Coluna): number[] {
  return [c, c + 10, c + 20, c + 30, c + 40, c + 50];
}
