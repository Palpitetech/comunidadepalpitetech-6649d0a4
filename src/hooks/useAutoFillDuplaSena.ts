import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";

export interface DezenaJustificada {
  dezena: number;
  motivo: string;
}

export interface EstrategiaDuplaSena {
  ferramentas: string[];
  dezenas_justificadas: DezenaJustificada[];
  dezenas_evitadas?: { dezenas: number[]; motivo: string }[];
  filtros_aplicados: { filtro: string; valor_alvo?: string; motivo: string }[];
  conclusao: string;
}

interface AutoFillResultDuplaSena {
  dezenas: number[];
  estrategia: EstrategiaDuplaSena | null;
}

export function useAutoFillDuplaSena() {
  const { user } = useAuth();
  const { isAdmin } = useUserRole();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [usageCount, setUsageCount] = useState(0);

  const canUse = isAdmin || usageCount < 1;

  const checkUsage = async () => {
    if (!user) return;
    const today = new Date().toISOString().split("T")[0];
    const { data } = await supabase
      .from("fechamento_auto_usage")
      .select("count")
      .eq("user_id", user.id)
      .eq("day", today)
      .single();
    setUsageCount(data?.count || 0);
  };

  const autoFill = async (
    estrategiaId: string,
    totalDezenas: number
  ): Promise<AutoFillResultDuplaSena | null> => {
    if (!user) {
      toast({ title: "Faça login", description: "Você precisa estar logado para usar o palpite inteligente.", variant: "destructive" });
      return null;
    }
    if (!canUse) {
      toast({ title: "Limite atingido", description: "Você já usou o palpite inteligente hoje. Tente novamente amanhã.", variant: "destructive" });
      return null;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("auto-fill-duplasena", {
        body: { estrategiaId, totalDezenas },
      });

      if (error) throw new Error(error.message);
      if (data?.error) {
        if (data.error.includes("Limite")) setUsageCount(1);
        throw new Error(data.error);
      }
      if (!data?.dezenas?.length) throw new Error("Resposta inválida da IA");

      if (!isAdmin) setUsageCount((prev) => prev + 1);

      toast({
        title: "Palpite gerado!",
        description: `A IA analisou os últimos 10 concursos e sugeriu ${data.dezenas.length} dezenas.`,
      });

      return {
        dezenas: data.dezenas,
        estrategia: data.estrategia || null,
      };
    } catch (error) {
      console.error("Erro no auto-fill Dupla Sena:", error);
      toast({
        title: "Erro ao gerar palpite",
        description: error instanceof Error ? error.message : "Não foi possível gerar sugestões.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { isLoading, canUse, usageCount, autoFill, checkUsage };
}
