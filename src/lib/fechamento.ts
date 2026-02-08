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
    default:
      throw new Error(`Estratégia não suportada: ${estrategiaId}`);
  }
}
