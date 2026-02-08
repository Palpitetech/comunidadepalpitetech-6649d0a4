/**
 * Lógica de geração de fechamentos (desdobramentos) para Lotofácil
 * 
 * ESTRUTURA UNIVERSAL DE MATRIZES
 * Cada matriz define quais posições devem ser removidas para gerar cada jogo.
 * Isso permite adicionar novas estratégias apenas definindo os dados.
 */

import type { 
  MatrizFechamento, 
  ResultadoFechamento, 
  ResultadoSimulacao 
} from "@/types/fechamento";

// Importar matrizes grandes de arquivos separados
import { FC05 } from "@/lib/matrizes/fc05";

// Re-export dos tipos para compatibilidade
export type { MatrizFechamento, ResultadoFechamento, ResultadoSimulacao };

/**
 * MATRIZES DE FECHAMENTO DISPONÍVEIS
 * 
 * Para adicionar uma nova matriz:
 * 1. Defina os dados seguindo a interface MatrizFechamento
 * 2. O sistema automaticamente a incluirá no seletor e nas funções de geração
 * 
 * NOMENCLATURA:
 * - FC01: 16 dezenas
 * - FC02: 17 dezenas
 * - FC03: 18 dezenas
 * - FC04: 19 dezenas
 * - FC05: 20 dezenas
 */
export const MATRIZES_FECHAMENTO: MatrizFechamento[] = [
  // ═══════════════════════════════════════════════════════════════════
  // FC01 - 16 DEZENAS (BÁSICO)
  // ═══════════════════════════════════════════════════════════════════
  {
    id: "16-14-4",
    nome: "FC01",
    descricao: "Fechamento básico de 16 dezenas com 4 jogos",
    dezenas: 16,
    garantia: 14,
    dezenasPorJogo: 15,
    condicao: "Se acertar 15 dos 16 números",
    fixasObrigatorias: 0,
    categoria: "basico",
    ativo: true,
    matrizRemocoes: [
      [15], // Jogo 1: remove 16ª dezena (índice 15)
      [14], // Jogo 2: remove 15ª dezena (índice 14)
      [13], // Jogo 3: remove 14ª dezena (índice 13)
      [12], // Jogo 4: remove 13ª dezena (índice 12)
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  // FC02 - 17 DEZENAS - 8 JOGOS
  // Matriz fornecida convertida para remoções
  // ═══════════════════════════════════════════════════════════════════
  {
    id: "17-14-8",
    nome: "FC02",
    descricao: "Fechamento de 17 dezenas com 8 jogos",
    dezenas: 17,
    garantia: 14,
    dezenasPorJogo: 15,
    condicao: "Se acertar 15 dos 17 números",
    fixasObrigatorias: 0,
    categoria: "intermediario",
    ativo: true,
    matrizRemocoes: [
      [15, 16],  // Jogo 1: remove índices 15 e 16
      [13, 14],  // Jogo 2: remove índices 13 e 14
      [10, 12],  // Jogo 3: remove índices 10 e 12
      [8, 9],    // Jogo 4: remove índices 8 e 9
      [6, 7],    // Jogo 5: remove índices 6 e 7
      [4, 5],    // Jogo 6: remove índices 4 e 5
      [1, 2],    // Jogo 7: remove índices 1 e 2
      [0, 14],   // Jogo 8: remove índices 0 e 14
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  // FC03 - 19 DEZENAS (13 FIXAS + 6 VARIÁVEIS) - 6 JOGOS
  // Lógica circular: 13 fixas sempre presentes + pares de variáveis
  // ═══════════════════════════════════════════════════════════════════
  {
    id: "19-14-6",
    nome: "FC03",
    descricao: "13 fixas + 6 variáveis em pares circulares",
    dezenas: 19,
    garantia: 14,
    dezenasPorJogo: 15,
    condicao: "Se acertar 15 dos 19 números",
    fixasObrigatorias: 13,
    categoria: "avancado",
    ativo: true,
    // Variáveis são índices 13-18. Cada jogo usa 2 variáveis (remove 4)
    // Pares: [0,1], [1,2], [2,3], [3,4], [4,5], [5,0]
    matrizRemocoes: [
      [15, 16, 17, 18],  // Jogo 1: usa var[0,1] → remove var[2,3,4,5]
      [13, 16, 17, 18],  // Jogo 2: usa var[1,2] → remove var[0,3,4,5]
      [13, 14, 17, 18],  // Jogo 3: usa var[2,3] → remove var[0,1,4,5]
      [13, 14, 15, 18],  // Jogo 4: usa var[3,4] → remove var[0,1,2,5]
      [13, 14, 15, 16],  // Jogo 5: usa var[4,5] → remove var[0,1,2,3]
      [14, 15, 16, 17],  // Jogo 6: usa var[5,0] → remove var[1,2,3,4]
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  // FC04 - 21 DEZENAS (14 FIXAS + 7 VARIÁVEIS) - 7 JOGOS
  // Rotação simples: 14 fixas + 1 variável por jogo
  // ═══════════════════════════════════════════════════════════════════
  {
    id: "21-14-7",
    nome: "FC04",
    descricao: "14 fixas + 7 variáveis em rotação simples",
    dezenas: 21,
    garantia: 14,
    dezenasPorJogo: 15,
    condicao: "Se acertar 15 dos 21 números",
    fixasObrigatorias: 14,
    categoria: "avancado",
    ativo: true,
    // Variáveis são índices 14-20. Cada jogo usa 1 variável (remove 6)
    matrizRemocoes: [
      [15, 16, 17, 18, 19, 20],  // Jogo 1: usa var[0]
      [14, 16, 17, 18, 19, 20],  // Jogo 2: usa var[1]
      [14, 15, 17, 18, 19, 20],  // Jogo 3: usa var[2]
      [14, 15, 16, 18, 19, 20],  // Jogo 4: usa var[3]
      [14, 15, 16, 17, 19, 20],  // Jogo 5: usa var[4]
      [14, 15, 16, 17, 18, 20],  // Jogo 6: usa var[5]
      [14, 15, 16, 17, 18, 19],  // Jogo 7: usa var[6]
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  // FC06 - 18 DEZENAS - 24 JOGOS
  // Design de cobertura: remove 3 por jogo, cobertura balanceada de pares
  // Cada número é removido exatamente 4 vezes (24×3/18 = 4)
  // ═══════════════════════════════════════════════════════════════════
  {
    id: "18-14-24",
    nome: "FC06",
    descricao: "Fechamento de 18 dezenas com 24 jogos",
    dezenas: 18,
    garantia: 14,
    dezenasPorJogo: 15,
    condicao: "Se acertar 15 dos 18 números",
    fixasObrigatorias: 0,
    categoria: "intermediario",
    ativo: true,
    // Cada jogo remove 3 índices (0-17), design balanceado em blocos
    matrizRemocoes: [
      // Bloco 1: Trios consecutivos
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [9, 10, 11],
      [12, 13, 14],
      [15, 16, 17],
      // Bloco 2: Trios com salto 3 (grid 6×3 colunas)
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [9, 12, 15],
      [10, 13, 16],
      [11, 14, 17],
      // Bloco 3: Diagonais do grid
      [0, 4, 8],
      [1, 5, 6],
      [2, 3, 7],
      [9, 13, 17],
      [10, 14, 15],
      [11, 12, 16],
      // Bloco 4: Anti-diagonais do grid
      [0, 5, 7],
      [1, 3, 8],
      [2, 4, 6],
      [9, 14, 16],
      [10, 12, 17],
      [11, 13, 15],
    ],
  },

  // FC05 importado de arquivo separado (365 jogos)
  FC05,
];

/**
 * Retorna apenas as matrizes ativas
 */
export function getMatrizesAtivas(): MatrizFechamento[] {
  return MATRIZES_FECHAMENTO.filter((m) => m.ativo);
}

/**
 * Busca uma matriz pelo ID
 */
export function buscarMatriz(estrategiaId: string): MatrizFechamento | undefined {
  return MATRIZES_FECHAMENTO.find((m) => m.id === estrategiaId);
}

/**
 * Busca uma matriz pelo nome (FC01, FC02, etc.)
 */
export function buscarMatrizPorNome(nome: string): MatrizFechamento | undefined {
  return MATRIZES_FECHAMENTO.find((m) => m.nome === nome);
}

/**
 * Função genérica que aplica uma matriz de fechamento às dezenas selecionadas
 * 
 * IMPORTANTE: Para matrizes com fixas obrigatórias, a ordem das dezenas É IMPORTANTE!
 * As primeiras N dezenas (fixasObrigatorias) são tratadas como fixas.
 * NÃO devemos ordenar as dezenas se houver fixas obrigatórias.
 */
export function aplicarMatriz(
  dezenasSelecionadas: number[],
  matriz: MatrizFechamento
): number[][] {
  if (dezenasSelecionadas.length !== matriz.dezenas) {
    throw new Error(
      `É necessário selecionar exatamente ${matriz.dezenas} números para a matriz ${matriz.nome}`
    );
  }

  // Se a matriz tem fixas obrigatórias, NÃO ordenamos as dezenas
  // pois a ordem define quais são fixas (primeiras) e variáveis (últimas)
  const dezenas = matriz.fixasObrigatorias > 0 
    ? [...dezenasSelecionadas] 
    : [...dezenasSelecionadas].sort((a, b) => a - b);

  // Aplica cada linha da matriz de remoções
  const jogos: number[][] = matriz.matrizRemocoes.map((indicesRemover) => {
    return dezenas.filter((_, index) => !indicesRemover.includes(index));
  });

  return jogos;
}

/**
 * Função principal que gera o fechamento baseado na estratégia
 */
export function gerarFechamento(
  estrategiaId: string,
  dezenasSelecionadas: number[]
): ResultadoFechamento {
  const matriz = buscarMatriz(estrategiaId);

  if (!matriz) {
    throw new Error(`Estratégia não suportada: ${estrategiaId}`);
  }

  if (!matriz.ativo) {
    throw new Error(`Estratégia ${matriz.nome} ainda não está disponível`);
  }

  const jogos = aplicarMatriz(dezenasSelecionadas, matriz);

  return {
    jogos,
    estrategia: `${matriz.dezenas} Dezenas - Garantia ${matriz.garantia} pontos`,
    totalDezenas: matriz.dezenas,
    garantia: matriz.garantia,
    nomeMatriz: matriz.nome,
  };
}

/**
 * Simula um sorteio com 15 dezenas e verifica se a garantia matemática é cumprida
 * 
 * Para matrizes com fixas obrigatórias (FC03, FC04):
 * - Sorteia (fixas - 1) das fixas (rotacionando qual fica de fora)
 * - Complementa com variáveis até chegar em 15
 * 
 * Para matrizes sem fixas:
 * - Sorteia 15 dezenas aleatórias das selecionadas
 */
export function simularGarantia(
  dezenasSelecionadas: number[],
  jogos: number[][],
  garantia: number,
  fixasObrigatorias: number = 0
): ResultadoSimulacao {
  let resultadoSimulado: number[];

  if (fixasObrigatorias > 0) {
    // Matrizes com fixas obrigatórias (FC03, FC04)
    // As primeiras N posições são fixas, o resto são variáveis
    const fixas = dezenasSelecionadas.slice(0, fixasObrigatorias);
    const variaveis = dezenasSelecionadas.slice(fixasObrigatorias);
    
    // Quantas fixas precisamos acertar para a garantia funcionar
    // Se cada jogo tem 15 dezenas = fixas + 1 variável, 
    // para garantir X pontos, precisamos de (X - 1) fixas + pelo menos 1 variável
    const fixasNecessarias = fixasObrigatorias - 1; // Remove 1 fixa (rotaciona)
    const variaveisNecessarias = 15 - fixasNecessarias;
    
    // Sorteia quais fixas entram (remove 1 aleatória)
    const fixasEmbaralhadas = [...fixas].sort(() => Math.random() - 0.5);
    const fixasSorteadas = fixasEmbaralhadas.slice(0, fixasNecessarias);
    
    // Sorteia quais variáveis entram
    const variaveisEmbaralhadas = [...variaveis].sort(() => Math.random() - 0.5);
    const variaveisSorteadas = variaveisEmbaralhadas.slice(0, Math.min(variaveisNecessarias, variaveis.length));
    
    // Combina e ordena
    resultadoSimulado = [...fixasSorteadas, ...variaveisSorteadas].sort((a, b) => a - b);
  } else {
    // Matrizes sem fixas - sorteia 15 aleatórias
    const dezenasEmbaralhadas = [...dezenasSelecionadas].sort(() => Math.random() - 0.5);
    resultadoSimulado = dezenasEmbaralhadas.slice(0, 15).sort((a, b) => a - b);
  }

  // Calcula acertos de cada jogo
  const acertosPorJogo = jogos.map((jogo) => {
    return jogo.filter((dezena) => resultadoSimulado.includes(dezena)).length;
  });

  // Conta quantos jogos têm cada quantidade de acertos (11-15)
  const contagem: Record<11 | 12 | 13 | 14 | 15, number> = { 
    15: 0, 14: 0, 13: 0, 12: 0, 11: 0 
  };
  
  acertosPorJogo.forEach((acertos) => {
    if (acertos >= 11 && acertos <= 15) {
      contagem[acertos as 11 | 12 | 13 | 14 | 15]++;
    }
  });

  // Verifica se a garantia foi cumprida (pelo menos 1 jogo com >= garantia pontos)
  const garantiaCumprida = acertosPorJogo.some((acertos) => acertos >= garantia);

  return {
    resultadoSimulado,
    acertosPorJogo,
    contagem,
    garantiaCumprida,
    garantiaAlvo: garantia,
  };
}

/**
 * Valida se uma matriz de fechamento está correta
 * Útil para testes e validação de novas matrizes
 */
export function validarMatriz(matriz: MatrizFechamento): { valido: boolean; erros: string[] } {
  const erros: string[] = [];
  
  // Verifica se todas as remoções geram jogos com 15 dezenas
  const dezenasEsperadas = matriz.dezenasPorJogo;
  const dezenasRemover = matriz.dezenas - dezenasEsperadas;
  
  matriz.matrizRemocoes.forEach((remocao, index) => {
    if (remocao.length !== dezenasRemover) {
      erros.push(
        `Jogo ${index + 1}: esperado ${dezenasRemover} remoções, encontrado ${remocao.length}`
      );
    }
    
    // Verifica se os índices são válidos
    remocao.forEach((idx) => {
      if (idx < 0 || idx >= matriz.dezenas) {
        erros.push(
          `Jogo ${index + 1}: índice ${idx} inválido (deve ser 0-${matriz.dezenas - 1})`
        );
      }
    });
  });
  
  return {
    valido: erros.length === 0,
    erros,
  };
}

/**
 * Função legada para compatibilidade com testes existentes
 * @deprecated Use gerarFechamento("16-14-4", dezenas) em vez disso
 */
export function gerarFechamento16Dezenas(dezenasSelecionadas: number[]): number[][] {
  const matriz = buscarMatriz("16-14-4");
  if (!matriz) throw new Error("Matriz FC01 não encontrada");
  return aplicarMatriz(dezenasSelecionadas, matriz);
}
