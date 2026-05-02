import { useEffect, useState } from "react";
import { RefreshCw, Loader2, History, AlertTriangle, ShieldCheck, User, Clock } from "lucide-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
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
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

function timeAgo(iso: string | null): string {
  if (!iso) return "—";
  const diffMs = Date.now() - new Date(iso).getTime();
  const sec = Math.max(0, Math.floor(diffMs / 1000));
  if (sec < 60) return `há ${sec}s`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `há ${min}min`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `há ${hr}h`;
  const days = Math.floor(hr / 24);
  return `há ${days}d`;
}

export default function AdminForceUpdate() {
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState<{ force_reload_at: string | null; current_version: number | null } | null>(null);
  const [propagationProgress, setPropagationProgress] = useState(0);

  const fetchConfig = async () => {
    const { data } = await supabase
      .from("app_config")
      .select("force_reload_at, current_version")
      .eq("id", 1)
      .maybeSingle();
    setConfig(data);
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  useEffect(() => {
    let interval: any;
    if (propagationProgress > 0) {
      interval = setInterval(() => {
        setPropagationProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            return 0;
          }
          return prev + (100 / 60);
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [propagationProgress]);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const newVersion = Math.floor(Date.now() / 1000);
      const { data: userData } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("app_config")
        .update({
          current_version: newVersion,
          force_reload_at: new Date().toISOString(),
          updated_by: userData.user?.id ?? null,
        })
        .eq("id", 1);

      if (error) throw error;

      toast.success("Atualização disparada", {
        description: "Todos os usuários ativos serão recarregados em até 60 segundos.",
      });
      setPropagationProgress(1);
      await fetchConfig();
    } catch (err) {
      toast.error("Falha ao disparar atualização", {
        description: err instanceof Error ? err.message : "Erro desconhecido",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout pageTitle="Atualização Global">
      <div className="p-4 md:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
        
        {/* Header Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Versão Atual</h3>
            </div>
            <p className="text-3xl font-bold tracking-tight text-foreground">
              v{config?.current_version || "—"}
            </p>
          </div>

          <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <Clock className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Último Disparo</h3>
            </div>
            <p className="text-3xl font-bold tracking-tight text-foreground">
              {timeAgo(config?.force_reload_at)}
            </p>
            {config?.force_reload_at && (
              <p className="text-xs text-muted-foreground mt-1">
                {format(new Date(config.force_reload_at), "PPP 'às' HH:mm", { locale: ptBR })}
              </p>
            )}
          </div>
        </div>

        {/* Action Card */}
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
          <div className="p-6 space-y-4">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-destructive/10 rounded-full text-destructive shrink-0">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-foreground">Ação Crítica</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Esta ação forçará o recarregamento imediato de todas as instâncias do aplicativo (Web e PWA) para todos os usuários conectados no mundo.
                </p>
              </div>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 space-y-2 border border-border/50">
              <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">O que acontece?</h4>
              <ul className="text-sm text-muted-foreground space-y-2 list-disc pl-4">
                <li>Navegadores detectarão a nova versão em até 60 segundos.</li>
                <li>Qualquer formulário ou texto não salvo será perdido.</li>
                <li>Útil para limpar caches persistentes ou corrigir erros críticos em tempo real.</li>
              </ul>
            </div>

            {propagationProgress > 0 && (
              <div className="space-y-2 py-2">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-primary animate-pulse">Propagando atualização...</span>
                  <span>{Math.round(propagationProgress)}%</span>
                </div>
                <div className="h-2 w-full bg-secondary rounded-full overflow-hidden border border-border">
                  <div 
                    className="h-full bg-primary transition-all duration-1000 ease-linear"
                    style={{ width: `${propagationProgress}%` }}
                  />
                </div>
              </div>
            )}

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  size="lg" 
                  variant="destructive" 
                  disabled={loading || propagationProgress > 0} 
                  className="w-full md:w-auto md:px-12 h-14 md:h-12 text-lg md:text-base font-bold shadow-lg shadow-destructive/20"
                >
                  {loading ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-2 h-5 w-5" />
                  )}
                  {propagationProgress > 0 ? "Aguarde a propagação..." : "DISPARAR RELOAD GLOBAL"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmar Forçar Atualização?</AlertDialogTitle>
                  <AlertDialogDescription className="space-y-3">
                    <p>
                      Você está prestes a interromper a sessão de <strong>todos os usuários</strong>.
                    </p>
                    <div className="p-3 bg-destructive/5 border border-destructive/20 rounded-md text-destructive font-medium text-sm">
                      Atenção: Esta ação não pode ser desfeita e afetará o suporte e a experiência de uso imediatamente.
                    </div>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Abortar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleConfirm} className="bg-destructive hover:bg-destructive/90">
                    Confirmar e Forçar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Info Footer */}
        <div className="flex items-center gap-2 justify-center text-xs text-muted-foreground pt-4">
          <History className="h-3.5 w-3.5" />
          <span>As atualizações automáticas via PWA continuam funcionando normalmente.</span>
        </div>
      </div>
    </AdminLayout>
  );
}
