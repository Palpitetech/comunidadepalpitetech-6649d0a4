import { formatarDezena } from "@/lib/lotofacil";
import type { FrequenciaDezena } from "@/hooks/useGravacaoData";

interface SlideFrequenciaProps {
  frequenciaDezenas: FrequenciaDezena[];
}

export default function SlideFrequencia({ frequenciaDezenas }: SlideFrequenciaProps) {
  const dezenaMap = new Map(frequenciaDezenas.map((f) => [f.dezena, f]));
  const quentes = frequenciaDezenas.filter((f) => f.tipo === "quente");
  const frias = frequenciaDezenas.filter((f) => f.tipo === "fria");

  return (
    <div className="flex w-full h-full gap-6">
      {/* Left 30%: Grid 5x5 */}
      <div className="w-[30%] flex flex-col items-center justify-center">
        <p className="text-purple-300/60 text-sm mb-4 tracking-wide text-center">
          Frequência — Últimos 5
        </p>
        <div className="grid grid-cols-5 gap-1.5">
          {Array.from({ length: 25 }, (_, i) => i + 1).map((num) => {
            const info = dezenaMap.get(num);
            const tipo = info?.tipo ?? "neutra";
            const bg =
              tipo === "quente"
                ? "bg-emerald-500 text-white"
                : tipo === "fria"
                ? "bg-red-500 text-white"
                : "bg-white/5 text-white/30";
            return (
              <div
                key={num}
                className={`w-9 h-9 md:w-11 md:h-11 rounded-lg flex flex-col items-center justify-center ${bg}`}
              >
                <span className="text-xs md:text-sm font-bold leading-none">
                  {formatarDezena(num)}
                </span>
                {info && (
                  <span className="text-[8px] opacity-70 leading-none mt-0.5">
                    {info.freq}×
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-4">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-emerald-500" />
            <span className="text-white/50 text-[10px]">Quentes (3+)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-red-500" />
            <span className="text-white/50 text-[10px]">Frias (0–1)</span>
          </div>
        </div>
      </div>

      {/* Right 70%: Lists */}
      <div className="w-[70%] flex flex-col justify-center gap-6">
        {/* Quentes */}
        <div>
          <p className="text-purple-300 text-sm font-semibold mb-3 flex items-center gap-2">
            🔥 Dezenas Quentes
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            {quentes.length === 0 ? (
              <p className="text-white/30 text-xs col-span-2">Nenhuma dezena com 3+ aparições</p>
            ) : (
              quentes.map((f) => (
                <div
                  key={f.dezena}
                  className="flex items-center gap-3 bg-emerald-500/15 border border-emerald-500/30 rounded-lg px-4 py-2"
                >
                  <span className="text-emerald-400 font-bold text-base min-w-[28px]">
                    {formatarDezena(f.dezena)}
                  </span>
                  <span className="text-white/50 text-sm">
                    {f.freq}× em 5
                  </span>
                  <span className="text-emerald-400/70 text-sm ml-auto font-medium">
                    {f.pct.toFixed(0)}%
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Frias */}
        <div>
          <p className="text-purple-300 text-sm font-semibold mb-3 flex items-center gap-2">
            ❄️ Dezenas Frias
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            {frias.length === 0 ? (
              <p className="text-white/30 text-xs col-span-2">Nenhuma dezena com 0–1 aparição</p>
            ) : (
              frias.map((f) => (
                <div
                  key={f.dezena}
                  className="flex items-center gap-3 bg-red-500/15 border border-red-500/30 rounded-lg px-4 py-2"
                >
                  <span className="text-red-400 font-bold text-base min-w-[28px]">
                    {formatarDezena(f.dezena)}
                  </span>
                  <span className="text-white/50 text-sm">
                    {f.freq}× em 5
                  </span>
                  <span className="text-red-400/70 text-sm ml-auto font-medium">
                    {f.pct.toFixed(0)}%
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
