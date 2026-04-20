import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Origem = "automatico" | "usuario";

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
  // Enriched fields
  user_name?: string | null;
  user_email?: string | null;
  origem?: Origem;
}

export interface AdminSettings {
  id: string;
  usd_to_brl: number;
  updated_at: string;
}

export interface UsageSummary {
  totalCostUsd: number;
  totalTokens: number;
  totalCalls: number;
  byOrigem: Record<Origem, { costUsd: number; tokens: number; count: number }>;
  byFerramenta: Record<string, { costUsd: number; tokens: number; tokensIn: number; tokensOut: number; count: number; hasUser: boolean; hasAuto: boolean }>;
  byUsuario: Record<string, { name: string; email: string | null; costUsd: number; tokens: number; count: number }>;
  byBot: Record<string, { name: string; costUsd: number; tokens: number; count: number }>;
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
  origem?: Origem | "all";
  limit?: number;
}) {
  return useQuery({
    queryKey: ["ai-usage-logs", filters],
    queryFn: async (): Promise<AiUsageLog[]> => {
      let query = supabase
        .from("ai_usage_logs" as any)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(filters?.limit || 500);

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
      if (filters?.origem === "automatico") {
        query = query.is("user_id", null);
      } else if (filters?.origem === "usuario") {
        query = query.not("user_id", "is", null);
      }

      const { data, error } = await query;
      if (error) throw error;

      const logs = (data || []) as unknown as AiUsageLog[];

      // Collect unique user IDs for JOIN
      const userIds = Array.from(
        new Set(logs.map((l) => l.user_id).filter((id): id is string => !!id))
      );

      let perfilMap = new Map<string, { nome: string | null; email: string | null }>();

      if (userIds.length > 0) {
        const { data: perfis } = await supabase
          .from("perfis")
          .select("id, nome, email")
          .in("id", userIds);
        for (const p of perfis || []) {
          perfilMap.set(p.id, { nome: p.nome, email: p.email });
        }
      }

      // Enrich
      return logs.map((log) => {
        const perfil = log.user_id ? perfilMap.get(log.user_id) : null;
        return {
          ...log,
          user_name: perfil?.nome || null,
          user_email: perfil?.email || null,
          origem: (log.user_id ? "usuario" : "automatico") as Origem,
        };
      });
    },
  });
}

export function computeSummary(logs: AiUsageLog[]): UsageSummary {
  const summary: UsageSummary = {
    totalCostUsd: 0,
    totalTokens: 0,
    totalCalls: 0,
    byOrigem: {
      automatico: { costUsd: 0, tokens: 0, count: 0 },
      usuario: { costUsd: 0, tokens: 0, count: 0 },
    },
    byFerramenta: {},
    byUsuario: {},
    byBot: {},
  };

  for (const log of logs) {
    const cost = Number(log.cost_usd) || 0;
    const tokens = log.total_tokens || 0;

    summary.totalCostUsd += cost;
    summary.totalTokens += tokens;
    summary.totalCalls++;

    // By origem
    const origem: Origem = log.origem || (log.user_id ? "usuario" : "automatico");
    summary.byOrigem[origem].costUsd += cost;
    summary.byOrigem[origem].tokens += tokens;
    summary.byOrigem[origem].count++;

    // By ferramenta (edge function)
    if (!summary.byFerramenta[log.edge_function]) {
      summary.byFerramenta[log.edge_function] = {
        costUsd: 0, tokens: 0, tokensIn: 0, tokensOut: 0, count: 0, hasUser: false, hasAuto: false,
      };
    }
    summary.byFerramenta[log.edge_function].costUsd += cost;
    summary.byFerramenta[log.edge_function].tokens += tokens;
    summary.byFerramenta[log.edge_function].tokensIn += log.prompt_tokens || 0;
    summary.byFerramenta[log.edge_function].tokensOut += log.completion_tokens || 0;
    summary.byFerramenta[log.edge_function].count++;
    if (log.user_id) summary.byFerramenta[log.edge_function].hasUser = true;
    else summary.byFerramenta[log.edge_function].hasAuto = true;

    // By usuario (only when user_id present)
    if (log.user_id) {
      if (!summary.byUsuario[log.user_id]) {
        summary.byUsuario[log.user_id] = {
          name: log.user_name || "Usuário sem nome",
          email: log.user_email || null,
          costUsd: 0,
          tokens: 0,
          count: 0,
        };
      }
      summary.byUsuario[log.user_id].costUsd += cost;
      summary.byUsuario[log.user_id].tokens += tokens;
      summary.byUsuario[log.user_id].count++;
    }

    // By bot (only when bot_persona_id present)
    if (log.bot_persona_id) {
      if (!summary.byBot[log.bot_persona_id]) {
        summary.byBot[log.bot_persona_id] = {
          name: log.bot_name || "Bot",
          costUsd: 0,
          tokens: 0,
          count: 0,
        };
      }
      summary.byBot[log.bot_persona_id].costUsd += cost;
      summary.byBot[log.bot_persona_id].tokens += tokens;
      summary.byBot[log.bot_persona_id].count++;
    }
  }

  return summary;
}
