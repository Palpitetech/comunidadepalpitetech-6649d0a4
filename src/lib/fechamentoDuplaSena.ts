/**
 * Lógica de geração de fechamentos para Dupla Sena
 * 
 * A Dupla Sena sorteia 6 dezenas de 01 a 50 (dois sorteios por concurso).
 * Fechamento consiste em gerar jogos de 6 dezenas a partir de um conjunto maior.
 */

export interface MatrizFechamentoDuplaSena {
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

export interface ResultadoFechamentoDuplaSena {
  jogos: number[][];
  estrategia: string;
  totalDezenas: number;
  garantia: number;
  nomeMatriz: string;
}

export interface EstrategiaFechamentoDuplaSenaUI {
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
 * MATRIZES DE FECHAMENTO DUPLA SENA
 * 
 * Cada matriz define quais posições devem ser removidas para gerar cada jogo.
 * Para Dupla Sena, jogos têm 6 dezenas (1-50).
 */
export const MATRIZES_DUPLASENA: MatrizFechamentoDuplaSena[] = [
  {
    id: "7-5-7",
    nome: "DS01",
    descricao: "Fechamento básico de 7 dezenas com 7 jogos",
    dezenas: 7,
    garantia: 5,
    dezenasPorJogo: 6,
    condicao: "Se acertar 6 das 7 números",
    fixasObrigatorias: 0,
    categoria: "basico",
    ativo: true,
    matrizRemocoes: [
      [6], [5], [4], [3], [2], [1], [0],
    ],
  },
  {
    id: "8-5-28",
    nome: "DS02",
    descricao: "Fechamento de 8 dezenas com 28 jogos",
    dezenas: 8,
    garantia: 5,
    dezenasPorJogo: 6,
    condicao: "Se acertar 6 das 8 números",
    fixasObrigatorias: 0,
    categoria: "basico",
    ativo: true,
    matrizRemocoes: generateCombinations(8, 2),
  },
  {
    id: "9-5-84",
    nome: "DS03",
    descricao: "Fechamento de 9 dezenas com 84 jogos",
    dezenas: 9,
    garantia: 5,
    dezenasPorJogo: 6,
    condicao: "Se acertar 6 das 9 números",
    fixasObrigatorias: 0,
    categoria: "intermediario",
    ativo: true,
    matrizRemocoes: generateCombinations(9, 3),
  },
  {
    id: "10-5-210",
    nome: "DS04",
    descricao: "Fechamento de 10 dezenas com 210 jogos",
    dezenas: 10,
    garantia: 5,
    dezenasPorJogo: 6,
    condicao: "Se acertar 6 das 10 números",
    fixasObrigatorias: 0,
    categoria: "intermediario",
    ativo: true,
    matrizRemocoes: generateCombinations(10, 4),
  },
];

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

export function getMatrizesAtivasDuplaSena(): MatrizFechamentoDuplaSena[] {
  return MATRIZES_DUPLASENA.filter((m) => m.ativo);
}

export function buscarMatrizDuplaSena(estrategiaId: string): MatrizFechamentoDuplaSena | undefined {
  return MATRIZES_DUPLASENA.find((m) => m.id === estrategiaId);
}

export function matrizParaUIDuplaSena(matriz: MatrizFechamentoDuplaSena): EstrategiaFechamentoDuplaSenaUI {
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

export function aplicarMatrizDuplaSena(
  dezenasSelecionadas: number[],
  matriz: MatrizFechamentoDuplaSena
): number[][] {
  if (dezenasSelecionadas.length !== matriz.dezenas) {
    throw new Error(
      `É necessário selecionar exatamente ${matriz.dezenas} números para a matriz ${matriz.nome}`
    );
  }

  const dezenas = matriz.fixasObrigatorias > 0 
    ? [...dezenasSelecionadas] 
    : [...dezenasSelecionadas].sort((a, b) => a - b);

  return matriz.matrizRemocoes.map((indicesRemover) => {
    return dezenas.filter((_, index) => !indicesRemover.includes(index));
  });
}

export function gerarFechamentoDuplaSena(
  estrategiaId: string,
  dezenasSelecionadas: number[]
): ResultadoFechamentoDuplaSena {
  const matriz = buscarMatrizDuplaSena(estrategiaId);

  if (!matriz) {
    throw new Error(`Estratégia não suportada: ${estrategiaId}`);
  }

  if (!matriz.ativo) {
    throw new Error(`Estratégia ${matriz.nome} ainda não está disponível`);
  }

  const jogos = aplicarMatrizDuplaSena(dezenasSelecionadas, matriz);

  return {
    jogos,
    estrategia: `${matriz.dezenas} Dezenas - Garantia ${matriz.garantia} pontos`,
    totalDezenas: matriz.dezenas,
    garantia: matriz.garantia,
    nomeMatriz: matriz.nome,
  };
}

export function simularGarantiaDuplaSena(
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
  const dezenasEmbaralhadas = [...dezenasSelecionadas].sort(() => Math.random() - 0.5);
  const resultadoSimulado = dezenasEmbaralhadas.slice(0, 6).sort((a, b) => a - b);

  const acertosPorJogo = jogos.map((jogo) => {
    return jogo.filter((dezena) => resultadoSimulado.includes(dezena)).length;
  });

  const contagem: Record<4 | 5 | 6, number> = { 6: 0, 5: 0, 4: 0 };
  acertosPorJogo.forEach((acertos) => {
    if (acertos >= 4 && acertos <= 6) {
      contagem[acertos as 4 | 5 | 6]++;
    }
  });

  const garantiaCumprida = acertosPorJogo.some((acertos) => acertos >= garantia);

  return {
    resultadoSimulado,
    acertosPorJogo,
    contagem,
    garantiaCumprida,
    garantiaAlvo: garantia,
  };
}

export function formatarDezenaDuplaSena(numero: number): string {
  return numero.toString().padStart(2, "0");
}
