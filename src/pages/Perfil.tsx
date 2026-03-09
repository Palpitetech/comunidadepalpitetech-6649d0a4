import { useIsMobile } from "@/hooks/use-mobile";
import { MainLayout } from "@/components/layout/MainLayout";
import { useAuthContext } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Mail, Phone, Lock, CreditCard, Calendar, Sparkles, Trash2, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useUserRole } from "@/hooks/useUserRole";
import { useMySubscription } from "@/hooks/useMySubscription";
import { STATUS_CONFIG } from "@/lib/subscription";
import { differenceInDays, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AlterarCelularDialog } from "@/components/perfil/AlterarCelularDialog";
import { useQueryClient } from "@tanstack/react-query";

export default function Perfil() {
  const isMobile = useIsMobile();
  const { profile, user } = useAuthContext();
  const { toast } = useToast();
  const [isOpeningCheckout, setIsOpeningCheckout] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const navigate = useNavigate();
  const { isPremium } = useUserRole();
  const { data: subscription } = useMySubscription(user?.id);
  const queryClient = useQueryClient();

  const handleCelularSuccess = () => {
    // Refresh profile data
    queryClient.invalidateQueries({ queryKey: ["profile"] });
    window.location.reload();
  };

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

  const handleDeleteAccount = async () => {
    if (!user) return;
    setIsDeletingAccount(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) throw new Error("Sessão expirada");

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-account`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Erro ao excluir conta");

      await supabase.auth.signOut();
      toast({
        title: "Conta excluída",
        description: "Sua conta e todos os dados foram removidos com sucesso.",
      });
      navigate("/login", { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao excluir conta";
      toast({ title: "Erro", description: message, variant: "destructive" });
    } finally {
      setIsDeletingAccount(false);
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
    <MainLayout pageTitle="Perfil">
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

        {/* Seção 3: Excluir Conta */}
        <Card className="mt-6 border-destructive/30">
          <CardHeader>
            <CardTitle className="text-senior-lg flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              Excluir Conta
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-senior-base text-muted-foreground mb-4">
              Ao excluir sua conta, todos os seus dados serão removidos permanentemente, 
              incluindo palpites, postagens e histórico de conversas. Esta ação não pode ser desfeita.
            </p>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full h-12 text-senior-base gap-2">
                  <Trash2 className="h-5 w-5" />
                  Excluir minha conta
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Tem certeza absoluta?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação é irreversível. Todos os seus dados serão excluídos permanentemente, 
                    incluindo perfil, palpites salvos, postagens e histórico de conversas.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteAccount}
                    disabled={isDeletingAccount}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {isDeletingAccount ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Excluindo...
                      </>
                    ) : (
                      "Sim, excluir minha conta"
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
