/**
 * Tipos e interfaces padronizadas para o sistema de Fechamento
 * 
 * Este arquivo centraliza todas as definições de tipos relacionadas
 * ao Gerador de Fechamento, garantindo consistência e escalabilidade
 * para adicionar novas matrizes (FC02, FC03, FC04, FC05, etc.)
 */

/**
 * Categoria de fechamento baseada na quantidade de dezenas
 */
export type CategoriaFechamento = "basico" | "intermediario" | "avancado";

/**
 * Interface completa para uma matriz de fechamento
 * Esta é a estrutura universal que define cada estratégia
 */
export interface MatrizFechamento {
  /** ID único da matriz (ex: "16-14-4") */
  id: string;
  
  /** Nome curto (ex: "FC01", "FC02") */
  nome: string;
  
  /** Descrição amigável para o usuário */
  descricao: string;
  
  /** Quantidade total de dezenas a selecionar */
  dezenas: number;
  
  /** Garantia de pontos (11, 12, 13, 14 ou 15) */
  garantia: number;
  
  /** Dezenas por jogo gerado (15 para Lotofácil) */
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
   * Matriz de remoções: cada array interno contém os ÍNDICES (0-based) 
   * das dezenas que devem ser REMOVIDAS para gerar aquele jogo.
   */
  matrizRemocoes: number[][];
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
