import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useLotomaniaResultados(limit: number = 200) {
  return useQuery({
    queryKey: ["resultados-lotomania", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("resultados_lotomania")
        .select("*")
        .order("concurso", { ascending: false })
        .limit(limit);

      if (error) throw new Error(error.message);
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });
}
