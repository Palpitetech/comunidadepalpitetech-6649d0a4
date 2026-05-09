// Helpers da Aula 02 — DEZENAS PARES de cada subdivisão do volante.
// Mesma estrutura de aula01Helpers, porém filtrando apenas dezenas pares.

import {
  DEZENAS_LINHA,
  DEZENAS_COLUNA,
  DEZENAS_QUADRANTE,
  DEZENAS_MINI,
} from "../aula01/aula01Helpers";

const onlyEven = (arr: number[]) => arr.filter((d) => d % 2 === 0);

/** 6 linhas — apenas dezenas pares (5 por linha). */
export const PARES_LINHA: Record<number, number[]> = Object.fromEntries(
  Object.entries(DEZENAS_LINHA).map(([k, v]) => [Number(k), onlyEven(v)]),
);

/** Colunas pares (2,4,6,8,10) — cada uma com 6 dezenas pares.
 *  Colunas ímpares não contêm dezenas pares e são omitidas. */
export const PARES_COLUNA: Record<number, number[]> = Object.fromEntries(
  Object.entries(DEZENAS_COLUNA)
    .map(([k, v]) => [Number(k), onlyEven(v)] as [number, number[]])
    .filter(([, v]) => v.length > 0),
);

/** 4 quadrantes — apenas dezenas pares. */
export const PARES_QUADRANTE: Record<number, number[]> = Object.fromEntries(
  Object.entries(DEZENAS_QUADRANTE).map(([k, v]) => [Number(k), onlyEven(v)]),
);

/** 15 mini-quadrantes — apenas dezenas pares (2 por mini). */
export const PARES_MINI: Record<number, number[]> = Object.fromEntries(
  Object.entries(DEZENAS_MINI).map(([k, v]) => [Number(k), onlyEven(v)]),
);

/** Lista flat de todas as 30 dezenas pares (2..60). */
export const TODAS_PARES: number[] = Array.from({ length: 30 }, (_, i) => (i + 1) * 2);
