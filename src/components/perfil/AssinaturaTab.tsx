import { useMySubscription } from "@/hooks/useMySubscription";
import { useUserRole } from "@/hooks/useUserRole";
import { STATUS_CONFIG } from "@/lib/subscription";
import { Button } from "@/components/ui/button";
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
import { Crown, Calendar, Sparkles, XCircle, Loader2, Clock } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { User } from "@supabase/supabase-js";

interface AssinaturaTabProps {
  user: User | null;
}

export function AssinaturaTab({ user }: AssinaturaTabProps) {
  const navigate = useNavigate();
  const { isPremium } = useUserRole();
  const { data: subscription } = useMySubscription(user?.id);
  const [cancelling, setCancelling] = useState(false);

  const statusConfig = STATUS_CONFIG[(subscription?.status ?? "inativa")];

  const dias =
    subscription?.validade && isPremium
      ? differenceInDays(new Date(subscription.validade), new Date())
      : null;

  const diasLabel =
    dias === null
      ? null
      : dias < 0
      ? `Vencido há ${Math.abs(dias)} dia${Math.abs(dias) === 1 ? "" : "s"}`
      : dias === 0
      ? "Vence hoje"
      : `Faltam ${dias} dia${dias === 1 ? "" : "s"}`;

  const diasColor =
    dias === null
      ? ""
      : dias < 0
      ? "text-destructive"
      : dias <= 7
      ? "text-amber-600"
      : "text-foreground";

  const handleCancelSubscription = async () => {
    setCancelling(true);
    try {
      const { error } = await supabase
        .from("perfis")
        .update({ status_assinatura: "cancelada" })
        .eq("id", user!.id);
      if (error) throw error;
      toast.success("Assinatura cancelada com sucesso.");
    } catch (err) {
      toast.error("Erro ao cancelar assinatura.");
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="px-4 py-4 space-y-4">
      {/* Card de status visual em destaque */}
      <div
        className={cn(
          "rounded-2xl border p-6 flex flex-col items-center text-center overflow-hidden relative",
          isPremium
            ? "bg-gradient-to-br from-amber-500/15 via-amber-500/5 to-card border-amber-500/30"
            : "bg-gradient-to-br from-muted/50 to-card"
        )}
      >
        <div
          className={cn(
            "h-16 w-16 rounded-full flex items-center justify-center mb-3",
            isPremium ? "bg-amber-500/20 text-amber-600" : "bg-muted text-muted-foreground"
          )}
        >
          <Crown className="h-8 w-8" />
        </div>
        <p className="text-2xl font-bold tracking-tight">
          {isPremium ? "Premium" : "Plano Grátis"}
        </p>
        <p
          className={cn(
            "text-xs font-semibold uppercase tracking-wider mt-1",
            statusConfig.variant === "default" && "text-emerald-600",
            statusConfig.variant === "destructive" && "text-destructive",
            statusConfig.variant === "secondary" && "text-amber-600",
            statusConfig.variant === "outline" && "text-muted-foreground"
          )}
        >
          {statusConfig.label}
        </p>
      </div>

      {/* Vencimento + dias restantes */}
      {subscription?.validade && isPremium && (
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border bg-card p-4">
            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center mb-2">
              <Calendar className="h-4 w-4 text-primary" />
            </div>
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Vence em</p>
            <p className="text-sm font-semibold mt-0.5">
              {format(new Date(subscription.validade), "dd 'de' MMM 'de' yyyy", { locale: ptBR })}
            </p>
          </div>
          <div className="rounded-2xl border bg-card p-4">
            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center mb-2">
              <Clock className="h-4 w-4 text-primary" />
            </div>
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Restantes</p>
            <p className={cn("text-sm font-semibold mt-0.5", diasColor)}>{diasLabel}</p>
          </div>
        </div>
      )}

      {/* CTA primária */}
      <Button
        className="w-full gap-2 h-12 text-base font-semibold"
        onClick={() => navigate("/planos")}
      >
        <Sparkles className="h-5 w-5" />
        {isPremium ? "Trocar Plano" : "Ver Planos Premium"}
      </Button>

      {/* CTA secundária — cancelar */}
      {isPremium && subscription?.status === "ativa" && (
        <>
          <div className="border-t pt-2" />
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                className="w-full gap-2 text-destructive hover:bg-destructive/5 hover:text-destructive h-10"
              >
                <XCircle className="h-4 w-4" />
                Cancelar Assinatura
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Cancelar assinatura?</AlertDialogTitle>
                <AlertDialogDescription>
                  Você perderá acesso às ferramentas Premium ao final do período atual. Essa ação pode ser revertida contratando um novo plano.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Manter Plano</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleCancelSubscription}
                  disabled={cancelling}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {cancelling && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Confirmar Cancelamento
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </div>
  );
}
