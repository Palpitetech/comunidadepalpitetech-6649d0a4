import { useEffect } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";

/**
 * Handles PWA updates with a persistent toast notification.
 * Shows a button for the user to apply the update manually.
 */
export function PWAUpdateHandler() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    // Check for updates every 30 seconds
    onRegisteredSW(_swUrl, registration) {
      if (registration) {
        // Initial check after 3 seconds
        setTimeout(() => registration.update(), 3000);
        // Then every 30 seconds
        setInterval(() => registration.update(), 30 * 1000);
      }
    },
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
