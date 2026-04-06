import { useMySubscription } from "@/hooks/useMySubscription";
import { useUserRole } from "@/hooks/useUserRole";
import { STATUS_CONFIG } from "@/lib/subscription";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
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
import { CreditCard, Calendar, Sparkles, XCircle, Loader2 } from "lucide-react";
import { format, addDays, addMonths } from "date-fns";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
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
      {/* Status atual */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="flex items-center gap-3 p-4">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <CreditCard className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground">Plano Atual</p>
            <p className="font-semibold">{subscription?.plano || (isPremium ? "Premium" : "Grátis")}</p>
          </div>
          <Badge variant={statusConfig.variant} className="text-xs shrink-0">
            {statusConfig.label}
          </Badge>
        </div>

        {subscription?.validade && (
          <>
            <Separator />
            <div className="flex items-center gap-3 p-4">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Vencimento</p>
                <p className="font-semibold text-sm">
                  {format(new Date(subscription.validade), "dd/MM/yyyy")}
                </p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Ações */}
      <div className="space-y-2">
        <Button className="w-full gap-2" onClick={() => navigate("/planos")}>
          <Sparkles className="h-4 w-4" />
          {isPremium ? "Trocar Plano" : "Ver Planos"}
        </Button>

        {isPremium && subscription?.status === "ativa" && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="w-full gap-2 text-destructive border-destructive/30 hover:bg-destructive/5">
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
        )}
      </div>
    </div>
  );
}
