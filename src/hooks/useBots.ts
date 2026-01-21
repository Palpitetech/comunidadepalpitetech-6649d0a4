import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { BotWithStats, BotSchedule } from "@/types/bots";
import { toast } from "sonner";

export function useBots() {
  const [bots, setBots] = useState<BotWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBots = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("guide_personas")
        .select(`
          *,
          perfis:perfil_id (
            id,
            nome,
            email,
            avatar_url,
            is_bot
          )
        `)
        .order("created_at", { ascending: true });

      if (fetchError) throw fetchError;

      // Type assertion para lidar com o JSONB
      const typedData = (data || []).map((bot) => ({
        ...bot,
        post_schedule: (bot.post_schedule as unknown) as BotSchedule,
        perfis: bot.perfis as BotWithStats["perfis"],
      }));

      setBots(typedData);
    } catch (err) {
      console.error("Erro ao buscar bots:", err);
      setError(err instanceof Error ? err.message : "Erro desconhecido");
      toast.error("Erro ao carregar bots");
    } finally {
      setLoading(false);
    }
  }, []);

  const toggleBotActive = async (botId: string, ativo: boolean) => {
    try {
      const { error } = await supabase
        .from("guide_personas")
        .update({ ativo })
        .eq("id", botId);

      if (error) throw error;
      
      toast.success(ativo ? "Bot ativado" : "Bot desativado");
      fetchBots();
    } catch (err) {
      console.error("Erro ao alterar status:", err);
      toast.error("Erro ao alterar status do bot");
    }
  };

  const deleteBot = async (botId: string, perfilId: string) => {
    try {
      // Primeiro, deletar o guide_personas
      const { error: guideError } = await supabase
        .from("guide_personas")
        .delete()
        .eq("id", botId);

      if (guideError) throw guideError;

      // Depois, deletar o perfil (vai cascade para postagens/comentários)
      const { error: perfilError } = await supabase
        .from("perfis")
        .delete()
        .eq("id", perfilId);

      if (perfilError) {
        console.warn("Perfil não deletado (pode ter dependências):", perfilError);
      }

      toast.success("Bot removido com sucesso");
      fetchBots();
    } catch (err) {
      console.error("Erro ao deletar bot:", err);
      toast.error("Erro ao remover bot");
    }
  };

  useEffect(() => {
    fetchBots();
  }, [fetchBots]);

  return {
    bots,
    loading,
    error,
    refetch: fetchBots,
    toggleBotActive,
    deleteBot,
  };
}
