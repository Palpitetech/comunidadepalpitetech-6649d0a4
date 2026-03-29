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

  // Se perfil marca não verificado, redireciona para verificação OTP
  // Mas NÃO redireciona se o usuário está na rota /login (onde o RegisterWizard já mostra o OTP inline)
  if (profile && profile.email_verificado === false) {
    // Verificar se o referrer é a página de login/cadastro - nesse caso o RegisterWizard
    // já está controlando o fluxo de OTP internamente, não devemos sequestrar
    const fromLogin = location.state?.from?.pathname === "/login" || 
                      document.referrer.includes("/login");
    if (!fromLogin) {
      return <Navigate to="/verificar-email" replace />;
    }
  }

  return <>{children}</>;
}
