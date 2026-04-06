import { Navigate } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { Loader2 } from "lucide-react";

interface AdminRouteProps {
  children: React.ReactNode;
}

export function AdminRoute({ children }: AdminRouteProps) {
  const { user, loading: authLoading } = useAuthContext();
  const { isAdmin, loading: roleLoading, roles } = useUserRole();

  const isLoading = authLoading || roleLoading;

  // Debug temporário
  console.log("[AdminRoute]", {
    authLoading,
    roleLoading,
    isLoading,
    userId: user?.id ?? null,
    roles,
    isAdmin,
  });

  // Aguarda carregamento
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Não autenticado
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Não é admin
  if (!isAdmin) {
    console.warn("[AdminRoute] Redirect to /home — user is NOT admin", { userId: user.id, roles });
    return <Navigate to="/home" replace />;
  }

  return <>{children}</>;
}
