import { useAuthContext } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  User, Mail, Phone, Lock, CreditCard, Calendar, Sparkles, Trash2, Loader2, 
  ChevronRight, ArrowLeft, Shield, CheckCircle2, AlertCircle
} from "lucide-react";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

export default function Perfil() {
  const { profile, user, signOut } = useAuthContext();
  const { toast } = useToast();
  const [_isOpeningCheckout, _setIsOpeningCheckout] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const navigate = useNavigate();
  const { isPremium } = useUserRole();
  const { data: subscription } = useMySubscription(user?.id);
  const queryClient = useQueryClient();

  const handleCelularSuccess = () => {
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

  const handleLogout = async () => {
    await signOut();
    navigate("/login", { replace: true });
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

  const statusConfig = STATUS_CONFIG[(subscription?.status ?? "inativa")];
  const diasRestantes = subscription?.validade 
    ? differenceInDays(new Date(subscription.validade), new Date()) 
    : null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      {/* Header fixo */}
      <header className="shrink-0 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between h-14 px-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate(-1)}
            className="h-10 w-10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Meu Perfil</h1>
          <div className="w-10" />
        </div>
      </header>

      {/* Conteúdo scrollável */}
      <ScrollArea className="flex-1">
        <div className="pb-24">
          {/* Hero do perfil */}
          <div className="relative bg-gradient-to-b from-primary/10 to-background pt-6 pb-8 px-4">
            <div className="flex flex-col items-center">
              <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
                  {getInitials(profile?.nome)}
                </AvatarFallback>
              </Avatar>
              <h2 className="mt-4 text-xl font-bold text-foreground">{profile?.nome || "Usuário"}</h2>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              
              {/* Badge de status */}
              <div className="mt-3 flex items-center gap-2">
                <Badge 
                  variant={isPremium ? "default" : "secondary"}
                  className={isPremium ? "bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90" : ""}
                >
                  {isPremium ? (
                    <>
                      <Sparkles className="h-3 w-3 mr-1" />
                      Premium
                    </>
                  ) : (
                    "Grátis"
                  )}
                </Badge>
                <Badge variant={statusConfig.variant}>
                  {statusConfig.label}
                </Badge>
              </div>
            </div>
          </div>

          {/* Seção de Assinatura */}
          <div className="px-4 mt-6">
            <div className="rounded-2xl border bg-card overflow-hidden">
              <div className="p-4 bg-muted/30">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <CreditCard className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Minha Assinatura</p>
                    <p className="font-semibold">{isPremium ? "Plano Premium" : "Plano Grátis"}</p>
                  </div>
                  {diasRestantes !== null && (
                    <Badge 
                      variant={diasRestantes > 7 ? "outline" : diasRestantes > 0 ? "secondary" : "destructive"}
                      className="shrink-0"
                    >
                      {diasRestantes > 0
                        ? `${diasRestantes}d restantes`
                        : diasRestantes === 0
                          ? "Expira hoje"
                          : `Expirou`}
                    </Badge>
                  )}
                </div>
              </div>

              {subscription?.validade && (
                <div className="px-4 py-3 border-t flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Válido até:</span>
                  <span className="text-sm font-medium">
                    {format(new Date(subscription.validade), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </span>
                </div>
              )}

              <div className="p-4 border-t space-y-2">
                <Button
                  className="w-full h-12 text-base font-semibold gap-2"
                  onClick={() => navigate("/planos")}
                >
                  <Sparkles className="h-5 w-5" />
                  {isPremium ? "Renovar / Trocar Plano" : "Ver Planos"}
                </Button>
              </div>
            </div>
          </div>

          {/* Seção Dados de Acesso */}
          <div className="px-4 mt-6">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">
              Dados de Acesso
            </h3>
            <div className="rounded-2xl border bg-card overflow-hidden divide-y">
              {/* Email */}
              <div className="flex items-center gap-4 p-4">
                <div className="h-10 w-10 rounded-full bg-[hsl(var(--primary))]/10 flex items-center justify-center shrink-0">
                  <Mail className="h-5 w-5 text-[hsl(var(--primary))]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">E-mail</p>
                  <p className="font-medium truncate">{user?.email || "Não informado"}</p>
                </div>
                <CheckCircle2 className="h-5 w-5 text-[hsl(var(--primary))] shrink-0" />
              </div>

              {/* Celular */}
              <div className="flex items-center gap-4 p-4">
                <div className="h-10 w-10 rounded-full bg-[hsl(var(--primary))]/10 flex items-center justify-center shrink-0">
                  <Phone className="h-5 w-5 text-[hsl(var(--primary))]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">Celular</p>
                  <p className="font-medium">{profile?.celular || "Não informado"}</p>
                </div>
                {profile?.celular ? (
                  <CheckCircle2 className="h-5 w-5 text-[hsl(var(--primary))] shrink-0" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-muted-foreground shrink-0" />
                )}
              </div>
            </div>
          </div>

          {/* Ações de Conta */}
          <div className="px-4 mt-6">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">
              Configurações da Conta
            </h3>
            <div className="rounded-2xl border bg-card overflow-hidden divide-y">
              {/* Alterar Celular */}
              <AlterarCelularDialog
                celularAtual={profile?.celular || null}
                onSuccess={handleCelularSuccess}
                trigger={
                  <button className="w-full flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors text-left">
                    <div className="h-10 w-10 rounded-full bg-[hsl(var(--primary))]/10 flex items-center justify-center shrink-0">
                      <Phone className="h-5 w-5 text-[hsl(var(--primary))]" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{profile?.celular ? "Alterar Celular" : "Adicionar Celular"}</p>
                      <p className="text-xs text-muted-foreground">Verificação por SMS</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </button>
                }
              />

              {/* Alterar Email */}
              <button className="w-full flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors text-left">
                <div className="h-10 w-10 rounded-full bg-[hsl(var(--primary))]/10 flex items-center justify-center shrink-0">
                  <Mail className="h-5 w-5 text-[hsl(var(--primary))]" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Alterar E-mail</p>
                  <p className="text-xs text-muted-foreground">Verificação necessária</p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </button>

              {/* Trocar Senha */}
              <Link to="/recuperar-senha" className="block">
                <div className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors">
                  <div className="h-10 w-10 rounded-full bg-[hsl(var(--primary))]/10 flex items-center justify-center shrink-0">
                    <Lock className="h-5 w-5 text-[hsl(var(--primary))]" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Trocar Senha</p>
                    <p className="text-xs text-muted-foreground">Altere sua senha de acesso</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </Link>

              {/* Privacidade */}
              <Link to="/privacidade" className="block">
                <div className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors">
                  <div className="h-10 w-10 rounded-full bg-[hsl(var(--primary))]/10 flex items-center justify-center shrink-0">
                    <Shield className="h-5 w-5 text-[hsl(var(--primary))]" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Privacidade</p>
                    <p className="text-xs text-muted-foreground">Política de privacidade</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </Link>
            </div>
          </div>

          {/* Zona de Perigo */}
          <div className="px-4 mt-6">
            <h3 className="text-sm font-semibold text-destructive uppercase tracking-wider mb-3 px-1">
              Zona de Perigo
            </h3>
            <div className="rounded-2xl border border-destructive/30 bg-card overflow-hidden">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button className="w-full flex items-center gap-4 p-4 hover:bg-destructive/5 transition-colors text-left">
                    <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
                      <Trash2 className="h-5 w-5 text-destructive" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-destructive">Excluir Conta</p>
                      <p className="text-xs text-muted-foreground">Ação irreversível</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-destructive" />
                  </button>
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
            </div>
          </div>

          {/* Botão de Logout */}
          <div className="px-4 mt-8 mb-8">
            <Button 
              variant="outline" 
              className="w-full h-12 text-base"
              onClick={handleLogout}
            >
              Sair da Conta
            </Button>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
