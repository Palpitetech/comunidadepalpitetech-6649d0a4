import { useState, useEffect } from "react";
import { X, Sparkles } from "lucide-react";

const DISMISS_KEY = "mega-especial-banner-dismissed";

export function MegaEspecialBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const dismissed = sessionStorage.getItem(DISMISS_KEY);
    if (!dismissed) setVisible(true);
  }, []);

  const handleClose = () => {
    sessionStorage.setItem(DISMISS_KEY, "1");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="relative w-full bg-gradient-to-r from-megasena-primary via-megasena-primary to-highlight text-white shadow-lg">
      <div className="max-w-3xl mx-auto px-4 py-3 pr-10 flex items-center gap-3">
        <div className="hidden sm:flex h-10 w-10 rounded-full bg-white/15 items-center justify-center shrink-0">
          <Sparkles className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm sm:text-base font-bold leading-tight">
            Mega Especial 30 Anos · Prêmio de R$ 150 milhões
          </p>
          <p className="text-xs sm:text-sm text-white/90 leading-tight">
            Receba estudos exclusivos e participe dos bolões.
          </p>
        </div>
        <a
          href="https://www.palpitetech.com.br/g/90chnh2i"
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 bg-white text-megasena-primary font-bold text-xs sm:text-sm px-3 sm:px-4 py-2 rounded-full hover:bg-white/90 active:scale-95 transition shadow"
        >
          Receber estudos + Bolões
        </a>
      </div>
      <button
        type="button"
        onClick={handleClose}
        aria-label="Fechar banner"
        className="absolute top-1.5 right-1.5 h-7 w-7 flex items-center justify-center rounded-full hover:bg-white/20 transition"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
