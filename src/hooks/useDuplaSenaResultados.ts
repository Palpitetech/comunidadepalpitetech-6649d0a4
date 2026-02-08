import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ResultadoDuplaSena {
  id: string;
  concurso_id: number;
  data_sorteio: string;
  dezenas_sorteio1: number[];
  dezenas_sorteio2: number[];
  acumulou: boolean | null;
  valor_acumulado: number | null;
  valor_estimado_proximo: number | null;
  qtd_pares_s1: number | null;
  qtd_impares_s1: number | null;
  qtd_primos_s1: number | null;
  qtd_moldura_s1: number | null;
  qtd_repetidas_s1: number | null;
  qtd_pares_s2: number | null;
  qtd_impares_s2: number | null;
  qtd_primos_s2: number | null;
  qtd_moldura_s2: number | null;
  qtd_repetidas_s2: number | null;
}

export function useDuplaSenaResultados(limit: number = 50) {
  return useQuery({
    queryKey: ["duplasena-resultados", limit],
    queryFn: async (): Promise<ResultadoDuplaSena[]> => {
      const { data, error } = await supabase
        .from("resultados_duplasena")
        .select("*")
        .order("concurso_id", { ascending: false })
        .limit(limit);

      if (error) {
        throw new Error(error.message);
      }

      return (data || []) as ResultadoDuplaSena[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

export function useDuplaSenaUltimoResultado() {
  return useQuery({
    queryKey: ["duplasena-ultimo-resultado"],
    queryFn: async (): Promise<ResultadoDuplaSena | null> => {
      const { data, error } = await supabase
        .from("resultados_duplasena")
        .select("*")
        .order("concurso_id", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        throw new Error(error.message);
      }

      return data as ResultadoDuplaSena | null;
    },
    staleTime: 5 * 60 * 1000,
  });
}
