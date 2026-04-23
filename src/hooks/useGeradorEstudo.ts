import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { EstrategiaData } from "@/components/gerador/EstrategiaCard";

export interface JogoGeradoEstudo {
  dezenas: number[];
}

export interface BaseadoEm {
  post_id: string;
  titulo: string | null;
  loteria: string;
  loteria_tag: string;
  tema: string;
  tema_label: string;
  ultimo_concurso: number;
  proximo_concurso: number;
}

export interface GeradorEstudoResult {
  jogos: JogoGeradoEstudo[];
  estrategia: EstrategiaData;
  baseado_em: BaseadoEm;
  remaining_today: number;
  max_per_day: number;
}

export function useGeradorEstudo() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<GeradorEstudoResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const generate = async (postId: string, quantidade: number, qtdDezenas: number) => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        "generate-palpites-from-estudo",
        { body: { post_id: postId, quantidade, qtd_dezenas: qtdDezenas } },
      );

      if (fnError) {
        const msg = (fnError as any)?.message || "Erro ao gerar palpites";
        throw new Error(msg);
      }
      if (data?.error) throw new Error(data.error);

      setResult(data as GeradorEstudoResult);
      toast({
        title: "Palpites gerados! 🎲",
        description: `${data.jogos.length} jogo(s) criado(s) com base no estudo.`,
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

  return { isLoading, result, error, generate, reset };
}
