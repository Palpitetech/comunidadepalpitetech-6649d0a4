import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldX, MessageCircle } from "lucide-react";
import { useAuthContext } from "@/contexts/AuthContext";

export default function Bloqueado() {
  const { signOut } = useAuthContext();

  const handleContactSupport = () => {
    window.open("https://wa.me/5511999999999?text=Olá, preciso de ajuda com minha conta que foi bloqueada.", "_blank");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <ShieldX className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="text-senior-xl">Acesso Suspenso</CardTitle>
          <CardDescription className="text-senior-base">
            Sua conta foi temporariamente bloqueada. Entre em contato com o suporte para mais informações.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={handleContactSupport}
            className="w-full h-12 text-senior-base gap-2"
          >
            <MessageCircle className="h-5 w-5" />
            Falar com Suporte
          </Button>
          <Button
            variant="ghost"
            onClick={signOut}
            className="w-full h-10 text-muted-foreground"
          >
            Sair da conta
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
