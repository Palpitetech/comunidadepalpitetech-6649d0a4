import { formatarDezena } from "@/lib/lotofacil";

interface SlideResultadoProps {
  dezenas: number[];
}

export default function SlideResultado({ dezenas }: SlideResultadoProps) {
  const sorteadas = new Set(dezenas);

  return (
    <div className="flex flex-col items-center justify-center w-full h-full gap-6">
      <h2 className="text-white/60 text-xl md:text-2xl font-medium tracking-wide">
        Dezenas Sorteadas
      </h2>
      <div className="grid grid-cols-5 gap-3 md:gap-5">
        {Array.from({ length: 25 }, (_, i) => i + 1).map((num) => {
          const isSorteada = sorteadas.has(num);
          return (
            <div
              key={num}
              className={`
                w-14 h-14 md:w-20 md:h-20 rounded-xl flex items-center justify-center
                text-xl md:text-3xl font-bold transition-all duration-500
                ${
                  isSorteada
                    ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 scale-100"
                    : "bg-white/5 text-white/20"
                }
              `}
              style={{
                animationDelay: isSorteada ? `${dezenas.indexOf(num) * 60}ms` : undefined,
              }}
            >
              {formatarDezena(num)}
            </div>
          );
        })}
      </div>
    </div>
  );
}
