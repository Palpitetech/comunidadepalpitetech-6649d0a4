import { useNavigate } from "react-router-dom";
import { RecuperarSenhaWizard } from "@/components/auth/RecuperarSenhaWizard";

export default function RecuperarSenha() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
      <RecuperarSenhaWizard onVoltar={() => navigate("/login")} />
    </div>
  );
}
