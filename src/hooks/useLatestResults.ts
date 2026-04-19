import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ResultadoUnificado } from "./useResultados";

const LOTTERIES = ["megasena", "lotofacil", "quina", "duplasena", "lotomania", "diadesorte"];

export type ResultadoComProximo = ResultadoUnificado & {
  premio_estimado_proximo?: number | null;
  data_proximo_concurso_real?: string | null;
  numero_proximo_concurso?: string | null;
  acumulado_proximo?: boolean | null;
};

export function useLatestResults() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["latest-results"],
    queryFn: async (): Promise<ResultadoComProximo[]> => {
      // Busca em paralelo: últimos resultados + próximos concursos
      const [resultsResponses, proximosRes] = await Promise.all([
        Promise.all(
          LOTTERIES.map((loteria) =>
            supabase
              .from("resultados_loterias")
              .select("*")
              .eq("loteria", loteria)
              .order("concurso", { ascending: false })
              .limit(1)
              .maybeSingle()
          )
        ),
        supabase.from("proximos_concursos").select("*"),
      ]);

      const latestByLottery: Record<string, ResultadoUnificado> = {};
      resultsResponses.forEach((res, idx) => {
        if (res.error) {
          console.error(`Error fetching ${LOTTERIES[idx]}:`, res.error);
          return;
        }
        if (res.data) {
          latestByLottery[LOTTERIES[idx]] = res.data as ResultadoUnificado;
        }
      });

      const proximosByLottery: Record<string, any> = {};
      if (proximosRes.error) {
        console.error("Error fetching proximos_concursos:", proximosRes.error);
      } else if (proximosRes.data) {
        proximosRes.data.forEach((p: any) => {
          proximosByLottery[p.loteria] = p;
        });
      }

      return LOTTERIES
        .filter((lot) => !!latestByLottery[lot])
        .map((lot) => {
          const result = latestByLottery[lot];
          const proximo = proximosByLottery[lot];
          return {
            ...result,
            premio_estimado_proximo: proximo?.premio_estimado ?? null,
            data_proximo_concurso_real: proximo?.data_sorteio ?? null,
            numero_proximo_concurso: proximo?.numero_concurso ?? null,
            acumulado_proximo: proximo?.acumulado ?? null,
          };
        });
    },
    staleTime: 60 * 1000,
  });

  // Realtime: invalida ao receber INSERT/UPDATE em qualquer das duas tabelas
  useEffect(() => {
    const channel = supabase
      .channel("latest-results-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "resultados_loterias" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["latest-results"] });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "proximos_concursos" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["latest-results"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return query;
}
