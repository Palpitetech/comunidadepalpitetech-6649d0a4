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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-secondary/30 to-background p-3 md:p-6">
      <div className="w-full max-w-lg">
        <LoginWizard />

        <p className="text-center mt-3 md:mt-6 text-muted-foreground text-xs md:text-senior-sm">
          Ao criar uma conta, você concorda com nossos{" "}
          <a href="/termos" target="_blank" className="underline text-primary hover:text-primary/80">Termos de Uso</a>
          {" "}e{" "}
          <a href="/privacidade" target="_blank" className="underline text-primary hover:text-primary/80">Política de Privacidade</a>.
        </p>
      </div>
    </div>
  );
}
