import type { FeatureKey } from "@/types/plans";

/**
 * Maps route paths to the feature key required to access them.
 * Routes not listed here are considered free/accessible.
 */
export const ROUTE_FEATURE_MAP: Record<string, FeatureKey> = {
  // Lotofácil
  "/tendencias": "tendencias",
  "/linhas-colunas": "linhas_colunas",
  "/frequencia": "quentes_frias",
  "/frequencia-dezenas": "frequencia_dezenas",
  "/dezenas-por-posicao": "dezenas_por_posicao",
  "/tabela-movimentacao": "tabela_movimentacao",
  "/analise-do-dia": "analise_do_dia",
  // "/smart-gerador": "gerador", // Gerador is now self-managed to allow free usage and trial offers
  "/desdobramento": "desdobramento",
  "/fechamento": "fechamento",

  // Mega Sena
  "/megasena/tendencias": "tendencias",
  "/megasena/linhas-colunas": "linhas_colunas",
  "/megasena/frequencia": "quentes_frias",
  "/megasena/frequencia-dezenas": "frequencia_dezenas",
  "/megasena/dezenas-por-posicao": "dezenas_por_posicao",
  "/megasena/tabela-movimentacao": "tabela_movimentacao",
  "/megasena/analise-do-dia": "analise_do_dia",
  // "/megasena/gerador": "gerador",
  "/megasena/desdobramento": "desdobramento",
  "/megasena/fechamento": "fechamento",

  // Dupla Sena
  "/duplasena/tendencias": "tendencias",
  "/duplasena/linhas-colunas": "linhas_colunas",
  "/duplasena/frequencia": "quentes_frias",
  "/duplasena/frequencia-dezenas": "frequencia_dezenas",
  "/duplasena/dezenas-por-posicao": "dezenas_por_posicao",
  "/duplasena/tabela-movimentacao": "tabela_movimentacao",
  "/duplasena/analise-do-dia": "analise_do_dia",
  // "/duplasena/gerador": "gerador",
  "/duplasena/desdobramento": "desdobramento",
  "/duplasena/fechamento": "fechamento",

  // Quina
  "/quina/tendencias": "tendencias",
  "/quina/linhas-colunas": "linhas_colunas",
  "/quina/frequencia": "quentes_frias",
  "/quina/frequencia-dezenas": "frequencia_dezenas",
  "/quina/dezenas-posicao": "dezenas_por_posicao",
  "/quina/tabela-movimentacao": "tabela_movimentacao",
  "/quina/analise-do-dia": "analise_do_dia",
  // "/quina/gerador": "gerador",
  "/quina/desdobramento": "desdobramento",

  // Outros
  "/meus-palpites": "palpites_salvos",
  "/convites": "comunidade_full",
};

// Features exclusive to VIP Annual plan
export const VIP_ONLY_FEATURES: FeatureKey[] = [
  "chat_estatisticas",
  "chat_boloes",
  "guias",
];

export function getFeatureForRoute(path: string): FeatureKey | null {
  return ROUTE_FEATURE_MAP[path] || null;
}

export function isVipFeature(feature: FeatureKey): boolean {
  return VIP_ONLY_FEATURES.includes(feature);
}
