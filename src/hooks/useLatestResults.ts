import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ResultadoUnificado } from "./useResultados";

const LOTTERIES = ["megasena", "lotofacil", "quina", "duplasena", "lotomania", "diadesorte"];

export function useLatestResults() {
  return useQuery({
    queryKey: ["latest-results"],
    queryFn: async (): Promise<ResultadoUnificado[]> => {
      // Fetch the latest result for each lottery individually to avoid
      // one lottery (with higher contest numbers) dominating a global limit.
      const results = await Promise.all(
        LOTTERIES.map((loteria) =>
          supabase
            .from("resultados_loterias")
            .select("*")
            .eq("loteria", loteria)
            .order("concurso", { ascending: false })
            .limit(1)
            .maybeSingle()
        )
      );

      const latestByLottery: Record<string, ResultadoUnificado> = {};
      results.forEach((res, idx) => {
        if (res.error) {
          console.error(`Error fetching ${LOTTERIES[idx]}:`, res.error);
          return;
        }
        if (res.data) {
          latestByLottery[LOTTERIES[idx]] = res.data as ResultadoUnificado;
        }
      });

      return LOTTERIES
        .filter((lot) => !!latestByLottery[lot])
        .map((lot) => latestByLottery[lot]);
    },
    staleTime: 5 * 60 * 1000,
  });
}
