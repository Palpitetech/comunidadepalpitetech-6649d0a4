import { useEffect } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";

/**
 * Handles PWA updates with a persistent toast notification.
 * Only checks for updates on page load/focus — no polling.
 */
export function PWAUpdateHandler() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisterError(error) {
      console.error("SW registration error:", error);
    },
  });

  useEffect(() => {
    if (needRefresh) {
      toast("Nova atualização disponível!", {
        description: "Toque para atualizar o app agora.",
        icon: <RefreshCw className="h-5 w-5 text-primary" />,
        duration: Infinity,
        action: {
          label: "Atualizar",
          onClick: () => updateServiceWorker(true),
        },
        dismissible: false,
      });
    }
  }, [needRefresh, updateServiceWorker]);

  return null;
}
