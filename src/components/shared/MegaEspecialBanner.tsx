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
      <div className="max-w-3xl mx-auto px-3 sm:px-4 py-3 pr-9 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
        <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
          <div className="flex h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-white/15 items-center justify-center shrink-0 mt-0.5">
            <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm sm:text-base font-bold leading-snug break-words">
              Mega Especial 30 Anos · R$ 150 milhões
            </p>
            <p className="text-xs sm:text-sm text-white/90 leading-snug break-words">
              Receba estudos exclusivos e participe dos bolões.
            </p>
          </div>
        </div>
        <a
          href="https://chat.whatsapp.com/EBHBFt2h8UOGlzIau0nZ54"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full sm:w-auto text-center shrink-0 bg-white text-megasena-primary font-bold text-sm px-4 py-2.5 sm:py-2 rounded-full hover:bg-white/90 active:scale-95 transition shadow min-h-[44px] flex items-center justify-center"
        >
          Receber estudos + Bolões
        </a>
      </div>
      <button
        type="button"
        onClick={handleClose}
        aria-label="Fechar banner"
        className="absolute top-1.5 right-1.5 h-8 w-8 flex items-center justify-center rounded-full hover:bg-white/20 active:scale-95 transition"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
