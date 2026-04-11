import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Gem, ArrowRight, Check, Sparkles, Loader2, Zap, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import { useMySubscription } from "@/hooks/useMySubscription";
import { usePermissionContext } from "@/contexts/PermissionContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  featureLabel?: string;
  variant?: "premium" | "vip";
}

export function UpgradeModal({ open, onOpenChange, featureLabel, variant = "premium" }: UpgradeModalProps) {
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const { isPremium, plan } = usePermissionContext();
  const { data: subscription, refetch } = useMySubscription(user?.id);
  const [activatingTrial, setActivatingTrial] = useState(false);
  const activatingRef = useRef(false);

  // Se o usuário já é premium mas está vendo o modal, provavelmente quer VIP (ilimitado)
  const effectiveVariant = (isPremium && variant !== "vip") ? "vip" : variant;
  const isVip = effectiveVariant === "vip";
  const isTrialActive = plan?.slug === 'trial' || plan?.slug === 'teste-gratis-3-dias';
  
  // Se estiver em trial, fecha o modal de upsell premium (recurso agora é liberado no hasPermission)
  useEffect(() => {
    if (open && isTrialActive && variant !== "vip") {
      onOpenChange(false);
    }
  }, [open, isTrialActive, variant, onOpenChange]);

  // Se for Free > Oferece o trial de 3 dias
  // Se for Free que já usou o Trial > Oferece o Upgrade.
  const canUseTrial = subscription?.isFree && !subscription.trial_used;
  const isTrialExpired = subscription?.isFree && subscription.trial_used;


  const handleStartTrial = async () => {
    if (!user) {
      console.error("Tentativa de ativar trial sem usuário autenticado");
      toast.error("Você precisa estar logado para ativar o teste grátis.");
      return;
    }
    
    setActivatingTrial(true);
    activatingRef.current = true;
    
    try {
      console.log("Iniciando ativação do trial para usuário:", user.id);
      
      // Verifique se tem Whatsapp ou Celular cadastrado
      const { data: profile, error: profileError } = await supabase
        .from("perfis")
        .select("whatsapp, celular")
        .eq("id", user.id)
        .single();

      if (profileError) {
        console.error("Erro ao carregar perfil do usuário:", profileError);
        throw profileError;
      }

      const hasPhone = profile?.whatsapp || profile?.celular;

      if (!hasPhone) {
        console.warn("Usuário sem telefone cadastrado, redirecionando para perfil.");
        toast.info("Você precisa cadastrar seu WhatsApp para ativar o teste grátis.");
        navigate("/perfil"); // Pede para cadastrar
        onOpenChange(false);
        return;
      }

      console.log("Chamando RPC activate_free_trial...");
      const { data: result, error: rpcError } = await supabase.rpc('activate_free_trial');
      
      console.log("Retorno do RPC activate_free_trial:", { result, rpcError });
      
      if (rpcError) {
        console.error("Erro RPC no Supabase:", rpcError);
        throw rpcError;
      }
      
      if (result === true) {
        console.log("Trial ativado com sucesso! Atualizando dados locais...");
        toast.success("Teste grátis ativado! Aproveite 3 dias de acesso total.");
        
        // Força o refetch da assinatura
        await refetch();
        
        // Pequeno delay para garantir que o PermissionContext receba a atualização do Realtime
        setTimeout(() => {
          onOpenChange(false);
        }, 500);
      } else {
        toast.error("Não foi possível ativar o teste. Você já utilizou o período de teste ou ocorreu um erro.");
        setActivatingTrial(false);
        activatingRef.current = false;
      }
      
    } catch (error: any) {
      console.error("Erro capturado no catch do handleStartTrial:", error);
      const errorMessage = error?.message || "Erro inesperado ao ativar teste grátis.";
      toast.error(`Falha na ativação: ${errorMessage}`);
      activatingRef.current = false;
    } finally {
      setActivatingTrial(false);
    }
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen && !activatingRef.current && canUseTrial) {
      navigate("/comunidade");
    }
    onOpenChange(isOpen);
  };

  const getTitle = () => {
    if (canUseTrial) return "Experimente o Premium Grátis";
    if (isTrialExpired) return "Acesso Premium Necessário";
    if (isVip) return "Recurso Exclusivo VIP";
    return "Recurso Premium";
  };

  const getDescription = () => {
    if (canUseTrial) {
      return "Você ainda não utilizou seu teste gratuito. Aproveite 3 dias de acesso total a todas as ferramentas agora mesmo sem compromisso.";
    }
    if (isTrialExpired) {
      return "Seu período de teste de 3 dias expirou. Para continuar utilizando este e outros recursos exclusivos, faça um upgrade para um dos nossos planos.";
    }
    if (subscription?.status === "ativa") {
      return (
        <>Você atingiu seu limite diário para <strong className="text-foreground">{featureLabel || "este recurso"}</strong>. Faça um upgrade para o plano <strong className="text-foreground">VIP</strong> para ter acesso ilimitado.</>
      );
    }
    return (
      featureLabel
        ? <><strong className="text-foreground">{featureLabel}</strong> é um recurso {isVip ? "exclusivo do plano Anual VIP" : "disponível nos planos pagos"}.</>
        : <>Este recurso {isVip ? "é exclusivo do plano Anual VIP" : "está disponível nos planos pagos"}.</>
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center space-y-3 pb-2">
          <div className="flex flex-col items-center gap-3">
            <div className={`mx-auto flex items-center justify-center h-16 w-16 rounded-2xl ${isVip ? "bg-[hsl(var(--vip))]/15" : "bg-[hsl(var(--premium))]/15"}`}>
              {canUseTrial ? (
                <Zap className="h-8 w-8 text-amber-500 fill-amber-500" />
              ) : (
                <Gem className={`h-8 w-8 ${isVip ? "text-[hsl(var(--vip))]" : "text-[hsl(var(--premium))]"}`} />
              )}
            </div>
            
            {isTrialExpired && (
              <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 gap-1.5 py-1 px-3">
                <AlertCircle className="h-3.5 w-3.5" />
                Seu período de teste já foi utilizado
              </Badge>
            )}
            
            {canUseTrial && (
              <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 gap-1.5 py-1 px-3">
                <Sparkles className="h-3.5 w-3.5" />
                Oferta Exclusiva: 3 Dias Grátis
              </Badge>
            )}
          </div>
          
          <DialogTitle className="text-xl font-bold">
            {getTitle()}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-muted-foreground text-sm text-center">
            {getDescription()}
          </p>

          <div className="bg-secondary/50 rounded-xl p-4 space-y-2.5">
            <p className="text-xs font-semibold text-foreground uppercase tracking-wider">
              {isVip ? "✨ Anual VIP inclui" : "⭐ Planos pagos incluem"}
            </p>
            {(isVip
              ? [
                  "Gerador Ilimitado",
                  "Chat IA completo",
                  "Ferramentas com IA exclusivas",
                  "Tudo dos outros planos",
                ]
              : [
                  "Gerador de Jogos (10x/dia)",
                  "Fechamento e Desdobramento",
                  "Estatísticas completas",
                  "Comunidade e Mesa Redonda",
                ]
              ).map((item) => (
                <div key={item} className="flex items-center gap-2 text-sm text-foreground">
                  <Check className="h-3.5 w-3.5 text-accent shrink-0" />
                  {item}
                </div>
              ))}
          </div>

          <div className="flex flex-col gap-2 pt-1">
            {canUseTrial && (
              <Button 
                onClick={handleStartTrial} 
                className="w-full gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 border-none h-12 text-senior-base font-bold shadow-md"
                disabled={activatingTrial}
              >
                {activatingTrial ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <Zap className="h-5 w-5 fill-white" />
                    Ativar 3 Dias de Teste Grátis
                  </>
                )}
              </Button>
            )}

            {!canUseTrial && (
              <Button className="w-full gap-2 h-12 text-senior-base" asChild>
                <Link to="/planos" onClick={() => onOpenChange(false)}>
                  <Sparkles className="h-4 w-4" />
                  {isVip && isPremium ? "Upgrade para VIP Ilimitado" : "Ver Planos e Fazer Upgrade"}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            )}
            
            <Button variant="ghost" className="w-full text-muted-foreground" onClick={() => handleClose(false)}>
              Agora não
            </Button>
          </div>
          
          {canUseTrial && (
            <p className="text-[10px] text-center text-muted-foreground">
              * Liberação imediata. Acesso 100% por 72 horas.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
