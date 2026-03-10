import { useEffect } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { toast } from "sonner";

/**
 * Handles PWA auto-update silently.
 * When a new service worker is ready, it auto-activates and reloads the page
 * to avoid duplicate/stale app versions.
 */
export function PWAUpdateHandler() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    // Check for updates every 60 seconds
    onRegisteredSW(swUrl, registration) {
      if (registration) {
        setInterval(() => {
          registration.update();
        }, 60 * 1000);
      }
    },
    onRegisterError(error) {
      console.error("SW registration error:", error);
    },
  });

  useEffect(() => {
    if (needRefresh) {
      // Show a brief toast then auto-update
      toast.info("Atualizando o app...", { duration: 2000 });

      // Small delay so the user sees the toast
      const timer = setTimeout(() => {
        updateServiceWorker(true);
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [needRefresh, updateServiceWorker]);

  return null;
}
