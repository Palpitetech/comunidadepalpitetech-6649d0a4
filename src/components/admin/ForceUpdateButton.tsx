import { useEffect, useState } from "react";
import { RefreshCw, Loader2 } from "lucide-react";
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

export function ForceUpdateButton() {
  const [loading, setLoading] = useState(false);
  const [lastForceAt, setLastForceAt] = useState<string | null>(null);

  const fetchLast = async () => {
    const { data } = await supabase
      .from("app_config")
      .select("force_reload_at")
      .eq("id", 1)
      .maybeSingle();
    setLastForceAt(data?.force_reload_at ?? null);
  };

  useEffect(() => {
    fetchLast();
  }, []);

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
      await fetchLast();
    } catch (err) {
      toast.error("Falha ao disparar atualização", {
        description: err instanceof Error ? err.message : "Erro desconhecido",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
      <RefreshCw className="h-5 w-5 text-primary shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">Forçar atualização global</p>
        <p className="text-xs text-muted-foreground">
          Recarrega todos os navegadores conectados. Último disparo: {timeAgo(lastForceAt)}
        </p>
      </div>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button size="sm" disabled={loading} className="shrink-0">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Forçar agora"}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar atualização global?</AlertDialogTitle>
            <AlertDialogDescription>
              Todos os usuários conectados (PWA e Web) terão a página recarregada automaticamente em
              até 60 segundos. Quem estiver digitando algo perderá o conteúdo não salvo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm}>Sim, forçar reload</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
