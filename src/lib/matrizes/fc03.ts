/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * FC03 — SISTEMA DE NÚCLEO FIXO COM COMBINAÇÃO CIRCULAR DE VARIÁVEIS
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Definição Matemática:
 * ─────────────────────
 * Tipo: Fechamento com núcleo fixo e pares circulares (Fixed Core + Circular Pairs)
 * Notação: 19 dezenas (13 fixas + 6 variáveis) → 6 jogos de 15 dezenas
 * 
 * Parâmetros Fundamentais:
 * ────────────────────────
 *   v = 19  (total de dezenas selecionadas pelo usuário)
 *   f = 13  (dezenas fixas obrigatórias)
 *   r = 6   (dezenas variáveis)
 *   k = 15  (dezenas por jogo gerado = f + 2)
 *   g = 14  (garantia mínima de acertos)
 *   b = 6   (quantidade total de jogos)
 * 
 * Condição de Funcionamento:
 * ──────────────────────────
 *   |Resultado ∩ Fixas| = 13
 *   |Resultado ∩ Variáveis| ≥ 2
 *   
 *   Traduzindo: O usuário deve acertar TODAS as 13 fixas
 *   E pelo menos 2 das 6 variáveis.
 * 
 * Garantia Matemática:
 * ────────────────────
 *   Se ambas as condições forem satisfeitas:
 *   ∃ jogo ∈ {jogos} : |jogo ∩ Resultado| ≥ 14
 *   
 *   Existe pelo menos um jogo com 14+ acertos.
 *   
 *   Prova: Com 13 fixas certas + 2 variáveis certas:
 *   - Se as 2 variáveis certas formam um par em algum jogo → 15 pontos
 *   - Senão, cada variável aparece em algum jogo → pelo menos 14 pontos
 *   Como cada variável participa de exatamente 2 jogos, sempre há 14+ ✓
 * 
 * Estrutura da Matriz:
 * ────────────────────
 * A matriz utiliza pares circulares: cada jogo contém as 13 fixas
 * mais exatamente 2 variáveis adjacentes no ciclo.
 * 
 *   Ordem das dezenas (CRÍTICA):
 *   Posições 0-12: Fixas obrigatórias
 *   Posições 13-18: Variáveis (2 por jogo)
 * 
 *   Ciclo de Pares:
 *   Jogo 1: Fixas + [Var0, Var1]
 *   Jogo 2: Fixas + [Var1, Var2]
 *   Jogo 3: Fixas + [Var2, Var3]
 *   Jogo 4: Fixas + [Var3, Var4]
 *   Jogo 5: Fixas + [Var4, Var5]
 *   Jogo 6: Fixas + [Var5, Var0]
 * 
 * Propriedades:
 * ─────────────
 *   - Cada jogo remove exatamente 4 variáveis (19 - 15 = 4)
 *   - Cada jogo mantém as 13 fixas + 2 variáveis
 *   - Cada variável participa de exatamente 2 jogos (distribuição uniforme)
 *   - Cobertura circular: pares adjacentes garantem 14+ para qualquer par acertado
 * 
 * Fonte: Design de núcleo fixo com ciclo hamiltoniano em loterias
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import type { MatrizFechamento, ParametrosCoveringDesign } from "@/types/fechamento";

/**
 * Parâmetros do Núcleo Fixo FC03
 */
const FC03_COVERING: ParametrosCoveringDesign = {
  totalDezenas: 19,      // v
  dezenasPorJogo: 15,    // k
  erroPermitido: 0,      // Não aplicável a núcleo fixo
  garantiaMinima: 14,    // g
  remocoesPorJogo: 4,    // r = v - k
  totalJogos: 6,         // b
};

/**
 * FC03 — Fechamento 19 Dezenas (13 Fixas + 6 Variáveis)
 * 
 * Estratégia de núcleo fixo com pares circulares que garante 14+ pontos
 * quando o usuário acerta TODAS as 13 fixas
 * E pelo menos 2 das 6 variáveis.
 * 
 * IMPORTANTE: As dezenas devem ser passadas em ordem específica!
 * Primeiras 13 posições: Fixas
 * Últimas 6 posições: Variáveis
 * A ordem é crítica para a aplicação correta da matriz de remoções.
 */
export const FC03: MatrizFechamento = {
  id: "19-14-6",
  nome: "FC03",
  descricao: "19 dezenas (13 fixas + 6 variáveis), 6 jogos, garantia 14 pontos",
  dezenas: FC03_COVERING.totalDezenas,
  garantia: FC03_COVERING.garantiaMinima,
  dezenasPorJogo: FC03_COVERING.dezenasPorJogo,
  condicao: `Acertar todas as 13 fixas E 2+ das 6 variáveis`,
  fixasObrigatorias: 13,
  categoria: "avancado",
  ativo: true,
  covering: FC03_COVERING,
  matrizRemocoes: [
    // ═══════════════════════════════════════════════════════════════════
    // CICLO DE PARES: 13 FIXAS + 2 VARIÁVEIS POR JOGO
    // ═══════════════════════════════════════════════════════════════════
    // Cada jogo contém as 13 fixas (índices 0-12) + 2 variáveis (índices 13-18)
    // Remoções: 4 variáveis que NÃO aparecem no jogo atual
    // 
    // Construção: Pares circulares adjacentes
    // Var[i] e Var[(i+1) mod 6] formam cada par
    // 
    // Cada variável participa de exatamente 2 jogos:
    // Var0 → Jogos 1 e 6
    // Var1 → Jogos 1 e 2
    // Var2 → Jogos 2 e 3
    // Var3 → Jogos 3 e 4
    // Var4 → Jogos 4 e 5
    // Var5 → Jogos 5 e 6
    // ═══════════════════════════════════════════════════════════════════
    
    // Jogo 1: Fixas + [Var0, Var1] → remove [Var2, Var3, Var4, Var5]
    [15, 16, 17, 18],
    
    // Jogo 2: Fixas + [Var1, Var2] → remove [Var0, Var3, Var4, Var5]
    [13, 16, 17, 18],
    
    // Jogo 3: Fixas + [Var2, Var3] → remove [Var0, Var1, Var4, Var5]
    [13, 14, 17, 18],
    
    // Jogo 4: Fixas + [Var3, Var4] → remove [Var0, Var1, Var2, Var5]
    [13, 14, 15, 18],
    
    // Jogo 5: Fixas + [Var4, Var5] → remove [Var0, Var1, Var2, Var3]
    [13, 14, 15, 16],
    
    // Jogo 6: Fixas + [Var5, Var0] → remove [Var1, Var2, Var3, Var4]
    [14, 15, 16, 17],
  ],
};

/**
 * Valida a estrutura da matriz FC03
 */
export function validarFC03(): { valido: boolean; erros: string[] } {
  const erros: string[] = [];
  const matriz = FC03.matrizRemocoes;
  
  // Verifica quantidade de jogos
  if (matriz.length !== 6) {
    erros.push(`Esperado 6 jogos, encontrado ${matriz.length}`);
  }
  
  // Verifica cada jogo
  const contagemVariaveis: number[] = new Array(6).fill(0);
  
  matriz.forEach((remocoes, jogoIdx) => {
    // Verifica quantidade de remoções
    if (remocoes.length !== 4) {
      erros.push(`Jogo ${jogoIdx + 1}: esperado 4 remoções, encontrado ${remocoes.length}`);
    }
    
    // Verifica índices válidos (13-18 para variáveis)
    remocoes.forEach((idx) => {
      if (idx < 13 || idx > 18) {
        erros.push(`Jogo ${jogoIdx + 1}: índice ${idx} deve estar em [13, 18]`);
      } else {
        contagemVariaveis[idx - 13]++;
      }
    });
    
    // Verifica duplicatas internas
    const unique = new Set(remocoes);
    if (unique.size !== remocoes.length) {
      erros.push(`Jogo ${jogoIdx + 1}: índices duplicados ${JSON.stringify(remocoes)}`);
    }
  });
  
  // Verifica distribuição balanceada (cada variável deve ser removida 4 vezes)
  contagemVariaveis.forEach((count, idx) => {
    if (count !== 4) {
      erros.push(`Variável[${idx}] (índice ${13 + idx}) é removida ${count} vezes (esperado: 4)`);
    }
  });
  
  return {
    valido: erros.length === 0,
    erros,
  };
}
