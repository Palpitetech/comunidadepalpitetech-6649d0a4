import { 
  isPar, 
  isMoldura, 
  isPrimo,
  MOLDURA_LOTOFACIL,
  PRIMOS_LOTOFACIL 
} from "./lotofacil";

export interface FiltrosDesdobramento {
  qtdImpares: number;
  qtdRepetidas: number;
  qtdPrimos: number;
  qtdMoldura: number;
  linhas: number[];
  colunas: number[];
  qtdDezenas: number;
  dezenasUltimoSorteio?: number[];
}

export interface JogoDesdobramento {
  dezenas: number[];
}

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
 * Verifica se uma combinação de dezenas atende todos os filtros
 */
export function validarFiltros(
  dezenas: number[],
  filtros: FiltrosDesdobramento
): boolean {
  // Validar quantidade de ímpares
  const qtdImpares = dezenas.filter(d => d % 2 !== 0).length;
  if (qtdImpares !== filtros.qtdImpares) return false;

  // Validar quantidade de primos
  const qtdPrimos = dezenas.filter(d => isPrimo(d)).length;
  if (qtdPrimos !== filtros.qtdPrimos) return false;

  // Validar quantidade de moldura
  const qtdMoldura = dezenas.filter(d => isMoldura(d)).length;
  if (qtdMoldura !== filtros.qtdMoldura) return false;

  // Validar repetidas (se houver último sorteio)
  if (filtros.dezenasUltimoSorteio && filtros.dezenasUltimoSorteio.length > 0) {
    const qtdRepetidas = dezenas.filter(d => 
      filtros.dezenasUltimoSorteio!.includes(d)
    ).length;
    if (qtdRepetidas !== filtros.qtdRepetidas) return false;
  }

  // Validar linhas
  for (let linha = 1; linha <= 5; linha++) {
    const dezenasNaLinha = dezenas.filter(d => getLinha(d) === linha).length;
    if (dezenasNaLinha !== filtros.linhas[linha - 1]) return false;
  }

  // Validar colunas
  for (let coluna = 1; coluna <= 5; coluna++) {
    const dezenasNaColuna = dezenas.filter(d => getColuna(d) === coluna).length;
    if (dezenasNaColuna !== filtros.colunas[coluna - 1]) return false;
  }

  return true;
}

/**
 * Gera todas as combinações possíveis de K elementos de um array
 */
function* combinations<T>(array: T[], k: number): Generator<T[]> {
  if (k === 0) {
    yield [];
    return;
  }
  if (array.length < k) return;
  
  const first = array[0];
  const rest = array.slice(1);
  
  // Combinações que incluem o primeiro elemento
  for (const combo of combinations(rest, k - 1)) {
    yield [first, ...combo];
  }
  
  // Combinações que não incluem o primeiro elemento
  yield* combinations(rest, k);
}

/**
 * Gera palpites baseados nos filtros de desdobramento
 */
export function gerarDesdobramento(
  filtros: FiltrosDesdobramento,
  maxJogos: number = 1000
): JogoDesdobramento[] {
  const dezenas = Array.from({ length: 25 }, (_, i) => i + 1);
  const jogosValidos: JogoDesdobramento[] = [];
  
  // Gerar combinações e filtrar
  let count = 0;
  for (const combo of combinations(dezenas, filtros.qtdDezenas)) {
    if (validarFiltros(combo, filtros)) {
      jogosValidos.push({ dezenas: combo.sort((a, b) => a - b) });
      count++;
      if (count >= maxJogos) break;
    }
  }
  
  return jogosValidos;
}

/**
 * Conta quantas combinações válidas existem (para preview)
 */
export function contarCombinacoes(filtros: FiltrosDesdobramento): number {
  const dezenas = Array.from({ length: 25 }, (_, i) => i + 1);
  let count = 0;
  const maxCheck = 100000; // Limite para não travar
  let checked = 0;
  
  for (const combo of combinations(dezenas, filtros.qtdDezenas)) {
    checked++;
    if (checked > maxCheck) return -1; // Indica que há muitas combinações
    if (validarFiltros(combo, filtros)) {
      count++;
    }
  }
  
  return count;
}
