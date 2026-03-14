import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useQuinaResultados(limit: number = 200) {
  return useQuery({
    queryKey: ["resultados-quina", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("resultados_quina")
        .select("*")
        .order("concurso", { ascending: false })
        .limit(limit);

      if (error) throw new Error(error.message);
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });
}
