/**
 * Lógica de geração de fechamentos para Mega Sena
 * 
 * A Mega Sena sorteia 6 dezenas de 01 a 60.
 * Fechamento consiste em gerar jogos de 6 dezenas a partir de um conjunto maior.
 */

export interface MatrizFechamentoMegaSena {
  id: string;
  nome: string;
  descricao: string;
  dezenas: number;
  garantia: number;
  dezenasPorJogo: number;
  condicao: string;
  fixasObrigatorias: number;
  categoria: "basico" | "intermediario" | "avancado";
  ativo: boolean;
  matrizRemocoes: number[][];
}

export interface ResultadoFechamentoMegaSena {
  jogos: number[][];
  estrategia: string;
  totalDezenas: number;
  garantia: number;
  nomeMatriz: string;
}

export interface EstrategiaFechamentoMegaSenaUI {
  id: string;
  nome: string;
  dezenas: number;
  garantia: number;
  jogos: number;
  label: string;
  descricao: string;
  condicao: string;
  fixasObrigatorias: number;
  categoria: "basico" | "intermediario" | "avancado";
  ativo: boolean;
}

/**
 * MATRIZES DE FECHAMENTO MEGA SENA
 * 
 * Cada matriz define quais posições devem ser removidas para gerar cada jogo.
 * Para Mega Sena, jogos têm 6 dezenas.
 */
export const MATRIZES_MEGASENA: MatrizFechamentoMegaSena[] = [
  // ═══════════════════════════════════════════════════════════════════
  // MS01 - 7 DEZENAS (BÁSICO) - Garantia 5 pontos
  // ═══════════════════════════════════════════════════════════════════
  {
    id: "7-5-7",
    nome: "MS01",
    descricao: "Fechamento básico de 7 dezenas com 7 jogos",
    dezenas: 7,
    garantia: 5,
    dezenasPorJogo: 6,
    condicao: "Se acertar 6 das 7 números",
    fixasObrigatorias: 0,
    categoria: "basico",
    ativo: true,
    matrizRemocoes: [
      [6], // Jogo 1: remove 7ª dezena
      [5], // Jogo 2: remove 6ª dezena
      [4], // Jogo 3: remove 5ª dezena
      [3], // Jogo 4: remove 4ª dezena
      [2], // Jogo 5: remove 3ª dezena
      [1], // Jogo 6: remove 2ª dezena
      [0], // Jogo 7: remove 1ª dezena
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  // MS02 - 8 DEZENAS - 28 JOGOS - Garantia 5 pontos
  // C(8,6) = 28 combinações para cobrir erro de 2
  // ═══════════════════════════════════════════════════════════════════
  {
    id: "8-5-28",
    nome: "MS02",
    descricao: "Fechamento de 8 dezenas com 28 jogos",
    dezenas: 8,
    garantia: 5,
    dezenasPorJogo: 6,
    condicao: "Se acertar 6 das 8 números",
    fixasObrigatorias: 0,
    categoria: "basico",
    ativo: true,
    matrizRemocoes: generateCombinations(8, 2), // Remove 2 de cada vez
  },

  // ═══════════════════════════════════════════════════════════════════
  // MS03 - 9 DEZENAS - 84 JOGOS - Garantia 5 pontos
  // C(9,6) = 84 combinações para cobrir erro de 3
  // ═══════════════════════════════════════════════════════════════════
  {
    id: "9-5-84",
    nome: "MS03",
    descricao: "Fechamento de 9 dezenas com 84 jogos",
    dezenas: 9,
    garantia: 5,
    dezenasPorJogo: 6,
    condicao: "Se acertar 6 das 9 números",
    fixasObrigatorias: 0,
    categoria: "intermediario",
    ativo: true,
    matrizRemocoes: generateCombinations(9, 3), // Remove 3 de cada vez
  },

  // ═══════════════════════════════════════════════════════════════════
  // MS04 - 10 DEZENAS - 210 JOGOS - Garantia 5 pontos
  // C(10,6) = 210 combinações para cobrir erro de 4
  // ═══════════════════════════════════════════════════════════════════
  {
    id: "10-5-210",
    nome: "MS04",
    descricao: "Fechamento de 10 dezenas com 210 jogos",
    dezenas: 10,
    garantia: 5,
    dezenasPorJogo: 6,
    condicao: "Se acertar 6 das 10 números",
    fixasObrigatorias: 0,
    categoria: "intermediario",
    ativo: true,
    matrizRemocoes: generateCombinations(10, 4), // Remove 4 de cada vez
  },

];

/**
 * Gera todas as combinações de índices para remoção
 * @param n Total de elementos
 * @param r Quantidade a remover de cada vez
 */
function generateCombinations(n: number, r: number): number[][] {
  const result: number[][] = [];
  const combination: number[] = [];

  function generate(start: number, depth: number) {
    if (depth === r) {
      result.push([...combination]);
      return;
    }
    for (let i = start; i < n; i++) {
      combination.push(i);
      generate(i + 1, depth + 1);
      combination.pop();
    }
  }

  generate(0, 0);
  return result;
}

/**
 * Retorna apenas as matrizes ativas
 */
export function getMatrizesAtivasMegaSena(): MatrizFechamentoMegaSena[] {
  return MATRIZES_MEGASENA.filter((m) => m.ativo);
}

/**
 * Busca uma matriz pelo ID
 */
export function buscarMatrizMegaSena(estrategiaId: string): MatrizFechamentoMegaSena | undefined {
  return MATRIZES_MEGASENA.find((m) => m.id === estrategiaId);
}

/**
 * Converte uma MatrizFechamento para o formato de exibição UI
 */
export function matrizParaUIMegaSena(matriz: MatrizFechamentoMegaSena): EstrategiaFechamentoMegaSenaUI {
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
 * Aplica uma matriz de fechamento às dezenas selecionadas
 */
export function aplicarMatrizMegaSena(
  dezenasSelecionadas: number[],
  matriz: MatrizFechamentoMegaSena
): number[][] {
  if (dezenasSelecionadas.length !== matriz.dezenas) {
    throw new Error(
      `É necessário selecionar exatamente ${matriz.dezenas} números para a matriz ${matriz.nome}`
    );
  }

  const dezenas = matriz.fixasObrigatorias > 0 
    ? [...dezenasSelecionadas] 
    : [...dezenasSelecionadas].sort((a, b) => a - b);

  const jogos: number[][] = matriz.matrizRemocoes.map((indicesRemover) => {
    return dezenas.filter((_, index) => !indicesRemover.includes(index));
  });

  return jogos;
}

/**
 * Função principal que gera o fechamento baseado na estratégia
 */
export function gerarFechamentoMegaSena(
  estrategiaId: string,
  dezenasSelecionadas: number[]
): ResultadoFechamentoMegaSena {
  const matriz = buscarMatrizMegaSena(estrategiaId);

  if (!matriz) {
    throw new Error(`Estratégia não suportada: ${estrategiaId}`);
  }

  if (!matriz.ativo) {
    throw new Error(`Estratégia ${matriz.nome} ainda não está disponível`);
  }

  const jogos = aplicarMatrizMegaSena(dezenasSelecionadas, matriz);

  return {
    jogos,
    estrategia: `${matriz.dezenas} Dezenas - Garantia ${matriz.garantia} pontos`,
    totalDezenas: matriz.dezenas,
    garantia: matriz.garantia,
    nomeMatriz: matriz.nome,
  };
}

/**
 * Simula um sorteio e verifica se a garantia matemática é cumprida
 */
export function simularGarantiaMegaSena(
  dezenasSelecionadas: number[],
  jogos: number[][],
  garantia: number
): {
  resultadoSimulado: number[];
  acertosPorJogo: number[];
  contagem: Record<4 | 5 | 6, number>;
  garantiaCumprida: boolean;
  garantiaAlvo: number;
} {
  // Sorteia 6 dezenas aleatórias das selecionadas
  const dezenasEmbaralhadas = [...dezenasSelecionadas].sort(() => Math.random() - 0.5);
  const resultadoSimulado = dezenasEmbaralhadas.slice(0, 6).sort((a, b) => a - b);

  // Calcula acertos de cada jogo
  const acertosPorJogo = jogos.map((jogo) => {
    return jogo.filter((dezena) => resultadoSimulado.includes(dezena)).length;
  });

  // Conta quantos jogos têm cada quantidade de acertos (4-6)
  const contagem: Record<4 | 5 | 6, number> = { 6: 0, 5: 0, 4: 0 };
  
  acertosPorJogo.forEach((acertos) => {
    if (acertos >= 4 && acertos <= 6) {
      contagem[acertos as 4 | 5 | 6]++;
    }
  });

  // Verifica se a garantia foi cumprida
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
 * Formata uma dezena Mega Sena (01-60)
 */
export function formatarDezenaMegaSena(numero: number): string {
  return numero.toString().padStart(2, "0");
}
