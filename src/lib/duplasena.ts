/**
 * DUPLA SENA - Única Verdade
 * Arquivo central com todas as constantes e funções de cálculo do sistema.
 * Todas as análises estatísticas DEVEM usar estas definições.
 * 
 * DIFERENCIAL: Dois sorteios independentes por concurso
 * - Sorteio 1: Apenas prêmio para sena (6 acertos)
 * - Sorteio 2: Prêmios para terno (3), quadra (4), quina (5) e sena (6)
 */

// =============================================================================
// CONSTANTES FIXAS - DUPLA SENA
// =============================================================================

/**
 * Total de dezenas no volante (1 a 50)
 */
export const TOTAL_DEZENAS_VOLANTE = 50;

/**
 * Quantidade de dezenas sorteadas por sorteio (são 2 sorteios por concurso)
 */
export const DEZENAS_POR_SORTEIO = 6;

/**
 * Quantidade de sorteios por concurso
 */
export const SORTEIOS_POR_CONCURSO = 2;

/**
 * Número de linhas no grid do volante
 */
export const LINHAS_GRID = 5;

/**
 * Número de colunas no grid do volante
 */
export const COLUNAS_GRID = 10;

/**
 * Números primos dentro do universo da Dupla Sena (1-50)
 */
export const PRIMOS_DUPLASENA: number[] = [
  2, 3, 5, 7, 11, 13, 17, 19, 23, 29,
  31, 37, 41, 43, 47
];

/**
 * Múltiplos de 3 dentro do universo Dupla Sena (1-50)
 */
export const MULTIPLOS_DE_3_DUPLASENA: number[] = [
  3, 6, 9, 12, 15, 18, 21, 24, 27, 30,
  33, 36, 39, 42, 45, 48
];

/**
 * Sequência de Fibonacci dentro do universo Dupla Sena (1-50)
 */
export const FIBONACCI_DUPLASENA: number[] = [1, 2, 3, 5, 8, 13, 21, 34];

/**
 * Dezenas que formam a moldura do volante (bordas externas)
 * Formato visual do volante 5x10:
 * [01] [02] [03] [04] [05] [06] [07] [08] [09] [10]   <- Linha Superior
 * [11]  12   13   14   15   16   17   18   19  [20]   <- Bordas
 * [21]  22   23   24   25   26   27   28   29  [30]   <- Bordas
 * [31]  32   33   34   35   36   37   38   39  [40]   <- Bordas
 * [41] [42] [43] [44] [45] [46] [47] [48] [49] [50]   <- Linha Inferior
 */
export const MOLDURA_DUPLASENA: number[] = [
  // Linha Superior (1-10)
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
  // Coluna Esquerda (11, 21, 31)
  11, 21, 31,
  // Coluna Direita (20, 30, 40)
  20, 30, 40,
  // Linha Inferior (41-50)
  41, 42, 43, 44, 45, 46, 47, 48, 49, 50
];

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
  return MOLDURA_DUPLASENA.includes(numero);
}

/**
 * Verifica se um número é primo (dentro do universo Dupla Sena)
 */
export function isPrimo(numero: number): boolean {
  return PRIMOS_DUPLASENA.includes(numero);
}

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
  return FIBONACCI_DUPLASENA.includes(numero);
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
 * Calcula quantas dezenas se repetiram em relação ao sorteio anterior
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

// =============================================================================
// QUADRANTES (Grid 5x10 dividido em 4)
// =============================================================================

/**
 * Retorna o quadrante de uma dezena (1-4)
 * 
 * Quadrante 1 (Superior Esquerdo): 01-05, 11-15
 * Quadrante 2 (Superior Direito): 06-10, 16-20
 * Quadrante 3 (Centro-Inferior Esquerdo): 21-25, 31-35, 41-45
 * Quadrante 4 (Centro-Inferior Direito): 26-30, 36-40, 46-50
 */
export function getQuadrante(numero: number): number {
  const ultimoDigito = numero % 10;
  const isLadoEsquerdo = ultimoDigito >= 1 && ultimoDigito <= 5;
  const isMetadeSuperior = numero <= 20;
  
  if (isMetadeSuperior) {
    return isLadoEsquerdo ? 1 : 2;
  } else {
    return isLadoEsquerdo ? 3 : 4;
  }
}

/**
 * Conta quantas dezenas estão em cada quadrante
 * Retorna um array [q1, q2, q3, q4]
 */
export function contarPorQuadrante(dezenas: number[]): number[] {
  const contagem = [0, 0, 0, 0];
  dezenas.forEach((d) => {
    const quadrante = getQuadrante(d);
    contagem[quadrante - 1]++;
  });
  return contagem;
}

/**
 * Gera a chave de distribuição por quadrantes (ex: "2-1-2-1")
 */
export function getDistribuicaoQuadrantes(dezenas: number[]): string {
  return contarPorQuadrante(dezenas).join("-");
}

// =============================================================================
// LINHAS E COLUNAS (Grid 5x10)
// =============================================================================

/**
 * Retorna a linha de uma dezena (1-5)
 */
export function getLinha(dezena: number): number {
  return Math.ceil(dezena / 10);
}

/**
 * Retorna a coluna de uma dezena (1-10)
 */
export function getColuna(dezena: number): number {
  const col = dezena % 10;
  return col === 0 ? 10 : col;
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
 * Retorna um array de 10 posições
 */
export function contarPorColuna(dezenas: number[]): number[] {
  const contagem = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  dezenas.forEach((d) => {
    const coluna = getColuna(d);
    contagem[coluna - 1]++;
  });
  return contagem;
}

/**
 * Gera a chave de distribuição por linhas
 */
export function getDistribuicaoLinhas(dezenas: number[]): string {
  return contarPorLinha(dezenas).join("-");
}

/**
 * Gera a chave de distribuição por colunas
 */
export function getDistribuicaoColunas(dezenas: number[]): string {
  return contarPorColuna(dezenas).join("-");
}

// =============================================================================
// UTILITÁRIOS
// =============================================================================

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

/**
 * Interface para indicadores de um sorteio individual
 */
export interface IndicadoresSorteio {
  qtdPares: number;
  qtdImpares: number;
  qtdMoldura: number;
  qtdPrimos: number;
  qtdRepetidas: number;
  qtdFibonacci: number;
  dezenasPares: number[];
  dezenasImpares: number[];
  dezenasMoldura: number[];
  dezenasPrimos: number[];
  dezenasRepetidas: number[];
  dezenasFibonacci: number[];
  distribuicaoQuadrantes: number[];
}

/**
 * Interface para indicadores de um concurso completo (2 sorteios)
 */
export interface IndicadoresConcursoDuplaSena {
  sorteio1: IndicadoresSorteio;
  sorteio2: IndicadoresSorteio;
}

/**
 * Calcula os indicadores de um único sorteio
 */
export function calcularIndicadoresSorteio(
  dezenas: number[],
  dezenasAnteriores?: number[]
): IndicadoresSorteio {
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
    dezenasPares,
    dezenasImpares,
    dezenasMoldura,
    dezenasPrimos,
    dezenasRepetidas,
    dezenasFibonacci,
    distribuicaoQuadrantes: contarPorQuadrante(dezenas)
  };
}

/**
 * Calcula os indicadores de um concurso completo (ambos os sorteios)
 */
export function calcularIndicadoresConcurso(
  dezenasSorteio1: number[],
  dezenasSorteio2: number[],
  dezenasAnterioresS1?: number[],
  dezenasAnterioresS2?: number[]
): IndicadoresConcursoDuplaSena {
  return {
    sorteio1: calcularIndicadoresSorteio(dezenasSorteio1, dezenasAnterioresS1),
    sorteio2: calcularIndicadoresSorteio(dezenasSorteio2, dezenasAnterioresS2)
  };
}
