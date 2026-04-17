import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import { LoginWizard } from "@/components/auth/LoginWizard";
import { Loader2, ArrowLeft } from "lucide-react";

export default function Auth() {
  const { isAuthenticated, loading, profile } = useAuthContext();
  const navigate = useNavigate();

  useEffect(() => {
    // Redireciona se autenticado e tiver nome (perfil completo)
    if (isAuthenticated && profile?.nome) {
      navigate("/home", { replace: true });
    }
  }, [isAuthenticated, profile, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="mt-4 text-senior-lg text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background overflow-y-auto md:overflow-hidden md:flex-row">
      {/* Left side — Logo (desktop only) */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-primary/90 via-primary to-primary/80 items-center justify-center relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(255,255,255,0.08)_0%,transparent_60%)]" />
        <div className="flex flex-col items-center gap-6 z-10">
          <img src="/logo.png" alt="Palpite Tech" className="h-48 w-48 rounded-3xl shadow-2xl" />
          <h1 className="text-3xl font-bold text-white tracking-tight">Comunidade Palpite Tech</h1>
          <p className="text-white/70 text-center max-w-xs text-sm">As melhores ferramentas de análise para Lotofácil, Mega-Sena e Dupla Sena.</p>
        </div>
      </div>

      {/* Right side — Form */}
      <div className="flex-1 flex flex-col justify-center p-0 md:p-10 md:w-1/2">
        <div className="w-full max-w-lg mx-auto flex flex-col flex-1 md:flex-initial justify-center py-4 md:py-0">
          <LoginWizard />

          <p className="text-center py-3 md:mt-6 text-muted-foreground text-xs md:text-senior-sm px-4 pb-6">
            Ao criar uma conta, você concorda com nossos{" "}
            <a href="/termos" target="_blank" className="underline text-primary hover:text-primary/80">Termos de Uso</a>
            {" "}e{" "}
            <a href="/privacidade" target="_blank" className="underline text-primary hover:text-primary/80">Política de Privacidade</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
