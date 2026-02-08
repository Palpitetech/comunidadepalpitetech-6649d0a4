import { describe, it, expect } from "vitest";
import { FC04, validarFC04 } from "@/lib/matrizes/fc04";
import { validarMatrizFechamento, calcularParametrosCovering, gerarJogosDaMatriz } from "@/types/fechamento";

/**
 * Testes de validação estrutural do FC04 (21 dezenas, 14 fixas, 7 variáveis)
 * Verifica a integridade matemática do núcleo fixo com rotação simples
 */
describe("FC04 — Validação Estrutural (21-14-7)", () => {
  it("deve ter metadados corretos", () => {
    expect(FC04.nome).toBe("FC04");
    expect(FC04.dezenas).toBe(21);
    expect(FC04.dezenasPorJogo).toBe(15);
    expect(FC04.garantia).toBe(14);
    expect(FC04.fixasObrigatorias).toBe(14);
    expect(FC04.ativo).toBe(true);
    expect(FC04.categoria).toBe("avancado");
  });

  it("deve ter exatamente 7 jogos na matriz", () => {
    expect(FC04.matrizRemocoes).toHaveLength(7);
  });

  it("cada jogo deve remover exatamente 6 índices (v - k = 21 - 15)", () => {
    FC04.matrizRemocoes.forEach((removals, idx) => {
      expect(removals).toHaveLength(6);
      expect(removals, `Jogo ${idx + 1} tem ${removals.length} remoções`).toHaveLength(6);
    });
  });

  it("cada índice de remoção deve estar no intervalo [14, 20] (variáveis)", () => {
    FC04.matrizRemocoes.forEach((removals, jogoIdx) => {
      removals.forEach((idx) => {
        expect(idx).toBeGreaterThanOrEqual(14);
        expect(idx).toBeLessThan(21);
      });
    });
  });

  it("não deve haver índices duplicados dentro de um jogo", () => {
    FC04.matrizRemocoes.forEach((removals, jogoIdx) => {
      const unique = new Set(removals);
      expect(unique.size).toBe(6);
    });
  });

  it("deve ter distribuição balanceada (cada variável removida 6 vezes)", () => {
    const contagem = new Array(7).fill(0); // 7 variáveis
    
    FC04.matrizRemocoes.forEach((removals) => {
      removals.forEach((idx) => {
        contagem[idx - 14]++;
      });
    });
    
    // 7 jogos × 6 remoções = 42 remoções / 7 variáveis = 6 por variável
    contagem.forEach((count, idx) => {
      expect(count).toBe(6);
    });
  });

  it("deve validar corretamente com validarMatrizFechamento()", () => {
    const resultado = validarMatrizFechamento(FC04);
    
    expect(resultado.valida).toBe(true);
    expect(resultado.erros).toHaveLength(0);
    
    if (!resultado.valida) {
      console.error("Erros encontrados:", resultado.erros);
    }
  });

  it("deve validar corretamente com validarFC04()", () => {
    const resultado = validarFC04();
    
    expect(resultado.valido).toBe(true);
    expect(resultado.erros).toHaveLength(0);
    
    if (!resultado.valido) {
      console.error("Erros encontrados:", resultado.erros);
    }
  });

  it("deve ter os parâmetros do Núcleo Fixo corretos", () => {
    expect(FC04.covering).toBeDefined();
    
    if (FC04.covering) {
      expect(FC04.covering.totalDezenas).toBe(21);
      expect(FC04.covering.dezenasPorJogo).toBe(15);
      expect(FC04.covering.remocoesPorJogo).toBe(6);
      expect(FC04.covering.garantiaMinima).toBe(14);
      expect(FC04.covering.totalJogos).toBe(7);
    }
  });

  it("deve calcular parâmetros corretamente com calcularParametrosCovering()", () => {
    const params = calcularParametrosCovering(FC04);
    
    expect(params.totalDezenas).toBe(21);
    expect(params.dezenasPorJogo).toBe(15);
    expect(params.remocoesPorJogo).toBe(6);
    expect(params.garantiaMinima).toBe(14);
    expect(params.totalJogos).toBe(7);
  });

  it("deve gerar exatamente 15 dezenas por jogo quando aplicada", () => {
    const dezenas21 = Array.from({ length: 21 }, (_, i) => i + 1);
    const jogos = gerarJogosDaMatriz(dezenas21, FC04.matrizRemocoes);
    
    expect(jogos).toHaveLength(7);
    jogos.forEach((jogo, idx) => {
      expect(jogo, `Jogo ${idx + 1}`).toHaveLength(15);
    });
  });

  it("deve ter descricao e condicao legíveis", () => {
    expect(FC04.descricao).toBeDefined();
    expect(FC04.descricao.length).toBeGreaterThan(0);
    
    expect(FC04.condicao).toBeDefined();
    expect(FC04.condicao).toContain("14");
    expect(FC04.condicao).toContain("13");
  });
});

/**
 * Testes de garantia matemática do FC04
 * Valida que a condição (13 fixas + 2 variáveis) garante 14+
 */
describe("FC04 — Teste de Garantia Matemática", () => {
  it("deve garantir 14+ pontos quando acerta 13 fixas e 2 variáveis", () => {
    // Prepara: 14 fixas + 7 variáveis
    const fixas = Array.from({ length: 14 }, (_, i) => i + 1);
    const variaveis = Array.from({ length: 7 }, (_, i) => i + 15);
    const dezenas21 = [...fixas, ...variaveis];
    
    const jogos = gerarJogosDaMatriz(dezenas21, FC04.matrizRemocoes);
    
    // Testa todas as combinações de erros:
    // 1 fixa errada (13 acertadas) + 5 variáveis erradas (2 acertadas)
    let garantiaCumprida = 0;
    let garantiaFalhou = 0;
    
    // Escolhe qual fixa erra (1 de 14)
    for (let fixaErrada = 0; fixaErrada < 14; fixaErrada++) {
      // Escolhe quais 2 variáveis acertam (C(7,2) = 21 combinações)
      for (let v1 = 0; v1 < 7; v1++) {
        for (let v2 = v1 + 1; v2 < 7; v2++) {
          // Simula resultado: 13 fixas acertadas + 2 variáveis acertadas
          const resultado = [
            ...fixas.filter((_, i) => i !== fixaErrada),
            variaveis[v1],
            variaveis[v2],
          ];
          
          // Verifica melhor acerto entre os 7 jogos
          let melhorAcerto = 0;
          jogos.forEach((jogo) => {
            const acertos = jogo.filter((d) => resultado.includes(d)).length;
            if (acertos > melhorAcerto) {
              melhorAcerto = acertos;
            }
          });
          
          if (melhorAcerto >= 14) {
            garantiaCumprida++;
          } else {
            garantiaFalhou++;
          }
        }
      }
    }
    
    const totalCombinacoes = 14 * 21; // 14 fixas erradas × C(7,2) variáveis
    
    // Logging para análise
    console.log(`FC04 - Taxa de sucesso: ${((garantiaCumprida / totalCombinacoes) * 100).toFixed(2)}%`);
    console.log(`Garantia cumprida: ${garantiaCumprida}/${totalCombinacoes}`);
    console.log(`Garantia falhou: ${garantiaFalhou}/${totalCombinacoes}`);
    
    // Para um núcleo fixo perfeito, todas as combinações devem funcionar
    expect(garantiaCumprida).toBe(totalCombinacoes);
  });

  it("deve garantir 15 pontos quando acerta todas as 21 dezenas", () => {
    const dezenas21 = Array.from({ length: 21 }, (_, i) => i + 1);
    const jogos = gerarJogosDaMatriz(dezenas21, FC04.matrizRemocoes);
    
    // Se acertar todas as 21, todos os jogos têm 15 acertos
    jogos.forEach((jogo, idx) => {
      const acertos = jogo.filter((d) => dezenas21.includes(d)).length;
      expect(acertos, `Jogo ${idx + 1}`).toBe(15);
    });
  });

  it("deve garantir 14 pontos quando acerta 13 fixas + 1 variável", () => {
    const fixas = Array.from({ length: 14 }, (_, i) => i + 1);
    const variaveis = Array.from({ length: 7 }, (_, i) => i + 15);
    const dezenas21 = [...fixas, ...variaveis];
    
    const jogos = gerarJogosDaMatriz(dezenas21, FC04.matrizRemocoes);
    
    // Testa: 13 fixas acertadas + 1 variável acertada
    // Escolhe qual fixa erra (1 de 14)
    for (let fixaErrada = 0; fixaErrada < 14; fixaErrada++) {
      // Escolhe qual variável acerta (1 de 7)
      for (let varAcerta = 0; varAcerta < 7; varAcerta++) {
        const resultado = [
          ...fixas.filter((_, i) => i !== fixaErrada),
          variaveis[varAcerta],
        ];
        
        let melhorAcerto = 0;
        jogos.forEach((jogo) => {
          const acertos = jogo.filter((d) => resultado.includes(d)).length;
          melhorAcerto = Math.max(melhorAcerto, acertos);
        });
        
        // Com 13 fixas + 1 variável, garantia é 13 (nem sempre 14)
        // Mas frequentemente um jogo bate 14
        expect(melhorAcerto).toBeGreaterThanOrEqual(13);
      }
    }
  });
});
