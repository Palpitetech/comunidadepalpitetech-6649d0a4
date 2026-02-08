/**
 * FC05 - ERRE 5
 * 20 Dezenas | Garantia 14 pontos
 * 
 * ⚠️ IMPORTANTE: A matriz original de 365 jogos NÃO garante 14 pontos matematicamente.
 * Para garantia real de 14 pontos com 20 dezenas (ERRE 5), é necessário um
 * "covering design" C(20, 15, 5) completo, que requer aproximadamente 15504 jogos.
 * 
 * Esta matriz está DESATIVADA até que uma matriz de cobertura otimizada
 * e matematicamente validada seja implementada.
 * 
 * Condição: Se acertar 15 das 20 dezenas escolhidas, garante 14 pontos
 */

import type { MatrizFechamento } from "@/types/fechamento";

/**
 * Matriz FC05 - Temporariamente desativada
 * 
 * O problema: Para garantir 14 pontos quando acertamos 15 de 20 dezenas,
 * precisamos garantir que QUALQUER combinação de 5 erros resulte em pelo
 * menos um jogo com 14+ acertos.
 * 
 * Isso requer um "covering design" que é matematicamente complexo.
 * A matriz simples de 365 jogos falha em ~86% dos cenários aleatórios.
 */
export const FC05: MatrizFechamento = {
  id: "20-14-365",
  nome: "FC05",
  descricao: "ERRE 5 — Fechamento de 20 dezenas (em validação)",
  dezenas: 20,
  garantia: 14,
  dezenasPorJogo: 15,
  condicao: "Se acertar 15 dos 20 números",
  fixasObrigatorias: 0,
  categoria: "avancado",
  // DESATIVADO: Matriz original não cumpre garantia matemática
  ativo: false,
  // Matriz vazia - será implementada com design validado
  matrizRemocoes: [],
};
