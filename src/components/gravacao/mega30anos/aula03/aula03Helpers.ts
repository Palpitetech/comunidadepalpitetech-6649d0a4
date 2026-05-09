// Helpers da Aula 03 — DEZENAS ÍMPARES de cada subdivisão do volante.
// Mesma estrutura de aula02Helpers, porém filtrando apenas dezenas ímpares.

import {
  DEZENAS_LINHA,
  DEZENAS_COLUNA,
  DEZENAS_QUADRANTE,
  DEZENAS_MINI,
} from "../aula01/aula01Helpers";

const onlyOdd = (arr: number[]) => arr.filter((d) => d % 2 !== 0);

/** 6 linhas — apenas dezenas ímpares (5 por linha). */
export const IMPARES_LINHA: Record<number, number[]> = Object.fromEntries(
  Object.entries(DEZENAS_LINHA).map(([k, v]) => [Number(k), onlyOdd(v)]),
);

/** Colunas ímpares (1,3,5,7,9) — cada uma com 6 dezenas ímpares.
 *  Colunas pares não contêm dezenas ímpares e são omitidas. */
export const IMPARES_COLUNA: Record<number, number[]> = Object.fromEntries(
  Object.entries(DEZENAS_COLUNA)
    .map(([k, v]) => [Number(k), onlyOdd(v)] as [number, number[]])
    .filter(([, v]) => v.length > 0),
);

/** 4 quadrantes — apenas dezenas ímpares. */
export const IMPARES_QUADRANTE: Record<number, number[]> = Object.fromEntries(
  Object.entries(DEZENAS_QUADRANTE).map(([k, v]) => [Number(k), onlyOdd(v)]),
);

/** 15 mini-quadrantes — apenas dezenas ímpares (2 por mini). */
export const IMPARES_MINI: Record<number, number[]> = Object.fromEntries(
  Object.entries(DEZENAS_MINI).map(([k, v]) => [Number(k), onlyOdd(v)]),
);

/** Lista flat de todas as 30 dezenas ímpares (1..59). */
export const TODAS_IMPARES: number[] = Array.from({ length: 30 }, (_, i) => i * 2 + 1);
