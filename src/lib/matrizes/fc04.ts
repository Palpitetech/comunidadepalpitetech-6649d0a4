/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * FC04 — SISTEMA DE NÚCLEO FIXO COM ROTAÇÃO SIMPLES
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Definição Matemática:
 * ─────────────────────
 * Tipo: Fechamento com núcleo fixo (Fixed Core Closure)
 * Notação: 21 dezenas (14 fixas + 7 variáveis) → 7 jogos de 15 dezenas
 * 
 * Parâmetros Fundamentais:
 * ────────────────────────
 *   v = 21  (total de dezenas selecionadas pelo usuário)
 *   f = 14  (dezenas fixas obrigatórias)
 *   r = 7   (dezenas variáveis)
 *   k = 15  (dezenas por jogo gerado = f + 1)
 *   g = 14  (garantia mínima de acertos)
 *   b = 7   (quantidade total de jogos)
 * 
 * Condição de Funcionamento:
 * ──────────────────────────
 *   |Resultado ∩ Fixas| ≥ 13
 *   |Resultado ∩ Variáveis| ≥ 2
 *   
 *   Traduzindo: O usuário deve acertar pelo menos 13 das 14 fixas
 *   E pelo menos 2 das 7 variáveis.
 * 
 * Garantia Matemática:
 * ────────────────────
 *   Se ambas as condições forem satisfeitas:
 *   ∃ jogo ∈ {jogos} : |jogo ∩ Resultado| ≥ 14
 *   
 *   Existe pelo menos um jogo com 14+ acertos.
 *   
 *   Prova: Se acertar 13 fixas + 2 variáveis, no pior caso um jogo tem:
 *   13 fixas + 1 variável acertada = 14 pontos (100% garantido)
 * 
 * Estrutura da Matriz:
 * ────────────────────
 * A matriz utiliza rotação simples: cada jogo contém as 14 fixas
 * mais exatamente 1 variável distinta.
 * 
 *   Ordem das dezenas (CRÍTICA):
 *   Posições 0-13: Fixas obrigatórias
 *   Posições 14-20: Variáveis (1 por jogo)
 * 
 *   Jogos:
 *   Jogo 1: Fixas + Variável[0]
 *   Jogo 2: Fixas + Variável[1]
 *   ...
 *   Jogo 7: Fixas + Variável[6]
 * 
 * Propriedades:
 * ─────────────
 *   - Cada jogo remove exatamente 6 variáveis (21 - 15 = 6)
 *   - Cada jogo mantém as 14 fixas + 1 variável
 *   - Cobertura: todas as combinações {13 fixas + 2 variáveis} geram 14+
 *   - Simplicidade: algoritmo trivial, fácil de explicar
 * 
 * Fonte: Design de núcleo fixo clássico em loterias
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import type { MatrizFechamento, ParametrosCoveringDesign } from "@/types/fechamento";

/**
 * Parâmetros do Núcleo Fixo FC04
 */
const FC04_COVERING: ParametrosCoveringDesign = {
  totalDezenas: 21,      // v
  dezenasPorJogo: 15,    // k
  erroPermitido: 0,      // Não aplicável a núcleo fixo
  garantiaMinima: 14,    // g
  remocoesPorJogo: 6,    // r = v - k
  totalJogos: 7,         // b
};

/**
 * FC04 — Fechamento 21 Dezenas (14 Fixas + 7 Variáveis)
 * 
 * Estratégia de núcleo fixo que garante 14+ pontos
 * quando o usuário acerta pelo menos 13 das 14 fixas
 * E pelo menos 2 das 7 variáveis.
 * 
 * IMPORTANTE: As dezenas devem ser passadas em ordem específica!
 * Primeiras 14 posições: Fixas
 * Últimas 7 posições: Variáveis
 * A ordem é crítica para a aplicação correta da matriz de remoções.
 */
export const FC04: MatrizFechamento = {
  id: "21-14-7",
  nome: "FC04",
  descricao: "21 dezenas (14 fixas + 7 variáveis), 7 jogos, garantia 14 pontos",
  dezenas: FC04_COVERING.totalDezenas,
  garantia: FC04_COVERING.garantiaMinima,
  dezenasPorJogo: FC04_COVERING.dezenasPorJogo,
  condicao: `Acertar 13+ das 14 fixas E 2+ das 7 variáveis`,
  fixasObrigatorias: 14,
  categoria: "avancado",
  ativo: true,
  covering: FC04_COVERING,
  matrizRemocoes: [
    // ═══════════════════════════════════════════════════════════════════
    // ROTAÇÃO SIMPLES: 14 FIXAS + 1 VARIÁVEL POR JOGO
    // ═══════════════════════════════════════════════════════════════════
    // Cada jogo contém as 14 fixas (índices 0-13) + 1 variável (índices 14-20)
    // Remoções: 6 variáveis que NÃO aparecem no jogo atual
    // 
    // Construção: Para cada jogo i (0..6), remover todos os índices
    // de variáveis EXCETO o índice (14+i).
    // 
    // Garantia: Se acertar 13 fixas + 2 variáveis, em pior caso um jogo tem:
    //   13 fixas acertadas + 1 variável acertada = 14 pontos ✓
    // ═══════════════════════════════════════════════════════════════════
    
    // Jogo 1: Fixas + Variável[0] → remove Variáveis[1,2,3,4,5,6]
    [15, 16, 17, 18, 19, 20],
    
    // Jogo 2: Fixas + Variável[1] → remove Variáveis[0,2,3,4,5,6]
    [14, 16, 17, 18, 19, 20],
    
    // Jogo 3: Fixas + Variável[2] → remove Variáveis[0,1,3,4,5,6]
    [14, 15, 17, 18, 19, 20],
    
    // Jogo 4: Fixas + Variável[3] → remove Variáveis[0,1,2,4,5,6]
    [14, 15, 16, 18, 19, 20],
    
    // Jogo 5: Fixas + Variável[4] → remove Variáveis[0,1,2,3,5,6]
    [14, 15, 16, 17, 19, 20],
    
    // Jogo 6: Fixas + Variável[5] → remove Variáveis[0,1,2,3,4,6]
    [14, 15, 16, 17, 18, 20],
    
    // Jogo 7: Fixas + Variável[6] → remove Variáveis[0,1,2,3,4,5]
    [14, 15, 16, 17, 18, 19],
  ],
};

/**
 * Valida a estrutura da matriz FC04
 */
export function validarFC04(): { valido: boolean; erros: string[] } {
  const erros: string[] = [];
  const matriz = FC04.matrizRemocoes;
  
  // Verifica quantidade de jogos
  if (matriz.length !== 7) {
    erros.push(`Esperado 7 jogos, encontrado ${matriz.length}`);
  }
  
  // Verifica cada jogo
  const contagemVariaveis: number[] = new Array(7).fill(0);
  
  matriz.forEach((remocoes, jogoIdx) => {
    // Verifica quantidade de remoções
    if (remocoes.length !== 6) {
      erros.push(`Jogo ${jogoIdx + 1}: esperado 6 remoções, encontrado ${remocoes.length}`);
    }
    
    // Verifica índices válidos (14-20 para variáveis)
    remocoes.forEach((idx) => {
      if (idx < 14 || idx > 20) {
        erros.push(`Jogo ${jogoIdx + 1}: índice ${idx} deve estar em [14, 20]`);
      } else {
        contagemVariaveis[idx - 14]++;
      }
    });
    
    // Verifica duplicatas internas
    const unique = new Set(remocoes);
    if (unique.size !== remocoes.length) {
      erros.push(`Jogo ${jogoIdx + 1}: índices duplicados ${JSON.stringify(remocoes)}`);
    }
  });
  
  // Verifica distribuição balanceada (cada variável deve ser removida 6 vezes)
  contagemVariaveis.forEach((count, idx) => {
    if (count !== 6) {
      erros.push(`Variável[${idx}] (índice ${14 + idx}) é removida ${count} vezes (esperado: 6)`);
    }
  });
  
  return {
    valido: erros.length === 0,
    erros,
  };
}
