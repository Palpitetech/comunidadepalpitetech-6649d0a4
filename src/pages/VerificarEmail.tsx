import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogOut, Mail } from "lucide-react";
import { StepCodigoOTP } from "@/components/auth/steps/StepCodigoOTP";

export default function VerificarEmail() {
  const { user, signOut } = useAuthContext();
  const navigate = useNavigate();

  const handleVerificado = () => {
    window.location.href = "/comunidade";
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/login", { replace: true });
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <StepCodigoOTP
          userId={user.id}
          tipo="email"
          destino={user.email || ""}
          onVerified={handleVerificado}
        />
        <CardContent className="pt-0">
          <Button variant="outline" onClick={handleLogout} className="w-full">
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
