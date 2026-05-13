// Helpers da Aula 05 — Linhas Quentes (Início, Fim e Geral).
// Como `resultados_loterias.dezenas` é armazenado ordenado, usamos
// interpretação matemática:
//   - Inicial = menor dezena do concurso
//   - Final   = maior dezena do concurso
//   - Geral   = todas as 6 dezenas (com repetição quando 2+ caem na mesma linha)

import type { ConcursoMega } from "@/lib/megaEspecialEngine";

export const LINHAS = [1, 2, 3, 4, 5, 6] as const;
export type Linha = (typeof LINHAS)[number];

export const linhaDe = (d: number): Linha =>
  Math.min(6, Math.max(1, Math.ceil(d / 10))) as Linha;

const emptyCount = (): Record<Linha, number> => ({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 });

export interface FreqLinha {
  linha: Linha;
  freq: number;
  pct: number; // 0..100
}

function rank(counts: Record<Linha, number>): FreqLinha[] {
  const total = LINHAS.reduce((acc, l) => acc + counts[l], 0) || 1;
  return LINHAS.map((l) => ({
    linha: l,
    freq: counts[l],
    pct: (counts[l] / total) * 100,
  }));
}

export function freqInicioPorLinha(concursos: ConcursoMega[]): FreqLinha[] {
  const c = emptyCount();
  for (const k of concursos) {
    if (!k.dezenas?.length) continue;
    const min = Math.min(...k.dezenas);
    c[linhaDe(min)]++;
  }
  return rank(c);
}

export function freqFimPorLinha(concursos: ConcursoMega[]): FreqLinha[] {
  const c = emptyCount();
  for (const k of concursos) {
    if (!k.dezenas?.length) continue;
    const max = Math.max(...k.dezenas);
    c[linhaDe(max)]++;
  }
  return rank(c);
}

export function freqGeralPorLinha(concursos: ConcursoMega[]): FreqLinha[] {
  const c = emptyCount();
  for (const k of concursos) {
    for (const d of k.dezenas ?? []) c[linhaDe(d)]++;
  }
  return rank(c);
}

export interface TopDezenaLinha {
  linha: Linha;
  dezena: number | null;
  freq: number;
}

function topPorLinha(
  concursos: ConcursoMega[],
  pegar: (ds: number[]) => number | null,
): TopDezenaLinha[] {
  // count[linha][dezena] = vezes
  const map: Record<Linha, Record<number, number>> = {
    1: {}, 2: {}, 3: {}, 4: {}, 5: {}, 6: {},
  };
  for (const k of concursos) {
    if (!k.dezenas?.length) continue;
    const d = pegar(k.dezenas);
    if (d == null) continue;
    const l = linhaDe(d);
    map[l][d] = (map[l][d] ?? 0) + 1;
  }
  return LINHAS.map((l) => {
    const entries = Object.entries(map[l]);
    if (entries.length === 0) return { linha: l, dezena: null, freq: 0 };
    entries.sort((a, b) => b[1] - a[1] || Number(a[0]) - Number(b[0]));
    const [dez, freq] = entries[0];
    return { linha: l, dezena: Number(dez), freq };
  });
}

export function topDezenaInicialPorLinha(concursos: ConcursoMega[]): TopDezenaLinha[] {
  return topPorLinha(concursos, (ds) => Math.min(...ds));
}

export function topDezenaFinalPorLinha(concursos: ConcursoMega[]): TopDezenaLinha[] {
  return topPorLinha(concursos, (ds) => Math.max(...ds));
}
