import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ResultadoMegaSena {
  id: string;
  concurso_id: number;
  data_sorteio: string;
  dezenas: number[];
  acumulou: boolean | null;
  valor_acumulado: number | null;
  valor_estimado_proximo: number | null;
  qtd_pares: number | null;
  qtd_impares: number | null;
  qtd_primos: number | null;
  qtd_moldura: number | null;
  qtd_repetidas: number | null;
}

export function useMegaSenaResultados(limit: number = 50) {
  return useQuery({
    queryKey: ["megasena-resultados", limit],
    queryFn: async (): Promise<ResultadoMegaSena[]> => {
      const { data, error } = await (supabase as any)
        .from("resultados_loterias")
        .select("id, concurso, data_sorteio, dezenas, acumulou, valor_acumulado, valor_estimado_proximo, qtd_pares, qtd_impares, qtd_primos, qtd_moldura, qtd_repetidas")
        .eq("loteria", "megasena")
        .order("concurso", { ascending: false })
        .limit(limit);

      if (error) {
        throw new Error(error.message);
      }

      return (data || []).map((r: any) => ({ ...r, concurso_id: r.concurso })) as ResultadoMegaSena[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

export function useMegaSenaUltimoResultado() {
  return useQuery({
    queryKey: ["megasena-ultimo-resultado"],
    queryFn: async (): Promise<ResultadoMegaSena | null> => {
      const { data, error } = await (supabase as any)
        .from("resultados_loterias")
        .select("id, concurso, data_sorteio, dezenas, acumulou, valor_acumulado, valor_estimado_proximo, qtd_pares, qtd_impares, qtd_primos, qtd_moldura, qtd_repetidas")
        .eq("loteria", "megasena")
        .order("concurso", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        throw new Error(error.message);
      }

      if (!data) return null;
      return { ...data, concurso_id: data.concurso } as ResultadoMegaSena | null;
    },
    staleTime: 5 * 60 * 1000,
  });
}
