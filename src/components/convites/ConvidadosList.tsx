import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, UserPlus } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";

interface Convidado {
  id: string;
  nome: string | null;
  avatar_url: string | null;
  created_at: string;
}

interface ConvidadosListProps {
  convidados: Convidado[];
  totalConvidados: number;
  isLoading: boolean;
}

export const ConvidadosList: React.FC<ConvidadosListProps> = ({
  convidados,
  totalConvidados,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-lg">
          <span className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Pessoas convidadas
          </span>
          <span className="text-2xl font-bold text-primary">
            {totalConvidados}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {convidados.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <UserPlus className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">
              Nenhum convidado ainda.
            </p>
            <p className="text-sm text-muted-foreground">
              Compartilhe seu link para convidar amigos!
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {convidados.map((convidado) => (
              <li
                key={convidado.id}
                className="flex items-center gap-3 py-2 border-b last:border-0"
              >
                <Avatar className="h-10 w-10">
                  {convidado.avatar_url && (
                    <AvatarImage src={convidado.avatar_url} />
                  )}
                  <AvatarFallback>
                    {convidado.nome?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">
                    {convidado.nome || "Usuário"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Entrou em{" "}
                    {format(new Date(convidado.created_at), "dd MMM yyyy", {
                      locale: ptBR,
                    })}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};
