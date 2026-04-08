import { formatarDezena } from "@/lib/quina";

interface SlideResultadoQuinaProps {
  dezenas: number[];
}

export default function SlideResultadoQuina({ dezenas }: SlideResultadoQuinaProps) {
  const sorteadas = new Set(dezenas);

  return (
    <div className="flex flex-col items-center justify-center w-full h-full gap-6">
      <h2 className="text-indigo-300/70 text-xl md:text-2xl font-medium tracking-wide">
        Dezenas Sorteadas
      </h2>
      {/* 8 rows x 10 cols grid */}
      <div className="grid grid-cols-10 gap-1.5 md:gap-2">
        {Array.from({ length: 80 }, (_, i) => i + 1).map((num) => {
          const isSorteada = sorteadas.has(num);
          return (
            <div
              key={num}
              className={`
                w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center
                text-sm md:text-base font-bold transition-all duration-500
                ${
                  isSorteada
                    ? "text-white shadow-lg scale-100"
                    : "bg-white/5 text-white/20"
                }
              `}
              style={
                isSorteada
                  ? {
                      background: "linear-gradient(135deg, #6366F1, #4F46E5)",
                      boxShadow: "0 8px 24px rgba(99, 102, 241, 0.3)",
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
