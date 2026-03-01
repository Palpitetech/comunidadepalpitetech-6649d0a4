import { useState } from "react";
import { Download, X, Share, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePWAInstall } from "@/hooks/usePWAInstall";

export function DownloadBanner() {
  const { canInstall, isInstalled, install, showIOSGuide, isIOS } = usePWAInstall();
  const [dismissed, setDismissed] = useState(() => {
    return sessionStorage.getItem("pwa-banner-dismissed") === "true";
  });
  const [showIOSModal, setShowIOSModal] = useState(false);

  if (isInstalled || dismissed) return null;
  if (!canInstall && !showIOSGuide) return null;

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
      <div className="relative overflow-hidden bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
        <div className="container-senior py-4 flex items-center gap-4">
          {/* Icon */}
          <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
            <Download className="h-6 w-6" />
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            <p className="font-bold text-base sm:text-lg leading-tight">
              Fazer download Grátis
            </p>
            <p className="text-sm sm:text-base opacity-90 leading-tight mt-0.5">
              Faça o download e tenha maior praticidade.
            </p>
          </div>

          {/* CTA */}
          <Button
            onClick={handleInstall}
            className="flex-shrink-0 bg-white text-primary hover:bg-white/90 font-bold h-11 px-5 rounded-xl shadow-lg"
          >
            <Download className="h-4 w-4 mr-2" />
            Instalar
          </Button>

          {/* Close */}
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 p-1.5 rounded-full hover:bg-white/20 transition-colors"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Decorative background elements */}
        <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/5 rounded-full" />
        <div className="absolute -right-2 -bottom-4 w-16 h-16 bg-white/5 rounded-full" />
      </div>

      {/* iOS Install Guide Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-4">
          <div className="bg-card rounded-2xl w-full max-w-sm p-6 space-y-5 animate-in slide-in-from-bottom-4">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Download className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground">
                Instalar no iPhone
              </h3>
              <p className="text-muted-foreground mt-2">
                Siga os passos abaixo para instalar:
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold flex-shrink-0">
                  1
                </div>
                <p className="text-foreground pt-1">
                  Toque no botão <Share className="inline h-4 w-4 text-primary" /> <strong>Compartilhar</strong> na barra do Safari
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold flex-shrink-0">
                  2
                </div>
                <p className="text-foreground pt-1">
                  Role para baixo e toque em <Plus className="inline h-4 w-4 text-primary" /> <strong>Adicionar à Tela de Início</strong>
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold flex-shrink-0">
                  3
                </div>
                <p className="text-foreground pt-1">
                  Toque em <strong>Adicionar</strong> para confirmar
                </p>
              </div>
            </div>

            <Button
              onClick={() => setShowIOSModal(false)}
              className="w-full h-12 text-base font-bold rounded-xl"
            >
              Entendi
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
