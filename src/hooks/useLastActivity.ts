import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Busca a data do último log de IA por categoria, ignorando filtros de período.
 * Útil para empty state inteligente: "última atividade foi em X, amplie o filtro".
 */
export interface LastActivityInfo {
  lastBot: string | null;       // último log com bot_persona_id
  lastUser: string | null;      // último log com user_id
  lastAny: string | null;       // último log de qualquer tipo
  botCount30d: number;          // chamadas de bot nos últimos 30 dias
  userCount30d: number;         // chamadas de usuário nos últimos 30 dias
}

export function useLastActivity() {
  return useQuery({
    queryKey: ["ai-usage-last-activity"],
    queryFn: async (): Promise<LastActivityInfo> => {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();

      const [{ data: lastBotRow }, { data: lastUserRow }, { data: lastAnyRow }, { count: botCount30d }, { count: userCount30d }] = await Promise.all([
        supabase
          .from("ai_usage_logs" as any)
          .select("created_at")
          .not("bot_persona_id", "is", null)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("ai_usage_logs" as any)
          .select("created_at")
          .not("user_id", "is", null)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("ai_usage_logs" as any)
          .select("created_at")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("ai_usage_logs" as any)
          .select("id", { count: "exact", head: true })
          .not("bot_persona_id", "is", null)
          .gte("created_at", thirtyDaysAgo),
        supabase
          .from("ai_usage_logs" as any)
          .select("id", { count: "exact", head: true })
          .not("user_id", "is", null)
          .gte("created_at", thirtyDaysAgo),
      ]);

      return {
        lastBot: (lastBotRow as any)?.created_at || null,
        lastUser: (lastUserRow as any)?.created_at || null,
        lastAny: (lastAnyRow as any)?.created_at || null,
        botCount30d: botCount30d || 0,
        userCount30d: userCount30d || 0,
      };
    },
    staleTime: 60_000, // 1 min
  });
}
