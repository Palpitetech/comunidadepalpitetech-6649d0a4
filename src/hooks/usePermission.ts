import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import type { FeatureKey, Plan, PlanFeatures } from "@/types/plans";

interface PermissionState {
  plan: Plan | null;
  customFeatures: PlanFeatures | null;
  isBlocked: boolean;
  loading: boolean;
}

export function usePermissions() {
  const { user, profile } = useAuthContext();
  const [state, setState] = useState<PermissionState>({
    plan: null,
    customFeatures: null,
    isBlocked: false,
    loading: true,
  });

  useEffect(() => {
    async function fetchPlanData() {
      if (!user || !profile) {
        setState((prev) => ({ ...prev, loading: false }));
        return;
      }

      try {
        // Buscar perfil completo com plan_id
        const { data: perfilData, error: perfilError } = await supabase
          .from("perfis")
          .select("plan_id, custom_features, is_blocked")
          .eq("id", user.id)
          .single();

        if (perfilError) throw perfilError;

        let planData: Plan | null = null;

        if (perfilData?.plan_id) {
          const { data: plan, error: planError } = await supabase
            .from("plans")
            .select("*")
            .eq("id", perfilData.plan_id)
            .single();

          if (!planError && plan) {
            planData = {
              ...plan,
              price: Number(plan.price),
              features: plan.features as PlanFeatures,
            };
          }
        }

        setState({
          plan: planData,
          customFeatures: perfilData?.custom_features as PlanFeatures | null,
          isBlocked: perfilData?.is_blocked || false,
          loading: false,
        });
      } catch (error) {
        console.error("Erro ao buscar dados do plano:", error);
        setState((prev) => ({ ...prev, loading: false }));
      }
    }

    fetchPlanData();
  }, [user, profile]);

  const hasPermission = useCallback(
    (feature: FeatureKey): boolean => {
      // Usuário bloqueado não tem nenhuma permissão
      if (state.isBlocked) return false;

      // Se não está logado, sem permissão
      if (!user) return false;

      // 1. Verificar custom_features primeiro (override individual)
      if (state.customFeatures && feature in state.customFeatures) {
        return state.customFeatures[feature] === true;
      }

      // 2. Senão, usar features do plano
      if (state.plan?.features && feature in state.plan.features) {
        return state.plan.features[feature] === true;
      }

      // 3. Default: sem permissão
      return false;
    },
    [state.isBlocked, state.customFeatures, state.plan, user]
  );

  return {
    ...state,
    hasPermission,
  };
}

// Hook simplificado para verificar uma única feature
export function usePermission(feature: FeatureKey): boolean {
  const { hasPermission, loading } = usePermissions();
  
  // Durante o loading, retorna false por segurança
  if (loading) return false;
  
  return hasPermission(feature);
}
