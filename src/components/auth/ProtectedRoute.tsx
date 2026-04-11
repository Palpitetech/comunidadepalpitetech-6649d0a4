import { Navigate, useLocation } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isAuthenticated, loading, profile } = useAuthContext();
  const location = useLocation();

  // Enquanto carrega, mostra um loading simples
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground text-senior-base">Carregando...</p>
        </div>
      </div>
    );
  }

  // Se não está autenticado, redireciona para login
  if (!isAuthenticated) {
    const isHome = location.pathname === "/home" || location.pathname === "/comunidade";
    return <Navigate to={isHome ? "/" : "/login"} state={{ from: location }} replace />;
  }

  // Verificação de e-mail agora é feita no login via OTP
  // Se o usuário está autenticado, assumimos que o e-mail está verificado ou em processo.

  return <>{children}</>;
}
