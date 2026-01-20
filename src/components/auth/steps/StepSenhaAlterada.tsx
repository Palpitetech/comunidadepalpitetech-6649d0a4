import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, LogIn } from "lucide-react";

interface StepSenhaAlteradaProps {
  onVoltarLogin: () => void;
}

export function StepSenhaAlterada({ onVoltarLogin }: StepSenhaAlteradaProps) {
  return (
    <>
      <CardHeader className="text-center pb-6">
        <div className="mx-auto mb-4 w-20 h-20 bg-accent/20 rounded-full flex items-center justify-center">
          <CheckCircle className="h-12 w-12 text-accent" />
        </div>
        <CardTitle className="text-senior-2xl text-accent">Senha Alterada!</CardTitle>
        <CardDescription className="text-senior-base">
          Sua senha foi alterada com sucesso. Agora você pode fazer login com sua nova senha.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="p-6 rounded-2xl bg-accent/10 border border-accent/30 text-center">
          <p className="text-accent text-senior-base">
            🎉 Tudo pronto! Sua conta está segura novamente.
          </p>
        </div>

        <Button
          onClick={onVoltarLogin}
          className="btn-senior w-full bg-primary hover:bg-primary/90"
        >
          <LogIn className="h-5 w-5 mr-2" />
          Fazer Login
        </Button>
      </CardContent>
    </>
  );
}
