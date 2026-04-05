/**
 * DIA DE SORTE - Única Verdade
 * Arquivo central com todas as constantes e funções de cálculo do sistema.
 * Universo: 1-31 | Grid: 3 linhas de 10 + 1 linha com 1 | Sorteio: 7 dezenas + 1 mês
 *
 * Layout do volante:
 * [01] [02] [03] [04] [05] [06] [07] [08] [09] [10]
 * [11] [12] [13] [14] [15] [16] [17] [18] [19] [20]
 * [21] [22] [23] [24] [25] [26] [27] [28] [29] [30]
 * [31]
 *
 * A primeira coluna tem 4 linhas. Da 2ª à 10ª coluna tem 3 linhas.
 */

// =============================================================================
// CONSTANTES FIXAS - DIA DE SORTE
// =============================================================================

export const TOTAL_DEZENAS_VOLANTE = 31;
export const DEZENAS_POR_SORTEIO = 7;
export const TOTAL_MESES = 12;

/**
 * Meses do Dia de Sorte (grid 2x6)
 */
export const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
] as const;

/**
 * Números primos dentro do universo Dia de Sorte (1-31)
 */
export const PRIMOS_DIADESORTE: number[] = [
  2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31
];

/**
 * Múltiplos de 3 dentro do universo Dia de Sorte (1-31)
 */
export const MULTIPLOS_DE_3_DIADESORTE: number[] = [
  3, 6, 9, 12, 15, 18, 21, 24, 27, 30
];

/**
 * Sequência de Fibonacci dentro do universo Dia de Sorte (1-31)
 */
export const FIBONACCI_DIADESORTE: number[] = [1, 2, 3, 5, 8, 13, 21];

/**
 * Dezenas que formam a moldura do volante (bordas externas)
 *
 * [01] [02] [03] [04] [05] [06] [07] [08] [09] [10]  <- toda borda
 * [11]  12   13   14   15   16   17   18   19  [20]  <- bordas laterais
 * [21] [22] [23] [24] [25] [26] [27] [28] [29] [30]  <- toda borda (linha inferior do bloco 10-wide)
 * [31]                                                 <- borda (sozinha)
 *
 * Interior (miolo): apenas 12, 13, 14, 15, 16, 17, 18, 19
 */
export const MOLDURA_DIADESORTE: number[] = [
  // Linha superior
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
  // Bordas laterais da linha 2
  11, 20,
  // Linha inferior do bloco principal
  21, 22, 23, 24, 25, 26, 27, 28, 29, 30,
  // Dezena isolada
  31
];

// =============================================================================
// FUNÇÕES DE CÁLCULO
// =============================================================================

export function isPar(numero: number): boolean {
  return numero % 2 === 0;
}

export function isImpar(numero: number): boolean {
  return numero % 2 !== 0;
}

export function isMoldura(numero: number): boolean {
  return MOLDURA_DIADESORTE.includes(numero);
}

export function isPrimo(numero: number): boolean {
  return PRIMOS_DIADESORTE.includes(numero);
}

export function isMultiploDe3(numero: number): boolean {
  return numero % 3 === 0;
}

export function isFibonacci(numero: number): boolean {
  return FIBONACCI_DIADESORTE.includes(numero);
}

export function contarPares(dezenas: number[]): number {
  return dezenas.filter(isPar).length;
}

export function contarImpares(dezenas: number[]): number {
  return dezenas.filter(isImpar).length;
}

export function contarMoldura(dezenas: number[]): number {
  return dezenas.filter(isMoldura).length;
}

export function contarPrimos(dezenas: number[]): number {
  return dezenas.filter(isPrimo).length;
}

export function contarMultiplosDe3(dezenas: number[]): number {
  return dezenas.filter(isMultiploDe3).length;
}

export function contarFibonacci(dezenas: number[]): number {
  return dezenas.filter(isFibonacci).length;
}

export function contarRepetidas(
  dezenasAtuais: number[],
  dezenasAnteriores: number[]
): number {
  return dezenasAtuais.filter((d) => dezenasAnteriores.includes(d)).length;
}

export function getRepetidas(
  dezenasAtuais: number[],
  dezenasAnteriores: number[]
): number[] {
  return dezenasAtuais.filter((d) => dezenasAnteriores.includes(d));
}

export function calcularSoma(dezenas: number[]): number {
  return dezenas.reduce((a, b) => a + b, 0);
}

export function contarSequencias(dezenas: number[]): number {
  const sorted = [...dezenas].sort((a, b) => a - b);
  let count = 0;
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === sorted[i - 1] + 1) count++;
  }
  return count;
}

// =============================================================================
// LINHAS E COLUNAS
// =============================================================================

/**
 * Retorna a linha de uma dezena (1-4)
 * Linha 1: 01-10 | Linha 2: 11-20 | Linha 3: 21-30 | Linha 4: 31
 */
export function getLinha(dezena: number): number {
  if (dezena === 31) return 4;
  return Math.ceil(dezena / 10);
}

/**
 * Retorna a coluna de uma dezena (1-10)
 * Para 31, retorna coluna 1
 */
export function getColuna(dezena: number): number {
  if (dezena === 31) return 1;
  const col = dezena % 10;
  return col === 0 ? 10 : col;
}

export function contarPorLinha(dezenas: number[]): number[] {
  const contagem = [0, 0, 0, 0]; // 4 linhas
  dezenas.forEach((d) => { contagem[getLinha(d) - 1]++; });
  return contagem;
}

export function contarPorColuna(dezenas: number[]): number[] {
  const contagem = new Array(10).fill(0);
  dezenas.forEach((d) => { contagem[getColuna(d) - 1]++; });
  return contagem;
}

export function getDistribuicaoLinhas(dezenas: number[]): string {
  return contarPorLinha(dezenas).join("-");
}

export function getDistribuicaoColunas(dezenas: number[]): string {
  return contarPorColuna(dezenas).join("-");
}

// =============================================================================
// UTILITÁRIOS
// =============================================================================

export function formatarDezena(dezena: number): string {
  return dezena.toString().padStart(2, '0');
}

export function ordenarDezenas(dezenas: number[]): number[] {
  return [...dezenas].sort((a, b) => a - b);
}

export interface IndicadoresConcurso {
  qtdPares: number;
  qtdImpares: number;
  qtdMoldura: number;
  qtdPrimos: number;
  qtdRepetidas: number;
  qtdFibonacci: number;
  soma: number;
  sequencias: number;
  dezenasPares: number[];
  dezenasImpares: number[];
  dezenasMoldura: number[];
  dezenasPrimos: number[];
  dezenasRepetidas: number[];
  dezenasFibonacci: number[];
}

export function calcularIndicadores(
  dezenas: number[],
  dezenasAnteriores?: number[]
): IndicadoresConcurso {
  const dezenasPares = dezenas.filter(isPar);
  const dezenasImpares = dezenas.filter(isImpar);
  const dezenasMoldura = dezenas.filter(isMoldura);
  const dezenasPrimos = dezenas.filter(isPrimo);
  const dezenasFibonacci = dezenas.filter(isFibonacci);
  const dezenasRepetidas = dezenasAnteriores
    ? getRepetidas(dezenas, dezenasAnteriores)
    : [];

  return {
    qtdPares: dezenasPares.length,
    qtdImpares: dezenasImpares.length,
    qtdMoldura: dezenasMoldura.length,
    qtdPrimos: dezenasPrimos.length,
    qtdRepetidas: dezenasRepetidas.length,
    qtdFibonacci: dezenasFibonacci.length,
    soma: calcularSoma(dezenas),
    sequencias: contarSequencias(dezenas),
    dezenasPares,
    dezenasImpares,
    dezenasMoldura,
    dezenasPrimos,
    dezenasRepetidas,
    dezenasFibonacci,
  };
}
