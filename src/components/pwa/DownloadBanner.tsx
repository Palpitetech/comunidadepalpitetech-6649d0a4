import { useState } from "react";
import { Download, X, Share, Plus, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePWAInstall } from "@/hooks/usePWAInstall";

export function DownloadBanner() {
  const { canInstall, isInstalled, install, showIOSGuide, isIOS } = usePWAInstall();
  const [dismissed, setDismissed] = useState(() => {
    return sessionStorage.getItem("pwa-banner-dismissed") === "true";
  });
  const [showIOSModal, setShowIOSModal] = useState(false);

  if (isInstalled || dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem("pwa-banner-dismissed", "true");
  };

  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSModal(true);
      return;
    }
    await install();
  };

  return (
    <>
      {/* Compact mobile banner */}
      <div className="relative overflow-hidden bg-background border-b border-border/40">
        <div className="px-4 py-2.5 flex items-center gap-3">
          {/* App icon */}
          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center border border-primary/10">
            <Smartphone className="h-4 w-4 text-primary" />
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            <p className="font-bold text-xs leading-tight text-foreground">
              Baixe grátis o App
            </p>
            <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">
              Mais praticidade no seu celular
            </p>
          </div>

          {/* CTA */}
          <Button
            onClick={handleInstall}
            size="sm"
            variant="outline"
            className="flex-shrink-0 h-8 px-3 rounded-lg text-[11px] font-bold border-primary/20 text-primary hover:bg-primary/5 hover:text-primary"
          >
            Instalar
          </Button>

          {/* Close */}
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 p-1 rounded-full hover:bg-muted transition-colors -mr-1"
            aria-label="Fechar"
          >
            <X className="h-3.5 w-3.5 text-muted-foreground/60" />
          </button>
        </div>
      </div>

      {/* iOS Install Guide Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end justify-center" onClick={() => setShowIOSModal(false)}>
          <div
            className="bg-card rounded-t-2xl w-full max-w-md px-5 pt-4 pb-[env(safe-area-inset-bottom,16px)] space-y-4 animate-in slide-in-from-bottom-4 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-muted rounded-full mx-auto" />

            <div className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-2">
                <Smartphone className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-base font-bold text-foreground">
                Instalar no iPhone
              </h3>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-3 bg-muted/50 rounded-lg px-3 py-2.5">
                <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>
                <p className="text-sm text-foreground">
                  Toque em <Share className="inline h-3.5 w-3.5 text-primary" /> <strong>Compartilhar</strong>
                </p>
              </div>
              <div className="flex items-center gap-3 bg-muted/50 rounded-lg px-3 py-2.5">
                <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>
                <p className="text-sm text-foreground">
                  <Plus className="inline h-3.5 w-3.5 text-primary" /> <strong>Adicionar à Tela de Início</strong>
                </p>
              </div>
              <div className="flex items-center gap-3 bg-muted/50 rounded-lg px-3 py-2.5">
                <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold flex-shrink-0">3</span>
                <p className="text-sm text-foreground">
                  Toque em <strong>Adicionar</strong>
                </p>
              </div>
            </div>

            <Button
              onClick={() => setShowIOSModal(false)}
              className="w-full h-11 text-sm font-bold rounded-xl"
            >
              Entendi
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
