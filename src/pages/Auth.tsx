import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import { AuthForm } from "@/components/auth/AuthForm";
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-secondary/30 to-background p-6">
      <div className="w-full max-w-lg">
        <AuthForm />
        
        <p className="text-center mt-6 text-muted-foreground text-senior-sm">
          Ao criar uma conta, você concorda com nossos termos de uso.
        </p>
      </div>
    </div>
  );
}
