/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * FC07 — SISTEMA DE NÚCLEO FIXO ABSOLUTO COM ROTAÇÃO SIMPLES
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Definição Matemática:
 * ─────────────────────
 * Tipo: Fechamento com núcleo fixo absoluto (Fixed Core - Maximum Guarantee)
 * Notação: 25 dezenas (14 fixas + 11 variáveis) → 11 jogos de 15 dezenas
 * 
 * Parâmetros Fundamentais:
 * ────────────────────────
 *   v = 25  (total de dezenas selecionadas pelo usuário)
 *   f = 14  (dezenas fixas obrigatórias)
 *   r = 11  (dezenas variáveis)
 *   k = 15  (dezenas por jogo gerado = f + 1)
 *   t = 15  (garantia máxima de acertos)
 *   b = 11  (quantidade total de jogos)
 * 
 * Condição de Funcionamento:
 * ──────────────────────────
 *   |Resultado ∩ Fixas| = 14
 *   |Resultado ∩ Variáveis| ≥ 1
 *   
 *   Traduzindo: O usuário DEVE acertar TODAS as 14 fixas
 *   E pelo menos 1 das 11 variáveis (a 15ª dezena do sorteio).
 * 
 * Garantia Matemática (PERFEITA):
 * ───────────────────────────────
 *   Se ambas as condições forem satisfeitas:
 *   ∃ jogo ∈ {jogos} : |jogo ∩ Resultado| = 15
 *   
 *   Existe EXATAMENTE um jogo com 15 acertos (pontuação máxima).
 *   
 *   Prova: Se acertar as 14 fixas + qualquer 1 variável:
 *   - Há um jogo específico que contém essa 1 variável → 15 pontos
 *   - Todos os outros jogos têm 14 acertos
 *   Garantia matemática 100% perfeita ✓
 * 
 * Estrutura da Matriz:
 * ────────────────────
 * A matriz utiliza rotação simples: cada jogo contém as 14 fixas
 * mais exatamente 1 variável distinta.
 * 
 *   Ordem das dezenas (CRÍTICA):
 *   Posições 0-13: Fixas obrigatórias
 *   Posições 14-24: Variáveis (1 por jogo)
 * 
 *   Jogos:
 *   Jogo 1: Fixas + Variável[0]
 *   Jogo 2: Fixas + Variável[1]
 *   ...
 *   Jogo 11: Fixas + Variável[10]
 * 
 * Propriedades:
 * ─────────────
 *   - Cada jogo remove exatamente 10 variáveis (25 - 15 = 10)
 *   - Cada jogo mantém as 14 fixas + 1 variável
 *   - Cobertura: todas as 11 variáveis são cobertas individualmente
 *   - Garantia: 100% para condição atendida (15 pontos garantidos)
 *   - Simplicidade extrema: produto premium e direto ao ponto
 * 
 * Comercial:
 * ──────────
 *   - Fácil de explicar ("acerte as 14, qualquer uma das 11 variáveis faz 15")
 *   - Custo baixo (apenas 11 jogos)
 *   - Garantia máxima (15 pontos)
 *   - Alto índice de conversão
 *   - Produto "marquinho" premium
 * 
 * Fonte: Design de núcleo fixo clássico - Gold Standard em loterias
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import type { MatrizFechamento, ParametrosCoveringDesign } from "@/types/fechamento";

/**
 * Parâmetros do Núcleo Fixo Absoluto FC07
 */
const FC07_COVERING: ParametrosCoveringDesign = {
  totalDezenas: 25,      // v
  dezenasPorJogo: 15,    // k
  erroPermitido: 0,      // Não aplicável a núcleo fixo
  garantiaMinima: 15,    // g (máxima)
  remocoesPorJogo: 10,   // r = v - k
  totalJogos: 11,        // b
};

/**
 * FC07 — Fechamento 25 Dezenas (14 Fixas + 11 Variáveis)
 * 
 * Estratégia de núcleo fixo absoluto que garante 15 pontos (máximo)
 * quando o usuário acerta TODAS as 14 fixas
 * E pelo menos 1 das 11 variáveis.
 * 
 * IMPORTANTE: As dezenas devem ser passadas em ordem específica!
 * Primeiras 14 posições: Fixas
 * Últimas 11 posições: Variáveis
 * A ordem é crítica para a aplicação correta da matriz de remoções.
 */
export const FC07: MatrizFechamento = {
  id: "25-15-11",
  nome: "FC07",
  descricao: "25 dezenas (14 fixas + 11 variáveis), 11 jogos, garantia 15 pontos",
  dezenas: FC07_COVERING.totalDezenas,
  garantia: FC07_COVERING.garantiaMinima,
  dezenasPorJogo: FC07_COVERING.dezenasPorJogo,
  condicao: `Acertar todas as 14 fixas E 1+ das 11 variáveis`,
  fixasObrigatorias: 14,
  categoria: "avancado",
  ativo: true,
  covering: FC07_COVERING,
  matrizRemocoes: [
    // ═══════════════════════════════════════════════════════════════════
    // ROTAÇÃO SIMPLES: 14 FIXAS + 1 VARIÁVEL POR JOGO
    // ═══════════════════════════════════════════════════════════════════
    // Cada jogo contém as 14 fixas (índices 0-13) + 1 variável (índices 14-24)
    // Remoções: 10 variáveis que NÃO aparecem no jogo atual
    // 
    // Construção: Para cada jogo i (0..10), remover todos os índices
    // de variáveis EXCETO o índice (14+i).
    // 
    // Garantia Perfeita: Se acertar 14 fixas + qualquer 1 variável:
    //   Há um jogo que contém essa variável → 15 pontos garantidos ✓
    // ═══════════════════════════════════════════════════════════════════
    
    // Jogo 1: Fixas + Variável[0] → remove Variáveis[1-10]
    [15, 16, 17, 18, 19, 20, 21, 22, 23, 24],
    
    // Jogo 2: Fixas + Variável[1] → remove Variáveis[0,2-10]
    [14, 16, 17, 18, 19, 20, 21, 22, 23, 24],
    
    // Jogo 3: Fixas + Variável[2] → remove Variáveis[0-1,3-10]
    [14, 15, 17, 18, 19, 20, 21, 22, 23, 24],
    
    // Jogo 4: Fixas + Variável[3] → remove Variáveis[0-2,4-10]
    [14, 15, 16, 18, 19, 20, 21, 22, 23, 24],
    
    // Jogo 5: Fixas + Variável[4] → remove Variáveis[0-3,5-10]
    [14, 15, 16, 17, 19, 20, 21, 22, 23, 24],
    
    // Jogo 6: Fixas + Variável[5] → remove Variáveis[0-4,6-10]
    [14, 15, 16, 17, 18, 20, 21, 22, 23, 24],
    
    // Jogo 7: Fixas + Variável[6] → remove Variáveis[0-5,7-10]
    [14, 15, 16, 17, 18, 19, 21, 22, 23, 24],
    
    // Jogo 8: Fixas + Variável[7] → remove Variáveis[0-6,8-10]
    [14, 15, 16, 17, 18, 19, 20, 22, 23, 24],
    
    // Jogo 9: Fixas + Variável[8] → remove Variáveis[0-7,9-10]
    [14, 15, 16, 17, 18, 19, 20, 21, 23, 24],
    
    // Jogo 10: Fixas + Variável[9] → remove Variáveis[0-8,10]
    [14, 15, 16, 17, 18, 19, 20, 21, 22, 24],
    
    // Jogo 11: Fixas + Variável[10] → remove Variáveis[0-9]
    [14, 15, 16, 17, 18, 19, 20, 21, 22, 23],
  ],
};

/**
 * Valida a estrutura da matriz FC07
 */
export function validarFC07(): { valido: boolean; erros: string[] } {
  const erros: string[] = [];
  const matriz = FC07.matrizRemocoes;
  
  // Verifica quantidade de jogos
  if (matriz.length !== 11) {
    erros.push(`Esperado 11 jogos, encontrado ${matriz.length}`);
  }
  
  // Verifica cada jogo
  const contagemVariaveis: number[] = new Array(11).fill(0);
  
  matriz.forEach((remocoes, jogoIdx) => {
    // Verifica quantidade de remoções
    if (remocoes.length !== 10) {
      erros.push(`Jogo ${jogoIdx + 1}: esperado 10 remoções, encontrado ${remocoes.length}`);
    }
    
    // Verifica índices válidos (14-24 para variáveis)
    remocoes.forEach((idx) => {
      if (idx < 14 || idx > 24) {
        erros.push(`Jogo ${jogoIdx + 1}: índice ${idx} deve estar em [14, 24]`);
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
  
  // Verifica distribuição balanceada (cada variável deve ser removida 10 vezes)
  contagemVariaveis.forEach((count, idx) => {
    if (count !== 10) {
      erros.push(`Variável[${idx}] (índice ${14 + idx}) é removida ${count} vezes (esperado: 10)`);
    }
  });
  
  return {
    valido: erros.length === 0,
    erros,
  };
}
