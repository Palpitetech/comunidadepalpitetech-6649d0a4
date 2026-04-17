import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ResultadoUnificado } from "./useResultados";

export function useLatestResults() {
  return useQuery({
    queryKey: ["latest-results"],
    queryFn: async (): Promise<ResultadoUnificado[]> => {
      // Fetch latest results for each lottery from the unified table
      const { data, error } = await supabase
        .from("resultados_loterias")
        .select("*")
        .order("concurso", { ascending: false })
        .limit(100);

      if (error) throw error;

      const latestByLottery: Record<string, ResultadoUnificado> = {};
      const lotteriesOrder = ["megasena", "lotofacil", "quina", "duplasena", "lotomania", "diadesorte"];
      
      (data || []).forEach((item: any) => {
        if (!latestByLottery[item.loteria]) {
          latestByLottery[item.loteria] = item;
        }
      });

      // Sort by the predefined order
      return lotteriesOrder
        .filter(lot => !!latestByLottery[lot])
        .map(lot => latestByLottery[lot]);
    },
    staleTime: 5 * 60 * 1000,
  });
}

