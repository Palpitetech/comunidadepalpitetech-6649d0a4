import { useNavigate } from "react-router-dom";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Home, PartyPopper } from "lucide-react";

export function StepSucesso() {
  const navigate = useNavigate();

  return (
    <>
      <CardHeader className="text-center pb-6">
        <div className="mx-auto mb-6 relative">
          <div className="w-24 h-24 bg-accent/20 rounded-full flex items-center justify-center animate-pulse">
            <CheckCircle className="h-14 w-14 text-accent" />
          </div>
          <PartyPopper className="h-8 w-8 text-lotofacil-moldura absolute -top-2 -right-2 animate-bounce" />
        </div>
        <CardTitle className="text-senior-2xl text-accent">
          Cadastro Concluído!
        </CardTitle>
        <CardDescription className="text-senior-base">
          Seu celular foi verificado com sucesso.
          <br />
          Agora você pode acessar todas as funcionalidades.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="p-6 rounded-xl bg-accent/10 border border-accent/30">
          <h3 className="font-semibold text-senior-lg text-foreground mb-2">
            O que você pode fazer agora:
          </h3>
          <ul className="space-y-2 text-senior-base text-muted-foreground">
            <li className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-accent flex-shrink-0" />
              Ver resultados da Lotofácil
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-accent flex-shrink-0" />
              Análises estatísticas completas
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-accent flex-shrink-0" />
              Participar da comunidade
            </li>
          </ul>
        </div>

        <Button
          onClick={() => navigate("/home")}
          className="btn-senior w-full"
        >
          <Home className="h-5 w-5 mr-2" />
          Ir para o Início
        </Button>
      </CardContent>
    </>
  );
}
