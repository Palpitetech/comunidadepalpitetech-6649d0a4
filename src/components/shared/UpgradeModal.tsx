import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Gem, ArrowRight, Check, Sparkles, Loader2, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import { useMySubscription } from "@/hooks/useMySubscription";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  featureLabel?: string;
  variant?: "premium" | "vip";
}

export function UpgradeModal({ open, onOpenChange, featureLabel, variant = "premium" }: UpgradeModalProps) {
  const isVip = variant === "vip";
  const { user } = useAuthContext();
  const { data: subscription, refetch } = useMySubscription(user?.id);
  const [activatingTrial, setActivatingTrial] = useState(false);

  const canUseTrial = subscription && !subscription.trial_used && subscription.status === "inativa";

  const handleStartTrial = async () => {
    if (!user) return;
    
    setActivatingTrial(true);
    try {
      const trialPlanId = 'b3a2a9e3-8e3b-4e3b-8e3b-8e3b8e3b8e3b';
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 3);

      const { error } = await supabase
        .from("perfis")
        .update({
          plan_id: trialPlanId,
          status_assinatura: "ativa",
          validade_assinatura: expiresAt.toISOString(),
          trial_used: true
        })
        .eq("id", user.id);

      if (error) throw error;

      toast.success("Teste grátis ativado com sucesso! Aproveite 3 dias de acesso total.");
      await refetch();
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao ativar trial:", error);
      toast.error("Erro ao ativar teste grátis. Tente novamente mais tarde.");
    } finally {
      setActivatingTrial(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center space-y-3 pb-2">
          <div className={`mx-auto flex items-center justify-center h-16 w-16 rounded-2xl ${isVip ? "bg-[hsl(var(--vip))]/15" : "bg-[hsl(var(--premium))]/15"}`}>
            <Gem className={`h-8 w-8 ${isVip ? "text-[hsl(var(--vip))]" : "text-[hsl(var(--premium))]"}`} />
          </div>
          <DialogTitle className="text-xl font-bold">
            {isVip ? "Recurso Exclusivo VIP" : "Recurso Premium"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-muted-foreground text-sm text-center">
            {subscription?.status === "ativa" ? (
              <>Você atingiu seu limite diário para <strong className="text-foreground">{featureLabel || "este recurso"}</strong>. Faça um upgrade para aumentar seu limite ou gerar jogos ilimitados.</>
            ) : (
              featureLabel
                ? <><strong className="text-foreground">{featureLabel}</strong> é um recurso {isVip ? "exclusivo do plano Anual VIP" : "disponível nos planos pagos"}.</>
                : <>Este recurso {isVip ? "é exclusivo do plano Anual VIP" : "está disponível nos planos pagos"}.</>
            )}
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
                  "Gerador de Jogos",
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

            <Button className={`w-full gap-2 ${canUseTrial ? "h-10 text-sm" : "h-12 text-senior-base"}`} variant={canUseTrial ? "outline" : "default"} asChild>
              <Link to="/planos" onClick={() => onOpenChange(false)}>
                <Sparkles className="h-4 w-4" />
                Ver Planos e Fazer Upgrade
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            
            <Button variant="ghost" className="w-full text-muted-foreground" onClick={() => onOpenChange(false)}>
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
