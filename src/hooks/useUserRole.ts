import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";

type AppRole = "user" | "premium" | "moderator" | "admin";

export function useUserRole() {
  const { user } = useAuthContext();
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRoles() {
      if (!user) {
        setRoles([]);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id);

        if (error) throw error;

        setRoles((data || []).map((r) => r.role as AppRole));
      } catch (error) {
        console.error("Erro ao buscar roles:", error);
        setRoles([]);
      } finally {
        setLoading(false);
      }
    }

    fetchRoles();
  }, [user]);

  const hasRole = (role: AppRole): boolean => {
    return roles.includes(role);
  };

  const isAdmin = hasRole("admin");
  const isModerator = hasRole("moderator") || isAdmin;
  const isPremium = hasRole("premium") || isModerator;

  return {
    roles,
    loading,
    hasRole,
    isAdmin,
    isModerator,
    isPremium,
  };
}
