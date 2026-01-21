import { MainLayout } from "@/components/layout/MainLayout";
import { useAuthContext } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Mail, Phone, Lock, CreditCard, Calendar, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useUserRole } from "@/hooks/useUserRole";
import { useMySubscription } from "@/hooks/useMySubscription";
import { STATUS_CONFIG } from "@/lib/subscription";
import { differenceInDays, format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Perfil() {
  const { profile, user } = useAuthContext();
  const { toast } = useToast();
  const [isOpeningCheckout, setIsOpeningCheckout] = useState(false);
  const { isPremium } = useUserRole();
  const { data: subscription } = useMySubscription(user?.id);

  const handleOpenCheckout = async () => {
    if (!user) {
      toast({
        title: "Você precisa estar logado",
        description: "Faça login para assinar um plano.",
        variant: "destructive",
      });
      return;
    }

    setIsOpeningCheckout(true);
    try {
      const { data, error } = await supabase
        .from("plans")
        .select("checkout_link")
        .eq("is_active", true)
        .gt("price", 0)
        .not("checkout_link", "is", null)
        .order("price", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      const url = data?.checkout_link;
      if (!url) throw new Error("Nenhum link de checkout configurado para planos pagos.");

      window.open(String(url), "_blank", "noopener,noreferrer");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Não foi possível abrir o checkout";
      toast({
        title: "Erro ao abrir checkout",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsOpeningCheckout(false);
    }
  };

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
        {/* Cabeçalho do Perfil */}
        <div className="flex flex-col items-center mb-8">
          <Avatar className="h-24 w-24 mb-4">
            <AvatarImage src={profile?.avatar_url || undefined} />
            <AvatarFallback className="bg-primary text-primary-foreground text-3xl">
              {getInitials(profile?.nome)}
            </AvatarFallback>
          </Avatar>
          <h1 className="text-senior-2xl font-bold">{profile?.nome || "Usuário"}</h1>
          <Badge variant="secondary" className="mt-2">Grátis</Badge>
        </div>

        {/* Seção 1: Dados de Acesso */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-senior-lg flex items-center gap-2">
              <User className="h-5 w-5" />
              Dados de Acesso
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Campo Celular */}
            <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
              <Phone className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Celular</p>
                <p className="text-senior-base font-medium">{profile?.celular || "Não informado"}</p>
              </div>
            </div>

            {/* Campo E-mail */}
            <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">E-mail</p>
                <p className="text-senior-base font-medium">{user?.email || "Não informado"}</p>
              </div>
            </div>

            {/* Botões de ação */}
            <div className="pt-2 grid gap-3 sm:grid-cols-2">
              <Button variant="outline" className="h-12 text-senior-base gap-2">
                <Mail className="h-5 w-5" />
                Alterar E-mail
              </Button>
              <Link to="/recuperar-senha">
                <Button variant="outline" className="w-full h-12 text-senior-base gap-2">
                  <Lock className="h-5 w-5" />
                  Trocar Senha
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Seção 2: Dados da Assinatura */}
        <Card>
          <CardHeader>
            <CardTitle className="text-senior-lg flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Minha Assinatura
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Status da Assinatura */}
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Status atual</p>
                <p className="text-senior-base font-semibold">{isPremium ? "Premium" : "Grátis"}</p>
              </div>
              <Badge variant={STATUS_CONFIG[(subscription?.status ?? "inativa")].variant}>
                {STATUS_CONFIG[(subscription?.status ?? "inativa")].label}
              </Badge>
            </div>

            {/* Validade / Próxima cobrança */}
            {subscription?.validade ? (
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Validade</p>
                    <p className="text-senior-base font-medium">
                      {format(new Date(subscription.validade), "dd/MM/yyyy", { locale: ptBR })}
                    </p>
                  </div>
                </div>

                {(() => {
                  const diasRestantes = differenceInDays(new Date(subscription.validade), new Date());
                  const variant = diasRestantes > 7 ? "outline" : diasRestantes > 0 ? "secondary" : "destructive";

                  const label =
                    diasRestantes > 0
                      ? `${diasRestantes} dia${diasRestantes !== 1 ? "s" : ""} restante${diasRestantes !== 1 ? "s" : ""}`
                      : diasRestantes === 0
                        ? "Expira hoje"
                        : `Expirou há ${Math.abs(diasRestantes)} dia${Math.abs(diasRestantes) !== 1 ? "s" : ""}`;

                  return <Badge variant={variant}>{label}</Badge>;
                })()}
              </div>
            ) : (
              <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Próxima cobrança</p>
                  <p className="text-senior-base font-medium">Sem cobrança (plano grátis)</p>
                </div>
              </div>
            )}

            {/* Botões de Assinatura */}
            <div className="pt-2 space-y-3">
              <Button
                variant="outline"
                className="w-full h-12 text-senior-base"
                onClick={handleOpenCheckout}
                disabled={isOpeningCheckout}
              >
                <CreditCard className="h-5 w-5 mr-2" />
                {isOpeningCheckout ? "Abrindo checkout..." : "Abrir Checkout"}
              </Button>
              <Button
                className="w-full h-12 text-senior-base gap-2 bg-accent hover:bg-accent/90 text-accent-foreground"
                onClick={handleOpenCheckout}
                disabled={isOpeningCheckout}
              >
                <Sparkles className="h-5 w-5" />
                Assinar Premium
              </Button>
              <Button variant="ghost" className="w-full h-10 text-sm text-muted-foreground">
                Ver histórico de pagamentos
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
