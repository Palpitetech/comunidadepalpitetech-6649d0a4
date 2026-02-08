/**
 * Tipos e interfaces padronizadas para o sistema de Fechamento
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 * FUNDAMENTO MATEMÁTICO: COVERING DESIGNS
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Um Covering Design C(v, k, t) é um sistema que garante cobertura mínima
 * quando até certo número de elementos "errados" estão presentes.
 * 
 * Para Lotofácil, adaptamos para o conceito "ERRE e":
 * 
 *   - v = Total de dezenas selecionadas pelo usuário
 *   - k = Dezenas por jogo (15 para Lotofácil)
 *   - e = Erro permitido (quantidade de dezenas que podem NÃO ser sorteadas)
 *   - g = Garantia mínima de acertos (14 para maioria das estratégias)
 * 
 * CONDIÇÃO DE FUNCIONAMENTO:
 *   |Resultado ∩ Selecionadas| ≥ v - e
 *   
 *   Ou seja: o usuário deve acertar pelo menos (v - e) dezenas do conjunto.
 * 
 * GARANTIA:
 *   Se a condição for satisfeita:
 *   ∃ jogo : acertos(jogo) ≥ g
 *   
 *   Existe pelo menos um jogo com acertos ≥ garantia configurada.
 * 
 * ESTRUTURA DA MATRIZ:
 *   Cada jogo é formado removendo subconjuntos de tamanho r = v - k
 *   A matriz deve cobrir todas as combinações possíveis de até e erros.
 * 
 * EXEMPLO FC05 (ERRE 5):
 *   v = 20 dezenas, k = 15 por jogo, e = 5 erros, g = 14 pontos
 *   Remoções por jogo: r = 20 - 15 = 5 índices
 *   Condição: acertar 15+ de 20 → garantia de 14+ pontos em algum jogo
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 */

/**
 * Categoria de fechamento baseada na complexidade/quantidade de dezenas
 */
export type CategoriaFechamento = "basico" | "intermediario" | "avancado";

/**
 * Parâmetros matemáticos do Covering Design
 */
export interface ParametrosCoveringDesign {
  /** v: Total de dezenas selecionadas pelo usuário */
  totalDezenas: number;
  
  /** k: Dezenas por jogo gerado (15 para Lotofácil) */
  dezenasPorJogo: number;
  
  /** e: Erro permitido (dezenas que podem não ser sorteadas) */
  erroPermitido: number;
  
  /** g: Garantia mínima de acertos quando condição satisfeita */
  garantiaMinima: number;
  
  /** r: Remoções por jogo (calculado: v - k) */
  remocoesPorJogo: number;
  
  /** b: Quantidade total de jogos na matriz */
  totalJogos: number;
}

/**
 * Interface completa para uma matriz de fechamento
 * Estrutura universal que define cada estratégia de cobertura
 */
export interface MatrizFechamento {
  /** ID único da matriz (ex: "20-14-350") */
  id: string;
  
  /** Nome curto (ex: "FC01", "FC05") */
  nome: string;
  
  /** Descrição amigável para o usuário */
  descricao: string;
  
  /** v: Quantidade total de dezenas a selecionar */
  dezenas: number;
  
  /** g: Garantia de pontos (11, 12, 13, 14 ou 15) */
  garantia: number;
  
  /** k: Dezenas por jogo gerado (15 para Lotofácil) */
  dezenasPorJogo: number;
  
  /** Condição textual para a garantia se aplicar */
  condicao: string;
  
  /** Quantidade de fixas obrigatórias (0 se nenhuma) */
  fixasObrigatorias: number;
  
  /** Categoria para agrupamento visual */
  categoria: CategoriaFechamento;
  
  /** Se a matriz está ativa e disponível para uso */
  ativo: boolean;
  
  /** 
   * Matriz de remoções (Covering Design):
   * Cada array interno contém os ÍNDICES (0-based) das dezenas 
   * que devem ser REMOVIDAS para gerar aquele jogo.
   * 
   * Tamanho de cada array: r = v - k (ex: 20 - 15 = 5)
   * Quantidade de arrays: b = total de jogos
   */
  matrizRemocoes: number[][];
  
  /**
   * Parâmetros matemáticos do covering design (opcional, calculável)
   */
  covering?: ParametrosCoveringDesign;
}

/**
 * Interface para o resultado de um fechamento gerado
 */
export interface ResultadoFechamento {
  /** Array de jogos gerados, cada jogo é um array de dezenas */
  jogos: number[][];
  
  /** Descrição da estratégia usada */
  estrategia: string;
  
  /** Total de dezenas selecionadas */
  totalDezenas: number;
  
  /** Garantia de pontos */
  garantia: number;
  
  /** Nome da matriz usada */
  nomeMatriz: string;
}

/**
 * Interface para exibição no seletor de estratégias
 * Derivada de MatrizFechamento com campos calculados
 */
export interface EstrategiaFechamentoUI {
  id: string;
  nome: string;
  dezenas: number;
  garantia: number;
  jogos: number;
  label: string;
  descricao: string;
  condicao: string;
  fixasObrigatorias: number;
  categoria: CategoriaFechamento;
  ativo: boolean;
}

/**
 * Interface para simulação de garantia
 */
export interface ResultadoSimulacao {
  /** Dezenas do resultado simulado (15 dezenas) */
  resultadoSimulado: number[];
  
  /** Array com quantidade de acertos de cada jogo */
  acertosPorJogo: number[];
  
  /** Contagem de jogos por faixa de premiação (11-15) */
  contagem: Record<11 | 12 | 13 | 14 | 15, number>;
  
  /** Se a garantia mínima foi atingida */
  garantiaCumprida: boolean;
  
  /** Valor da garantia alvo */
  garantiaAlvo: number;
}

/**
 * Labels amigáveis para as categorias
 */
export const CATEGORIA_LABELS: Record<CategoriaFechamento, string> = {
  basico: "Básico",
  intermediario: "Intermediário",
  avancado: "Avançado",
};

/**
 * Cores para badges de categoria (usando tokens semânticos)
 */
export const CATEGORIA_STYLES: Record<CategoriaFechamento, string> = {
  basico: "bg-primary/10 text-primary",
  intermediario: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  avancado: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
};

/**
 * Converte uma MatrizFechamento para o formato de exibição UI
 */
export function matrizParaUI(matriz: MatrizFechamento): EstrategiaFechamentoUI {
  const totalJogos = matriz.matrizRemocoes.length;
  
  return {
    id: matriz.id,
    nome: matriz.nome,
    dezenas: matriz.dezenas,
    garantia: matriz.garantia,
    jogos: totalJogos,
    label: `${matriz.nome} — ${matriz.dezenas} Dezenas → ${totalJogos} Jogos`,
    descricao: matriz.descricao,
    condicao: matriz.condicao,
    fixasObrigatorias: matriz.fixasObrigatorias,
    categoria: matriz.categoria,
    ativo: matriz.ativo,
  };
}

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * FUNÇÕES AUXILIARES PARA COVERING DESIGNS
 * ═══════════════════════════════════════════════════════════════════════════════
 */

/**
 * Calcula os parâmetros de um Covering Design a partir de uma matriz
 */
export function calcularParametrosCovering(matriz: MatrizFechamento): ParametrosCoveringDesign {
  const v = matriz.dezenas;
  const k = matriz.dezenasPorJogo;
  const r = v - k;
  const b = matriz.matrizRemocoes.length;
  const e = r; // Erro permitido = remoções por jogo
  const g = matriz.garantia;
  
  return {
    totalDezenas: v,
    dezenasPorJogo: k,
    erroPermitido: e,
    garantiaMinima: g,
    remocoesPorJogo: r,
    totalJogos: b,
  };
}

/**
 * Valida a integridade estrutural de uma matriz de fechamento
 */
export function validarMatrizFechamento(matriz: MatrizFechamento): { 
  valida: boolean; 
  erros: string[];
} {
  const erros: string[] = [];
  const r = matriz.dezenas - matriz.dezenasPorJogo;
  
  // Verificar quantidade de remoções por jogo
  matriz.matrizRemocoes.forEach((removals, idx) => {
    if (removals.length !== r) {
      erros.push(`Jogo ${idx + 1}: esperado ${r} remoções, encontrado ${removals.length}`);
    }
    
    // Verificar índices válidos
    removals.forEach(i => {
      if (i < 0 || i >= matriz.dezenas) {
        erros.push(`Jogo ${idx + 1}: índice ${i} fora do intervalo [0, ${matriz.dezenas - 1}]`);
      }
    });
    
    // Verificar duplicatas
    const unique = new Set(removals);
    if (unique.size !== removals.length) {
      erros.push(`Jogo ${idx + 1}: índices duplicados nas remoções`);
    }
  });
  
  return {
    valida: erros.length === 0,
    erros,
  };
}

/**
 * Gera jogos a partir de uma matriz de fechamento e dezenas selecionadas
 * 
 * @param dezenas Array ordenado de dezenas selecionadas pelo usuário
 * @param matrizRemocoes Matriz de índices a remover para cada jogo
 * @returns Array de jogos (cada jogo é array de dezenas)
 */
export function gerarJogosDaMatriz(
  dezenas: number[], 
  matrizRemocoes: number[][]
): number[][] {
  return matrizRemocoes.map(removals => {
    return dezenas.filter((_, idx) => !removals.includes(idx));
  });
}

/**
 * Simula acertos de um jogo contra um resultado
 */
export function contarAcertos(jogo: number[], resultado: number[]): number {
  return jogo.filter(d => resultado.includes(d)).length;
}

/**
 * Verifica se a garantia foi cumprida para um conjunto de jogos
 */
export function verificarGarantia(
  jogos: number[][], 
  resultado: number[], 
  garantiaMinima: number
): { cumprida: boolean; melhorAcerto: number; jogoIndex: number } {
  let melhorAcerto = 0;
  let jogoIndex = -1;
  
  for (let i = 0; i < jogos.length; i++) {
    const acertos = contarAcertos(jogos[i], resultado);
    if (acertos > melhorAcerto) {
      melhorAcerto = acertos;
      jogoIndex = i;
    }
  }
  
  return {
    cumprida: melhorAcerto >= garantiaMinima,
    melhorAcerto,
    jogoIndex,
  };
}
