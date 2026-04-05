import { formatarDezena } from "@/lib/lotofacil";
import type { EstatisticaItem } from "@/hooks/useGravacaoData";

interface SlideEstatisticasProps {
  dezenas: number[];
  estatisticas: EstatisticaItem[];
}

const STATUS_COLORS = {
  dentro: { bg: "bg-emerald-500/15", text: "text-emerald-400", dot: "bg-emerald-400" },
  limite: { bg: "bg-yellow-500/15", text: "text-yellow-400", dot: "bg-yellow-400" },
  fora: { bg: "bg-red-500/15", text: "text-red-400", dot: "bg-red-400" },
};

export default function SlideEstatisticas({ dezenas, estatisticas }: SlideEstatisticasProps) {
  const sorteadas = new Set(dezenas);

  return (
    <div className="flex w-full h-full gap-8">
      {/* Left: mini grid */}
      <div className="w-[30%] flex flex-col items-center justify-center">
        <p className="text-white/50 text-sm mb-4 tracking-wide">Resultado</p>
        <div className="grid grid-cols-5 gap-1.5">
          {Array.from({ length: 25 }, (_, i) => i + 1).map((num) => (
            <div
              key={num}
              className={`
                w-9 h-9 md:w-11 md:h-11 rounded-lg flex items-center justify-center
                text-xs md:text-sm font-bold
                ${sorteadas.has(num) ? "bg-emerald-500 text-white" : "bg-white/5 text-white/15"}
              `}
            >
              {formatarDezena(num)}
            </div>
          ))}
        </div>
      </div>

      {/* Right: statistics table */}
      <div className="w-[70%] flex flex-col justify-center">
        <p className="text-white/50 text-sm mb-4 tracking-wide">Indicadores</p>
        <div className="space-y-3">
          {estatisticas.map((item) => {
            const colors = STATUS_COLORS[item.status];
            return (
              <div
                key={item.label}
                className={`flex items-center justify-between rounded-xl px-5 py-3 ${colors.bg}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-2.5 h-2.5 rounded-full ${colors.dot}`} />
                  <span className="text-white text-base md:text-lg font-medium">
                    {item.label}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`text-lg md:text-2xl font-bold ${colors.text}`}>
                    {item.valor}
                  </span>
                  <span className="text-white/30 text-sm">
                    ({item.faixaMin}–{item.faixaMax})
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
