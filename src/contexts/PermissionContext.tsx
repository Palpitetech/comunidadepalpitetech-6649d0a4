import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import type { FeatureKey, Plan, PlanFeatures } from "@/types/plans";

type AppRole = "user" | "premium" | "moderator" | "admin";

interface PermissionContextType {
  // Roles
  roles: AppRole[];
  isAdmin: boolean;
  isModerator: boolean;
  isPremium: boolean;
  hasRole: (role: AppRole) => boolean;
  // Permissions
  plan: Plan | null;
  customFeatures: PlanFeatures | null;
  isBlocked: boolean;
  loading: boolean;
  hasPermission: (feature: FeatureKey) => boolean;
}

const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

export function PermissionProvider({ children }: { children: React.ReactNode }) {
  const { user, profile, loading: authLoading } = useAuthContext();

  const [roles, setRoles] = useState<AppRole[]>([]);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [customFeatures, setCustomFeatures] = useState<PlanFeatures | null>(null);
  const [isBlocked, setIsBlocked] = useState(false);
  const [rolesLoading, setRolesLoading] = useState(true);
  // Track which user_id roles were fetched for to prevent race condition
  const [fetchedForUserId, setFetchedForUserId] = useState<string | null>(null);
  // Loading is true if auth is loading, roles are loading, OR user changed but roles haven't been re-fetched yet
  const loading = authLoading || rolesLoading || (!!user?.id && fetchedForUserId !== user.id);

  useEffect(() => {
    let cancelled = false;

    async function fetchAll() {
      if (!user) {
        setRoles([]);
        setPlan(null);
        setCustomFeatures(null);
        setIsBlocked(false);
        setFetchedForUserId(null);
        setRolesLoading(false);
        return;
      }

      try {
        // Single parallel fetch for roles + perfil data
        const [rolesRes, perfilRes] = await Promise.all([
          supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", user.id),
          supabase
            .from("perfis")
            .select("plan_id, custom_features, is_blocked, status_assinatura, validade_assinatura")
            .eq("id", user.id)
            .single(),
        ]);

        if (cancelled) return;

        // Process roles
        const fetchedRoles = (rolesRes.data || []).map((r) => r.role as AppRole);
        setRoles(fetchedRoles);

        // Process perfil
        if (perfilRes.error) {
          console.error("Erro ao buscar perfil:", perfilRes.error);
          setRolesLoading(false);
          return;
        }

        const perfilData = perfilRes.data;
        setIsBlocked(perfilData?.is_blocked || false);
        setCustomFeatures(perfilData?.custom_features as PlanFeatures | null);

        // Fetch plan if assigned
        if (perfilData?.plan_id) {
          const { data: planRow, error: planError } = await supabase
            .from("plans")
            .select("*")
            .eq("id", perfilData.plan_id)
            .single();

          if (cancelled) return;

          if (!planError && planRow) {
            setPlan({
              ...planRow,
              price: Number(planRow.price),
              features: planRow.features as PlanFeatures,
            });
          } else {
            setPlan(null);
          }
        } else {
          setPlan(null);
        }
      } catch (error) {
        console.error("Erro ao buscar permissões:", error);
      } finally {
        if (!cancelled) {
          setFetchedForUserId(user.id);
          setRolesLoading(false);
        }
      }
    }

    setRolesLoading(true);
    fetchAll();

    return () => { cancelled = true; };
  }, [user?.id]);

  const isAdmin = useMemo(() => roles.includes("admin"), [roles]);
  const isModerator = useMemo(() => roles.includes("moderator") || isAdmin, [roles, isAdmin]);
  const isPremium = useMemo(() => roles.includes("premium") || isModerator, [roles, isModerator]);

  const hasRole = useCallback((role: AppRole) => roles.includes(role), [roles]);

  const hasPermission = useCallback(
    (feature: FeatureKey): boolean => {
      if (isBlocked) return false;
      if (!user) return false;
      if (isAdmin) return true;

      // 1. custom_features override
      if (customFeatures && feature in customFeatures) {
        return customFeatures[feature] === true;
      }

      // 2. plan features
      if (plan?.features && feature in plan.features) {
        return plan.features[feature] === true;
      }

      // 3. default: no permission
      return false;
    },
    [isBlocked, isAdmin, customFeatures, plan, user]
  );

  const value = useMemo<PermissionContextType>(
    () => ({
      roles,
      isAdmin,
      isModerator,
      isPremium,
      hasRole,
      plan,
      customFeatures,
      isBlocked,
      loading,
      hasPermission,
    }),
    [roles, isAdmin, isModerator, isPremium, hasRole, plan, customFeatures, isBlocked, loading, hasPermission]
  );

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
}

export function usePermissionContext() {
  const context = useContext(PermissionContext);
  if (context === undefined) {
    throw new Error("usePermissionContext must be used within a PermissionProvider");
  }
  return context;
}
