import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import { LoginWizard } from "@/components/auth/LoginWizard";
import { Loader2 } from "lucide-react";

export default function Auth() {
  const { isAuthenticated, loading } = useAuthContext();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, navigate]);

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
    <div className="min-h-[100dvh] flex flex-col bg-background md:bg-gradient-to-br md:from-background md:via-secondary/30 md:to-background p-0 md:p-6 overflow-y-auto">
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
  );
}
