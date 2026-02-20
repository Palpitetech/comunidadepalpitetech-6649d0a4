import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AiUsageLog {
  id: string;
  created_at: string;
  user_id: string | null;
  bot_persona_id: string | null;
  bot_name: string | null;
  edge_function: string;
  action_type: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  model: string | null;
  cost_usd: number;
  metadata: Record<string, unknown> | null;
}

export interface AdminSettings {
  id: string;
  usd_to_brl: number;
  updated_at: string;
}

export interface UsageSummary {
  totalCostUsd: number;
  totalTokens: number;
  byBot: Record<string, { name: string; costUsd: number; tokens: number; count: number }>;
  byFunction: Record<string, { costUsd: number; tokens: number; count: number }>;
  byUser: Record<string, { costUsd: number; tokens: number; count: number }>;
}

export function useAdminSettings() {
  return useQuery({
    queryKey: ["admin-settings"],
    queryFn: async (): Promise<AdminSettings> => {
      const { data, error } = await supabase
        .from("admin_settings" as any)
        .select("*")
        .eq("id", "default")
        .single();
      if (error) throw error;
      return data as unknown as AdminSettings;
    },
  });
}

export function useAiUsageLogs(filters?: {
  startDate?: string;
  endDate?: string;
  botPersonaId?: string;
  edgeFunction?: string;
  userId?: string;
  limit?: number;
}) {
  return useQuery({
    queryKey: ["ai-usage-logs", filters],
    queryFn: async (): Promise<AiUsageLog[]> => {
      let query = supabase
        .from("ai_usage_logs" as any)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(filters?.limit || 200);

      if (filters?.startDate) {
        query = query.gte("created_at", filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte("created_at", `${filters.endDate}T23:59:59`);
      }
      if (filters?.botPersonaId) {
        query = query.eq("bot_persona_id", filters.botPersonaId);
      }
      if (filters?.edgeFunction) {
        query = query.eq("edge_function", filters.edgeFunction);
      }
      if (filters?.userId) {
        query = query.eq("user_id", filters.userId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as unknown as AiUsageLog[];
    },
  });
}

export function computeSummary(logs: AiUsageLog[]): UsageSummary {
  const summary: UsageSummary = {
    totalCostUsd: 0,
    totalTokens: 0,
    byBot: {},
    byFunction: {},
    byUser: {},
  };

  for (const log of logs) {
    summary.totalCostUsd += Number(log.cost_usd) || 0;
    summary.totalTokens += log.total_tokens || 0;

    // By bot
    const botKey = log.bot_persona_id || "user_action";
    if (!summary.byBot[botKey]) {
      summary.byBot[botKey] = { name: log.bot_name || "Ação de Usuário", costUsd: 0, tokens: 0, count: 0 };
    }
    summary.byBot[botKey].costUsd += Number(log.cost_usd) || 0;
    summary.byBot[botKey].tokens += log.total_tokens || 0;
    summary.byBot[botKey].count++;

    // By function
    if (!summary.byFunction[log.edge_function]) {
      summary.byFunction[log.edge_function] = { costUsd: 0, tokens: 0, count: 0 };
    }
    summary.byFunction[log.edge_function].costUsd += Number(log.cost_usd) || 0;
    summary.byFunction[log.edge_function].tokens += log.total_tokens || 0;
    summary.byFunction[log.edge_function].count++;

    // By user
    const userKey = log.user_id || "system";
    if (!summary.byUser[userKey]) {
      summary.byUser[userKey] = { costUsd: 0, tokens: 0, count: 0 };
    }
    summary.byUser[userKey].costUsd += Number(log.cost_usd) || 0;
    summary.byUser[userKey].tokens += log.total_tokens || 0;
    summary.byUser[userKey].count++;
  }

  return summary;
}
