// =============================================================================
// Registry de engines de loteria.
// Adicionar uma nova loteria = importar o engine + registrar aqui.
// =============================================================================

import type { GuideEngine } from "./types.ts";
import { lotofacilEngine } from "./lotofacil/engine.ts";

export const ENGINES: Record<string, GuideEngine> = {
  lotofacil: lotofacilEngine,
};

export function getEngine(loteria: string): GuideEngine {
  const e = ENGINES[loteria];
  if (!e) throw new Error(`Engine não cadastrada para loteria=${loteria}`);
  return e;
}

export type { GuideEngine, Concurso, CicloHistorico, Fatos } from "./types.ts";
