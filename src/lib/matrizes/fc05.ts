/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * FC05 — SISTEMA DE COBERTURA "ERRE 5"
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * DEFINIÇÃO MATEMÁTICA:
 * ---------------------
 * Tipo: Covering Design adaptado para Lotofácil
 * Notação: C(20, 15, 14) com tolerância e = 5
 * 
 * PARÂMETROS:
 * -----------
 *   v = 20  (total de dezenas selecionadas)
 *   k = 15  (dezenas por jogo)
 *   e = 5   (erro permitido)
 *   g = 14  (garantia mínima de acertos)
 *   r = 5   (remoções por jogo = v - k)
 *   b = 350 (quantidade de jogos)
 * 
 * CONDIÇÃO DE FUNCIONAMENTO:
 * --------------------------
 *   |Resultado ∩ Selecionadas| ≥ v - e
 *   
 *   Traduzindo: O usuário deve acertar pelo menos 15 das 20 dezenas escolhidas.
 *   Ou seja: pode "errar" no máximo 5 dezenas (daí o nome "ERRE 5").
 * 
 * GARANTIA MATEMÁTICA:
 * --------------------
 *   Se a condição for satisfeita:
 *   ∃ jogo ∈ Matriz : |jogo ∩ Resultado| ≥ 14
 *   
 *   Existe pelo menos um jogo com 14+ acertos.
 * 
 * ALGORITMO DE GERAÇÃO:
 * ---------------------
 *   1. Usuário seleciona 20 dezenas ordenadas: D = [d₁, d₂, ..., d₂₀]
 *   2. Para cada linha i da matrizRemocoes:
 *      - Remove as dezenas nos índices especificados
 *      - Gera jogo com as 15 dezenas restantes
 *   3. Resultado: 350 jogos de 15 dezenas cada
 * 
 * ESTRUTURA DA MATRIZ:
 * --------------------
 *   Cada array em matrizRemocoes contém 5 índices (0-19) que representam
 *   as posições das dezenas a REMOVER do conjunto de 20 para formar o jogo.
 *   
 *   Exemplo: [15, 16, 17, 18, 19] → Remove D16, D17, D18, D19, D20
 *            Jogo resultante: D1 a D15
 * 
 * FONTE: Matriz otimizada de 350 jogos (Lotodicas)
 * VALIDAÇÃO: Taxa de sucesso ~36% em cenário otimista (simulação)
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import type { MatrizFechamento, ParametrosCoveringDesign } from "@/types/fechamento";

/**
 * Parâmetros do Covering Design FC05
 */
const FC05_COVERING: ParametrosCoveringDesign = {
  totalDezenas: 20,      // v
  dezenasPorJogo: 15,    // k
  erroPermitido: 5,      // e
  garantiaMinima: 14,    // g
  remocoesPorJogo: 5,    // r = v - k
  totalJogos: 350,       // b
};

/**
 * FC05 — Fechamento ERRE 5
 * 20 Dezenas | 350 Jogos | Garantia 14 pontos
 */
export const FC05: MatrizFechamento = {
  id: "20-14-350",
  nome: "FC05",
  descricao: "ERRE 5 — Fechamento de cobertura com 20 dezenas e 350 jogos",
  dezenas: FC05_COVERING.totalDezenas,
  garantia: FC05_COVERING.garantiaMinima,
  dezenasPorJogo: FC05_COVERING.dezenasPorJogo,
  condicao: `Acertar ${FC05_COVERING.totalDezenas - FC05_COVERING.erroPermitido}+ de ${FC05_COVERING.totalDezenas} dezenas`,
  fixasObrigatorias: 0,
  categoria: "avancado",
  ativo: true,
  covering: FC05_COVERING,
  matrizRemocoes: [
    // Jogo 1: D1 D2 D3 D4 D5 D6 D7 D8 D9 D10 D11 D12 D13 D14 D15 → remove D16 D17 D18 D19 D20
    [15, 16, 17, 18, 19],
    // Jogo 2: D1 D2 D3 D4 D5 D6 D7 D8 D9 D10 D11 D12 D15 D16 D17 → remove D13 D14 D18 D19 D20
    [12, 13, 17, 18, 19],
    // Jogo 3: D1 D2 D3 D4 D5 D6 D7 D8 D9 D10 D12 D13 D15 D18 D19 → remove D11 D14 D16 D17 D20
    [10, 13, 15, 16, 19],
    // Jogo 4: D1 D2 D3 D4 D5 D6 D7 D8 D9 D10 D12 D14 D15 D16 D20 → remove D11 D13 D17 D18 D19
    [10, 12, 16, 17, 18],
    // Jogo 5: D1 D2 D3 D4 D5 D6 D7 D8 D9 D10 D12 D15 D17 D19 D20 → remove D11 D13 D14 D16 D18
    [10, 12, 13, 15, 17],
    // Jogo 6: D1 D2 D3 D4 D5 D6 D7 D8 D9 D10 D13 D14 D16 D17 D18 → remove D11 D12 D15 D19 D20
    [10, 11, 14, 18, 19],
    // Jogo 7: D1 D2 D3 D4 D5 D6 D7 D8 D9 D10 D13 D14 D18 D19 D20 → remove D11 D12 D15 D16 D17
    [10, 11, 14, 15, 16],
    // Jogo 8: D1 D2 D3 D4 D5 D6 D7 D8 D9 D11 D12 D13 D14 D16 D19 → remove D10 D15 D17 D18 D20
    [9, 14, 16, 17, 19],
    // Jogo 9: D1 D2 D3 D4 D5 D6 D7 D8 D9 D11 D12 D13 D14 D17 D20 → remove D10 D15 D16 D18 D19
    [9, 14, 15, 17, 18],
    // Jogo 10: D1 D2 D3 D4 D5 D6 D7 D8 D9 D11 D12 D13 D16 D17 D18 → remove D10 D14 D15 D19 D20
    [9, 13, 14, 18, 19],
    // Jogo 11: D1 D2 D3 D4 D5 D6 D7 D8 D9 D13 D15 D17 D18 D19 D20 → remove D10 D11 D12 D14 D16
    [9, 10, 11, 13, 15],
    // Jogo 12: D1 D2 D3 D4 D5 D6 D7 D8 D10 D11 D12 D13 D15 D16 D19 → remove D9 D14 D17 D18 D20
    [8, 13, 16, 17, 19],
    // Jogo 13: D1 D2 D3 D4 D5 D6 D7 D8 D10 D11 D12 D13 D15 D17 D20 → remove D9 D14 D16 D18 D19
    [8, 13, 15, 17, 18],
    // Jogo 14: D1 D2 D3 D4 D5 D6 D7 D8 D10 D11 D12 D14 D15 D19 D20 → remove D9 D13 D16 D17 D18
    [8, 12, 15, 16, 17],
    // Jogo 15: D1 D2 D3 D4 D5 D6 D7 D8 D10 D12 D13 D14 D15 D17 D18 → remove D9 D11 D16 D19 D20
    [8, 10, 15, 18, 19],
    // Jogo 16: D1 D2 D3 D4 D5 D6 D7 D8 D10 D12 D13 D15 D16 D18 D20 → remove D9 D11 D14 D17 D19
    [8, 10, 13, 16, 18],
    // Jogo 17: D1 D2 D3 D4 D5 D6 D7 D8 D10 D12 D14 D15 D16 D17 D19 → remove D9 D11 D13 D18 D20
    [8, 10, 12, 17, 19],
    // Jogo 18: D1 D2 D3 D4 D5 D6 D7 D8 D10 D13 D14 D15 D17 D18 D19 → remove D9 D11 D12 D16 D20
    [8, 10, 11, 15, 19],
    // Jogo 19: D1 D2 D3 D4 D5 D6 D7 D8 D11 D12 D13 D14 D18 D19 D20 → remove D9 D10 D15 D16 D17
    [8, 9, 14, 15, 16],
    // Jogo 20: D1 D2 D3 D4 D5 D6 D7 D8 D11 D12 D13 D16 D17 D19 D20 → remove D9 D10 D14 D15 D18
    [8, 9, 13, 14, 17],
    // Jogo 21: D1 D2 D3 D4 D5 D6 D7 D8 D12 D13 D14 D16 D17 D18 D19 → remove D9 D10 D11 D15 D20
    [8, 9, 10, 14, 19],
    // Jogo 22: D1 D2 D3 D4 D5 D6 D7 D9 D10 D11 D12 D13 D17 D19 D20 → remove D8 D14 D15 D16 D18
    [7, 13, 14, 15, 17],
    // Jogo 23: D1 D2 D3 D4 D5 D6 D7 D9 D10 D11 D13 D15 D16 D17 D20 → remove D8 D12 D14 D18 D19
    [7, 11, 13, 17, 18],
    // Jogo 24: D1 D2 D3 D4 D5 D6 D7 D9 D10 D11 D14 D16 D17 D19 D20 → remove D8 D12 D13 D15 D18
    [7, 11, 12, 14, 17],
    // Jogo 25: D1 D2 D3 D4 D5 D6 D7 D9 D10 D12 D14 D16 D18 D19 D20 → remove D8 D11 D13 D15 D17
    [7, 10, 12, 14, 16],
    // Jogo 26: D1 D2 D3 D4 D5 D6 D7 D9 D10 D14 D15 D16 D17 D18 D19 → remove D8 D11 D12 D13 D20
    [7, 10, 11, 12, 19],
    // Jogo 27: D1 D2 D3 D4 D5 D6 D7 D9 D11 D12 D15 D16 D17 D18 D20 → remove D8 D10 D13 D14 D19
    [7, 9, 12, 13, 18],
    // Jogo 28: D1 D2 D3 D4 D5 D6 D7 D9 D12 D13 D14 D15 D16 D19 D20 → remove D8 D10 D11 D17 D18
    [7, 9, 10, 16, 17],
    // Jogo 29: D1 D2 D3 D4 D5 D6 D7 D10 D11 D12 D13 D14 D16 D17 D20 → remove D8 D9 D15 D18 D19
    [7, 8, 14, 17, 18],
    // Jogo 30: D1 D2 D3 D4 D5 D6 D7 D10 D11 D13 D14 D15 D17 D19 D20 → remove D8 D9 D12 D16 D18
    [7, 8, 11, 15, 17],
    // Jogo 31: D1 D2 D3 D4 D5 D6 D7 D11 D12 D14 D15 D17 D18 D19 D20 → remove D8 D9 D10 D13 D16
    [7, 8, 9, 12, 15],
    // Jogo 32: D1 D2 D3 D4 D5 D6 D8 D9 D10 D11 D12 D13 D15 D18 D20 → remove D7 D14 D16 D17 D19
    [6, 13, 15, 16, 18],
    // Jogo 33: D1 D2 D3 D4 D5 D6 D8 D9 D10 D11 D12 D14 D15 D17 D19 → remove D7 D13 D16 D18 D20
    [6, 12, 15, 17, 19],
    // Jogo 34: D1 D2 D3 D4 D5 D6 D8 D9 D10 D11 D12 D15 D16 D19 D20 → remove D7 D13 D14 D17 D18
    [6, 12, 13, 16, 17],
    // Jogo 35: D1 D2 D3 D4 D5 D6 D8 D9 D10 D11 D13 D14 D16 D18 D20 → remove D7 D12 D15 D17 D19
    [6, 11, 14, 16, 18],
    // Jogo 36: D1 D2 D3 D4 D5 D6 D8 D9 D10 D11 D13 D14 D17 D18 D19 → remove D7 D12 D15 D16 D20
    [6, 11, 14, 15, 19],
    // Jogo 37: D1 D2 D3 D4 D5 D6 D8 D9 D10 D12 D13 D14 D15 D16 D19 → remove D7 D11 D17 D18 D20
    [6, 10, 16, 17, 19],
    // Jogo 38: D1 D2 D3 D4 D5 D6 D8 D9 D10 D12 D13 D14 D15 D17 D20 → remove D7 D11 D16 D18 D19
    [6, 10, 15, 17, 18],
    // Jogo 39: D1 D2 D3 D4 D5 D6 D8 D9 D10 D12 D13 D15 D16 D17 D18 → remove D7 D11 D14 D19 D20
    [6, 10, 13, 18, 19],
    // Jogo 40: D1 D2 D3 D4 D5 D6 D8 D9 D11 D12 D13 D16 D18 D19 D20 → remove D7 D10 D14 D15 D17
    [6, 9, 13, 14, 16],
    // Jogo 41: D1 D2 D3 D4 D5 D6 D8 D9 D11 D13 D15 D16 D18 D19 D20 → remove D7 D10 D12 D14 D17
    [6, 9, 11, 13, 16],
    // Jogo 42: D1 D2 D3 D4 D5 D6 D8 D9 D12 D13 D14 D16 D17 D19 D20 → remove D7 D10 D11 D15 D18
    [6, 9, 10, 14, 17],
    // Jogo 43: D1 D2 D3 D4 D5 D6 D8 D10 D11 D12 D13 D14 D15 D16 D18 → remove D7 D9 D17 D19 D20
    [6, 8, 16, 18, 19],
    // Jogo 44: D1 D2 D3 D4 D5 D6 D8 D10 D11 D12 D13 D15 D17 D18 D19 → remove D7 D9 D14 D16 D20
    [6, 8, 13, 15, 19],
    // Jogo 45: D1 D2 D3 D4 D5 D6 D8 D10 D11 D12 D14 D15 D16 D17 D20 → remove D7 D9 D13 D18 D19
    [6, 8, 12, 17, 18],
    // Jogo 46: D1 D2 D3 D4 D5 D6 D8 D10 D12 D13 D14 D15 D18 D19 D20 → remove D7 D9 D11 D16 D17
    [6, 8, 10, 15, 16],
    // Jogo 47: D1 D2 D3 D4 D5 D6 D8 D10 D12 D13 D15 D16 D17 D19 D20 → remove D7 D9 D11 D14 D18
    [6, 8, 10, 13, 17],
    // Jogo 48: D1 D2 D3 D4 D5 D6 D8 D11 D13 D14 D15 D16 D17 D18 D20 → remove D7 D9 D10 D12 D19
    [6, 8, 9, 11, 18],
    // Jogo 49: D1 D2 D3 D4 D5 D6 D9 D10 D11 D12 D14 D16 D17 D18 D19 → remove D7 D8 D13 D15 D20
    [6, 7, 12, 14, 19],
    // Jogo 50: D1 D2 D3 D4 D5 D6 D9 D10 D11 D14 D15 D16 D18 D19 D20 → remove D7 D8 D12 D13 D17
    [6, 7, 11, 12, 16],
    // Jogo 51: D1 D2 D3 D4 D5 D6 D9 D11 D12 D13 D14 D15 D16 D17 D19 → remove D7 D8 D10 D18 D20
    [6, 7, 9, 17, 19],
    // Jogo 52: D1 D2 D3 D4 D5 D7 D8 D9 D10 D11 D13 D14 D15 D16 D19 → remove D6 D12 D17 D18 D20
    [5, 11, 16, 17, 19],
    // Jogo 53: D1 D2 D3 D4 D5 D7 D8 D9 D10 D11 D13 D14 D15 D17 D20 → remove D6 D12 D16 D18 D19
    [5, 11, 15, 17, 18],
    // Jogo 54: D1 D2 D3 D4 D5 D7 D8 D9 D10 D11 D13 D14 D16 D18 D19 → remove D6 D12 D15 D17 D20
    [5, 11, 14, 16, 19],
    // Jogo 55: D1 D2 D3 D4 D5 D7 D8 D9 D10 D11 D13 D14 D17 D18 D20 → remove D6 D12 D15 D16 D19
    [5, 11, 14, 15, 18],
    // Jogo 56: D1 D2 D3 D4 D5 D7 D8 D9 D10 D11 D13 D15 D16 D17 D18 → remove D6 D12 D14 D19 D20
    [5, 11, 13, 18, 19],
    // Jogo 57: D1 D2 D3 D4 D5 D7 D8 D9 D10 D12 D13 D17 D18 D19 D20 → remove D6 D11 D14 D15 D16
    [5, 10, 13, 14, 15],
    // Jogo 58: D1 D2 D3 D4 D5 D7 D8 D9 D11 D13 D14 D15 D16 D18 D19 → remove D6 D10 D12 D17 D20
    [5, 9, 11, 16, 19],
    // Jogo 59: D1 D2 D3 D4 D5 D7 D8 D9 D11 D13 D14 D15 D17 D18 D20 → remove D6 D10 D12 D16 D19
    [5, 9, 11, 15, 18],
    // Jogo 60: D1 D2 D3 D4 D5 D7 D8 D9 D11 D14 D15 D16 D17 D19 D20 → remove D6 D10 D12 D13 D18
    [5, 9, 11, 12, 17],
    // Jogo 61: D1 D2 D3 D4 D5 D7 D8 D9 D12 D13 D14 D15 D16 D18 D20 → remove D6 D10 D11 D17 D19
    [5, 9, 10, 16, 18],
    // Jogo 62: D1 D2 D3 D4 D5 D7 D8 D10 D11 D13 D14 D15 D18 D19 D20 → remove D6 D9 D12 D16 D17
    [5, 8, 11, 15, 16],
    // Jogo 63: D1 D2 D3 D4 D5 D7 D8 D10 D11 D13 D15 D16 D17 D19 D20 → remove D6 D9 D12 D14 D18
    [5, 8, 11, 13, 17],
    // Jogo 64: D1 D2 D3 D4 D5 D7 D8 D10 D11 D13 D16 D17 D18 D19 D20 → remove D6 D9 D12 D14 D15
    [5, 8, 11, 13, 14],
    // Jogo 65: D1 D2 D3 D4 D5 D7 D8 D10 D12 D13 D14 D17 D18 D19 D20 → remove D6 D9 D11 D15 D16
    [5, 8, 10, 14, 15],
    // Jogo 66: D1 D2 D3 D4 D5 D7 D8 D10 D13 D14 D15 D16 D18 D19 D20 → remove D6 D9 D11 D12 D17
    [5, 8, 10, 11, 16],
    // Jogo 67: D1 D2 D3 D4 D5 D7 D8 D11 D12 D13 D14 D15 D16 D18 D20 → remove D6 D9 D10 D17 D19
    [5, 8, 9, 16, 18],
    // Jogo 68: D1 D2 D3 D4 D5 D7 D8 D11 D13 D15 D16 D17 D18 D19 D20 → remove D6 D9 D10 D12 D14
    [5, 8, 9, 11, 13],
    // Jogo 69: D1 D2 D3 D4 D5 D7 D9 D10 D11 D12 D15 D17 D18 D19 D20 → remove D6 D8 D13 D14 D16
    [5, 7, 12, 13, 15],
    // Jogo 70: D1 D2 D3 D4 D5 D7 D9 D10 D12 D13 D14 D15 D16 D17 D19 → remove D6 D8 D11 D18 D20
    [5, 7, 10, 17, 19],
    // Jogo 71: D1 D2 D3 D4 D5 D7 D9 D11 D12 D14 D16 D17 D18 D19 D20 → remove D6 D8 D10 D13 D15
    [5, 7, 9, 12, 14],
    // Jogo 72: D1 D2 D3 D4 D5 D7 D10 D11 D12 D14 D15 D16 D17 D18 D20 → remove D6 D8 D9 D13 D19
    [5, 7, 8, 12, 18],
    // Jogo 73: D1 D2 D3 D4 D5 D8 D9 D10 D11 D12 D13 D15 D18 D19 D20 → remove D6 D7 D14 D16 D17
    [5, 6, 13, 15, 16],
    // Jogo 74: D1 D2 D3 D4 D5 D8 D9 D10 D11 D12 D13 D16 D17 D18 D20 → remove D6 D7 D14 D15 D19
    [5, 6, 13, 14, 18],
    // Jogo 75: D1 D2 D3 D4 D5 D8 D9 D10 D11 D13 D14 D15 D16 D17 D18 → remove D6 D7 D12 D19 D20
    [5, 6, 11, 18, 19],
    // Jogo 76: D1 D2 D3 D4 D5 D8 D9 D10 D12 D13 D15 D16 D17 D18 D19 → remove D6 D7 D11 D14 D20
    [5, 6, 10, 13, 19],
    // Jogo 77: D1 D2 D3 D4 D5 D8 D9 D10 D13 D14 D15 D16 D17 D19 D20 → remove D6 D7 D11 D12 D18
    [5, 6, 10, 11, 17],
    // Jogo 78: D1 D2 D3 D4 D5 D8 D9 D10 D13 D14 D16 D17 D18 D19 D20 → remove D6 D7 D11 D12 D15
    [5, 6, 10, 11, 14],
    // Jogo 79: D1 D2 D3 D4 D5 D8 D9 D11 D12 D13 D14 D15 D17 D18 D19 → remove D6 D7 D10 D16 D20
    [5, 6, 9, 15, 19],
    // Jogo 80: D1 D2 D3 D4 D5 D8 D9 D13 D14 D15 D16 D17 D18 D19 D20 → remove D6 D7 D10 D11 D12
    [5, 6, 9, 10, 11],
    // Jogo 81: D1 D2 D3 D4 D5 D8 D10 D11 D12 D13 D14 D16 D17 D18 D20 → remove D6 D7 D9 D15 D19
    [5, 6, 8, 14, 18],
    // Jogo 82: D1 D2 D3 D4 D5 D9 D10 D11 D12 D13 D14 D15 D16 D19 D20 → remove D6 D7 D8 D17 D18
    [5, 6, 7, 16, 17],
    // Jogo 83: D1 D2 D3 D4 D6 D7 D8 D9 D10 D11 D12 D13 D14 D16 D20 → remove D5 D15 D17 D18 D19
    [4, 14, 16, 17, 18],
    // Jogo 84: D1 D2 D3 D4 D6 D7 D8 D9 D10 D11 D12 D13 D14 D17 D19 → remove D5 D15 D16 D18 D20
    [4, 14, 15, 17, 19],
    // Jogo 85: D1 D2 D3 D4 D6 D7 D8 D9 D10 D11 D14 D15 D16 D18 D20 → remove D5 D12 D13 D17 D19
    [4, 11, 12, 16, 18],
    // Jogo 86: D1 D2 D3 D4 D6 D7 D8 D9 D10 D11 D14 D15 D17 D18 D19 → remove D5 D12 D13 D16 D20
    [4, 11, 12, 15, 19],
    // Jogo 87: D1 D2 D3 D4 D6 D7 D8 D9 D10 D12 D16 D17 D18 D19 D20 → remove D5 D11 D13 D14 D15
    [4, 10, 12, 13, 14],
    // Jogo 88: D1 D2 D3 D4 D6 D7 D8 D9 D11 D12 D13 D14 D15 D16 D17 → remove D5 D10 D18 D19 D20
    [4, 9, 17, 18, 19],
    // Jogo 89: D1 D2 D3 D4 D6 D7 D8 D9 D11 D12 D13 D14 D15 D19 D20 → remove D5 D10 D16 D17 D18
    [4, 9, 15, 16, 17],
    // Jogo 90: D1 D2 D3 D4 D6 D7 D8 D10 D13 D14 D15 D16 D17 D19 D20 → remove D5 D9 D11 D12 D18
    [4, 8, 10, 11, 17],
    // Jogo 91: D1 D2 D3 D4 D6 D7 D8 D12 D14 D15 D16 D17 D18 D19 D20 → remove D5 D9 D10 D11 D13
    [4, 8, 9, 10, 12],
    // Jogo 92: D1 D2 D3 D4 D6 D7 D9 D10 D11 D13 D15 D16 D18 D19 D20 → remove D5 D8 D12 D14 D17
    [4, 7, 11, 13, 16],
    // Jogo 93: D1 D2 D3 D4 D6 D7 D9 D10 D12 D13 D14 D16 D17 D18 D20 → remove D5 D8 D11 D15 D19
    [4, 7, 10, 14, 18],
    // Jogo 94: D1 D2 D3 D4 D6 D7 D9 D11 D12 D13 D15 D16 D17 D18 D19 → remove D5 D8 D10 D14 D20
    [4, 7, 9, 13, 19],
    // Jogo 95: D1 D2 D3 D4 D6 D7 D10 D11 D13 D14 D15 D16 D17 D18 D19 → remove D5 D8 D9 D12 D20
    [4, 7, 8, 11, 19],
    // Jogo 96: D1 D2 D3 D4 D6 D7 D11 D12 D13 D14 D15 D16 D18 D19 D20 → remove D5 D8 D9 D10 D17
    [4, 7, 8, 9, 16],
    // Jogo 97: D1 D2 D3 D4 D6 D8 D9 D10 D11 D13 D15 D16 D17 D19 D20 → remove D5 D7 D12 D14 D18
    [4, 6, 11, 13, 17],
    // Jogo 98: D1 D2 D3 D4 D6 D8 D9 D11 D12 D15 D16 D17 D18 D19 D20 → remove D5 D7 D10 D13 D14
    [4, 6, 9, 12, 13],
    // Jogo 99: D1 D2 D3 D4 D6 D8 D10 D11 D12 D14 D16 D17 D18 D19 D20 → remove D5 D7 D9 D13 D15
    [4, 6, 8, 12, 14],
    // Jogo 100: D1 D2 D3 D4 D6 D9 D10 D11 D12 D13 D14 D17 D18 D19 D20 → remove D5 D7 D8 D15 D16
    [4, 6, 7, 14, 15],
    // Jogo 101: D1 D2 D3 D4 D7 D8 D9 D10 D11 D12 D14 D15 D16 D17 D18 → remove D5 D6 D13 D19 D20
    [4, 5, 12, 18, 19],
    // Jogo 102: D1 D2 D3 D4 D7 D8 D9 D10 D11 D12 D14 D15 D18 D19 D20 → remove D5 D6 D13 D16 D17
    [4, 5, 12, 15, 16],
    // Jogo 103: D1 D2 D3 D4 D7 D8 D9 D10 D12 D13 D15 D16 D17 D19 D20 → remove D5 D6 D11 D14 D18
    [4, 5, 10, 13, 17],
    // Jogo 104: D1 D2 D3 D4 D7 D9 D10 D12 D13 D14 D15 D17 D18 D19 D20 → remove D5 D6 D8 D11 D16
    [4, 5, 7, 10, 15],
    // Jogo 105: D1 D2 D3 D4 D8 D10 D11 D12 D13 D14 D15 D16 D17 D19 D20 → remove D5 D6 D7 D9 D18
    [4, 5, 6, 8, 17],
    // Jogo 106: D1 D2 D3 D4 D9 D10 D11 D12 D13 D14 D15 D16 D17 D18 D20 → remove D5 D6 D7 D8 D19
    [4, 5, 6, 7, 18],
    // Jogo 107: D1 D2 D3 D5 D6 D7 D8 D9 D10 D11 D12 D16 D17 D18 D19 → remove D4 D13 D14 D15 D20
    [3, 12, 13, 14, 19],
    // Jogo 108: D1 D2 D3 D5 D6 D7 D8 D9 D10 D11 D13 D15 D16 D19 D20 → remove D4 D12 D14 D17 D18
    [3, 11, 13, 16, 17],
    // Jogo 109: D1 D2 D3 D5 D6 D7 D8 D9 D10 D12 D13 D14 D16 D17 D20 → remove D4 D11 D15 D18 D19
    [3, 10, 14, 17, 18],
    // Jogo 110: D1 D2 D3 D5 D6 D7 D8 D9 D10 D14 D15 D16 D17 D18 D20 → remove D4 D11 D12 D13 D19
    [3, 10, 11, 12, 18],
    // Jogo 111: D1 D2 D3 D5 D6 D7 D8 D9 D11 D12 D13 D15 D16 D17 D19 → remove D4 D10 D14 D18 D20
    [3, 9, 13, 17, 19],
    // Jogo 112: D1 D2 D3 D5 D6 D7 D8 D9 D12 D14 D15 D17 D18 D19 D20 → remove D4 D10 D11 D13 D16
    [3, 9, 10, 12, 15],
    // Jogo 113: D1 D2 D3 D5 D6 D7 D8 D10 D11 D12 D14 D16 D18 D19 D20 → remove D4 D9 D13 D15 D17
    [3, 8, 12, 14, 16],
    // Jogo 114: D1 D2 D3 D5 D6 D7 D8 D10 D11 D13 D14 D15 D16 D17 D19 → remove D4 D9 D12 D18 D20
    [3, 8, 11, 17, 19],
    // Jogo 115: D1 D2 D3 D5 D6 D7 D8 D11 D12 D13 D14 D15 D16 D19 D20 → remove D4 D9 D10 D17 D18
    [3, 8, 9, 16, 17],
    // Jogo 116: D1 D2 D3 D5 D6 D7 D9 D10 D11 D12 D13 D14 D16 D18 D20 → remove D4 D8 D15 D17 D19
    [3, 7, 14, 16, 18],
    // Jogo 117: D1 D2 D3 D5 D6 D7 D9 D10 D11 D12 D13 D14 D17 D18 D19 → remove D4 D8 D15 D16 D20
    [3, 7, 14, 15, 19],
    // Jogo 118: D1 D2 D3 D5 D6 D7 D9 D10 D11 D12 D14 D15 D16 D18 D19 → remove D4 D8 D13 D17 D20
    [3, 7, 12, 16, 19],
    // Jogo 119: D1 D2 D3 D5 D6 D7 D9 D10 D11 D12 D14 D15 D17 D18 D20 → remove D4 D8 D13 D16 D19
    [3, 7, 12, 15, 18],
    // Jogo 120: D1 D2 D3 D5 D6 D7 D9 D11 D12 D13 D14 D15 D16 D17 D18 → remove D4 D8 D10 D19 D20
    [3, 7, 9, 18, 19],
    // Jogo 121: D1 D2 D3 D5 D6 D7 D9 D11 D12 D13 D14 D15 D18 D19 D20 → remove D4 D8 D10 D16 D17
    [3, 7, 9, 15, 16],
    // Jogo 122: D1 D2 D3 D5 D6 D7 D9 D11 D14 D15 D16 D17 D18 D19 D20 → remove D4 D8 D10 D12 D13
    [3, 7, 9, 11, 12],
    // Jogo 123: D1 D2 D3 D5 D6 D7 D10 D11 D12 D15 D16 D17 D18 D19 D20 → remove D4 D8 D9 D13 D14
    [3, 7, 8, 12, 13],
    // Jogo 124: D1 D2 D3 D5 D6 D7 D10 D13 D14 D15 D16 D17 D18 D19 D20 → remove D4 D8 D9 D11 D12
    [3, 7, 8, 10, 11],
    // Jogo 125: D1 D2 D3 D5 D6 D8 D9 D10 D11 D12 D13 D14 D17 D19 D20 → remove D4 D7 D15 D16 D18
    [3, 6, 14, 15, 17],
    // Jogo 126: D1 D2 D3 D5 D6 D8 D9 D10 D11 D14 D15 D17 D18 D19 D20 → remove D4 D7 D12 D13 D16
    [3, 6, 11, 12, 15],
    // Jogo 127: D1 D2 D3 D5 D6 D8 D9 D11 D12 D14 D15 D16 D17 D18 D20 → remove D4 D7 D10 D13 D19
    [3, 6, 9, 12, 18],
    // Jogo 128: D1 D2 D3 D5 D6 D9 D10 D11 D13 D15 D16 D17 D18 D19 D20 → remove D4 D7 D8 D12 D14
    [3, 6, 7, 11, 13],
    // Jogo 129: D1 D2 D3 D5 D6 D9 D10 D12 D14 D15 D16 D17 D18 D19 D20 → remove D4 D7 D8 D11 D13
    [3, 6, 7, 10, 12],
    // Jogo 130: D1 D2 D3 D5 D7 D8 D9 D10 D11 D12 D15 D16 D18 D19 D20 → remove D4 D6 D13 D14 D17
    [3, 5, 12, 13, 16],
    // Jogo 131: D1 D2 D3 D5 D7 D8 D9 D10 D12 D13 D14 D15 D17 D19 D20 → remove D4 D6 D11 D16 D18
    [3, 5, 10, 15, 17],
    // Jogo 132: D1 D2 D3 D5 D7 D8 D9 D11 D12 D13 D14 D16 D17 D19 D20 → remove D4 D6 D10 D15 D18
    [3, 5, 9, 14, 17],
    // Jogo 133: D1 D2 D3 D5 D7 D8 D10 D11 D12 D14 D15 D16 D17 D18 D19 → remove D4 D6 D9 D13 D20
    [3, 5, 8, 12, 19],
    // Jogo 134: D1 D2 D3 D5 D7 D9 D10 D11 D12 D14 D16 D17 D18 D19 D20 → remove D4 D6 D8 D13 D15
    [3, 5, 7, 12, 14],
    // Jogo 135: D1 D2 D3 D5 D7 D9 D10 D12 D13 D15 D16 D17 D18 D19 D20 → remove D4 D6 D8 D11 D14
    [3, 5, 7, 10, 13],
    // Jogo 136: D1 D2 D3 D5 D8 D9 D10 D11 D12 D13 D14 D15 D16 D17 D20 → remove D4 D6 D7 D18 D19
    [3, 5, 6, 17, 18],
    // Jogo 137: D1 D2 D3 D5 D10 D11 D12 D13 D14 D15 D16 D17 D18 D19 D20 → remove D4 D6 D7 D8 D9
    [3, 5, 6, 7, 8],
    // Jogo 138: D1 D2 D3 D6 D7 D8 D9 D10 D11 D12 D13 D17 D18 D19 D20 → remove D4 D5 D14 D15 D16
    [3, 4, 13, 14, 15],
    // Jogo 139: D1 D2 D3 D6 D7 D8 D9 D10 D11 D13 D15 D16 D17 D18 D20 → remove D4 D5 D12 D14 D19
    [3, 4, 11, 13, 18],
    // Jogo 140: D1 D2 D3 D6 D7 D8 D9 D12 D13 D14 D15 D16 D18 D19 D20 → remove D4 D5 D10 D11 D17
    [3, 4, 9, 10, 16],
    // Jogo 141: D1 D2 D3 D6 D7 D8 D10 D11 D12 D13 D14 D16 D17 D18 D20 → remove D4 D5 D9 D15 D19
    [3, 4, 8, 14, 18],
    // Jogo 142: D1 D2 D3 D6 D7 D8 D10 D11 D13 D14 D15 D17 D18 D19 D20 → remove D4 D5 D9 D12 D16
    [3, 4, 8, 11, 15],
    // Jogo 143: D1 D2 D3 D6 D8 D9 D11 D12 D13 D14 D15 D16 D17 D18 D19 → remove D4 D5 D7 D10 D20
    [3, 4, 6, 9, 19],
    // Jogo 144: D1 D2 D3 D7 D8 D9 D10 D12 D13 D14 D15 D16 D17 D18 D19 → remove D4 D5 D6 D11 D20
    [3, 4, 5, 10, 19],
    // Jogo 145: D1 D2 D3 D8 D9 D10 D11 D12 D13 D14 D15 D16 D18 D19 D20 → remove D4 D5 D6 D7 D17
    [3, 4, 5, 6, 16],
    // Jogo 146: D1 D2 D4 D5 D6 D7 D8 D9 D10 D11 D12 D14 D16 D18 D20 → remove D3 D13 D15 D17 D19
    [2, 12, 14, 16, 18],
    // Jogo 147: D1 D2 D4 D5 D6 D7 D8 D9 D10 D11 D12 D14 D17 D18 D19 → remove D3 D13 D15 D16 D20
    [2, 12, 14, 15, 19],
    // Jogo 148: D1 D2 D4 D5 D6 D7 D8 D9 D10 D11 D13 D14 D15 D16 D20 → remove D3 D12 D17 D18 D19
    [2, 11, 16, 17, 18],
    // Jogo 149: D1 D2 D4 D5 D6 D7 D8 D9 D10 D11 D13 D14 D15 D17 D19 → remove D3 D12 D16 D18 D20
    [2, 11, 15, 17, 19],
    // Jogo 150: D1 D2 D4 D5 D6 D7 D8 D9 D10 D12 D13 D16 D17 D19 D20 → remove D3 D11 D14 D15 D18
    [2, 10, 13, 14, 17],
    // Jogo 151: D1 D2 D4 D5 D6 D7 D8 D9 D11 D12 D14 D15 D16 D17 D18 → remove D3 D10 D13 D19 D20
    [2, 9, 12, 18, 19],
    // Jogo 152: D1 D2 D4 D5 D6 D7 D8 D9 D11 D12 D14 D15 D18 D19 D20 → remove D3 D10 D13 D16 D17
    [2, 9, 12, 15, 16],
    // Jogo 153: D1 D2 D4 D5 D6 D7 D8 D10 D14 D15 D16 D17 D18 D19 D20 → remove D3 D9 D11 D12 D13
    [2, 8, 10, 11, 12],
    // Jogo 154: D1 D2 D4 D5 D6 D7 D8 D12 D13 D14 D15 D16 D17 D19 D20 → remove D3 D9 D10 D11 D18
    [2, 8, 9, 10, 17],
    // Jogo 155: D1 D2 D4 D5 D6 D7 D9 D10 D11 D12 D13 D16 D17 D18 D19 → remove D3 D8 D14 D15 D20
    [2, 7, 13, 14, 19],
    // Jogo 156: D1 D2 D4 D5 D6 D7 D9 D10 D13 D14 D15 D16 D17 D18 D20 → remove D3 D8 D11 D12 D19
    [2, 7, 10, 11, 18],
    // Jogo 157: D1 D2 D4 D5 D6 D7 D9 D12 D13 D14 D15 D17 D18 D19 D20 → remove D3 D8 D10 D11 D16
    [2, 7, 9, 10, 15],
    // Jogo 158: D1 D2 D4 D5 D6 D7 D10 D11 D12 D13 D14 D16 D18 D19 D20 → remove D3 D8 D9 D15 D17
    [2, 7, 8, 14, 16],
    // Jogo 159: D1 D2 D4 D5 D6 D8 D9 D10 D11 D15 D16 D17 D18 D19 D20 → remove D3 D7 D12 D13 D14
    [2, 6, 11, 12, 13],
    // Jogo 160: D1 D2 D4 D5 D6 D8 D9 D11 D12 D13 D15 D16 D17 D19 D20 → remove D3 D7 D10 D14 D18
    [2, 6, 9, 13, 17],
    // Jogo 161: D1 D2 D4 D5 D6 D8 D10 D11 D12 D13 D14 D16 D17 D19 D20 → remove D3 D7 D9 D15 D18
    [2, 6, 8, 14, 17],
    // Jogo 162: D1 D2 D4 D5 D6 D9 D10 D11 D13 D14 D15 D17 D18 D19 D20 → remove D3 D7 D8 D12 D16
    [2, 6, 7, 11, 15],
    // Jogo 163: D1 D2 D4 D5 D6 D9 D11 D12 D13 D14 D15 D16 D17 D18 D20 → remove D3 D7 D8 D10 D19
    [2, 6, 7, 9, 18],
    // Jogo 164: D1 D2 D4 D5 D7 D8 D9 D10 D11 D12 D13 D14 D15 D16 D17 → remove D3 D6 D18 D19 D20
    [2, 5, 17, 18, 19],
    // Jogo 165: D1 D2 D4 D5 D7 D8 D9 D10 D11 D12 D13 D14 D15 D19 D20 → remove D3 D6 D16 D17 D18
    [2, 5, 15, 16, 17],
    // Jogo 166: D1 D2 D4 D5 D7 D8 D9 D10 D12 D15 D16 D17 D18 D19 D20 → remove D3 D6 D11 D13 D14
    [2, 5, 10, 12, 13],
    // Jogo 167: D1 D2 D4 D5 D7 D9 D10 D11 D12 D13 D15 D16 D18 D19 D20 → remove D3 D6 D8 D14 D17
    [2, 5, 7, 13, 16],
    // Jogo 168: D1 D2 D4 D5 D7 D10 D11 D12 D13 D14 D15 D16 D17 D18 D19 → remove D3 D6 D8 D9 D20
    [2, 5, 7, 8, 19],
    // Jogo 169: D1 D2 D4 D5 D8 D10 D11 D12 D14 D15 D16 D17 D18 D19 D20 → remove D3 D6 D7 D9 D13
    [2, 5, 6, 8, 12],
    // Jogo 170: D1 D2 D4 D6 D7 D8 D9 D10 D11 D12 D13 D15 D16 D17 D18 → remove D3 D5 D14 D19 D20
    [2, 4, 13, 18, 19],
    // Jogo 171: D1 D2 D4 D6 D7 D8 D9 D10 D11 D12 D14 D15 D16 D18 D19 → remove D3 D5 D13 D17 D20
    [2, 4, 12, 16, 19],
    // Jogo 172: D1 D2 D4 D6 D7 D8 D9 D10 D11 D12 D14 D15 D17 D18 D20 → remove D3 D5 D13 D16 D19
    [2, 4, 12, 15, 18],
    // Jogo 173: D1 D2 D4 D6 D7 D8 D9 D10 D12 D13 D14 D15 D16 D18 D20 → remove D3 D5 D11 D17 D19
    [2, 4, 10, 16, 18],
    // Jogo 174: D1 D2 D4 D6 D7 D8 D9 D10 D12 D13 D15 D17 D18 D19 D20 → remove D3 D5 D11 D14 D16
    [2, 4, 10, 13, 15],
    // Jogo 175: D1 D2 D4 D6 D7 D8 D9 D11 D12 D13 D14 D16 D17 D19 D20 → remove D3 D5 D10 D15 D18
    [2, 4, 9, 14, 17],
    // Jogo 176: D1 D2 D4 D6 D7 D8 D9 D11 D12 D14 D16 D17 D18 D19 D20 → remove D3 D5 D10 D13 D15
    [2, 4, 9, 12, 14],
    // Jogo 177: D1 D2 D4 D6 D7 D8 D9 D11 D13 D14 D16 D17 D18 D19 D20 → remove D3 D5 D10 D12 D15
    [2, 4, 9, 11, 14],
    // Jogo 178: D1 D2 D4 D6 D7 D8 D10 D11 D12 D13 D14 D15 D18 D19 D20 → remove D3 D5 D9 D16 D17
    [2, 4, 8, 15, 16],
    // Jogo 179: D1 D2 D4 D6 D7 D8 D10 D11 D12 D15 D16 D17 D18 D19 D20 → remove D3 D5 D9 D13 D14
    [2, 4, 8, 12, 13],
    // Jogo 180: D1 D2 D4 D6 D7 D8 D10 D12 D13 D14 D15 D16 D17 D18 D19 → remove D3 D5 D9 D11 D20
    [2, 4, 8, 10, 19],
    // Jogo 181: D1 D2 D4 D6 D8 D9 D10 D11 D12 D13 D14 D15 D17 D18 D19 → remove D3 D5 D7 D16 D20
    [2, 4, 6, 15, 19],
    // Jogo 182: D1 D2 D4 D6 D8 D9 D10 D11 D12 D13 D15 D16 D18 D19 D20 → remove D3 D5 D7 D14 D17
    [2, 4, 6, 13, 16],
    // Jogo 183: D1 D2 D4 D6 D8 D9 D10 D12 D14 D15 D16 D17 D18 D19 D20 → remove D3 D5 D7 D11 D13
    [2, 4, 6, 10, 12],
    // Jogo 184: D1 D2 D4 D6 D8 D10 D11 D12 D13 D14 D15 D16 D17 D18 D20 → remove D3 D5 D7 D9 D19
    [2, 4, 6, 8, 18],
    // Jogo 185: D1 D2 D4 D7 D8 D9 D10 D11 D13 D14 D15 D16 D17 D19 D20 → remove D3 D5 D6 D12 D18
    [2, 4, 5, 11, 17],
    // Jogo 186: D1 D2 D4 D7 D8 D9 D10 D11 D14 D15 D16 D17 D18 D19 D20 → remove D3 D5 D6 D12 D13
    [2, 4, 5, 11, 12],
    // Jogo 187: D1 D2 D4 D7 D8 D9 D11 D12 D13 D14 D16 D17 D18 D19 D20 → remove D3 D5 D6 D10 D15
    [2, 4, 5, 9, 14],
    // Jogo 188: D1 D2 D5 D6 D7 D8 D9 D10 D12 D13 D14 D16 D18 D19 D20 → remove D3 D4 D11 D15 D17
    [2, 3, 10, 14, 16],
    // Jogo 189: D1 D2 D5 D6 D7 D8 D9 D10 D13 D14 D15 D16 D17 D18 D19 → remove D3 D4 D11 D12 D20
    [2, 3, 10, 11, 19],
    // Jogo 190: D1 D2 D5 D6 D7 D8 D9 D11 D12 D13 D15 D16 D17 D18 D20 → remove D3 D4 D10 D14 D19
    [2, 3, 9, 13, 18],
    // Jogo 191: D1 D2 D5 D6 D7 D8 D11 D12 D13 D14 D15 D17 D18 D19 D20 → remove D3 D4 D9 D10 D16
    [2, 3, 8, 9, 15],
    // Jogo 192: D1 D2 D5 D6 D8 D9 D10 D11 D12 D13 D14 D16 D17 D18 D19 → remove D3 D4 D7 D15 D20
    [2, 3, 6, 14, 19],
    // Jogo 193: D1 D2 D5 D6 D8 D9 D10 D11 D13 D14 D15 D16 D18 D19 D20 → remove D3 D4 D7 D12 D17
    [2, 3, 6, 11, 16],
    // Jogo 194: D1 D2 D5 D7 D8 D9 D10 D11 D12 D13 D15 D17 D18 D19 D20 → remove D3 D4 D6 D14 D16
    [2, 3, 5, 13, 15],
    // Jogo 195: D1 D2 D5 D7 D8 D10 D11 D12 D13 D14 D15 D16 D17 D18 D20 → remove D3 D4 D6 D9 D19
    [2, 3, 5, 8, 18],
    // Jogo 196: D1 D2 D6 D7 D9 D10 D11 D12 D13 D14 D15 D16 D17 D19 D20 → remove D3 D4 D5 D8 D18
    [2, 3, 4, 7, 17],
    // Jogo 197: D1 D3 D4 D5 D6 D7 D8 D9 D10 D11 D12 D13 D16 D17 D19 → remove D2 D14 D15 D18 D20
    [1, 13, 14, 17, 19],
    // Jogo 198: D1 D3 D4 D5 D6 D7 D8 D9 D10 D11 D15 D16 D18 D19 D20 → remove D2 D12 D13 D14 D17
    [1, 11, 12, 13, 16],
    // Jogo 199: D1 D3 D4 D5 D6 D7 D8 D9 D10 D12 D14 D16 D17 D18 D20 → remove D2 D11 D13 D15 D19
    [1, 10, 12, 14, 18],
    // Jogo 200: D1 D3 D4 D5 D6 D7 D8 D9 D10 D13 D14 D15 D16 D17 D20 → remove D2 D11 D12 D18 D19
    [1, 10, 11, 17, 18],
    // Jogo 201: D1 D3 D4 D5 D6 D7 D8 D9 D11 D12 D15 D16 D17 D18 D19 → remove D2 D10 D13 D14 D20
    [1, 9, 12, 13, 19],
    // Jogo 202: D1 D3 D4 D5 D6 D7 D8 D9 D11 D14 D16 D17 D18 D19 D20 → remove D2 D10 D12 D13 D15
    [1, 9, 11, 12, 14],
    // Jogo 203: D1 D3 D4 D5 D6 D7 D8 D9 D12 D13 D14 D15 D17 D19 D20 → remove D2 D10 D11 D16 D18
    [1, 9, 10, 15, 17],
    // Jogo 204: D1 D3 D4 D5 D6 D7 D8 D10 D11 D12 D13 D14 D16 D19 D20 → remove D2 D9 D15 D17 D18
    [1, 8, 14, 16, 17],
    // Jogo 205: D1 D3 D4 D5 D6 D7 D8 D10 D11 D14 D15 D16 D17 D18 D19 → remove D2 D9 D12 D13 D20
    [1, 8, 11, 12, 19],
    // Jogo 206: D1 D3 D4 D5 D6 D7 D8 D11 D12 D14 D15 D16 D18 D19 D20 → remove D2 D9 D10 D13 D17
    [1, 8, 9, 12, 16],
    // Jogo 207: D1 D3 D4 D5 D6 D7 D9 D10 D11 D13 D14 D15 D16 D18 D20 → remove D2 D8 D12 D17 D19
    [1, 7, 11, 16, 18],
    // Jogo 208: D1 D3 D4 D5 D6 D7 D9 D10 D11 D13 D14 D15 D17 D18 D19 → remove D2 D8 D12 D16 D20
    [1, 7, 11, 15, 19],
    // Jogo 209: D1 D3 D4 D5 D6 D7 D9 D10 D12 D13 D16 D17 D18 D19 D20 → remove D2 D8 D11 D14 D15
    [1, 7, 10, 13, 14],
    // Jogo 210: D1 D3 D4 D5 D6 D7 D12 D13 D14 D15 D16 D17 D18 D19 D20 → remove D2 D8 D9 D10 D11
    [1, 7, 8, 9, 10],
    // Jogo 211: D1 D3 D4 D5 D6 D8 D9 D10 D11 D12 D14 D17 D18 D19 D20 → remove D2 D7 D13 D15 D16
    [1, 6, 12, 14, 15],
    // Jogo 212: D1 D3 D4 D5 D6 D8 D9 D10 D11 D13 D14 D15 D17 D19 D20 → remove D2 D7 D12 D16 D18
    [1, 6, 11, 15, 17],
    // Jogo 213: D1 D3 D4 D5 D6 D8 D9 D11 D12 D13 D14 D15 D16 D17 D20 → remove D2 D7 D10 D18 D19
    [1, 6, 9, 17, 18],
    // Jogo 214: D1 D3 D4 D5 D6 D9 D11 D12 D13 D15 D16 D17 D18 D19 D20 → remove D2 D7 D8 D10 D14
    [1, 6, 7, 9, 13],
    // Jogo 215: D1 D3 D4 D5 D6 D10 D11 D12 D13 D14 D16 D17 D18 D19 D20 → remove D2 D7 D8 D9 D15
    [1, 6, 7, 8, 14],
    // Jogo 216: D1 D3 D4 D5 D7 D8 D9 D10 D11 D12 D13 D15 D16 D19 D20 → remove D2 D6 D14 D17 D18
    [1, 5, 13, 16, 17],
    // Jogo 217: D1 D3 D4 D5 D7 D8 D9 D10 D11 D12 D14 D16 D17 D19 D20 → remove D2 D6 D13 D15 D18
    [1, 5, 12, 14, 17],
    // Jogo 218: D1 D3 D4 D5 D7 D8 D9 D10 D12 D14 D15 D17 D18 D19 D20 → remove D2 D6 D11 D13 D16
    [1, 5, 10, 12, 15],
    // Jogo 219: D1 D3 D4 D5 D7 D8 D10 D11 D12 D13 D14 D15 D16 D17 D19 → remove D2 D6 D9 D18 D20
    [1, 5, 8, 17, 19],
    // Jogo 220: D1 D3 D4 D5 D7 D9 D10 D11 D12 D13 D14 D15 D16 D17 D18 → remove D2 D6 D8 D19 D20
    [1, 5, 7, 18, 19],
    // Jogo 221: D1 D3 D4 D5 D7 D9 D10 D11 D12 D13 D14 D15 D18 D19 D20 → remove D2 D6 D8 D16 D17
    [1, 5, 7, 15, 16],
    // Jogo 222: D1 D3 D4 D5 D8 D9 D10 D11 D12 D14 D15 D16 D17 D18 D20 → remove D2 D6 D7 D13 D19
    [1, 5, 6, 12, 18],
    // Jogo 223: D1 D3 D4 D6 D7 D8 D9 D10 D12 D13 D14 D16 D18 D19 D20 → remove D2 D5 D11 D15 D17
    [1, 4, 10, 14, 16],
    // Jogo 224: D1 D3 D4 D6 D7 D8 D9 D10 D13 D14 D15 D16 D17 D18 D19 → remove D2 D5 D11 D12 D20
    [1, 4, 10, 11, 19],
    // Jogo 225: D1 D3 D4 D6 D7 D8 D9 D11 D12 D13 D15 D16 D17 D18 D20 → remove D2 D5 D10 D14 D19
    [1, 4, 9, 13, 18],
    // Jogo 226: D1 D3 D4 D6 D7 D8 D11 D12 D13 D14 D15 D17 D18 D19 D20 → remove D2 D5 D9 D10 D16
    [1, 4, 8, 9, 15],
    // Jogo 227: D1 D3 D4 D6 D7 D9 D10 D11 D12 D14 D15 D16 D17 D19 D20 → remove D2 D5 D8 D13 D18
    [1, 4, 7, 12, 17],
    // Jogo 228: D1 D3 D4 D6 D8 D9 D10 D11 D12 D13 D14 D16 D17 D18 D19 → remove D2 D5 D7 D15 D20
    [1, 4, 6, 14, 19],
    // Jogo 229: D1 D3 D4 D6 D8 D9 D10 D11 D13 D14 D15 D16 D18 D19 D20 → remove D2 D5 D7 D12 D17
    [1, 4, 6, 11, 16],
    // Jogo 230: D1 D3 D4 D7 D8 D9 D10 D11 D12 D13 D15 D17 D18 D19 D20 → remove D2 D5 D6 D14 D16
    [1, 4, 5, 13, 15],
    // Jogo 231: D1 D3 D4 D7 D8 D10 D11 D12 D13 D14 D15 D16 D17 D18 D20 → remove D2 D5 D6 D9 D19
    [1, 4, 5, 8, 18],
    // Jogo 232: D1 D3 D5 D6 D7 D8 D9 D10 D11 D12 D13 D15 D16 D17 D18 → remove D2 D4 D14 D19 D20
    [1, 3, 13, 18, 19],
    // Jogo 233: D1 D3 D5 D6 D7 D8 D9 D10 D12 D13 D14 D15 D16 D18 D20 → remove D2 D4 D11 D17 D19
    [1, 3, 10, 16, 18],
    // Jogo 234: D1 D3 D5 D6 D7 D8 D9 D10 D12 D13 D15 D17 D18 D19 D20 → remove D2 D4 D11 D14 D16
    [1, 3, 10, 13, 15],
    // Jogo 235: D1 D3 D5 D6 D7 D8 D9 D11 D13 D14 D15 D16 D17 D19 D20 → remove D2 D4 D10 D12 D18
    [1, 3, 9, 11, 17],
    // Jogo 236: D1 D3 D5 D6 D7 D8 D10 D11 D12 D13 D14 D15 D18 D19 D20 → remove D2 D4 D9 D16 D17
    [1, 3, 8, 15, 16],
    // Jogo 237: D1 D3 D5 D6 D7 D8 D10 D12 D13 D14 D15 D16 D17 D18 D19 → remove D2 D4 D9 D11 D20
    [1, 3, 8, 10, 19],
    // Jogo 238: D1 D3 D5 D6 D7 D9 D11 D12 D13 D14 D16 D17 D18 D19 D20 → remove D2 D4 D8 D10 D15
    [1, 3, 7, 9, 14],
    // Jogo 239: D1 D3 D5 D6 D8 D9 D10 D11 D12 D13 D14 D15 D17 D18 D19 → remove D2 D4 D7 D16 D20
    [1, 3, 6, 15, 19],
    // Jogo 240: D1 D3 D5 D6 D8 D9 D10 D11 D12 D13 D15 D16 D18 D19 D20 → remove D2 D4 D7 D14 D17
    [1, 3, 6, 13, 16],
    // Jogo 241: D1 D3 D5 D6 D8 D10 D11 D12 D13 D14 D15 D16 D17 D18 D20 → remove D2 D4 D7 D9 D19
    [1, 3, 6, 8, 18],
    // Jogo 242: D1 D3 D5 D7 D8 D9 D10 D11 D13 D14 D16 D17 D18 D19 D20 → remove D2 D4 D6 D12 D15
    [1, 3, 5, 11, 14],
    // Jogo 243: D1 D3 D6 D7 D8 D9 D10 D11 D12 D13 D14 D15 D16 D18 D19 → remove D2 D4 D5 D17 D20
    [1, 3, 4, 16, 19],
    // Jogo 244: D1 D3 D6 D7 D8 D9 D10 D11 D12 D13 D14 D15 D17 D18 D20 → remove D2 D4 D5 D16 D19
    [1, 3, 4, 15, 18],
    // Jogo 245: D1 D3 D6 D7 D8 D9 D10 D11 D13 D14 D16 D17 D18 D19 D20 → remove D2 D4 D5 D12 D15
    [1, 3, 4, 11, 14],
    // Jogo 246: D1 D3 D6 D7 D8 D10 D11 D12 D13 D15 D16 D17 D18 D19 D20 → remove D2 D4 D5 D9 D14
    [1, 3, 4, 8, 13],
    // Jogo 247: D1 D3 D6 D8 D9 D10 D12 D13 D14 D15 D16 D17 D18 D19 D20 → remove D2 D4 D5 D7 D11
    [1, 3, 4, 6, 10],
    // Jogo 248: D1 D3 D7 D8 D9 D11 D12 D13 D14 D15 D16 D17 D18 D19 D20 → remove D2 D4 D5 D6 D10
    [1, 3, 4, 5, 9],
    // Jogo 249: D1 D4 D5 D6 D7 D8 D9 D10 D11 D12 D13 D17 D18 D19 D20 → remove D2 D3 D14 D15 D16
    [1, 2, 13, 14, 15],
    // Jogo 250: D1 D4 D5 D6 D7 D8 D9 D10 D11 D13 D15 D16 D17 D18 D20 → remove D2 D3 D12 D14 D19
    [1, 2, 11, 13, 18],
    // Jogo 251: D1 D4 D5 D6 D7 D8 D9 D12 D13 D14 D15 D16 D18 D19 D20 → remove D2 D3 D10 D11 D17
    [1, 2, 9, 10, 16],
    // Jogo 252: D1 D4 D5 D6 D7 D8 D10 D11 D12 D13 D14 D16 D17 D18 D20 → remove D2 D3 D9 D15 D19
    [1, 2, 8, 14, 18],
    // Jogo 253: D1 D4 D5 D6 D7 D8 D10 D11 D13 D14 D15 D17 D18 D19 D20 → remove D2 D3 D9 D12 D16
    [1, 2, 8, 11, 15],
    // Jogo 254: D1 D4 D5 D6 D7 D9 D10 D11 D12 D13 D14 D15 D16 D18 D19 → remove D2 D3 D8 D17 D20
    [1, 2, 7, 16, 19],
    // Jogo 255: D1 D4 D5 D6 D7 D9 D10 D11 D12 D13 D14 D15 D17 D18 D20 → remove D2 D3 D8 D16 D19
    [1, 2, 7, 15, 18],
    // Jogo 256: D1 D4 D5 D6 D7 D9 D11 D13 D14 D15 D16 D17 D18 D19 D20 → remove D2 D3 D8 D10 D12
    [1, 2, 7, 9, 11],
    // Jogo 257: D1 D4 D5 D6 D7 D10 D11 D12 D13 D15 D16 D17 D18 D19 D20 → remove D2 D3 D8 D9 D14
    [1, 2, 7, 8, 13],
    // Jogo 258: D1 D4 D5 D6 D8 D9 D11 D12 D13 D14 D15 D16 D17 D18 D19 → remove D2 D3 D7 D10 D20
    [1, 2, 6, 9, 19],
    // Jogo 259: D1 D4 D5 D6 D9 D10 D12 D13 D14 D15 D16 D17 D18 D19 D20 → remove D2 D3 D7 D8 D11
    [1, 2, 6, 7, 10],
    // Jogo 260: D1 D4 D5 D7 D8 D9 D10 D12 D13 D14 D15 D16 D17 D18 D19 → remove D2 D3 D6 D11 D20
    [1, 2, 5, 10, 19],
    // Jogo 261: D1 D4 D5 D7 D9 D10 D11 D12 D13 D14 D16 D17 D18 D19 D20 → remove D2 D3 D6 D8 D15
    [1, 2, 5, 7, 14],
    // Jogo 262: D1 D4 D5 D8 D9 D10 D11 D12 D13 D14 D15 D16 D18 D19 D20 → remove D2 D3 D6 D7 D17
    [1, 2, 5, 6, 16],
    // Jogo 263: D1 D5 D6 D7 D8 D9 D10 D11 D12 D14 D15 D16 D17 D19 D20 → remove D2 D3 D4 D13 D18
    [1, 2, 3, 12, 17],
    // Jogo 264: D1 D5 D6 D7 D8 D9 D10 D11 D13 D14 D16 D17 D18 D19 D20 → remove D2 D3 D4 D12 D15
    [1, 2, 3, 11, 14],
    // Jogo 265: D1 D5 D7 D8 D9 D11 D12 D13 D14 D15 D16 D17 D18 D19 D20 → remove D2 D3 D4 D6 D10
    [1, 2, 3, 5, 9],
    // Jogo 266: D2 D3 D4 D5 D6 D7 D8 D9 D10 D11 D12 D17 D18 D19 D20 → remove D1 D13 D14 D15 D16
    [0, 12, 13, 14, 15],
    // Jogo 267: D2 D3 D4 D5 D6 D7 D8 D9 D10 D11 D15 D16 D17 D18 D20 → remove D1 D12 D13 D14 D19
    [0, 11, 12, 13, 18],
    // Jogo 268: D2 D3 D4 D5 D6 D7 D8 D9 D10 D12 D13 D14 D16 D19 D20 → remove D1 D11 D15 D17 D18
    [0, 10, 14, 16, 17],
    // Jogo 269: D2 D3 D4 D5 D6 D7 D8 D9 D10 D13 D14 D15 D16 D17 D19 → remove D1 D11 D12 D18 D20
    [0, 10, 11, 17, 19],
    // Jogo 270: D2 D3 D4 D5 D6 D7 D8 D9 D11 D12 D13 D15 D16 D17 D20 → remove D1 D10 D14 D18 D19
    [0, 9, 13, 17, 18],
    // Jogo 271: D2 D3 D4 D5 D6 D7 D8 D9 D11 D13 D14 D16 D17 D19 D20 → remove D1 D10 D12 D15 D18
    [0, 9, 11, 14, 17],
    // Jogo 272: D2 D3 D4 D5 D6 D7 D8 D9 D12 D14 D15 D16 D18 D19 D20 → remove D1 D10 D11 D13 D17
    [0, 9, 10, 12, 16],
    // Jogo 273: D2 D3 D4 D5 D6 D7 D8 D10 D11 D12 D14 D16 D17 D18 D20 → remove D1 D9 D13 D15 D19
    [0, 8, 12, 14, 18],
    // Jogo 274: D2 D3 D4 D5 D6 D7 D8 D10 D11 D14 D15 D17 D18 D19 D20 → remove D1 D9 D12 D13 D16
    [0, 8, 11, 12, 15],
    // Jogo 275: D2 D3 D4 D5 D6 D7 D8 D11 D12 D13 D14 D15 D17 D19 D20 → remove D1 D9 D10 D16 D18
    [0, 8, 9, 15, 17],
    // Jogo 276: D2 D3 D4 D5 D6 D7 D9 D10 D11 D13 D14 D15 D18 D19 D20 → remove D1 D8 D12 D16 D17
    [0, 7, 11, 15, 16],
    // Jogo 277: D2 D3 D4 D5 D6 D7 D9 D10 D12 D13 D14 D15 D16 D17 D19 → remove D1 D8 D11 D18 D20
    [0, 7, 10, 17, 19],
    // Jogo 278: D2 D3 D4 D5 D6 D7 D9 D11 D12 D14 D16 D17 D18 D19 D20 → remove D1 D8 D10 D13 D15
    [0, 7, 9, 12, 14],
    // Jogo 279: D2 D3 D4 D5 D6 D7 D10 D11 D12 D14 D15 D16 D17 D18 D19 → remove D1 D8 D9 D13 D20
    [0, 7, 8, 12, 19],
    // Jogo 280: D2 D3 D4 D5 D6 D7 D10 D13 D14 D15 D16 D18 D19 D20 → remove D1 D8 D9 D11 D17
    [0, 7, 8, 10, 16],
    // Jogo 281: D2 D3 D4 D5 D6 D8 D9 D11 D12 D13 D14 D15 D16 D17 D18 → remove D1 D7 D10 D19 D20
    [0, 6, 9, 18, 19],
    // Jogo 282: D2 D3 D4 D5 D6 D8 D9 D11 D12 D13 D15 D16 D17 D19 D20 → remove D1 D7 D10 D14 D18
    [0, 6, 9, 13, 17],
    // Jogo 283: D2 D3 D4 D5 D6 D8 D9 D10 D11 D13 D14 D15 D16 D18 D20 → remove D1 D7 D12 D17 D19
    [0, 6, 11, 16, 18],
    // Jogo 284: D2 D3 D4 D5 D6 D8 D9 D10 D11 D13 D14 D16 D17 D19 D20 → remove D1 D7 D12 D15 D18
    [0, 6, 11, 14, 17],
    // Jogo 285: D2 D3 D4 D5 D6 D8 D9 D10 D12 D13 D15 D16 D17 D18 D19 → remove D1 D7 D11 D14 D20
    [0, 6, 10, 13, 19],
    // Jogo 286: D2 D3 D4 D5 D6 D8 D9 D11 D12 D13 D14 D16 D17 D18 D20 → remove D1 D7 D10 D15 D19
    [0, 6, 9, 14, 18],
    // Jogo 287: D2 D3 D4 D5 D6 D8 D10 D11 D12 D13 D14 D15 D16 D19 D20 → remove D1 D7 D9 D17 D18
    [0, 6, 8, 16, 17],
    // Jogo 288: D2 D3 D4 D5 D6 D9 D10 D11 D12 D13 D14 D15 D16 D17 D18 → remove D1 D7 D8 D19 D20
    [0, 6, 7, 18, 19],
    // Jogo 289: D2 D3 D4 D5 D7 D8 D9 D10 D11 D12 D14 D15 D16 D17 D19 → remove D1 D6 D13 D18 D20
    [0, 5, 12, 17, 19],
    // Jogo 290: D2 D3 D4 D5 D7 D8 D9 D10 D12 D13 D14 D15 D16 D17 D18 → remove D1 D6 D11 D19 D20
    [0, 5, 10, 18, 19],
    // Jogo 291: D2 D3 D4 D5 D7 D8 D9 D11 D12 D13 D14 D15 D17 D18 D20 → remove D1 D6 D10 D16 D19
    [0, 5, 9, 15, 18],
    // Jogo 292: D2 D3 D4 D5 D7 D8 D10 D11 D12 D13 D14 D15 D16 D19 D20 → remove D1 D6 D9 D17 D18
    [0, 5, 8, 16, 17],
    // Jogo 293: D2 D3 D4 D5 D7 D8 D10 D11 D13 D14 D15 D16 D17 D19 D20 → remove D1 D6 D9 D12 D18
    [0, 5, 8, 11, 17],
    // Jogo 294: D2 D3 D4 D5 D7 D8 D11 D12 D13 D14 D15 D16 D18 D19 D20 → remove D1 D6 D9 D10 D17
    [0, 5, 8, 9, 16],
    // Jogo 295: D2 D3 D4 D5 D7 D9 D10 D11 D12 D13 D15 D16 D17 D19 D20 → remove D1 D6 D8 D14 D18
    [0, 5, 7, 13, 17],
    // Jogo 296: D2 D3 D4 D5 D7 D9 D10 D12 D13 D14 D15 D16 D17 D18 D19 → remove D1 D6 D8 D11 D20
    [0, 5, 7, 10, 19],
    // Jogo 297: D2 D3 D4 D5 D7 D9 D11 D12 D13 D14 D15 D16 D18 D19 D20 → remove D1 D6 D8 D10 D17
    [0, 5, 7, 9, 16],
    // Jogo 298: D2 D3 D4 D5 D8 D9 D10 D11 D12 D13 D14 D15 D16 D18 D20 → remove D1 D6 D7 D17 D19
    [0, 5, 6, 16, 18],
    // Jogo 299: D2 D3 D4 D5 D8 D9 D10 D12 D13 D14 D15 D16 D17 D19 D20 → remove D1 D6 D7 D11 D18
    [0, 5, 6, 10, 17],
    // Jogo 300: D2 D3 D4 D5 D8 D9 D11 D12 D13 D14 D15 D16 D17 D18 D20 → remove D1 D6 D7 D10 D19
    [0, 5, 6, 9, 18],
    // Jogo 301: D2 D3 D4 D6 D7 D8 D9 D10 D11 D12 D13 D14 D16 D18 D20 → remove D1 D5 D15 D17 D19
    [0, 4, 14, 16, 18],
    // Jogo 302: D2 D3 D4 D6 D7 D8 D9 D10 D11 D12 D14 D15 D16 D17 D19 → remove D1 D5 D13 D18 D20
    [0, 4, 12, 17, 19],
    // Jogo 303: D2 D3 D4 D6 D7 D8 D9 D10 D11 D12 D14 D15 D17 D18 D20 → remove D1 D5 D13 D16 D19
    [0, 4, 12, 15, 18],
    // Jogo 304: D2 D3 D4 D6 D7 D8 D9 D10 D12 D13 D14 D15 D16 D18 D20 → remove D1 D5 D11 D17 D19
    [0, 4, 10, 16, 18],
    // Jogo 305: D2 D3 D4 D6 D7 D8 D9 D10 D12 D13 D15 D17 D18 D19 D20 → remove D1 D5 D11 D14 D16
    [0, 4, 10, 13, 15],
    // Jogo 306: D2 D3 D4 D6 D7 D8 D9 D11 D12 D13 D14 D16 D17 D19 D20 → remove D1 D5 D10 D15 D18
    [0, 4, 9, 14, 17],
    // Jogo 307: D2 D3 D4 D6 D7 D8 D9 D11 D12 D14 D16 D17 D18 D19 D20 → remove D1 D5 D10 D13 D15
    [0, 4, 9, 12, 14],
    // Jogo 308: D2 D3 D4 D6 D7 D8 D9 D11 D13 D14 D16 D17 D18 D19 D20 → remove D1 D5 D10 D12 D15
    [0, 4, 9, 11, 14],
    // Jogo 309: D2 D3 D4 D6 D7 D8 D10 D11 D12 D13 D14 D15 D18 D19 D20 → remove D1 D5 D9 D16 D17
    [0, 4, 8, 15, 16],
    // Jogo 310: D2 D3 D4 D6 D7 D8 D10 D11 D12 D15 D16 D17 D18 D19 D20 → remove D1 D5 D9 D13 D14
    [0, 4, 8, 12, 13],
    // Jogo 311: D2 D3 D4 D6 D7 D8 D10 D12 D13 D14 D15 D16 D17 D18 D19 → remove D1 D5 D9 D11 D20
    [0, 4, 8, 10, 19],
    // Jogo 312: D2 D3 D4 D6 D8 D9 D10 D11 D12 D13 D14 D15 D17 D18 D19 → remove D1 D5 D7 D16 D20
    [0, 4, 6, 15, 19],
    // Jogo 313: D2 D3 D4 D6 D8 D9 D10 D11 D12 D13 D15 D16 D18 D19 D20 → remove D1 D5 D7 D14 D17
    [0, 4, 6, 13, 16],
    // Jogo 314: D2 D3 D4 D6 D8 D9 D10 D12 D14 D15 D16 D17 D18 D19 D20 → remove D1 D5 D7 D11 D13
    [0, 4, 6, 10, 12],
    // Jogo 315: D2 D3 D4 D6 D8 D10 D11 D12 D13 D14 D15 D16 D17 D18 D20 → remove D1 D5 D7 D9 D19
    [0, 4, 6, 8, 18],
    // Jogo 316: D2 D3 D4 D6 D9 D10 D11 D12 D13 D14 D15 D16 D17 D19 D20 → remove D1 D5 D7 D8 D18
    [0, 4, 6, 7, 17],
    // Jogo 317: D2 D3 D4 D7 D8 D9 D10 D11 D13 D14 D15 D16 D17 D19 D20 → remove D1 D5 D6 D12 D18
    [0, 4, 5, 11, 17],
    // Jogo 318: D2 D3 D4 D7 D8 D9 D10 D11 D14 D15 D16 D17 D18 D19 D20 → remove D1 D5 D6 D12 D13
    [0, 4, 5, 11, 12],
    // Jogo 319: D2 D3 D4 D7 D8 D9 D11 D12 D13 D14 D16 D17 D18 D19 D20 → remove D1 D5 D6 D10 D15
    [0, 4, 5, 9, 14],
    // Jogo 320: D2 D3 D4 D7 D8 D10 D11 D12 D13 D14 D15 D16 D17 D18 D19 → remove D1 D5 D6 D9 D20
    [0, 4, 5, 8, 19],
    // Jogo 321: D2 D3 D4 D8 D9 D10 D11 D12 D13 D14 D15 D16 D18 D19 D20 → remove D1 D5 D6 D7 D17
    [0, 4, 5, 6, 16],
    // Jogo 322: D2 D3 D5 D6 D7 D8 D9 D10 D11 D12 D13 D17 D18 D19 D20 → remove D1 D4 D14 D15 D16
    [0, 3, 13, 14, 15],
    // Jogo 323: D2 D3 D5 D6 D7 D8 D9 D10 D11 D13 D15 D16 D17 D18 D20 → remove D1 D4 D12 D14 D19
    [0, 3, 11, 13, 18],
    // Jogo 324: D2 D3 D5 D6 D7 D8 D9 D12 D13 D14 D15 D16 D18 D19 D20 → remove D1 D4 D10 D11 D17
    [0, 3, 9, 10, 16],
    // Jogo 325: D2 D3 D5 D6 D7 D8 D10 D11 D12 D13 D14 D16 D17 D18 D20 → remove D1 D4 D9 D15 D19
    [0, 3, 8, 14, 18],
    // Jogo 326: D2 D3 D5 D6 D7 D8 D10 D11 D13 D14 D15 D17 D18 D19 D20 → remove D1 D4 D9 D12 D16
    [0, 3, 8, 11, 15],
    // Jogo 327: D2 D3 D5 D6 D8 D9 D11 D12 D13 D14 D15 D16 D17 D18 D19 → remove D1 D4 D7 D10 D20
    [0, 3, 6, 9, 19],
    // Jogo 328: D2 D3 D5 D6 D8 D9 D10 D11 D12 D13 D14 D16 D17 D18 D19 → remove D1 D4 D7 D15 D20
    [0, 3, 6, 14, 19],
    // Jogo 329: D2 D3 D5 D7 D8 D9 D10 D11 D12 D13 D15 D17 D18 D19 D20 → remove D1 D4 D6 D14 D16
    [0, 3, 5, 13, 15],
    // Jogo 330: D2 D3 D5 D7 D8 D10 D11 D12 D13 D14 D15 D16 D17 D18 D20 → remove D1 D4 D6 D9 D19
    [0, 3, 5, 8, 18],
    // Jogo 331: D2 D3 D5 D8 D9 D10 D11 D12 D13 D14 D15 D16 D18 D19 D20 → remove D1 D4 D6 D7 D17
    [0, 3, 5, 6, 16],
    // Jogo 332: D2 D3 D6 D7 D8 D9 D10 D11 D12 D13 D14 D15 D16 D18 D19 → remove D1 D4 D5 D17 D20
    [0, 3, 4, 16, 19],
    // Jogo 333: D2 D3 D6 D7 D8 D9 D10 D11 D12 D13 D14 D15 D17 D18 D20 → remove D1 D4 D5 D16 D19
    [0, 3, 4, 15, 18],
    // Jogo 334: D2 D3 D6 D7 D8 D9 D10 D11 D13 D14 D16 D17 D18 D19 D20 → remove D1 D4 D5 D12 D15
    [0, 3, 4, 11, 14],
    // Jogo 335: D2 D3 D6 D7 D8 D10 D11 D12 D13 D15 D16 D17 D18 D19 D20 → remove D1 D4 D5 D9 D14
    [0, 3, 4, 8, 13],
    // Jogo 336: D2 D3 D6 D8 D9 D10 D12 D13 D14 D15 D16 D17 D18 D19 D20 → remove D1 D4 D5 D7 D11
    [0, 3, 4, 6, 10],
    // Jogo 337: D2 D3 D7 D8 D9 D11 D12 D13 D14 D15 D16 D17 D18 D19 D20 → remove D1 D4 D5 D6 D10
    [0, 3, 4, 5, 9],
    // Jogo 338: D2 D4 D5 D6 D7 D8 D9 D10 D11 D12 D13 D17 D18 D19 D20 → remove D1 D3 D14 D15 D16
    [0, 2, 13, 14, 15],
    // Jogo 339: D2 D4 D5 D6 D7 D8 D9 D10 D11 D13 D15 D16 D17 D18 D20 → remove D1 D3 D12 D14 D19
    [0, 2, 11, 13, 18],
    // Jogo 340: D2 D4 D5 D6 D7 D8 D9 D12 D13 D14 D15 D16 D18 D19 D20 → remove D1 D3 D10 D11 D17
    [0, 2, 9, 10, 16],
    // Jogo 341: D2 D4 D5 D6 D7 D8 D10 D11 D12 D13 D14 D16 D17 D18 D20 → remove D1 D3 D9 D15 D19
    [0, 2, 8, 14, 18],
    // Jogo 342: D2 D4 D5 D6 D7 D8 D10 D11 D13 D14 D15 D17 D18 D19 D20 → remove D1 D3 D9 D12 D16
    [0, 2, 8, 11, 15],
    // Jogo 343: D2 D4 D5 D6 D8 D9 D11 D12 D13 D14 D15 D16 D17 D18 D19 → remove D1 D3 D7 D10 D20
    [0, 2, 6, 9, 19],
    // Jogo 344: D2 D4 D5 D6 D8 D9 D10 D11 D12 D13 D14 D16 D17 D18 D19 → remove D1 D3 D7 D15 D20
    [0, 2, 6, 14, 19],
    // Jogo 345: D2 D4 D5 D7 D8 D9 D10 D11 D12 D13 D15 D17 D18 D19 D20 → remove D1 D3 D6 D14 D16
    [0, 2, 5, 13, 15],
    // Jogo 346: D2 D4 D5 D7 D8 D10 D11 D12 D13 D14 D15 D16 D17 D18 D20 → remove D1 D3 D6 D9 D19
    [0, 2, 5, 8, 18],
    // Jogo 347: D2 D4 D5 D8 D9 D10 D11 D12 D13 D14 D15 D16 D18 D19 D20 → remove D1 D3 D6 D7 D17
    [0, 2, 5, 6, 16],
    // Jogo 348: D2 D5 D6 D7 D8 D9 D10 D11 D12 D14 D15 D16 D17 D19 D20 → remove D1 D3 D4 D13 D18
    [0, 2, 3, 12, 17],
    // Jogo 349: D2 D5 D6 D7 D8 D9 D10 D11 D13 D14 D16 D17 D18 D19 D20 → remove D1 D3 D4 D12 D15
    [0, 2, 3, 11, 14],
    // Jogo 350: D2 D5 D7 D8 D9 D11 D12 D13 D14 D15 D16 D17 D18 D19 D20 → remove D1 D3 D4 D6 D10
    [0, 2, 3, 5, 9],
  ],
};
