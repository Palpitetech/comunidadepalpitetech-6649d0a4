import { 
  isPar,
  isMoldura,
  isPrimo,
  isMultiploDe3,
  getLinha,
  getColuna,
  TOTAL_DEZENAS_VOLANTE,
  DEZENAS_POR_SORTEIO
} from "./megasena";

export interface FiltrosDesdobramentoMegaSena {
  qtdImpares: number[] | null;  // Array com valores aceitos ou null = desativado
  qtdRepetidas: number[] | null;
  qtdPrimos: number[] | null;
  qtdMoldura: number[] | null;
  qtdMultiplosDe3: number[] | null;
  linhas: number[] | null; // 6 linhas, null = ignorar
  colunas: number[] | null; // 10 colunas, null = ignorar
  qtdDezenas: number;
  dezenasUltimoSorteio?: number[];
  dezenasFixas?: number[];
  dezenasExcluidas?: number[];
}

export interface JogoDesdobramentoMegaSena {
  dezenas: number[];
}

/**
 * Verifica se uma combinação de dezenas atende todos os filtros
 */
export function validarFiltrosMegaSena(
  dezenas: number[],
  filtros: FiltrosDesdobramentoMegaSena
): boolean {
  // Validar dezenas fixas - todas devem estar presentes
  if (filtros.dezenasFixas && filtros.dezenasFixas.length > 0) {
    for (const fixa of filtros.dezenasFixas) {
      if (!dezenas.includes(fixa)) return false;
    }
  }

  // Validar dezenas excluídas - nenhuma pode estar presente
  if (filtros.dezenasExcluidas && filtros.dezenasExcluidas.length > 0) {
    for (const excluida of filtros.dezenasExcluidas) {
      if (dezenas.includes(excluida)) return false;
    }
  }

  // Validar quantidade de ímpares
  if (filtros.qtdImpares !== null) {
    const qtdImpares = dezenas.filter(d => d % 2 !== 0).length;
    if (!filtros.qtdImpares.includes(qtdImpares)) return false;
  }

  // Validar quantidade de primos
  if (filtros.qtdPrimos !== null) {
    const qtdPrimos = dezenas.filter(d => isPrimo(d)).length;
    if (!filtros.qtdPrimos.includes(qtdPrimos)) return false;
  }

  // Validar quantidade de moldura
  if (filtros.qtdMoldura !== null) {
    const qtdMoldura = dezenas.filter(d => isMoldura(d)).length;
    if (!filtros.qtdMoldura.includes(qtdMoldura)) return false;
  }

  // Validar múltiplos de 3
  if (filtros.qtdMultiplosDe3 !== null) {
    const qtdM3 = dezenas.filter(d => isMultiploDe3(d)).length;
    if (!filtros.qtdMultiplosDe3.includes(qtdM3)) return false;
  }

  // Validar repetidas
  if (filtros.qtdRepetidas !== null && filtros.dezenasUltimoSorteio && filtros.dezenasUltimoSorteio.length > 0) {
    const qtdRepetidas = dezenas.filter(d => 
      filtros.dezenasUltimoSorteio!.includes(d)
    ).length;
    if (!filtros.qtdRepetidas.includes(qtdRepetidas)) return false;
  }

  // Validar linhas (6 linhas para Mega Sena)
  if (filtros.linhas !== null) {
    for (let linha = 1; linha <= 6; linha++) {
      const dezenasNaLinha = dezenas.filter(d => getLinha(d) === linha).length;
      if (dezenasNaLinha !== filtros.linhas[linha - 1]) return false;
    }
  }

  // Validar colunas (10 colunas para Mega Sena)
  if (filtros.colunas !== null) {
    for (let coluna = 1; coluna <= 10; coluna++) {
      const dezenasNaColuna = dezenas.filter(d => getColuna(d) === coluna).length;
      if (dezenasNaColuna !== filtros.colunas[coluna - 1]) return false;
    }
  }

  return true;
}

/**
 * Gera combinações de K elementos de um array (generator)
 */
function* combinations<T>(array: T[], k: number): Generator<T[]> {
  if (k === 0) {
    yield [];
    return;
  }
  if (array.length < k) return;
  
  const first = array[0];
  const rest = array.slice(1);
  
  for (const combo of combinations(rest, k - 1)) {
    yield [first, ...combo];
  }
  
  yield* combinations(rest, k);
}

/**
 * Gera palpites baseados nos filtros de desdobramento Mega Sena
 * Usa amostragem aleatória para performance com 60 números
 */
export function gerarDesdobramentoMegaSena(
  filtros: FiltrosDesdobramentoMegaSena,
  maxJogos: number = 100
): JogoDesdobramentoMegaSena[] {
  // Começar com todas as dezenas disponíveis
  let dezenasDisponiveis = Array.from({ length: TOTAL_DEZENAS_VOLANTE }, (_, i) => i + 1);
  
  // Remover dezenas excluídas do pool
  if (filtros.dezenasExcluidas && filtros.dezenasExcluidas.length > 0) {
    dezenasDisponiveis = dezenasDisponiveis.filter(
      d => !filtros.dezenasExcluidas!.includes(d)
    );
  }
  
  const jogosValidos: JogoDesdobramentoMegaSena[] = [];
  const fixas = filtros.dezenasFixas || [];
  const qtdVariaveis = filtros.qtdDezenas - fixas.length;
  
  // Para Mega Sena, usamos geração por amostragem aleatória
  // devido ao tamanho do espaço (C(60,6) é muito grande)
  const maxTentativas = 50000;
  let tentativas = 0;
  const jogosSet = new Set<string>();
  
  // Remover fixas do pool de variáveis
  const dezenasVariaveis = dezenasDisponiveis.filter(d => !fixas.includes(d));
  
  while (jogosValidos.length < maxJogos && tentativas < maxTentativas) {
    tentativas++;
    
    // Gerar combinação aleatória
    const shuffled = [...dezenasVariaveis].sort(() => Math.random() - 0.5);
    const variaveis = shuffled.slice(0, qtdVariaveis);
    const jogoCompleto = [...fixas, ...variaveis].sort((a, b) => a - b);
    
    // Verificar duplicata
    const chave = jogoCompleto.join(",");
    if (jogosSet.has(chave)) continue;
    
    // Validar filtros
    if (validarFiltrosMegaSena(jogoCompleto, filtros)) {
      jogosSet.add(chave);
      jogosValidos.push({ dezenas: jogoCompleto });
    }
  }
  
  return jogosValidos;
}

/**
 * Estima se há combinações válidas (amostragem rápida)
 */
export function estimarCombinacoesValidas(
  filtros: FiltrosDesdobramentoMegaSena,
  amostras: number = 1000
): number {
  let dezenasDisponiveis = Array.from({ length: TOTAL_DEZENAS_VOLANTE }, (_, i) => i + 1);
  
  if (filtros.dezenasExcluidas && filtros.dezenasExcluidas.length > 0) {
    dezenasDisponiveis = dezenasDisponiveis.filter(
      d => !filtros.dezenasExcluidas!.includes(d)
    );
  }
  
  const fixas = filtros.dezenasFixas || [];
  const qtdVariaveis = filtros.qtdDezenas - fixas.length;
  const dezenasVariaveis = dezenasDisponiveis.filter(d => !fixas.includes(d));
  
  let validCount = 0;
  
  for (let i = 0; i < amostras; i++) {
    const shuffled = [...dezenasVariaveis].sort(() => Math.random() - 0.5);
    const variaveis = shuffled.slice(0, qtdVariaveis);
    const jogoCompleto = [...fixas, ...variaveis].sort((a, b) => a - b);
    
    if (validarFiltrosMegaSena(jogoCompleto, filtros)) {
      validCount++;
    }
  }
  
  // Retorna taxa de sucesso como proxy
  return validCount;
}
