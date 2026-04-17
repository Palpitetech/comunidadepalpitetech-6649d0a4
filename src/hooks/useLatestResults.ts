import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ResultadoUnificado } from "./useResultados";

export function useLatestResults() {
  return useQuery({
    queryKey: ["latest-results"],
    queryFn: async (): Promise<ResultadoUnificado[]> => {
      // Fetch latest results from both unified table (other lotteries) and lotofacil table
      const [unifiedRes, lotofacilRes] = await Promise.all([
        supabase
          .from("resultados_loterias")
          .select("*")
          .order("concurso", { ascending: false })
          .limit(100),
        (supabase as any)
          .from("resultados")
          .select("*")
          .order("concurso_id", { ascending: false })
          .limit(1),
      ]);

      if (unifiedRes.error) throw unifiedRes.error;
      if (lotofacilRes.error) throw lotofacilRes.error;

      const latestByLottery: Record<string, ResultadoUnificado> = {};

      (unifiedRes.data || []).forEach((item: any) => {
        if (!latestByLottery[item.loteria]) {
          latestByLottery[item.loteria] = item;
        }
      });

      // Add lotofacil from its dedicated table, normalizing field names
      const lotofacilItem = (lotofacilRes.data || [])[0];
      if (lotofacilItem) {
        latestByLottery["lotofacil"] = {
          ...lotofacilItem,
          loteria: "lotofacil",
          concurso: lotofacilItem.concurso_id,
        } as ResultadoUnificado;
      }

      const lotteriesOrder = ["megasena", "lotofacil", "quina", "duplasena", "lotomania", "diadesorte"];

      return lotteriesOrder
        .filter((lot) => !!latestByLottery[lot])
        .map((lot) => latestByLottery[lot]);
    },
    staleTime: 5 * 60 * 1000,
  });
}
