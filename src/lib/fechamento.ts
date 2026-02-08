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
  // FC02 - 17 DEZENAS (INTERMEDIÁRIO)
  // ═══════════════════════════════════════════════════════════════════
  // TODO: Adicionar matriz FC02
  // {
  //   id: "17-14-X",
  //   nome: "FC02",
  //   descricao: "Fechamento intermediário de 17 dezenas",
  //   dezenas: 17,
  //   garantia: 14,
  //   dezenasPorJogo: 15,
  //   condicao: "Se acertar 15 dos 17 números",
  //   fixasObrigatorias: 0,
  //   categoria: "intermediario",
  //   ativo: false,
  //   matrizRemocoes: [
  //     // Cada jogo remove 2 dezenas (17 - 15 = 2)
  //   ],
  // },

  // ═══════════════════════════════════════════════════════════════════
  // FC03 - 18 DEZENAS (INTERMEDIÁRIO)
  // ═══════════════════════════════════════════════════════════════════
  // TODO: Adicionar matriz FC03
  // {
  //   id: "18-14-X",
  //   nome: "FC03",
  //   descricao: "Fechamento intermediário de 18 dezenas",
  //   dezenas: 18,
  //   garantia: 14,
  //   dezenasPorJogo: 15,
  //   condicao: "Se acertar 15 dos 18 números",
  //   fixasObrigatorias: 0,
  //   categoria: "intermediario",
  //   ativo: false,
  //   matrizRemocoes: [
  //     // Cada jogo remove 3 dezenas (18 - 15 = 3)
  //   ],
  // },

  // ═══════════════════════════════════════════════════════════════════
  // FC04 - 19 DEZENAS (AVANÇADO)
  // ═══════════════════════════════════════════════════════════════════
  // TODO: Adicionar matriz FC04
  // {
  //   id: "19-14-X",
  //   nome: "FC04",
  //   descricao: "Fechamento avançado de 19 dezenas",
  //   dezenas: 19,
  //   garantia: 14,
  //   dezenasPorJogo: 15,
  //   condicao: "Se acertar 15 dos 19 números",
  //   fixasObrigatorias: 0,
  //   categoria: "avancado",
  //   ativo: false,
  //   matrizRemocoes: [
  //     // Cada jogo remove 4 dezenas (19 - 15 = 4)
  //   ],
  // },

  // ═══════════════════════════════════════════════════════════════════
  // FC05 - 20 DEZENAS (AVANÇADO)
  // ═══════════════════════════════════════════════════════════════════
  // TODO: Adicionar matriz FC05
  // {
  //   id: "20-14-X",
  //   nome: "FC05",
  //   descricao: "Fechamento avançado de 20 dezenas",
  //   dezenas: 20,
  //   garantia: 14,
  //   dezenasPorJogo: 15,
  //   condicao: "Se acertar 15 dos 20 números",
  //   fixasObrigatorias: 0,
  //   categoria: "avancado",
  //   ativo: false,
  //   matrizRemocoes: [
  //     // Cada jogo remove 5 dezenas (20 - 15 = 5)
  //   ],
  // },
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

  // Ordena as dezenas para garantir consistência
  const dezenasOrdenadas = [...dezenasSelecionadas].sort((a, b) => a - b);

  // Aplica cada linha da matriz de remoções
  const jogos: number[][] = matriz.matrizRemocoes.map((indicesRemover) => {
    return dezenasOrdenadas.filter((_, index) => !indicesRemover.includes(index));
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
 * Simula um sorteio com 15 dezenas aleatórias das dezenas selecionadas
 * e verifica se a garantia matemática do fechamento é cumprida
 */
export function simularGarantia(
  dezenasSelecionadas: number[],
  jogos: number[][],
  garantia: number
): ResultadoSimulacao {
  // Sorteia 15 dezenas aleatórias das selecionadas (simulando o resultado)
  const dezenasEmbaralhadas = [...dezenasSelecionadas].sort(() => Math.random() - 0.5);
  const resultadoSimulado = dezenasEmbaralhadas.slice(0, 15).sort((a, b) => a - b);

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
