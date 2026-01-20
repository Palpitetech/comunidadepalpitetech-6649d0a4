import { MainLayout } from "@/components/layout/MainLayout";
import { useAuthContext } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Mail, Phone, Lock } from "lucide-react";
import { Link } from "react-router-dom";

export default function Perfil() {
  const { profile } = useAuthContext();

  const getInitials = (nome: string | null) => {
    if (!nome) return "U";
    return nome
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <MainLayout>
      <div className="container-senior py-8 max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <User className="h-8 w-8 text-primary" />
          <h1 className="text-senior-2xl font-bold">Meu Perfil</h1>
        </div>

        <Card>
          <CardHeader className="items-center">
            <Avatar className="h-24 w-24 mb-4">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="bg-primary text-primary-foreground text-3xl">
                {getInitials(profile?.nome)}
              </AvatarFallback>
            </Avatar>
            <CardTitle className="text-senior-xl">{profile?.nome || "Usuário"}</CardTitle>
            <Badge variant="secondary" className="mt-2">Grátis</Badge>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
              <Phone className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Celular</p>
                <p className="text-senior-base font-medium">{profile?.celular || "Não informado"}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">E-mail</p>
                <p className="text-senior-base font-medium">Não informado</p>
              </div>
            </div>

            <div className="pt-4 space-y-3">
              <Button variant="outline" className="w-full h-12 text-senior-base gap-2">
                <Mail className="h-5 w-5" />
                Alterar E-mail
              </Button>
              
              <Link to="/recuperar-senha" className="block">
                <Button variant="outline" className="w-full h-12 text-senior-base gap-2">
                  <Lock className="h-5 w-5" />
                  Trocar Senha
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
