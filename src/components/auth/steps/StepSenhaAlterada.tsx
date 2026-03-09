import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, LogIn, Mail } from "lucide-react";

interface StepSenhaAlteradaProps {
  onVoltarLogin: () => void;
}

export function StepSenhaAlterada({ onVoltarLogin }: StepSenhaAlteradaProps) {
  return (
    <>
      <CardHeader className="text-center pb-4 md:pb-6 px-4 md:px-6">
        <div className="mx-auto mb-3 md:mb-4 w-16 h-16 md:w-20 md:h-20 bg-accent/20 rounded-full flex items-center justify-center">
          <CheckCircle className="h-9 w-9 md:h-12 md:w-12 text-accent" />
        </div>
        <CardTitle className="text-xl md:text-senior-2xl text-accent">Senha Alterada!</CardTitle>
        <CardDescription className="text-sm md:text-senior-base">
          Sua nova senha foi enviada para o seu email cadastrado.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4 md:space-y-6 px-4 md:px-6">
        <div className="p-4 md:p-6 rounded-2xl bg-accent/10 border border-accent/30">
          <div className="flex items-start gap-3">
            <Mail className="h-5 w-5 text-accent mt-0.5 shrink-0" />
            <div className="space-y-2">
              <p className="text-foreground text-sm md:text-senior-base font-semibold">
                Vá até sua caixa de entrada, promoções, spam, lixo eletrônico e outros.
              </p>
              <p className="text-muted-foreground text-xs md:text-sm">
                Procure pelo email do remetente <strong className="text-foreground">"Comunidade Palpite Tech"</strong> ou{" "}
                <strong className="text-foreground">solicitacao@palpitetech.com.br</strong>
              </p>
            </div>
          </div>
        </div>

        <Button
          onClick={onVoltarLogin}
          className="w-full h-11 md:h-14 text-base md:text-lg font-semibold rounded-xl"
        >
          <LogIn className="h-5 w-5 mr-2" />
          Fazer Login
        </Button>
      </CardContent>
    </>
  );
}
