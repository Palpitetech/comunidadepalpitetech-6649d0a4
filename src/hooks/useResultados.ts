import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Loteria = "lotofacil" | "megasena" | "duplasena" | "quina" | "lotomania" | "diadesorte";

export interface ResultadoUnificado {
  id: string;
  loteria: string;
  concurso: number;
  data_sorteio: string;
  dezenas: number[];
  dezenas_sorteio2: number[] | null;
  acumulou: boolean | null;
  valor_acumulado: number | null;
  valor_estimado_proximo: number | null;
  valor_acumulado_especial: number | null;
  valor_premio_principal: number | null;
  data_proximo_concurso: string | null;
  premiacao_json: unknown;
  locais_ganhadores: unknown;
  local_sorteio: string | null;
  mes_sorte: string | null;
  qtd_pares: number | null;
  qtd_impares: number | null;
  qtd_moldura: number | null;
  qtd_primos: number | null;
  qtd_repetidas: number | null;
  qtd_pares_s2: number | null;
  qtd_impares_s2: number | null;
  qtd_moldura_s2: number | null;
  qtd_primos_s2: number | null;
  qtd_repetidas_s2: number | null;
  soma: number | null;
  sequencias: number | null;
  qtd_fibonacci: number | null;
  soma_s2: number | null;
  sequencias_s2: number | null;
  qtd_fibonacci_s2: number | null;
  ciclo_numero: number | null;
  dezenas_faltantes_ciclo: number[] | null;
  created_at: string;
}

/**
 * Hook para buscar resultados de qualquer loteria da tabela unificada.
 * Paginação no cliente com limit.
 */
export function useResultados(loteria: Loteria, limit: number = 200) {
  return useQuery({
    queryKey: ["resultados-loterias", loteria, limit],
    queryFn: async (): Promise<ResultadoUnificado[]> => {
      const tableName = loteria === "lotofacil" ? "resultados" : "resultados_loterias";
      let query = (supabase as any).from(tableName).select("*");
      
      if (loteria !== "lotofacil") {
        query = query.eq("loteria", loteria);
      }
      
      const { data, error } = await query
        .order(loteria === "lotofacil" ? "concurso_id" : "concurso", { ascending: false })
        .limit(limit);

      if (error) throw new Error(error.message);
      return (data || []) as ResultadoUnificado[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook com paginação server-side (para Lotofácil que tem muitos dados).
 */
export function useResultadosPaginados(
  loteria: Loteria,
  page: number,
  itemsPerPage: number,
  filters?: { searchConcurso?: string; dateFilter?: string }
) {
  return useQuery({
    queryKey: ["resultados-loterias-pag", loteria, page, itemsPerPage, filters],
    queryFn: async () => {
      let query = (supabase as any)
        .from("resultados_loterias")
        .select("*", { count: "exact" })
        .eq("loteria", loteria)
        .order("concurso", { ascending: false });

      if (filters?.searchConcurso?.trim()) {
        const num = parseInt(filters.searchConcurso.trim());
        if (!isNaN(num)) query = query.eq("concurso", num);
      }

      if (filters?.dateFilter) {
        query = query.eq("data_sorteio", filters.dateFilter);
      }

      const from = (page - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;
      if (error) throw error;

      return {
        resultados: (data || []) as ResultadoUnificado[],
        totalCount: count ?? 0,
      };
    },
  });
}
