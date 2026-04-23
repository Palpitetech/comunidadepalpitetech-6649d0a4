// =============================================================================
// Tipos compartilhados dos motores de geração de palpites.
// Re-exporta BaseGeracao do guide-post para evitar duplicação.
// =============================================================================

export type { BaseGeracao } from "../guide-post/types.ts";

export interface DezenaInfo {
  dezenas: number[];
  motivo: string;
}

export interface FiltroInfo {
  filtro: string;
  valor_alvo?: string;
  motivo: string;
}

export interface EstrategiaData {
  ferramentas: string[];
  dezenas_fixas?: DezenaInfo[];
  dezenas_evitadas?: DezenaInfo[];
  filtros_aplicados: FiltroInfo[];
  conclusao: string;
}

/** Filtros que o usuário pode mandar do front (todos opcionais). */
export interface FiltrosUsuario {
  dezenasFixas?: number[];
  dezenasExcluidas?: number[];
  pedidoEspecial?: string;
}

export interface JogoGerado {
  dezenas: number[];
}
