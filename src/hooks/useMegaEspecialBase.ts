import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { ConcursoMega } from "@/lib/megaEspecialEngine";

/**
 * Hook único que carrega TODOS os concursos da Mega-Sena.
 * Usado pela engine para alimentar slides admin e tabelas públicas.
 * Cache de 1h.
 */
export function useMegaEspecialBase() {
  return useQuery<ConcursoMega[]>({
    queryKey: ["mega-especial-base"],
    staleTime: 60 * 60 * 1000,
    gcTime: 2 * 60 * 60 * 1000,
    queryFn: async () => {
      const all: ConcursoMega[] = [];
      const PAGE = 1000;
      let from = 0;
      while (true) {
        const { data, error } = await (supabase as any)
          .from("resultados_loterias")
          .select("concurso, data_sorteio, dezenas")
          .eq("loteria", "megasena")
          .order("concurso", { ascending: true })
          .range(from, from + PAGE - 1);
        if (error) throw error;
        if (!data || data.length === 0) break;
        all.push(...data);
        if (data.length < PAGE) break;
        from += PAGE;
      }
      return all;
    },
  });
}
