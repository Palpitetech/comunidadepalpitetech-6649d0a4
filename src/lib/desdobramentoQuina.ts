import { 
  isPrimo,
  isMoldura,
  isMultiploDe3,
  TOTAL_DEZENAS_VOLANTE,
  LINHAS_GRID,
  COLUNAS_GRID
} from "./quina";

export interface FiltrosDesdobramentoQuina {
  qtdImpares: number[] | null;
  qtdRepetidas: number[] | null;
  qtdPrimos: number[] | null;
  qtdMoldura: number[] | null;
  qtdMultiplosDe3: number[] | null;
  linhas: number[] | null;
  colunas: number[] | null;
  qtdDezenas: number;
  dezenasUltimoSorteio?: number[];
  dezenasFixas?: number[];
  dezenasExcluidas?: number[];
}

export interface JogoDesdobramentoQuina {
  dezenas: number[];
}

/**
 * Verifica se uma combinação de dezenas atende todos os filtros
 */
export function validarFiltrosQuina(
  dezenas: number[],
  filtros: FiltrosDesdobramentoQuina
): boolean {
  if (filtros.dezenasFixas && filtros.dezenasFixas.length > 0) {
    for (const fixa of filtros.dezenasFixas) {
      if (!dezenas.includes(fixa)) return false;
    }
  }

  if (filtros.dezenasExcluidas && filtros.dezenasExcluidas.length > 0) {
    for (const excluida of filtros.dezenasExcluidas) {
      if (dezenas.includes(excluida)) return false;
    }
  }

  if (filtros.qtdImpares !== null) {
    const qtdImpares = dezenas.filter(d => d % 2 !== 0).length;
    if (!filtros.qtdImpares.includes(qtdImpares)) return false;
  }

  if (filtros.qtdPrimos !== null) {
    const qtdPrimos = dezenas.filter(d => isPrimo(d)).length;
    if (!filtros.qtdPrimos.includes(qtdPrimos)) return false;
  }

  if (filtros.qtdMoldura !== null) {
    const qtdMoldura = dezenas.filter(d => isMoldura(d)).length;
    if (!filtros.qtdMoldura.includes(qtdMoldura)) return false;
  }

  if (filtros.qtdMultiplosDe3 !== null) {
    const qtdM3 = dezenas.filter(d => isMultiploDe3(d)).length;
    if (!filtros.qtdMultiplosDe3.includes(qtdM3)) return false;
  }

  if (filtros.qtdRepetidas !== null && filtros.dezenasUltimoSorteio && filtros.dezenasUltimoSorteio.length > 0) {
    const qtdRepetidas = dezenas.filter(d => 
      filtros.dezenasUltimoSorteio!.includes(d)
    ).length;
    if (!filtros.qtdRepetidas.includes(qtdRepetidas)) return false;
  }

  // Validação de Linhas (8 linhas, 10 cols → linha = Math.ceil(d/10))
  if (filtros.linhas !== null) {
    const contLinhas = new Array(LINHAS_GRID).fill(0);
    dezenas.forEach(d => {
      const linhaIdx = Math.floor((d - 1) / COLUNAS_GRID);
      contLinhas[linhaIdx]++;
    });
    for (let i = 0; i < LINHAS_GRID; i++) {
      if (contLinhas[i] !== filtros.linhas[i]) return false;
    }
  }

  // Validação de Colunas (10 colunas)
  if (filtros.colunas !== null) {
    const contColunas = new Array(COLUNAS_GRID).fill(0);
    dezenas.forEach(d => {
      const colIdx = (d - 1) % COLUNAS_GRID;
      contColunas[colIdx]++;
    });
    for (let i = 0; i < COLUNAS_GRID; i++) {
      if (contColunas[i] !== filtros.colunas[i]) return false;
    }
  }

  return true;

/**
 * Gera palpites baseados nos filtros de desdobramento Quina
 * Usa amostragem aleatória (C(80,5) = ~24M combinações)
 */
export function gerarDesdobramentoQuina(
  filtros: FiltrosDesdobramentoQuina,
  maxJogos: number = 100
): JogoDesdobramentoQuina[] {
  let dezenasDisponiveis = Array.from({ length: TOTAL_DEZENAS_VOLANTE }, (_, i) => i + 1);
  
  if (filtros.dezenasExcluidas && filtros.dezenasExcluidas.length > 0) {
    dezenasDisponiveis = dezenasDisponiveis.filter(
      d => !filtros.dezenasExcluidas!.includes(d)
    );
  }
  
  const jogosValidos: JogoDesdobramentoQuina[] = [];
  const fixas = filtros.dezenasFixas || [];
  const qtdVariaveis = filtros.qtdDezenas - fixas.length;
  
  const maxTentativas = 50000;
  let tentativas = 0;
  const jogosSet = new Set<string>();
  
  const dezenasVariaveis = dezenasDisponiveis.filter(d => !fixas.includes(d));
  
  while (jogosValidos.length < maxJogos && tentativas < maxTentativas) {
    tentativas++;
    
    const shuffled = [...dezenasVariaveis].sort(() => Math.random() - 0.5);
    const variaveis = shuffled.slice(0, qtdVariaveis);
    const jogoCompleto = [...fixas, ...variaveis].sort((a, b) => a - b);
    
    const chave = jogoCompleto.join(",");
    if (jogosSet.has(chave)) continue;
    
    if (validarFiltrosQuina(jogoCompleto, filtros)) {
      jogosSet.add(chave);
      jogosValidos.push({ dezenas: jogoCompleto });
    }
  }
  
  return jogosValidos;
}

/**
 * Estima taxa de validação (amostragem rápida)
 */
export function estimarCombinacoesValidasQuina(
  filtros: FiltrosDesdobramentoQuina,
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
    
    if (validarFiltrosQuina(jogoCompleto, filtros)) {
      validCount++;
    }
  }
  
  return validCount;
}
