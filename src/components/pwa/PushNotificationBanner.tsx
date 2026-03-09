import { useState, useEffect } from "react";
import { Bell, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthContext } from "@/contexts/AuthContext";
import { toast } from "sonner";

type PushPermission = "default" | "granted" | "denied" | "unsupported";

function getPushPermission(): PushPermission {
  if (!("Notification" in window)) return "unsupported";
  return Notification.permission as PushPermission;
}

export function PushNotificationBanner() {
  const { isAuthenticated } = useAuthContext();
  const [permission, setPermission] = useState<PushPermission>(() => getPushPermission());
  const [dismissed, setDismissed] = useState(() => {
    return sessionStorage.getItem("push-banner-dismissed") === "true";
  });
  const [isRequesting, setIsRequesting] = useState(false);

  useEffect(() => {
    setPermission(getPushPermission());
  }, []);

  // Only show if: logged in, permission not yet granted/denied, not dismissed, browser supports it
  if (!isAuthenticated || permission !== "default" || dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem("push-banner-dismissed", "true");
  };

  const handleEnable = async () => {
    if (isRequesting) return;
    setIsRequesting(true);

    try {
      console.log("[Push] Click enable", {
        secure: window.isSecureContext,
        topLevel: window.top === window.self,
        permission: "Notification" in window ? Notification.permission : "unsupported",
        oneSignalLoaded: Boolean((window as any).OneSignal),
      });

      // 1) Sempre tentar prompt nativo imediatamente no clique (mais confiável para gesto do usuário)
      if ("Notification" in window && Notification.permission === "default") {
        const result = await Notification.requestPermission();
        console.log("[Push] Native permission result:", result);
        setPermission(result as PushPermission);
      }

      // 2) Depois sincroniza com OneSignal para garantir subscription
      const oneSignal = (window as any).OneSignal;
      if (oneSignal?.Notifications?.requestPermission) {
        await oneSignal.Notifications.requestPermission();
      } else {
        (window as any).OneSignalDeferred = (window as any).OneSignalDeferred || [];
        (window as any).OneSignalDeferred.push(async (OneSignal: any) => {
          await OneSignal.Notifications.requestPermission();
        });
      }

      const currentPermission = getPushPermission();
      setPermission(currentPermission);

      if (currentPermission === "granted") {
        toast.success("Notificações ativadas com sucesso!");
      } else if (currentPermission === "denied") {
        toast.error("Permissão bloqueada no navegador. Libere nas configurações do site.");
      } else {
        toast.message("Prompt não exibido. Tente fora da prévia e no domínio publicado.");
      }
    } catch (e) {
      console.warn("Push permission error:", e);
      toast.error("Falha ao solicitar permissão de notificação.");
    } finally {
      setIsRequesting(false);
    }
  };

  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-accent via-accent/95 to-accent/85 text-accent-foreground">
      <div className="absolute -right-4 -top-4 w-20 h-20 bg-white/[0.04] rounded-full" />
      <div className="absolute right-8 -bottom-6 w-14 h-14 bg-white/[0.04] rounded-full" />

      <div className="px-4 py-3 flex items-center gap-3">
        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/10">
          <Bell className="h-5 w-5" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-bold text-[15px] leading-tight">
            Receba quando sair novos resultados
          </p>
          <p className="text-[13px] opacity-80 leading-tight mt-0.5">
            Além de notificações de novas análises, não perca nada.
          </p>
        </div>

        <Button
          onClick={handleEnable}
          size="sm"
          disabled={isRequesting}
          className="flex-shrink-0 bg-white text-accent hover:bg-white/90 font-bold h-9 px-4 rounded-lg shadow-md text-[13px]"
        >
          {isRequesting ? "Ativando..." : "Ativar"}
        </Button>

        <button
          onClick={handleDismiss}
          className="flex-shrink-0 p-1 rounded-full hover:bg-white/15 transition-colors -mr-1"
          aria-label="Fechar"
        >
          <X className="h-4 w-4 opacity-70" />
        </button>
      </div>
    </div>
  );
}
