/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * FC06 — SISTEMA DE COBERTURA C(18, 15, 14) REDUZIDO
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Definição Matemática:
 * ─────────────────────
 * Tipo: Covering Design reduzido para Lotofácil
 * Notação: C(18, 15, 14) com tolerância e = 3 erros
 * 
 * Parâmetros Fundamentais:
 * ────────────────────────
 *   v = 18  (total de dezenas selecionadas pelo usuário)
 *   k = 15  (dezenas por jogo gerado)
 *   e = 3   (erro permitido)
 *   g = 14  (garantia mínima de acertos)
 *   r = 3   (remoções por jogo = v - k)
 *   b = 24  (quantidade total de jogos)
 * 
 * Condição de Funcionamento:
 * ──────────────────────────
 *   |Resultado ∩ Selecionadas| ≥ v - e
 *   |Resultado ∩ Selecionadas| ≥ 15
 *   
 *   Traduzindo: O usuário deve acertar pelo menos 15 das 18 dezenas escolhidas.
 *   Ou seja: pode "errar" no máximo 3 dezenas.
 * 
 * Garantia Matemática:
 * ────────────────────
 *   Se a condição for satisfeita:
 *   ∃ jogo ∈ {jogos} : |jogo ∩ Resultado| ≥ 14
 *   
 *   Existe pelo menos um jogo com 14+ acertos.
 * 
 * Estrutura da Matriz:
 * ────────────────────
 * A matriz utiliza um design baseado em grid 6×3 com 4 blocos ortogonais:
 * 
 *   Grid visual (índices 0-17):
 *   ┌────┬────┬────┬────┬────┬────┐
 *   │  0 │  1 │  2 │  3 │  4 │  5 │
 *   ├────┼────┼────┼────┼────┼────┤
 *   │  6 │  7 │  8 │  9 │ 10 │ 11 │
 *   ├────┼────┼────┼────┼────┼────┤
 *   │ 12 │ 13 │ 14 │ 15 │ 16 │ 17 │
 *   └────┴────┴────┴────┴────┴────┘
 * 
 *   Bloco 1 (6 jogos): Trios consecutivos horizontais
 *   Bloco 2 (6 jogos): Trios verticais (colunas)
 *   Bloco 3 (6 jogos): Diagonais do grid
 *   Bloco 4 (6 jogos): Anti-diagonais do grid
 * 
 * Propriedades:
 * ─────────────
 *   - Cada índice é removido exatamente 4 vezes (24×3/18 = 4) ✓
 *   - Distribuição balanceada de remoções
 *   - Design ortogonal baseado em grid
 * 
 * Fonte: Design combinatório clássico em grid 6×3
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import type { MatrizFechamento, ParametrosCoveringDesign } from "@/types/fechamento";

/**
 * Parâmetros do Covering Design C(18, 15, 14)
 */
const FC06_COVERING: ParametrosCoveringDesign = {
  totalDezenas: 18,      // v
  dezenasPorJogo: 15,    // k
  erroPermitido: 3,      // e
  garantiaMinima: 14,    // g
  remocoesPorJogo: 3,    // r = v - k
  totalJogos: 24,        // b
};

/**
 * FC06 — Fechamento 18 Dezenas
 * 
 * Estratégia de cobertura matemática que garante 14+ pontos
 * quando o usuário acerta pelo menos 15 de 18 dezenas selecionadas.
 * 
 * IMPORTANTE: As dezenas devem ser passadas em ordem crescente!
 * A ordem é crítica para a aplicação correta da matriz de remoções.
 */
export const FC06: MatrizFechamento = {
  id: "18-14-24",
  nome: "FC06",
  descricao: "18 dezenas, 24 jogos, garantia 14 pontos",
  dezenas: FC06_COVERING.totalDezenas,
  garantia: FC06_COVERING.garantiaMinima,
  dezenasPorJogo: FC06_COVERING.dezenasPorJogo,
  condicao: `Acertar ${FC06_COVERING.totalDezenas - FC06_COVERING.erroPermitido}+ de ${FC06_COVERING.totalDezenas} dezenas`,
  fixasObrigatorias: 0,
  categoria: "intermediario",
  ativo: true,
  covering: FC06_COVERING,
  matrizRemocoes: [
    // ═══════════════════════════════════════════════════════════════════
    // MATRIZ DE COBERTURA C(18, 15, 14) — 100% DE GARANTIA
    // ═══════════════════════════════════════════════════════════════════
    // Validado matematicamente: todas as C(18,3) = 816 combinações de erros
    // resultam em pelo menos 14 acertos em algum dos 24 jogos.
    // 
    // Construção: Design ortogonal baseado em grid 6×3 com 4 blocos.
    // Cada índice é removido exatamente 4 vezes (24×3/18 = 4) ✓
    // ═══════════════════════════════════════════════════════════════════
    
    // Bloco 1: Trios consecutivos
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [9, 10, 11],
    [12, 13, 14],
    [15, 16, 17],
    
    // Bloco 2: Trios com salto 3 (grid 6×3 metade superior/inferior)
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [9, 12, 15],
    [10, 13, 16],
    [11, 14, 17],
    
    // Bloco 3: Diagonais do grid (wrap-around)
    [0, 4, 8],
    [1, 5, 6],
    [2, 3, 7],
    [9, 13, 17],
    [10, 14, 15],
    [11, 12, 16],
    
    // Bloco 4: Anti-diagonais do grid
    [0, 5, 7],
    [1, 3, 8],
    [2, 4, 6],
    [9, 14, 16],
    [10, 12, 17],
    [11, 13, 15],
  ],
};

/**
 * Valida a estrutura da matriz FC06
 */
export function validarFC06(): { valido: boolean; erros: string[] } {
  const erros: string[] = [];
  const matriz = FC06.matrizRemocoes;
  
  // Verifica quantidade de jogos
  if (matriz.length !== 24) {
    erros.push(`Esperado 24 jogos, encontrado ${matriz.length}`);
  }
  
  // Verifica cada jogo
  const contagemIndices: number[] = new Array(18).fill(0);
  
  matriz.forEach((remocoes, jogoIdx) => {
    // Verifica quantidade de remoções
    if (remocoes.length !== 3) {
      erros.push(`Jogo ${jogoIdx + 1}: esperado 3 remoções, encontrado ${remocoes.length}`);
    }
    
    // Verifica índices válidos
    remocoes.forEach((idx) => {
      if (idx < 0 || idx >= 18) {
        erros.push(`Jogo ${jogoIdx + 1}: índice ${idx} fora do intervalo [0, 17]`);
      } else {
        contagemIndices[idx]++;
      }
    });
    
    // Verifica duplicatas internas
    const unique = new Set(remocoes);
    if (unique.size !== remocoes.length) {
      erros.push(`Jogo ${jogoIdx + 1}: índices duplicados ${JSON.stringify(remocoes)}`);
    }
  });
  
  // Verifica distribuição balanceada (cada índice deve aparecer 4 vezes)
  contagemIndices.forEach((count, idx) => {
    if (count !== 4) {
      erros.push(`Índice ${idx} aparece ${count} vezes (esperado: 4)`);
    }
  });
  
  return {
    valido: erros.length === 0,
    erros,
  };
}
