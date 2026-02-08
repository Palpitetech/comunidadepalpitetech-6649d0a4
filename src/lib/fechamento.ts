/**
 * Lógica de geração de fechamentos (desdobramentos) para Lotofácil
 * 
 * ESTRUTURA UNIVERSAL DE MATRIZES
 * Cada matriz define quais posições devem ser removidas para gerar cada jogo.
 * Isso permite adicionar novas estratégias apenas definindo os dados.
 */

export interface ResultadoFechamento {
  jogos: number[][];
  estrategia: string;
  totalDezenas: number;
  garantia: number;
}

/**
 * Interface para definição de uma matriz de fechamento
 */
export interface MatrizFechamento {
  id: string;
  nome: string;
  dezenas: number;
  garantia: number;
  /** Número de dezenas por jogo (geralmente 15 para Lotofácil) */
  dezenasPorJogo: number;
  /** Condição para a garantia se aplicar */
  condicao: string;
  /** 
   * Matriz de remoções: cada array interno contém os ÍNDICES (0-based) 
   * das dezenas que devem ser REMOVIDAS para gerar aquele jogo.
   * Exemplo: [[15], [14], [13], [12]] significa:
   * - Jogo 1: remove índice 15 (16ª dezena)
   * - Jogo 2: remove índice 14 (15ª dezena)
   * - etc.
   */
  matrizRemocoes: number[][];
}

/**
 * MATRIZES DE FECHAMENTO DISPONÍVEIS
 * Para adicionar uma nova matriz, basta incluir aqui seguindo o padrão.
 */
export const MATRIZES_FECHAMENTO: MatrizFechamento[] = [
  {
    id: "16-14-4",
    nome: "FC01",
    dezenas: 16,
    garantia: 14,
    dezenasPorJogo: 15,
    condicao: "Se acertar 15 dos 16 números",
    matrizRemocoes: [
      [15], // Jogo 1: remove 16ª dezena (índice 15)
      [14], // Jogo 2: remove 15ª dezena (índice 14)
      [13], // Jogo 3: remove 14ª dezena (índice 13)
      [12], // Jogo 4: remove 13ª dezena (índice 12)
    ],
  },
  // ADICIONE NOVAS MATRIZES AQUI
  // Exemplo de estrutura para FC02 (17 dezenas):
  // {
  //   id: "17-14-8",
  //   nome: "FC02",
  //   dezenas: 17,
  //   garantia: 14,
  //   dezenasPorJogo: 15,
  //   condicao: "Se acertar 15 dos 17 números",
  //   matrizRemocoes: [
  //     [15, 16], // Jogo 1: remove índices 15 e 16
  //     [14, 16], // Jogo 2: remove índices 14 e 16
  //     ... etc
  //   ],
  // },
];

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
 * Busca uma matriz pelo ID
 */
export function buscarMatriz(estrategiaId: string): MatrizFechamento | undefined {
  return MATRIZES_FECHAMENTO.find((m) => m.id === estrategiaId);
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

  const jogos = aplicarMatriz(dezenasSelecionadas, matriz);

  return {
    jogos,
    estrategia: `${matriz.dezenas} Dezenas - Garantia ${matriz.garantia} pontos`,
    totalDezenas: matriz.dezenas,
    garantia: matriz.garantia,
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
