import { describe, it, expect } from "vitest";
import { FC05 } from "@/lib/matrizes/fc05";
import { validarMatrizFechamento, calcularParametrosCovering } from "@/types/fechamento";

/**
 * Testes de validação estrutural do FC05 (ERRE 5)
 * Verifica a integridade matemática do Covering Design
 */
describe("FC05 — Validação Estrutural (ERRE 5)", () => {
  it("deve ter metadados corretos", () => {
    expect(FC05.nome).toBe("FC05");
    expect(FC05.dezenas).toBe(20);
    expect(FC05.dezenasPorJogo).toBe(15);
    expect(FC05.garantia).toBe(14);
    expect(FC05.ativo).toBe(true);
  });

  it("deve ter exatamente 350 jogos na matriz", () => {
    expect(FC05.matrizRemocoes).toHaveLength(350);
  });

  it("cada jogo deve remover exatamente 5 índices (v - k = 20 - 15)", () => {
    FC05.matrizRemocoes.forEach((removals, idx) => {
      expect(removals).toHaveLength(5);
      expect(removals, `Jogo ${idx + 1} tem ${removals.length} remoções`).toHaveLength(5);
    });
  });

  it("cada índice de remoção deve estar no intervalo [0, 19]", () => {
    FC05.matrizRemocoes.forEach((removals, jogoIdx) => {
      removals.forEach((idx, removalIdx) => {
        expect(idx).toBeGreaterThanOrEqual(0);
        expect(idx).toBeLessThan(20);
        expect(
          idx,
          `Jogo ${jogoIdx + 1}, remoção ${removalIdx + 1}: índice ${idx} fora do intervalo`
        ).toBeGreaterThanOrEqual(0);
      });
    });
  });

  it("não deve haver índices duplicados dentro de um jogo", () => {
    FC05.matrizRemocoes.forEach((removals, jogoIdx) => {
      const unique = new Set(removals);
      expect(unique.size).toBe(5);
      expect(
        unique.size,
        `Jogo ${jogoIdx + 1} tem índices duplicados: ${removals}`
      ).toBe(5);
    });
  });

  it("deve validar corretamente com validarMatrizFechamento()", () => {
    const resultado = validarMatrizFechamento(FC05);
    
    expect(resultado.valida).toBe(true);
    expect(resultado.erros).toHaveLength(0);
    
    if (!resultado.valida) {
      console.error("Erros encontrados:", resultado.erros);
    }
  });

  it("deve ter os parâmetros do Covering Design corretos", () => {
    expect(FC05.covering).toBeDefined();
    
    if (FC05.covering) {
      expect(FC05.covering.totalDezenas).toBe(20);
      expect(FC05.covering.dezenasPorJogo).toBe(15);
      expect(FC05.covering.erroPermitido).toBe(5);
      expect(FC05.covering.garantiaMinima).toBe(14);
      expect(FC05.covering.remocoesPorJogo).toBe(5);
      expect(FC05.covering.totalJogos).toBe(350);
    }
  });

  it("deve calcular parâmetros corretamente com calcularParametrosCovering()", () => {
    const params = calcularParametrosCovering(FC05);
    
    expect(params.totalDezenas).toBe(20);
    expect(params.dezenasPorJogo).toBe(15);
    expect(params.erroPermitido).toBe(5);
    expect(params.garantiaMinima).toBe(14);
    expect(params.remocoesPorJogo).toBe(5);
    expect(params.totalJogos).toBe(350);
  });

  it("deve gerar exatamente 15 dezenas por jogo quando aplicada", () => {
    import("@/types/fechamento").then(({ gerarJogosDaMatriz }) => {
      // Usa 20 dezenas de exemplo
      const dezenas20 = Array.from({ length: 20 }, (_, i) => i + 1);
      const jogos = gerarJogosDaMatriz(dezenas20, FC05.matrizRemocoes);
      
      expect(jogos).toHaveLength(350);
      jogos.forEach((jogo, idx) => {
        expect(jogo, `Jogo ${idx + 1}`).toHaveLength(15);
      });
    });
  });

  it("deve ter descricao e condicao legíveis", () => {
    expect(FC05.descricao).toBeDefined();
    expect(FC05.descricao.length).toBeGreaterThan(0);
    
    expect(FC05.condicao).toBeDefined();
    expect(FC05.condicao).toContain("15");
    expect(FC05.condicao).toContain("20");
  });
});
