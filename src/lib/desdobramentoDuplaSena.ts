import { 
  isPrimo,
  isMoldura,
  isMultiploDe3,
  getLinha,
  getColuna,
  TOTAL_DEZENAS_VOLANTE,
  DEZENAS_POR_SORTEIO
} from "./duplasena";

export interface FiltrosDesdobramentoDuplaSena {
  qtdImpares: number[] | null;  // Array com valores aceitos ou null = desativado
  qtdRepetidas: number[] | null;
  qtdPrimos: number[] | null;
  qtdMoldura: number[] | null;
  qtdMultiplosDe3: number[] | null;
  qtdDezenas: number;
  dezenasUltimoSorteio?: number[];
  dezenasFixas?: number[];
  dezenasExcluidas?: number[];
}

export interface JogoDesdobramentoDuplaSena {
  dezenas: number[];
}

/**
 * Verifica se uma combinação de dezenas atende todos os filtros
 */
export function validarFiltrosDuplaSena(
  dezenas: number[],
  filtros: FiltrosDesdobramentoDuplaSena
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

  return true;
}

/**
 * Gera palpites baseados nos filtros de desdobramento Dupla Sena
 * Usa amostragem aleatória para performance com 50 números
 */
export function gerarDesdobramentoDuplaSena(
  filtros: FiltrosDesdobramentoDuplaSena,
  maxJogos: number = 100
): JogoDesdobramentoDuplaSena[] {
  // Começar com todas as dezenas disponíveis
  let dezenasDisponiveis = Array.from({ length: TOTAL_DEZENAS_VOLANTE }, (_, i) => i + 1);
  
  // Remover dezenas excluídas do pool
  if (filtros.dezenasExcluidas && filtros.dezenasExcluidas.length > 0) {
    dezenasDisponiveis = dezenasDisponiveis.filter(
      d => !filtros.dezenasExcluidas!.includes(d)
    );
  }
  
  const jogosValidos: JogoDesdobramentoDuplaSena[] = [];
  const fixas = filtros.dezenasFixas || [];
  const qtdVariaveis = filtros.qtdDezenas - fixas.length;
  
  // Para Dupla Sena, usamos geração por amostragem aleatória
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
    if (validarFiltrosDuplaSena(jogoCompleto, filtros)) {
      jogosSet.add(chave);
      jogosValidos.push({ dezenas: jogoCompleto });
    }
  }
  
  return jogosValidos;
}

/**
 * Estima se há combinações válidas (amostragem rápida)
 */
export function estimarCombinacoesValidasDuplaSena(
  filtros: FiltrosDesdobramentoDuplaSena,
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
    
    if (validarFiltrosDuplaSena(jogoCompleto, filtros)) {
      validCount++;
    }
  }
  
  // Retorna taxa de sucesso como proxy
  return validCount;
}
