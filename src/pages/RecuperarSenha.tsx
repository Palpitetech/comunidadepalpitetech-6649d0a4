import { useNavigate } from "react-router-dom";
import { RecuperarSenhaWizard } from "@/components/auth/RecuperarSenhaWizard";

export default function RecuperarSenha() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-background md:bg-gradient-to-br md:from-background md:via-secondary/30 md:to-background p-0 md:p-6">
      <div className="w-full max-w-lg flex flex-col flex-1 md:flex-initial justify-center">
        <RecuperarSenhaWizard onVoltar={() => navigate("/login")} />
      </div>
    </div>
  );
}
