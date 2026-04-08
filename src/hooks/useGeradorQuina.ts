import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { EstrategiaData } from "@/components/gerador/EstrategiaCard";

export interface JogoGeradoQuina {
  dezenas: number[];
}

export interface GeradorQuinaResult {
  jogos: JogoGeradoQuina[];
  estrategia: EstrategiaData;
  remaining_today: number;
  max_per_day: number;
}

export interface FiltrosGeradorQuina {
  dezenasFiexas?: number[];
  dezenasExcluidas?: number[];
  pedidoEspecial?: string;
}

export function useGeradorQuina() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<GeradorQuinaResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const generatePalpites = async (
    quantidade: number,
    periodoAnalise: number = 50,
    filtros?: FiltrosGeradorQuina
  ) => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        throw new Error("Você precisa estar logado para gerar palpites");
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-palpites-quina`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionData.session.access_token}`,
          },
          body: JSON.stringify({
            quantidade,
            periodoAnalise,
            dezenasFiexas: filtros?.dezenasFiexas,
            dezenasExcluidas: filtros?.dezenasExcluidas,
            pedidoEspecial: filtros?.pedidoEspecial,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error(data.error || "Limite diário atingido. Tente novamente amanhã.");
        }
        throw new Error(data.error || "Erro ao gerar palpites");
      }

      setResult(data);
      toast({
        title: "Palpites gerados! 🎲",
        description: `${data.jogos.length} jogo(s) criado(s) com sucesso.`,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro desconhecido";
      setError(message);
      toast({
        title: "Erro ao gerar palpites",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setResult(null);
    setError(null);
  };

  return {
    isLoading,
    result,
    error,
    generatePalpites,
    reset,
  };
}
