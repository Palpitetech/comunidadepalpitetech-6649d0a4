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
      <div className="relative overflow-hidden bg-gradient-to-r from-primary via-primary/95 to-primary/85 text-primary-foreground">
        {/* Subtle decorative circles */}
        <div className="absolute -right-4 -top-4 w-20 h-20 bg-white/[0.04] rounded-full" />
        <div className="absolute right-8 -bottom-6 w-14 h-14 bg-white/[0.04] rounded-full" />

        <div className="px-4 py-3 flex items-center gap-3">
          {/* App icon */}
          <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/10">
            <Smartphone className="h-5 w-5" />
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            <p className="font-bold text-[15px] leading-tight">
              Baixe grátis o App
            </p>
            <p className="text-[13px] opacity-80 leading-tight mt-0.5">
              Mais praticidade no seu celular
            </p>
          </div>

          {/* CTA */}
          <Button
            onClick={handleInstall}
            size="sm"
            className="flex-shrink-0 bg-white text-primary hover:bg-white/90 font-bold h-9 px-4 rounded-lg shadow-md text-[13px]"
          >
            Instalar
          </Button>

          {/* Close */}
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 p-1 rounded-full hover:bg-white/15 transition-colors -mr-1"
            aria-label="Fechar"
          >
            <X className="h-4 w-4 opacity-70" />
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
