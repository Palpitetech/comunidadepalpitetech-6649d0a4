import { supabase } from "@/integrations/supabase/client";
import type { EstudoResultado } from "@/lib/megaEspecialEngine";

const CACHE_PREFIX = "mega30narrativa:";

function cacheKey(r: EstudoResultado): string {
  return `${CACHE_PREFIX}${r.meta.engineVersion}:${r.estudoId}:${r.agrupamento}:${r.periodo.tipo}:${r.periodo.valor ?? ""}:${r.topN}`;
}

export async function fetchNarrativaMega30(
  resultado: EstudoResultado,
): Promise<string> {
  const key = cacheKey(resultado);
  try {
    const cached = localStorage.getItem(key);
    if (cached) return cached;
  } catch { /* ignore */ }

  const { data, error } = await supabase.functions.invoke("mega30-narrativa", {
    body: { resultado },
  });
  if (error) throw error;
  const narrativa = (data as any)?.narrativa as string | undefined;
  if (!narrativa) throw new Error("Narrativa vazia");

  try { localStorage.setItem(key, narrativa); } catch { /* ignore */ }
  return narrativa;
}
