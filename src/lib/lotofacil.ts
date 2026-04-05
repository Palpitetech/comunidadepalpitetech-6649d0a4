/**
 * LOTOFÁCIL - Única Verdade
 * Arquivo central com todas as constantes e funções de cálculo do sistema.
 * Todas as análises estatísticas DEVEM usar estas definições.
 */

// =============================================================================
// CONSTANTES FIXAS - LOTOFÁCIL
// =============================================================================

/**
 * Dezenas que formam a moldura do volante (bordas externas)
 * Formato visual do volante 5x5:
 * [01] [02] [03] [04] [05]
 * [06]  07   08   09  [10]
 * [11]  12   13   14  [15]
 * [16]  17   18   19  [20]
 * [21] [22] [23] [24] [25]
 */
export const MOLDURA_LOTOFACIL: number[] = [
  1, 2, 3, 4, 5,
  6, 10,
  11, 15,
  16, 20,
  21, 22, 23, 24, 25
];

/**
 * Números primos dentro do universo da Lotofácil (1-25)
 */
export const PRIMOS_LOTOFACIL: number[] = [2, 3, 5, 7, 11, 13, 17, 19, 23];

/**
 * Total de dezenas no volante
 */
export const TOTAL_DEZENAS_VOLANTE = 25;

/**
 * Quantidade de dezenas sorteadas por concurso
 */
export const DEZENAS_POR_SORTEIO = 15;

/**
 * Níveis de acesso do sistema Freemium
 */
export const NIVEIS_ACESSO = {
  GRATIS: 1,
  PREMIUM: 2,
  ADMIN: 3
} as const;

/**
 * Roles do sistema para tabela user_roles
 */
export type AppRole = 'user' | 'premium' | 'moderator' | 'admin';

// =============================================================================
// FUNÇÕES DE CÁLCULO
// =============================================================================

/**
 * Verifica se um número é par
 */
export function isPar(numero: number): boolean {
  return numero % 2 === 0;
}

/**
 * Verifica se um número é ímpar
 */
export function isImpar(numero: number): boolean {
  return numero % 2 !== 0;
}

/**
 * Verifica se um número está na moldura
 */
export function isMoldura(numero: number): boolean {
  return MOLDURA_LOTOFACIL.includes(numero);
}

/**
 * Verifica se um número é primo (dentro do universo Lotofácil)
 */
export function isPrimo(numero: number): boolean {
  return PRIMOS_LOTOFACIL.includes(numero);
}

/**
 * Conta quantos números pares existem em um array de dezenas
 */
export function contarPares(dezenas: number[]): number {
  return dezenas.filter(isPar).length;
}

/**
 * Conta quantos números ímpares existem em um array de dezenas
 */
export function contarImpares(dezenas: number[]): number {
  return dezenas.filter(isImpar).length;
}

/**
 * Conta quantas dezenas estão na moldura
 */
export function contarMoldura(dezenas: number[]): number {
  return dezenas.filter(isMoldura).length;
}

/**
 * Conta quantos números primos existem em um array de dezenas
 */
export function contarPrimos(dezenas: number[]): number {
  return dezenas.filter(isPrimo).length;
}

/**
 * Calcula quantas dezenas se repetiram em relação ao concurso anterior
 * @param dezenasAtuais - Dezenas do concurso atual
 * @param dezenasAnteriores - Dezenas do concurso imediatamente anterior
 */
export function contarRepetidas(
  dezenasAtuais: number[],
  dezenasAnteriores: number[]
): number {
  return dezenasAtuais.filter((dezena) =>
    dezenasAnteriores.includes(dezena)
  ).length;
}

/**
 * Retorna quais dezenas se repetiram
 */
export function getRepetidas(
  dezenasAtuais: number[],
  dezenasAnteriores: number[]
): number[] {
  return dezenasAtuais.filter((dezena) =>
    dezenasAnteriores.includes(dezena)
  );
}

/**
 * Calcula todos os indicadores de um concurso
 */
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

// =============================================================================
// LÓGICA DE CICLOS
// =============================================================================

/**
 * Calcula quais dezenas ainda não saíram em uma série de concursos
 * @param historicoDezenas - Array de arrays de dezenas de concursos consecutivos
 */
export function getDezenasAusentesCiclo(
  historicoDezenas: number[][]
): number[] {
  const todasDezenas = Array.from({ length: TOTAL_DEZENAS_VOLANTE }, (_, i) => i + 1);
  const dezenasQueJaSairam = new Set(historicoDezenas.flat());
  
  return todasDezenas.filter((d) => !dezenasQueJaSairam.has(d));
}

/**
 * Verifica se um ciclo foi completado (todas as 25 dezenas foram sorteadas)
 */
export function isCicloCompleto(historicoDezenas: number[][]): boolean {
  return getDezenasAusentesCiclo(historicoDezenas).length === 0;
}

/**
 * Formata uma dezena para exibição (ex: 1 -> "01")
 */
export function formatarDezena(dezena: number): string {
  return dezena.toString().padStart(2, '0');
}

/**
 * Ordena dezenas em ordem crescente
 */
export function ordenarDezenas(dezenas: number[]): number[] {
  return [...dezenas].sort((a, b) => a - b);
}

// =============================================================================
// MÚLTIPLOS DE 3
// =============================================================================

/**
 * Números múltiplos de 3 dentro do universo Lotofácil (1-25)
 */
export const MULTIPLOS_DE_3_LOTOFACIL: number[] = [3, 6, 9, 12, 15, 18, 21, 24];

/**
 * Sequência de Fibonacci dentro do universo Lotofácil (1-25)
 */
export const FIBONACCI_LOTOFACIL: number[] = [1, 2, 3, 5, 8, 13, 21];

/**
 * Verifica se um número é múltiplo de 3
 */
export function isMultiploDe3(numero: number): boolean {
  return numero % 3 === 0;
}

/**
 * Verifica se um número pertence à sequência de Fibonacci
 */
export function isFibonacci(numero: number): boolean {
  return FIBONACCI_LOTOFACIL.includes(numero);
}

/**
 * Conta quantas dezenas são múltiplos de 3
 */
export function contarMultiplosDe3(dezenas: number[]): number {
  return dezenas.filter(isMultiploDe3).length;
}

/**
 * Conta quantas dezenas pertencem à sequência de Fibonacci
 */
export function contarFibonacci(dezenas: number[]): number {
  return dezenas.filter(isFibonacci).length;
}

/**
 * Retorna quais dezenas são múltiplos de 3
 */
export function getMultiplosDe3(dezenas: number[]): number[] {
  return dezenas.filter(isMultiploDe3);
}

/**
 * Soma de todas as dezenas
 */
export function calcularSoma(dezenas: number[]): number {
  return dezenas.reduce((a, b) => a + b, 0);
}

/**
 * Conta pares consecutivos nas dezenas ordenadas
 */
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
 * Estrutura do volante 5x5:
 * Linha 1: 01-05 | Linha 2: 06-10 | Linha 3: 11-15 | Linha 4: 16-20 | Linha 5: 21-25
 * Coluna 1: 01, 06, 11, 16, 21 | Coluna 2: 02, 07, 12, 17, 22 | etc.
 */

/**
 * Retorna a linha de uma dezena (1-5)
 */
export function getLinha(dezena: number): number {
  return Math.ceil(dezena / 5);
}

/**
 * Retorna a coluna de uma dezena (1-5)
 */
export function getColuna(dezena: number): number {
  return ((dezena - 1) % 5) + 1;
}

/**
 * Conta quantas dezenas estão em cada linha
 * Retorna um array [linha1, linha2, linha3, linha4, linha5]
 */
export function contarPorLinha(dezenas: number[]): number[] {
  const contagem = [0, 0, 0, 0, 0];
  dezenas.forEach((d) => {
    const linha = getLinha(d);
    contagem[linha - 1]++;
  });
  return contagem;
}

/**
 * Conta quantas dezenas estão em cada coluna
 * Retorna um array [col1, col2, col3, col4, col5]
 */
export function contarPorColuna(dezenas: number[]): number[] {
  const contagem = [0, 0, 0, 0, 0];
  dezenas.forEach((d) => {
    const coluna = getColuna(d);
    contagem[coluna - 1]++;
  });
  return contagem;
}

/**
 * Gera a chave de distribuição por linhas (ex: "3-3-3-3-3")
 */
export function getDistribuicaoLinhas(dezenas: number[]): string {
  return contarPorLinha(dezenas).join("-");
}

/**
 * Gera a chave de distribuição por colunas (ex: "3-3-3-3-3")
 */
export function getDistribuicaoColunas(dezenas: number[]): string {
  return contarPorColuna(dezenas).join("-");
}
