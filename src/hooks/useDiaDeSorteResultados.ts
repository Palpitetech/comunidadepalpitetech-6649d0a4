import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useDiaDeSorteResultados(limit: number = 200) {
  return useQuery({
    queryKey: ["resultados-diadesorte", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("resultados_diadesorte")
        .select("*")
        .order("concurso", { ascending: false })
        .limit(limit);

      if (error) throw new Error(error.message);
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });
}
