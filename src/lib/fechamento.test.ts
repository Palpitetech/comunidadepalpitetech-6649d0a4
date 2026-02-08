import { describe, it, expect } from "vitest";
import { 
  gerarFechamento16Dezenas, 
  gerarFechamento,
} from "@/lib/fechamento";

/**
 * Função auxiliar para calcular acertos entre um jogo e um resultado
 */
function calcularAcertos(jogo: number[], resultado: number[]): number {
  return jogo.filter((d) => resultado.includes(d)).length;
}

/**
 * Verifica se a garantia do fechamento é cumprida
 * Para garantia 14: se acertar X das N dezenas selecionadas, pelo menos um jogo deve ter 14+ acertos
 */
function verificarGarantia(
  jogos: number[][], 
  dezenasSelecionadas: number[], 
  resultado: number[], 
  garantiaMinima: number
): { garantidoCumprida: boolean; melhorAcerto: number } {
  const acertosPorJogo = jogos.map((jogo) => calcularAcertos(jogo, resultado));
  const melhorAcerto = Math.max(...acertosPorJogo);
  
  return {
    garantidoCumprida: melhorAcerto >= garantiaMinima,
    melhorAcerto,
  };
}

describe("Fechamento 16-14-4 (FC01)", () => {
  const dezenas16 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];

  it("deve gerar exatamente 4 jogos", () => {
    const jogos = gerarFechamento16Dezenas(dezenas16);
    expect(jogos).toHaveLength(4);
  });

  it("cada jogo deve ter 15 dezenas", () => {
    const jogos = gerarFechamento16Dezenas(dezenas16);
    jogos.forEach((jogo) => {
      expect(jogo).toHaveLength(15);
    });
  });

  it("deve garantir 14 pontos se acertar 15 das 16 dezenas (todas as combinações)", () => {
    const jogos = gerarFechamento16Dezenas(dezenas16);
    
    // Testa todas as 16 possibilidades de acertar 15 das 16 dezenas
    for (let dezenaErrada = 0; dezenaErrada < 16; dezenaErrada++) {
      // Simula um resultado onde apenas uma das 16 dezenas não foi sorteada
      const resultado = dezenas16.filter((_, i) => i !== dezenaErrada);
      
      const { garantidoCumprida, melhorAcerto } = verificarGarantia(jogos, dezenas16, resultado, 14);
      
      expect(garantidoCumprida).toBe(true);
      expect(melhorAcerto).toBeGreaterThanOrEqual(14);
    }
  });

  it("deve garantir 15 pontos se acertar todas as 16 dezenas", () => {
    const jogos = gerarFechamento16Dezenas(dezenas16);
    
    // Se todas as 16 dezenas forem sorteadas, todos os jogos têm 15 acertos
    const { melhorAcerto } = verificarGarantia(jogos, dezenas16, dezenas16, 15);
    expect(melhorAcerto).toBe(15);
  });
});

describe("gerarFechamento (função principal)", () => {
  it("deve rotear corretamente para a estratégia 16-14-4", () => {
    const dezenas = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];
    const resultado = gerarFechamento("16-14-4", dezenas);
    
    expect(resultado.jogos).toHaveLength(4);
    expect(resultado.garantia).toBe(14);
    expect(resultado.totalDezenas).toBe(16);
  });

  it("deve lançar erro para estratégia inválida", () => {
    const dezenas = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];
    expect(() => gerarFechamento("invalido", dezenas)).toThrow();
  });
});
