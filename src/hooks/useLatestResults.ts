import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ResultadoUnificado } from "./useResultados";

export function useLatestResults() {
  return useQuery({
    queryKey: ["latest-results"],
    queryFn: async (): Promise<ResultadoUnificado[]> => {
      const { data, error } = await supabase.rpc('get_latest_results');
      
      if (error) {
        // Fallback to manual query if RPC doesn't exist
        const { data: queryData, error: queryError } = await supabase
          .from("resultados_loterias")
          .select("*")
          .filter("id", "in", (
            supabase
              .from("resultados_loterias")
              .select("id")
              .order("concurso", { ascending: false })
              .limit(1) // This is tricky in Supabase JS without RPC or subqueries
          ));
          
        // Since Supabase JS doesn't support complex subqueries easily, 
        // let's use a simpler approach: fetch all and filter in JS if needed,
        // or just use a raw query via a function.
        
        // Better: Let's use the query I tested earlier but adapted for JS client
        // Or just fetch the latest 50 and group by lottery in JS.
        
        const { data: latestData, error: latestError } = await supabase
          .from("resultados_loterias")
          .select("*")
          .order("concurso", { ascending: false })
          .limit(100);

        if (latestError) throw latestError;

        const latestByLottery: Record<string, ResultadoUnificado> = {};
        (latestData || []).forEach((item: any) => {
          if (!latestByLottery[item.loteria]) {
            latestByLottery[item.loteria] = item;
          }
        });

        return Object.values(latestByLottery);
      }
      
      return (data || []) as ResultadoUnificado[];
    },
    staleTime: 5 * 60 * 1000,
  });
}
