import { usePermissionContext } from "@/contexts/PermissionContext";
import type { FeatureKey } from "@/types/plans";

/**
 * @deprecated Use usePermissionContext() directly instead.
 * Kept for backward compatibility.
 */
export function usePermissions() {
  return usePermissionContext();
}

/**
 * Hook simplificado para verificar uma única feature.
 */
export function usePermission(feature: FeatureKey): boolean {
  const { hasPermission, loading } = usePermissionContext();
  // Durante o loading, retorna true para evitar flash de bloqueio
  if (loading) return true;
  return hasPermission(feature);
}
