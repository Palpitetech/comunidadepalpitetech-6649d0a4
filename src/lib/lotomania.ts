/**
 * LOTOMANIA - Única Verdade
 * Arquivo central com todas as constantes e funções de cálculo do sistema.
 * Universo: 00-99 (armazenado como 0-99) | Grid: 10x10 | Sorteio: 20 dezenas
 * 
 * IMPORTANTE: O volante exibe 01 a 99 seguido de 00.
 * No banco de dados, 00 é armazenado como o inteiro 0.
 */

// =============================================================================
// CONSTANTES FIXAS - LOTOMANIA
// =============================================================================

export const TOTAL_DEZENAS_VOLANTE = 100;
export const DEZENAS_POR_SORTEIO = 20;
export const LINHAS_GRID = 10;
export const COLUNAS_GRID = 10;

/**
 * Números primos dentro do universo da Lotomania (0-99)
 */
export const PRIMOS_LOTOMANIA: number[] = [
  2, 3, 5, 7, 11, 13, 17, 19, 23, 29,
  31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97
];

/**
 * Múltiplos de 3 dentro do universo Lotomania (0-99)
 */
export const MULTIPLOS_DE_3_LOTOMANIA: number[] = [
  0, 3, 6, 9, 12, 15, 18, 21, 24, 27, 30,
  33, 36, 39, 42, 45, 48, 51, 54, 57, 60,
  63, 66, 69, 72, 75, 78, 81, 84, 87, 90,
  93, 96, 99
];

/**
 * Sequência de Fibonacci dentro do universo Lotomania (0-99)
 */
export const FIBONACCI_LOTOMANIA: number[] = [1, 2, 3, 5, 8, 13, 21, 34, 55, 89];

/**
 * Dezenas que formam a moldura do volante (bordas externas)
 * Grid 10x10 (exibição: linhas de 01-10, 11-20, ..., 91-99+00):
 * [01] [02] [03] [04] [05] [06] [07] [08] [09] [10]
 * [11]  12   13   14   15   16   17   18   19  [20]
 * [21]  22   23   24   25   26   27   28   29  [30]
 * [31]  32   33   34   35   36   37   38   39  [40]
 * [41]  42   43   44   45   46   47   48   49  [50]
 * [51]  52   53   54   55   56   57   58   59  [60]
 * [61]  62   63   64   65   66   67   68   69  [70]
 * [71]  72   73   74   75   76   77   78   79  [80]
 * [81]  82   83   84   85   86   87   88   89  [90]
 * [91] [92] [93] [94] [95] [96] [97] [98] [99] [00]
 */
export const MOLDURA_LOTOMANIA: number[] = [
  // Linha superior (01-10)
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
  // Coluna esquerda (11, 21, ..., 81)
  11, 21, 31, 41, 51, 61, 71, 81,
  // Coluna direita (20, 30, ..., 90)
  20, 30, 40, 50, 60, 70, 80, 90,
  // Linha inferior (91-99, 00)
  91, 92, 93, 94, 95, 96, 97, 98, 99, 0
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
  return MOLDURA_LOTOMANIA.includes(numero);
}

export function isPrimo(numero: number): boolean {
  return PRIMOS_LOTOMANIA.includes(numero);
}

export function isMultiploDe3(numero: number): boolean {
  return numero % 3 === 0;
}

export function isFibonacci(numero: number): boolean {
  return FIBONACCI_LOTOMANIA.includes(numero);
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
// LINHAS E COLUNAS (Grid 10x10)
// =============================================================================

/**
 * Retorna a linha de uma dezena (1-10)
 * Linha 1: 01-10, Linha 2: 11-20, ..., Linha 10: 91-99,00
 * Para 00 (armazenado como 0), retorna linha 10
 */
export function getLinha(dezena: number): number {
  if (dezena === 0) return 10;
  return Math.ceil(dezena / 10);
}

/**
 * Retorna a coluna de uma dezena (1-10)
 * Para 00 (armazenado como 0), retorna coluna 10
 */
export function getColuna(dezena: number): number {
  if (dezena === 0) return 10;
  const col = dezena % 10;
  return col === 0 ? 10 : col;
}

export function contarPorLinha(dezenas: number[]): number[] {
  const contagem = new Array(LINHAS_GRID).fill(0);
  dezenas.forEach((d) => { contagem[getLinha(d) - 1]++; });
  return contagem;
}

export function contarPorColuna(dezenas: number[]): number[] {
  const contagem = new Array(COLUNAS_GRID).fill(0);
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
