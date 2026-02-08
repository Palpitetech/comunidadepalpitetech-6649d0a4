import { describe, it, expect } from "vitest";
import { FC03, validarFC03 } from "@/lib/matrizes/fc03";
import { validarMatrizFechamento, calcularParametrosCovering, gerarJogosDaMatriz } from "@/types/fechamento";

/**
 * Testes de validação estrutural do FC03 (19 dezenas, 13 fixas, 6 variáveis)
 * Verifica a integridade matemática do núcleo fixo com pares circulares
 */
describe("FC03 — Validação Estrutural (19-14-6)", () => {
  it("deve ter metadados corretos", () => {
    expect(FC03.nome).toBe("FC03");
    expect(FC03.dezenas).toBe(19);
    expect(FC03.dezenasPorJogo).toBe(15);
    expect(FC03.garantia).toBe(14);
    expect(FC03.fixasObrigatorias).toBe(13);
    expect(FC03.ativo).toBe(true);
    expect(FC03.categoria).toBe("avancado");
  });

  it("deve ter exatamente 6 jogos na matriz", () => {
    expect(FC03.matrizRemocoes).toHaveLength(6);
  });

  it("cada jogo deve remover exatamente 4 índices (v - k = 19 - 15)", () => {
    FC03.matrizRemocoes.forEach((removals, idx) => {
      expect(removals).toHaveLength(4);
      expect(removals, `Jogo ${idx + 1} tem ${removals.length} remoções`).toHaveLength(4);
    });
  });

  it("cada índice de remoção deve estar no intervalo [13, 18] (variáveis)", () => {
    FC03.matrizRemocoes.forEach((removals, jogoIdx) => {
      removals.forEach((idx) => {
        expect(idx).toBeGreaterThanOrEqual(13);
        expect(idx).toBeLessThan(19);
      });
    });
  });

  it("não deve haver índices duplicados dentro de um jogo", () => {
    FC03.matrizRemocoes.forEach((removals, jogoIdx) => {
      const unique = new Set(removals);
      expect(unique.size).toBe(4);
    });
  });

  it("deve ter distribuição balanceada (cada variável removida 4 vezes)", () => {
    const contagem = new Array(6).fill(0); // 6 variáveis
    
    FC03.matrizRemocoes.forEach((removals) => {
      removals.forEach((idx) => {
        contagem[idx - 13]++;
      });
    });
    
    // 6 jogos × 4 remoções = 24 remoções / 6 variáveis = 4 por variável
    contagem.forEach((count, idx) => {
      expect(count).toBe(4);
    });
  });

  it("cada variável deve participar de exatamente 2 jogos", () => {
    const participacao = new Array(6).fill(0); // 6 variáveis
    
    FC03.matrizRemocoes.forEach((removals) => {
      // Variáveis que NÃO são removidas participam do jogo
      for (let v = 0; v < 6; v++) {
        if (!removals.includes(13 + v)) {
          participacao[v]++;
        }
      }
    });
    
    // Cada variável deve participar de exatamente 2 jogos
    participacao.forEach((count, idx) => {
      expect(count, `Variável ${idx} participa de ${count} jogos`).toBe(2);
    });
  });

  it("deve validar corretamente com validarMatrizFechamento()", () => {
    const resultado = validarMatrizFechamento(FC03);
    
    expect(resultado.valida).toBe(true);
    expect(resultado.erros).toHaveLength(0);
    
    if (!resultado.valida) {
      console.error("Erros encontrados:", resultado.erros);
    }
  });

  it("deve validar corretamente com validarFC03()", () => {
    const resultado = validarFC03();
    
    expect(resultado.valido).toBe(true);
    expect(resultado.erros).toHaveLength(0);
    
    if (!resultado.valido) {
      console.error("Erros encontrados:", resultado.erros);
    }
  });

  it("deve ter os parâmetros do Núcleo Fixo corretos", () => {
    expect(FC03.covering).toBeDefined();
    
    if (FC03.covering) {
      expect(FC03.covering.totalDezenas).toBe(19);
      expect(FC03.covering.dezenasPorJogo).toBe(15);
      expect(FC03.covering.remocoesPorJogo).toBe(4);
      expect(FC03.covering.garantiaMinima).toBe(14);
      expect(FC03.covering.totalJogos).toBe(6);
    }
  });

  it("deve calcular parâmetros corretamente com calcularParametrosCovering()", () => {
    const params = calcularParametrosCovering(FC03);
    
    expect(params.totalDezenas).toBe(19);
    expect(params.dezenasPorJogo).toBe(15);
    expect(params.remocoesPorJogo).toBe(4);
    expect(params.garantiaMinima).toBe(14);
    expect(params.totalJogos).toBe(6);
  });

  it("deve gerar exatamente 15 dezenas por jogo quando aplicada", () => {
    const dezenas19 = Array.from({ length: 19 }, (_, i) => i + 1);
    const jogos = gerarJogosDaMatriz(dezenas19, FC03.matrizRemocoes);
    
    expect(jogos).toHaveLength(6);
    jogos.forEach((jogo, idx) => {
      expect(jogo, `Jogo ${idx + 1}`).toHaveLength(15);
    });
  });

  it("deve ter descricao e condicao legíveis", () => {
    expect(FC03.descricao).toBeDefined();
    expect(FC03.descricao.length).toBeGreaterThan(0);
    
    expect(FC03.condicao).toBeDefined();
    expect(FC03.condicao).toContain("13");
    expect(FC03.condicao).toContain("6");
  });
});

/**
 * Testes de garantia matemática do FC03
 * Valida que a condição (13 fixas + 2 variáveis) garante 14+
 */
describe("FC03 — Teste de Garantia Matemática", () => {
  it("deve garantir 14+ pontos quando acerta todas as 13 fixas e 2+ variáveis", () => {
    // Prepara: 13 fixas + 6 variáveis
    const fixas = Array.from({ length: 13 }, (_, i) => i + 1);
    const variaveis = Array.from({ length: 6 }, (_, i) => i + 14);
    const dezenas19 = [...fixas, ...variaveis];
    
    const jogos = gerarJogosDaMatriz(dezenas19, FC03.matrizRemocoes);
    
    // Testa todas as C(6,2) = 15 combinações de 2 variáveis acertadas
    let garantiaCumprida = 0;
    let garantiaFalhou = 0;
    
    for (let v1 = 0; v1 < 6; v1++) {
      for (let v2 = v1 + 1; v2 < 6; v2++) {
        // Simula resultado: 13 fixas + 2 variáveis
        const resultado = [
          ...fixas,
          variaveis[v1],
          variaveis[v2],
        ];
        
        // Verifica melhor acerto entre os 6 jogos
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
    
    const totalCombinacoes = 15; // C(6,2) = 15
    
    // Logging para análise
    console.log(`FC03 - Taxa de sucesso: ${((garantiaCumprida / totalCombinacoes) * 100).toFixed(2)}%`);
    console.log(`Garantia cumprida: ${garantiaCumprida}/${totalCombinacoes}`);
    console.log(`Garantia falhou: ${garantiaFalhou}/${totalCombinacoes}`);
    
    // Para um núcleo fixo perfeito, todas as combinações devem funcionar
    expect(garantiaCumprida).toBe(totalCombinacoes);
  });

  it("deve garantir 15 pontos quando acerta todas as 19 dezenas", () => {
    const dezenas19 = Array.from({ length: 19 }, (_, i) => i + 1);
    const jogos = gerarJogosDaMatriz(dezenas19, FC03.matrizRemocoes);
    
    // Se acertar todas as 19, todos os jogos têm 15 acertos
    jogos.forEach((jogo, idx) => {
      const acertos = jogo.filter((d) => dezenas19.includes(d)).length;
      expect(acertos, `Jogo ${idx + 1}`).toBe(15);
    });
  });

  it("deve verificar pares circulares adjacentes", () => {
    const fixas = Array.from({ length: 13 }, (_, i) => i + 1);
    const variaveis = Array.from({ length: 6 }, (_, i) => i + 14);
    const dezenas19 = [...fixas, ...variaveis];
    
    const jogos = gerarJogosDaMatriz(dezenas19, FC03.matrizRemocoes);
    
    // Pares adjacentes: (0,1), (1,2), (2,3), (3,4), (4,5), (5,0)
    const paresAdjacentes = [
      [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0]
    ];
    
    paresAdjacentes.forEach(([v1, v2], jogoIdx) => {
      const jogo = jogos[jogoIdx];
      
      // Verifica que as variáveis do par estão no jogo
      expect(jogo, `Jogo ${jogoIdx + 1} deve conter Var${v1}`).toContain(variaveis[v1]);
      expect(jogo, `Jogo ${jogoIdx + 1} deve conter Var${v2}`).toContain(variaveis[v2]);
      
      // Verifica que as 13 fixas estão no jogo
      fixas.forEach((fixa) => {
        expect(jogo).toContain(fixa);
      });
    });
  });
});
