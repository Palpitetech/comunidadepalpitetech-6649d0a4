import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { subDays } from "date-fns";

export interface AdminBadges {
  usuarios: number;
  pagamentos: number;
  resgates: number;
  chat: number;
}

/**
 * Agrega contadores de itens que precisam de atenção do admin.
 * - usuarios: cadastros nas últimas 24h
 * - pagamentos: bolões aguardando pagamento (task_pago = false e status ativo)
 * - resgates: solicitações de resgate pendentes
 */
export function useAdminBadges() {
  return useQuery<AdminBadges>({
    queryKey: ["admin-sidebar-badges"],
    queryFn: async () => {
      const since24h = subDays(new Date(), 1).toISOString();

      const [usuariosRes, pagamentosRes, resgatesRes, chatRes] = await Promise.all([
        supabase
          .from("perfis")
          .select("id", { count: "exact", head: true })
          .gte("created_at", since24h),
        supabase
          .from("boloes")
          .select("id", { count: "exact", head: true })
          .eq("task_pago", false),
        supabase
          .from("bolao_resgates")
          .select("id", { count: "exact", head: true })
          .eq("status", "pendente"),
        supabase
          .from("whatsapp_chat_conversations")
          .select("unread_count")
          .gt("unread_count", 0),
      ]);

      const chatCount = (chatRes.data || []).reduce((acc, curr) => acc + (curr.unread_count || 0), 0);

      return {
        usuarios: usuariosRes.count ?? 0,
        pagamentos: pagamentosRes.count ?? 0,
        resgates: resgatesRes.count ?? 0,
        chat: chatCount,
      };
    },
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}
