import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface JogoGerado {
  dezenas: number[];
}

export interface GeradorResult {
  jogos: JogoGerado[];
  estrategia: string;
  remaining_today: number;
  max_per_day: number;
}

export function useGerador() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<GeradorResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const generatePalpites = async (quantidade: number) => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        throw new Error("Você precisa estar logado para gerar palpites");
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-palpites`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionData.session.access_token}`,
          },
          body: JSON.stringify({ quantidade }),
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
