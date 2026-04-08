import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface DezenaEstatisticaQuina {
  dezena: number;
  frequencia: number;
  status: "forte" | "fraca" | "neutra";
}

const TOTAL_DEZENAS = 80;

interface Concurso {
  dezenas: number[];
}

export function useFrequenciaDezenasQuina(periodo: number) {
  return useQuery({
    queryKey: ["frequencia-dezenas-quina", periodo],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("resultados_loterias")
        .select("dezenas")
        .eq("loteria", "quina")
        .order("concurso", { ascending: false })
        .limit(periodo);

      if (error) throw error;

      const concursos: Concurso[] = (data || []).map((r: any) => ({
        dezenas: r.dezenas as number[],
      }));

      if (concursos.length === 0) return [];

      const estatisticas: DezenaEstatisticaQuina[] = [];

      for (let dezena = 1; dezena <= TOTAL_DEZENAS; dezena++) {
        const aparicoes = concursos.filter((c) => c.dezenas.includes(dezena)).length;
        const frequencia = Math.round((aparicoes / concursos.length) * 100);
        estatisticas.push({ dezena, frequencia, status: "neutra" });
      }

      // Calcular média e limites dinâmicos
      const allPercents = estatisticas.map((d) => d.frequencia);
      const media = allPercents.reduce((a, b) => a + b, 0) / allPercents.length;
      const limiteForte = media + 8;
      const limiteFraca = media - 8;

      for (const est of estatisticas) {
        if (est.frequencia >= limiteForte) est.status = "forte";
        else if (est.frequencia <= limiteFraca) est.status = "fraca";
        else est.status = "neutra";
      }

      return estatisticas;
    },
  });
}
