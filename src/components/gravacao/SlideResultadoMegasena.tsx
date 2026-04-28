import { formatarDezena } from "@/lib/megasena";

interface SlideResultadoMegasenaProps {
  dezenas: number[];
}

export default function SlideResultadoMegasena({ dezenas }: SlideResultadoMegasenaProps) {
  const sorteadas = new Set(dezenas);

  return (
    <div className="flex flex-col items-center justify-center w-full h-full gap-6">
      <h2 className="text-emerald-300/70 text-xl md:text-2xl font-medium tracking-wide">
        Dezenas Sorteadas
      </h2>
      {/* 6 rows x 10 cols grid (1-60) */}
      <div className="grid grid-cols-10 gap-1.5 md:gap-2">
        {Array.from({ length: 60 }, (_, i) => i + 1).map((num) => {
          const isSorteada = sorteadas.has(num);
          return (
            <div
              key={num}
              className={`
                w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center
                text-base md:text-lg font-bold transition-all duration-500
                ${
                  isSorteada
                    ? "text-white shadow-lg scale-100"
                    : "bg-white/5 text-white/20"
                }
              `}
              style={
                isSorteada
                  ? {
                      background: "linear-gradient(135deg, #10B981, #059669)",
                      boxShadow: "0 8px 24px rgba(16, 185, 129, 0.3)",
                    }
                  : undefined
              }
            >
              {formatarDezena(num)}
            </div>
          );
        })}
      </div>
    </div>
  );
}
