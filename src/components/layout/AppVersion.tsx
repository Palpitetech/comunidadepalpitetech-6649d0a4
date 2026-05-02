import { useState, useEffect } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const APP_VERSION = "1.0.8"; // Incremented version

export function AppVersion({ className, collapsed = false }: { className?: string; collapsed?: boolean }) {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdate = async () => {
    setIsUpdating(true);
    toast.info("Atualizando para a nova versão...");

    try {
      // Unregister service workers
      if ("serviceWorker" in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          await registration.unregister();
        }
      }

      // Clear caches
      if ("caches" in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map((name) => caches.delete(name)));
      }

      // Hard reload
      window.location.reload();
    } catch (error) {
      console.error("Erro ao atualizar:", error);
      window.location.reload();
    }
  };

  if (collapsed) return null;

  return (
    <div className={cn("px-2 py-1 flex flex-col gap-1", className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] text-muted-foreground/60 font-medium tracking-tight">
          Versão {APP_VERSION}
        </span>
        <button
          onClick={handleUpdate}
          disabled={isUpdating}
          className="text-[10px] text-primary hover:text-primary/80 font-semibold flex items-center gap-1 transition-colors disabled:opacity-50"
        >
          {isUpdating ? (
            <RefreshCw className="h-2.5 w-2.5 animate-spin" />
          ) : (
            <>
              <RefreshCw className="h-2.5 w-2.5" />
              <span>Atualizar</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
