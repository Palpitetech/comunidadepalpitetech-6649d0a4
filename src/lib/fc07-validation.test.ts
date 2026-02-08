import { describe, it, expect } from "vitest";
import { FC07, validarFC07 } from "@/lib/matrizes/fc07";
import { validarMatrizFechamento, calcularParametrosCovering, gerarJogosDaMatriz } from "@/types/fechamento";

/**
 * Testes de validação estrutural do FC07 (25 dezenas, 14 fixas, 11 variáveis)
 * Verifica a integridade matemática do núcleo fixo absoluto
 */
describe("FC07 — Validação Estrutural (25-15-11)", () => {
  it("deve ter metadados corretos", () => {
    expect(FC07.nome).toBe("FC07");
    expect(FC07.dezenas).toBe(25);
    expect(FC07.dezenasPorJogo).toBe(15);
    expect(FC07.garantia).toBe(15);
    expect(FC07.fixasObrigatorias).toBe(14);
    expect(FC07.ativo).toBe(true);
    expect(FC07.categoria).toBe("avancado");
  });

  it("deve ter exatamente 11 jogos na matriz", () => {
    expect(FC07.matrizRemocoes).toHaveLength(11);
  });

  it("cada jogo deve remover exatamente 10 índices (v - k = 25 - 15)", () => {
    FC07.matrizRemocoes.forEach((removals, idx) => {
      expect(removals).toHaveLength(10);
      expect(removals, `Jogo ${idx + 1} tem ${removals.length} remoções`).toHaveLength(10);
    });
  });

  it("cada índice de remoção deve estar no intervalo [14, 24] (variáveis)", () => {
    FC07.matrizRemocoes.forEach((removals, jogoIdx) => {
      removals.forEach((idx) => {
        expect(idx).toBeGreaterThanOrEqual(14);
        expect(idx).toBeLessThan(25);
      });
    });
  });

  it("não deve haver índices duplicados dentro de um jogo", () => {
    FC07.matrizRemocoes.forEach((removals, jogoIdx) => {
      const unique = new Set(removals);
      expect(unique.size).toBe(10);
    });
  });

  it("deve ter distribuição balanceada (cada variável removida 10 vezes)", () => {
    const contagem = new Array(11).fill(0); // 11 variáveis
    
    FC07.matrizRemocoes.forEach((removals) => {
      removals.forEach((idx) => {
        contagem[idx - 14]++;
      });
    });
    
    // 11 jogos × 10 remoções = 110 remoções / 11 variáveis = 10 por variável
    contagem.forEach((count, idx) => {
      expect(count).toBe(10);
    });
  });

  it("deve validar corretamente com validarMatrizFechamento()", () => {
    const resultado = validarMatrizFechamento(FC07);
    
    expect(resultado.valida).toBe(true);
    expect(resultado.erros).toHaveLength(0);
    
    if (!resultado.valida) {
      console.error("Erros encontrados:", resultado.erros);
    }
  });

  it("deve validar corretamente com validarFC07()", () => {
    const resultado = validarFC07();
    
    expect(resultado.valido).toBe(true);
    expect(resultado.erros).toHaveLength(0);
    
    if (!resultado.valido) {
      console.error("Erros encontrados:", resultado.erros);
    }
  });

  it("deve ter os parâmetros do Núcleo Fixo corretos", () => {
    expect(FC07.covering).toBeDefined();
    
    if (FC07.covering) {
      expect(FC07.covering.totalDezenas).toBe(25);
      expect(FC07.covering.dezenasPorJogo).toBe(15);
      expect(FC07.covering.remocoesPorJogo).toBe(10);
      expect(FC07.covering.garantiaMinima).toBe(15);
      expect(FC07.covering.totalJogos).toBe(11);
    }
  });

  it("deve calcular parâmetros corretamente com calcularParametrosCovering()", () => {
    const params = calcularParametrosCovering(FC07);
    
    expect(params.totalDezenas).toBe(25);
    expect(params.dezenasPorJogo).toBe(15);
    expect(params.remocoesPorJogo).toBe(10);
    expect(params.garantiaMinima).toBe(15);
    expect(params.totalJogos).toBe(11);
  });

  it("deve gerar exatamente 15 dezenas por jogo quando aplicada", () => {
    const dezenas25 = Array.from({ length: 25 }, (_, i) => i + 1);
    const jogos = gerarJogosDaMatriz(dezenas25, FC07.matrizRemocoes);
    
    expect(jogos).toHaveLength(11);
    jogos.forEach((jogo, idx) => {
      expect(jogo, `Jogo ${idx + 1}`).toHaveLength(15);
    });
  });

  it("deve ter descricao e condicao legíveis", () => {
    expect(FC07.descricao).toBeDefined();
    expect(FC07.descricao.length).toBeGreaterThan(0);
    
    expect(FC07.condicao).toBeDefined();
    expect(FC07.condicao).toContain("14");
    expect(FC07.condicao).toContain("variáveis");
  });
});

/**
 * Testes de garantia matemática do FC07
 * Valida que a condição (14 fixas + 1 variável) garante 15 pontos PERFEITOS
 */
describe("FC07 — Teste de Garantia Matemática (PERFEITA)", () => {
  it("deve garantir 15 pontos quando acerta todas as 14 fixas e qualquer 1 variável", () => {
    // Prepara: 14 fixas + 11 variáveis
    const fixas = Array.from({ length: 14 }, (_, i) => i + 1);
    const variaveis = Array.from({ length: 11 }, (_, i) => i + 15);
    const dezenas25 = [...fixas, ...variaveis];
    
    const jogos = gerarJogosDaMatriz(dezenas25, FC07.matrizRemocoes);
    
    // Testa: 14 fixas acertadas + 1 variável acertada
    // Para cada uma das 11 variáveis
    let acertos15 = 0;
    let acertos14 = 0;
    let falhas = 0;
    
    for (let varAcerta = 0; varAcerta < 11; varAcerta++) {
      const resultado = [
        ...fixas,
        variaveis[varAcerta],
      ];
      
      // Verifica cada jogo
      jogos.forEach((jogo, jogoIdx) => {
        const acertos = jogo.filter((d) => resultado.includes(d)).length;
        
        if (acertos === 15) {
          // Deve ser exatamente o jogo que contém essa variável
          expect(jogo).toContain(variaveis[varAcerta]);
          acertos15++;
        } else if (acertos === 14) {
          // Todos os outros jogos têm 14
          acertos14++;
        } else {
          falhas++;
        }
      });
    }
    
    // Logging para análise
    console.log(`FC07 - Acertos de 15 pontos: ${acertos15}`);
    console.log(`FC07 - Acertos de 14 pontos: ${acertos14}`);
    console.log(`FC07 - Falhas: ${falhas}`);
    
    // Garantia: para cada variável sorteada, há exatamente 1 jogo com 15 pontos
    expect(acertos15).toBe(11); // 11 variáveis × 1 jogo com 15 cada
    expect(falhas).toBe(0);
  });

  it("deve garantir 15 pontos quando acerta todas as 25 dezenas", () => {
    const dezenas25 = Array.from({ length: 25 }, (_, i) => i + 1);
    const jogos = gerarJogosDaMatriz(dezenas25, FC07.matrizRemocoes);
    
    // Se acertar todas as 25, todos os jogos têm 15 acertos
    jogos.forEach((jogo, idx) => {
      const acertos = jogo.filter((d) => dezenas25.includes(d)).length;
      expect(acertos, `Jogo ${idx + 1}`).toBe(15);
    });
  });

  it("deve ter cada variável em exatamente 1 jogo", () => {
    const fixas = Array.from({ length: 14 }, (_, i) => i + 1);
    const variaveis = Array.from({ length: 11 }, (_, i) => i + 15);
    const dezenas25 = [...fixas, ...variaveis];
    
    const jogos = gerarJogosDaMatriz(dezenas25, FC07.matrizRemocoes);
    
    // Verifica que cada variável aparece em exatamente 1 jogo
    variaveis.forEach((variavel, varIdx) => {
      let encontrada = 0;
      
      jogos.forEach((jogo, jogoIdx) => {
        if (jogo.includes(variavel)) {
          encontrada++;
        }
      });
      
      expect(encontrada, `Variável ${varIdx} aparece em ${encontrada} jogo(s)`).toBe(1);
    });
  });
});
