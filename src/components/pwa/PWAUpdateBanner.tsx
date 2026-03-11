import { useRegisterSW } from "virtual:pwa-register/react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Inline banner shown on the home feed when a PWA update is available.
 */
export function PWAUpdateBanner() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  if (!needRefresh) return null;

  return (
    <div className="mx-4 mt-2 mb-1 rounded-xl border border-primary/20 bg-primary/10 p-3 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
      <RefreshCw className="h-5 w-5 text-primary shrink-0 animate-spin" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">Nova versão disponível!</p>
        <p className="text-xs text-muted-foreground">Atualize para ter a melhor experiência.</p>
      </div>
      <Button
        size="sm"
        onClick={() => updateServiceWorker(true)}
        className="shrink-0"
      >
        Atualizar
      </Button>
    </div>
  );
}
