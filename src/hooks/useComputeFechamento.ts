import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface FechamentoResult {
  jogos: number[][];
  estrategia: string;
  totalDezenas: number;
  garantia: number;
  nomeMatriz: string;
}

export function useComputeFechamento() {
  const [isComputing, setIsComputing] = useState(false);

  const compute = useCallback(async (
    loteria: "lotofacil" | "megasena" | "duplasena",
    estrategiaId: string,
    dezenas: number[]
  ): Promise<FechamentoResult | null> => {
    setIsComputing(true);
    try {
      const { data, error } = await supabase.functions.invoke("compute-fechamento", {
        body: { loteria, estrategiaId, dezenas },
      });

      if (error) {
        console.error("Erro ao computar fechamento:", error);
        toast.error("Erro ao gerar fechamento. Tente novamente.");
        return null;
      }

      if (data?.error) {
        toast.error(data.error);
        return null;
      }

      return data as FechamentoResult;
    } catch (err) {
      console.error("Erro ao computar fechamento:", err);
      toast.error("Erro ao gerar fechamento. Tente novamente.");
      return null;
    } finally {
      setIsComputing(false);
    }
  }, []);

  return { compute, isComputing };
}
