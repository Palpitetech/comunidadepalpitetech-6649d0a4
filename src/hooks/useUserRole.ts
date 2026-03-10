import { usePermissionContext } from "@/contexts/PermissionContext";

/**
 * @deprecated Use usePermissionContext() directly instead.
 * Kept for backward compatibility — delegates to PermissionContext.
 */
export function useUserRole() {
  const ctx = usePermissionContext();
  return {
    roles: ctx.roles,
    loading: ctx.loading,
    hasRole: ctx.hasRole,
    isAdmin: ctx.isAdmin,
    isModerator: ctx.isModerator,
    isPremium: ctx.isPremium,
  };
}
