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
  dezenasPares: number[];
  dezenasImpares: number[];
  dezenasMoldura: number[];
  dezenasPrimos: number[];
  dezenasRepetidas: number[];
}

export function calcularIndicadores(
  dezenas: number[],
  dezenasAnteriores?: number[]
): IndicadoresConcurso {
  const dezenasPares = dezenas.filter(isPar);
  const dezenasImpares = dezenas.filter(isImpar);
  const dezenasMoldura = dezenas.filter(isMoldura);
  const dezenasPrimos = dezenas.filter(isPrimo);
  const dezenasRepetidas = dezenasAnteriores
    ? getRepetidas(dezenas, dezenasAnteriores)
    : [];

  return {
    qtdPares: dezenasPares.length,
    qtdImpares: dezenasImpares.length,
    qtdMoldura: dezenasMoldura.length,
    qtdPrimos: dezenasPrimos.length,
    qtdRepetidas: dezenasRepetidas.length,
    dezenasPares,
    dezenasImpares,
    dezenasMoldura,
    dezenasPrimos,
    dezenasRepetidas
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
 * Verifica se um número é múltiplo de 3
 */
export function isMultiploDe3(numero: number): boolean {
  return numero % 3 === 0;
}

/**
 * Conta quantas dezenas são múltiplos de 3
 */
export function contarMultiplosDe3(dezenas: number[]): number {
  return dezenas.filter(isMultiploDe3).length;
}

/**
 * Retorna quais dezenas são múltiplos de 3
 */
export function getMultiplosDe3(dezenas: number[]): number[] {
  return dezenas.filter(isMultiploDe3);
}
