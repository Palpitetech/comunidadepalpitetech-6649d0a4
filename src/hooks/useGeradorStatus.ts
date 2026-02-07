import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface GeradorStatus {
  remaining_today: number;
  max_per_day: number;
  isLoading: boolean;
  isAdmin: boolean;
}

export function useGeradorStatus() {
  const [status, setStatus] = useState<GeradorStatus>({
    remaining_today: 0,
    max_per_day: 1,
    isLoading: true,
    isAdmin: false,
  });

  const fetchStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setStatus({ remaining_today: 0, max_per_day: 0, isLoading: false, isAdmin: false });
        return;
      }

      // Verificar se é admin
      const { data: adminRole } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .single();
      
      const isAdmin = !!adminRole;

      // Admin tem geração infinita
      if (isAdmin) {
        setStatus({
          remaining_today: 999,
          max_per_day: -1, // -1 = infinito
          isLoading: false,
          isAdmin: true,
        });
        return;
      }

      // Buscar plano do usuário
      const { data: perfil } = await supabase
        .from("perfis")
        .select("plan_id")
        .eq("id", user.id)
        .single();

      let maxPerDay = 1;
      if (perfil?.plan_id) {
        const { data: plan } = await supabase
          .from("plans")
          .select("gerador_max_per_day")
          .eq("id", perfil.plan_id)
          .single();
        
        if (plan?.gerador_max_per_day) {
          maxPerDay = plan.gerador_max_per_day;
        }
      }

      // Buscar uso de hoje
      const today = new Date().toISOString().split("T")[0];
      const { data: usage } = await supabase
        .from("gerador_daily_usage")
        .select("count")
        .eq("user_id", user.id)
        .eq("day", today)
        .single();

      const currentUsage = usage?.count || 0;
      const remaining = Math.max(maxPerDay - currentUsage, 0);

      setStatus({
        remaining_today: remaining,
        max_per_day: maxPerDay,
        isLoading: false,
        isAdmin: false,
      });
    } catch (error) {
      console.error("Erro ao buscar status do gerador:", error);
      setStatus({ remaining_today: 0, max_per_day: 1, isLoading: false, isAdmin: false });
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  return { ...status, refetch: fetchStatus };
}
