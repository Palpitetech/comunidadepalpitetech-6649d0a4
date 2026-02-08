import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";

interface UseAutoFillFechamentoResult {
  isLoading: boolean;
  canUse: boolean;
  usageCount: number;
  autoFill: (estrategiaId: string, totalDezenas: number) => Promise<number[] | null>;
  checkUsage: () => Promise<void>;
}

export function useAutoFillFechamento(): UseAutoFillFechamentoResult {
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
  ): Promise<number[] | null> => {
    if (!user) {
      toast({
        title: "Faça login",
        description: "Você precisa estar logado para usar o preenchimento automático.",
        variant: "destructive",
      });
      return null;
    }

    if (!canUse) {
      toast({
        title: "Limite atingido",
        description: "Você já usou o preenchimento automático hoje. Tente novamente amanhã.",
        variant: "destructive",
      });
      return null;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("auto-fill-fechamento", {
        body: { estrategiaId, totalDezenas },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data?.error) {
        if (data.error.includes("Limite")) {
          setUsageCount(1);
        }
        throw new Error(data.error);
      }

      if (!data?.dezenas?.length) {
        throw new Error("Resposta inválida da IA");
      }

      // Atualizar contagem de uso
      if (!isAdmin) {
        setUsageCount((prev) => prev + 1);
      }

      toast({
        title: "Dezenas sugeridas!",
        description: `A IA analisou os últimos 4 concursos e sugeriu ${data.dezenas.length} dezenas.`,
      });

      return data.dezenas;
    } catch (error) {
      console.error("Erro no auto-fill:", error);
      toast({
        title: "Erro ao preencher",
        description: error instanceof Error ? error.message : "Não foi possível gerar sugestões.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    canUse,
    usageCount,
    autoFill,
    checkUsage,
  };
}
