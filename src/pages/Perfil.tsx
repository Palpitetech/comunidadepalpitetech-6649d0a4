import { useAuthContext } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  User, Mail, Phone, Lock, CreditCard, Calendar, Sparkles, Trash2, Loader2, 
  ChevronRight, ArrowLeft, Shield, CheckCircle2, AlertCircle, Camera, MessageSquare
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
import { useState, useRef } from "react";
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
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { isPremium } = useUserRole();
  const { data: subscription } = useMySubscription(user?.id);
  const queryClient = useQueryClient();

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "Formato inválido", description: "Selecione uma imagem (JPG, PNG, etc.)", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Arquivo muito grande", description: "Máximo de 5MB permitido.", variant: "destructive" });
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const filePath = `${user.id}/avatar.${ext}`;

      // Remove old avatar if exists
      await supabase.storage.from("avatars").remove([filePath]);

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true, contentType: file.type });

      if (uploadError) throw uploadError;

      const { data: publicUrl } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      const avatarUrl = `${publicUrl.publicUrl}?t=${Date.now()}`;

      const { error: updateError } = await supabase
        .from("perfis")
        .update({ avatar_url: avatarUrl })
        .eq("id", user.id);

      if (updateError) throw updateError;

      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast({ title: "Foto atualizada!", description: "Sua foto de perfil foi alterada com sucesso." });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao enviar foto";
      toast({ title: "Erro", description: message, variant: "destructive" });
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleCelularSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["profile"] });
    window.location.reload();
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
        <div className="pb-8 max-w-lg mx-auto w-full">
          {/* Hero compacto */}
          <div className="flex items-center gap-4 px-4 py-5">
            <div className="relative shrink-0">
              <Avatar className="h-16 w-16 border-2 border-border shadow-sm">
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback className="bg-primary text-primary-foreground text-lg font-bold">
                  {getInitials(profile?.nome)}
                </AvatarFallback>
              </Avatar>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingAvatar}
                className="absolute -bottom-0.5 -right-0.5 h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow border-2 border-background hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {isUploadingAvatar ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Camera className="h-3 w-3" />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
              />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-foreground truncate">{profile?.nome || "Usuário"}</h2>
              <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
              <div className="mt-1.5 flex items-center gap-1.5">
                <Badge 
                  variant={isPremium ? "default" : "secondary"}
                  className={`text-[11px] h-5 ${isPremium ? "bg-primary hover:bg-primary/90" : ""}`}
                >
                  {isPremium ? (
                    <>
                      <Sparkles className="h-3 w-3 mr-0.5" />
                      Premium
                    </>
                  ) : (
                    "Grátis"
                  )}
                </Badge>
                <Badge variant={statusConfig.variant} className="text-[11px] h-5">
                  {statusConfig.label}
                </Badge>
              </div>
            </div>
          </div>

          {/* Assinatura - Card compacto */}
          <div className="px-4">
            <div className="rounded-xl border bg-card overflow-hidden">
              <div className="flex items-center gap-3 p-3.5">
                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <CreditCard className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">Plano Atual</p>
                  <p className="font-semibold text-sm">{isPremium ? "Premium" : "Grátis"}</p>
                </div>
                {diasRestantes !== null && (
                  <Badge 
                    variant={diasRestantes > 7 ? "outline" : diasRestantes > 0 ? "secondary" : "destructive"}
                    className="shrink-0 text-[11px]"
                  >
                    {diasRestantes > 0
                      ? `${diasRestantes}d`
                      : diasRestantes === 0
                        ? "Hoje"
                        : "Expirou"}
                  </Badge>
                )}
              </div>

              {subscription?.validade && (
                <div className="px-3.5 py-2.5 border-t flex items-center gap-2 bg-muted/30">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    Até {format(new Date(subscription.validade), "dd/MM/yyyy")}
                  </span>
                </div>
              )}

              <Separator />
              <div className="p-3">
                <Button
                  className="w-full h-10 text-sm font-semibold gap-2"
                  onClick={() => navigate("/planos")}
                >
                  <Sparkles className="h-4 w-4" />
                  {isPremium ? "Renovar / Trocar Plano" : "Ver Planos"}
                </Button>
              </div>
            </div>
          </div>

          {/* Dados de Acesso */}
          <div className="px-4 mt-5">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
              Dados de Acesso
            </h3>
            <div className="rounded-xl border bg-card overflow-hidden divide-y">
              <div className="flex items-center gap-3 p-3.5">
                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Mail className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-muted-foreground">E-mail</p>
                  <p className="text-sm font-medium truncate">{user?.email || "Não informado"}</p>
                </div>
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
              </div>

              <div className="flex items-center gap-3 p-3.5">
                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Phone className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-muted-foreground">Celular</p>
                  <p className="text-sm font-medium">{profile?.celular || "Não informado"}</p>
                </div>
                {profile?.celular ? (
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-muted-foreground shrink-0" />
                )}
              </div>
            </div>
          </div>

          {/* Configurações */}
          <div className="px-4 mt-5">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
              Configurações
            </h3>
            <div className="rounded-xl border bg-card overflow-hidden divide-y">
              <AlterarCelularDialog
                celularAtual={profile?.celular || null}
                onSuccess={handleCelularSuccess}
                trigger={
                  <button className="w-full flex items-center gap-3 p-3.5 hover:bg-muted/50 transition-colors text-left">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Phone className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{profile?.celular ? "Alterar Celular" : "Adicionar Celular"}</p>
                      <p className="text-[11px] text-muted-foreground">Verificação por SMS</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </button>
                }
              />

              <button className="w-full flex items-center gap-3 p-3.5 hover:bg-muted/50 transition-colors text-left">
                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Mail className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Alterar E-mail</p>
                  <p className="text-[11px] text-muted-foreground">Verificação necessária</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>

              <Link to="/recuperar-senha" className="block">
                <div className="flex items-center gap-3 p-3.5 hover:bg-muted/50 transition-colors">
                  <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Lock className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Trocar Senha</p>
                    <p className="text-[11px] text-muted-foreground">Altere sua senha de acesso</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </Link>

              <Link to="/privacidade" className="block">
                <div className="flex items-center gap-3 p-3.5 hover:bg-muted/50 transition-colors">
                  <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Shield className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Privacidade</p>
                    <p className="text-[11px] text-muted-foreground">Política de privacidade</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </Link>

              <a href="https://chat.whatsapp.com/J89dx46Lo97G9YdAaGmR78" target="_blank" rel="noopener noreferrer" className="block">
                <div className="flex items-center gap-3 p-3.5 hover:bg-muted/50 transition-colors">
                  <div className="h-9 w-9 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                    <MessageSquare className="h-4 w-4 text-accent" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Grupo WhatsApp</p>
                    <p className="text-[11px] text-muted-foreground">Entre no nosso grupo</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </a>
            </div>
          </div>

          {/* Zona de Perigo */}
          <div className="px-4 mt-5">
            <div className="rounded-xl border border-destructive/20 bg-card overflow-hidden">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button className="w-full flex items-center gap-3 p-3.5 hover:bg-destructive/5 transition-colors text-left">
                    <div className="h-9 w-9 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-destructive">Excluir Conta</p>
                      <p className="text-[11px] text-muted-foreground">Ação irreversível</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-destructive/50" />
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

          {/* Logout */}
          <div className="px-4 mt-6 mb-6">
            <Button 
              variant="outline" 
              className="w-full h-10 text-sm"
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
