import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TOTAL_DEZENAS_VOLANTE } from "@/lib/duplasena";

interface FrequenciaDezena {
  dezena: number;
  frequenciaSorteio1: number;
  frequenciaSorteio2: number;
  frequenciaTotal: number;
}

export function useFrequenciaDuplaSena(periodo: number = 50) {
  return useQuery({
    queryKey: ["frequencia-duplasena", periodo],
    queryFn: async (): Promise<FrequenciaDezena[]> => {
      const { data: resultados, error } = await supabase
        .from("resultados_duplasena")
        .select("dezenas_sorteio1, dezenas_sorteio2")
        .order("concurso_id", { ascending: false })
        .limit(periodo);

      if (error) throw error;
      if (!resultados || resultados.length === 0) return [];

      // Inicializar contagem
      const contagemS1: Record<number, number> = {};
      const contagemS2: Record<number, number> = {};
      
      for (let i = 1; i <= TOTAL_DEZENAS_VOLANTE; i++) {
        contagemS1[i] = 0;
        contagemS2[i] = 0;
      }

      // Contar frequência em cada sorteio
      resultados.forEach((resultado) => {
        resultado.dezenas_sorteio1.forEach((d) => {
          contagemS1[d]++;
        });
        resultado.dezenas_sorteio2.forEach((d) => {
          contagemS2[d]++;
        });
      });

      // Montar array de resultados
      const frequencias: FrequenciaDezena[] = [];
      for (let dezena = 1; dezena <= TOTAL_DEZENAS_VOLANTE; dezena++) {
        frequencias.push({
          dezena,
          frequenciaSorteio1: contagemS1[dezena],
          frequenciaSorteio2: contagemS2[dezena],
          frequenciaTotal: contagemS1[dezena] + contagemS2[dezena],
        });
      }

      return frequencias;
    },
    staleTime: 5 * 60 * 1000,
  });
}
