// Helpers da Aula 04 — DEZENAS PRIMAS de cada subdivisão do volante.
// Mesma estrutura de aula03Helpers, porém filtrando apenas dezenas primas
// (universo PRIMOS_MEGASENA = 2,3,5,7,11,13,17,19,23,29,31,37,41,43,47,53,59).

import {
  DEZENAS_LINHA,
  DEZENAS_COLUNA,
  DEZENAS_QUADRANTE,
  DEZENAS_MINI,
} from "../aula01/aula01Helpers";
import { PRIMOS_MEGASENA, isPrimo } from "@/lib/megasena";

const onlyPrimos = (arr: number[]) => arr.filter(isPrimo);

/** 6 linhas — apenas dezenas primas (2 a 4 por linha). */
export const PRIMOS_LINHA: Record<number, number[]> = Object.fromEntries(
  Object.entries(DEZENAS_LINHA).map(([k, v]) => [Number(k), onlyPrimos(v)]),
);

/** Colunas com primos (C1, C2, C3, C5, C7, C9). Demais são omitidas. */
export const PRIMOS_COLUNA: Record<number, number[]> = Object.fromEntries(
  Object.entries(DEZENAS_COLUNA)
    .map(([k, v]) => [Number(k), onlyPrimos(v)] as [number, number[]])
    .filter(([, v]) => v.length > 0),
);

/** 4 quadrantes — apenas dezenas primas. */
export const PRIMOS_QUADRANTE: Record<number, number[]> = Object.fromEntries(
  Object.entries(DEZENAS_QUADRANTE).map(([k, v]) => [Number(k), onlyPrimos(v)]),
);

/** Mini-quadrantes com primos (omite MQ8 e MQ13 que não têm primos). */
export const PRIMOS_MINI: Record<number, number[]> = Object.fromEntries(
  Object.entries(DEZENAS_MINI)
    .map(([k, v]) => [Number(k), onlyPrimos(v)] as [number, number[]])
    .filter(([, v]) => v.length > 0),
);

/** Lista flat de todos os 17 primos do universo da Mega-Sena. */
export const TODOS_PRIMOS: number[] = [...PRIMOS_MEGASENA];
