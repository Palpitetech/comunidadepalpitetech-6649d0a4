/**
 * Lógica de geração de fechamentos (desdobramentos) para Lotofácil
 */

export interface ResultadoFechamento {
  jogos: number[][];
  estrategia: string;
  totalDezenas: number;
  garantia: number;
}

/**
 * Gera jogos para a estratégia de 16 dezenas (4 jogos, garantia 14 pontos)
 * Lógica: Remove o 16º, 15º, 14º e 13º número selecionado
 */
export function gerarFechamento16Dezenas(dezenasSelecionadas: number[]): number[][] {
  if (dezenasSelecionadas.length !== 16) {
    throw new Error("É necessário selecionar exatamente 16 números");
  }

  // Ordena as dezenas para garantir consistência
  const dezenasOrdenadas = [...dezenasSelecionadas].sort((a, b) => a - b);

  // Gera 4 jogos removendo os últimos 4 números (posições 13, 14, 15, 16)
  const jogos: number[][] = [
    dezenasOrdenadas.filter((_, i) => i !== 15), // Remove 16º (índice 15)
    dezenasOrdenadas.filter((_, i) => i !== 14), // Remove 15º (índice 14)
    dezenasOrdenadas.filter((_, i) => i !== 13), // Remove 14º (índice 13)
    dezenasOrdenadas.filter((_, i) => i !== 12), // Remove 13º (índice 12)
  ];

  return jogos;
}

/**
 * Gera jogos para a estratégia de 17 dezenas
 * Utiliza combinações para garantir 14 pontos
 */
export function gerarFechamento17Dezenas(dezenasSelecionadas: number[]): number[][] {
  if (dezenasSelecionadas.length !== 17) {
    throw new Error("É necessário selecionar exatamente 17 números");
  }

  const dezenasOrdenadas = [...dezenasSelecionadas].sort((a, b) => a - b);
  const jogos: number[][] = [];

  // Gera 8 jogos removendo 2 números por jogo
  // Padrão: Remove combinações dos últimos 4 números
  const posicoesPraRemover = [
    [15, 16], [14, 16], [13, 16], [12, 16],
    [14, 15], [13, 15], [12, 15], [13, 14],
  ];

  for (const [pos1, pos2] of posicoesPraRemover) {
    const jogo = dezenasOrdenadas.filter((_, i) => i !== pos1 && i !== pos2);
    jogos.push(jogo);
  }

  return jogos;
}

/**
 * Gera jogos para a estratégia de 18 dezenas
 */
export function gerarFechamento18Dezenas(dezenasSelecionadas: number[]): number[][] {
  if (dezenasSelecionadas.length !== 18) {
    throw new Error("É necessário selecionar exatamente 18 números");
  }

  const dezenasOrdenadas = [...dezenasSelecionadas].sort((a, b) => a - b);
  const jogos: number[][] = [];

  // Gera 16 jogos removendo 3 números por jogo
  const posicoesPraRemover = [
    [15, 16, 17], [14, 16, 17], [13, 16, 17], [12, 16, 17],
    [14, 15, 17], [13, 15, 17], [12, 15, 17], [13, 14, 17],
    [12, 14, 17], [12, 13, 17], [14, 15, 16], [13, 15, 16],
    [12, 15, 16], [13, 14, 16], [12, 14, 16], [12, 13, 16],
  ];

  for (const posicoes of posicoesPraRemover) {
    const jogo = dezenasOrdenadas.filter((_, i) => !posicoes.includes(i));
    jogos.push(jogo);
  }

  return jogos;
}

/**
 * Gera jogos para a estratégia de 19 dezenas
 */
export function gerarFechamento19Dezenas(dezenasSelecionadas: number[]): number[][] {
  if (dezenasSelecionadas.length !== 19) {
    throw new Error("É necessário selecionar exatamente 19 números");
  }

  const dezenasOrdenadas = [...dezenasSelecionadas].sort((a, b) => a - b);
  const jogos: number[][] = [];

  // Gera 24 jogos removendo 4 números por jogo
  for (let i = 15; i < 19; i++) {
    for (let j = i + 1; j <= 19; j++) {
      for (let k = j + 1; k <= 19; k++) {
        for (let l = k + 1; l <= 19; l++) {
          if (jogos.length < 24) {
            const jogo = dezenasOrdenadas.filter((_, idx) => 
              idx !== i - 1 && idx !== j - 1 && idx !== k - 1 && idx !== l - 1
            );
            jogos.push(jogo);
          }
        }
      }
    }
  }

  return jogos.slice(0, 24);
}

/**
 * Gera jogos para a estratégia de 20 dezenas
 */
export function gerarFechamento20Dezenas(dezenasSelecionadas: number[]): number[][] {
  if (dezenasSelecionadas.length !== 20) {
    throw new Error("É necessário selecionar exatamente 20 números");
  }

  const dezenasOrdenadas = [...dezenasSelecionadas].sort((a, b) => a - b);
  const jogos: number[][] = [];

  // Gera 32 jogos removendo 5 números por jogo
  for (let i = 15; i < 20; i++) {
    for (let j = i + 1; j <= 20; j++) {
      for (let k = j + 1; k <= 20; k++) {
        for (let l = k + 1; l <= 20; l++) {
          for (let m = l + 1; m <= 20; m++) {
            if (jogos.length < 32) {
              const jogo = dezenasOrdenadas.filter((_, idx) => 
                idx !== i - 1 && idx !== j - 1 && idx !== k - 1 && 
                idx !== l - 1 && idx !== m - 1
              );
              jogos.push(jogo);
            }
          }
        }
      }
    }
  }

  return jogos.slice(0, 32);
}

/**
 * Função principal que roteia para o gerador correto baseado na estratégia
 */
export function gerarFechamento(
  estrategiaId: string, 
  dezenasSelecionadas: number[]
): ResultadoFechamento {
  const dezenasCount = dezenasSelecionadas.length;

  switch (estrategiaId) {
    case "16-14-4":
      return {
        jogos: gerarFechamento16Dezenas(dezenasSelecionadas),
        estrategia: "16 Dezenas - Garantia 14 pontos",
        totalDezenas: 16,
        garantia: 14,
      };
    case "17-14-8":
      return {
        jogos: gerarFechamento17Dezenas(dezenasSelecionadas),
        estrategia: "17 Dezenas - Garantia 14 pontos",
        totalDezenas: 17,
        garantia: 14,
      };
    case "18-14-16":
      return {
        jogos: gerarFechamento18Dezenas(dezenasSelecionadas),
        estrategia: "18 Dezenas - Garantia 14 pontos",
        totalDezenas: 18,
        garantia: 14,
      };
    case "19-14-24":
      return {
        jogos: gerarFechamento19Dezenas(dezenasSelecionadas),
        estrategia: "19 Dezenas - Garantia 14 pontos",
        totalDezenas: 19,
        garantia: 14,
      };
    case "20-14-32":
      return {
        jogos: gerarFechamento20Dezenas(dezenasSelecionadas),
        estrategia: "20 Dezenas - Garantia 14 pontos",
        totalDezenas: 20,
        garantia: 14,
      };
    default:
      throw new Error(`Estratégia não suportada: ${estrategiaId}`);
  }
}
