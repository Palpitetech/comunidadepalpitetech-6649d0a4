import { formatarDezena } from "@/lib/quina";
import type { FrequenciaDezena, DuplaFrequente } from "@/hooks/useGravacaoData";

interface SlideFrequenciaQuinaProps {
  frequenciaDezenas: FrequenciaDezena[];
  topDuplas: DuplaFrequente[];
}

export default function SlideFrequenciaQuina({ frequenciaDezenas, topDuplas }: SlideFrequenciaQuinaProps) {
  const dezenaMap = new Map(frequenciaDezenas.map((f) => [f.dezena, f]));
  const quentes = frequenciaDezenas.filter((f) => f.tipo === "quente");
  const frias = frequenciaDezenas.filter((f) => f.tipo === "fria");

  return (
    <div className="flex w-full h-full gap-6">
      {/* Left 35%: Grid 10x8 + Top Duplas */}
      <div className="w-[35%] flex flex-col items-center justify-center gap-4">
        <div>
          <p className="text-indigo-300/60 text-sm mb-3 tracking-wide text-center">
            Frequência — Últimos 5
          </p>
          <div className="grid grid-cols-10 gap-[3px]">
            {Array.from({ length: 80 }, (_, i) => i + 1).map((num) => {
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
                  className={`w-6 h-6 md:w-7 md:h-7 rounded flex flex-col items-center justify-center ${bg}`}
                >
                  <span className="text-[7px] md:text-[8px] font-bold leading-none">
                    {formatarDezena(num)}
                  </span>
                  {info && info.freq > 0 && (
                    <span className="text-[5px] opacity-70 leading-none">
                      {info.freq}×
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-2">
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

        {/* Top 3 Duplas */}
        {topDuplas.length > 0 && (
          <div className="w-full">
            <p className="text-indigo-300 text-xs font-semibold mb-2 flex items-center gap-1.5">
              🤝 Duplas Mais Frequentes
            </p>
            <div className="space-y-1.5">
              {topDuplas.map((dupla, i) => (
                <div
                  key={`${dupla.d1}-${dupla.d2}`}
                  className="flex items-center gap-3 rounded-lg px-3 py-2"
                  style={{
                    background: "rgba(99, 102, 241, 0.12)",
                    border: "1px solid rgba(99, 102, 241, 0.25)",
                  }}
                >
                  <span className="text-indigo-400/60 text-xs font-bold min-w-[16px]">
                    {i + 1}º
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white"
                      style={{ background: "linear-gradient(135deg, #6366F1, #4F46E5)" }}
                    >
                      {formatarDezena(dupla.d1)}
                    </span>
                    <span
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white"
                      style={{ background: "linear-gradient(135deg, #6366F1, #4F46E5)" }}
                    >
                      {formatarDezena(dupla.d2)}
                    </span>
                  </div>
                  <span className="text-white/50 text-xs ml-auto">
                    {dupla.freq}× em 5
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right 65%: Lists */}
      <div className="w-[65%] flex flex-col justify-center gap-6">
        {/* Quentes */}
        <div>
          <p className="text-indigo-300 text-sm font-semibold mb-3 flex items-center gap-2">
            🔥 Dezenas Quentes
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            {quentes.length === 0 ? (
              <p className="text-white/30 text-xs col-span-2">Nenhuma dezena com 3+ aparições</p>
            ) : (
              quentes.slice(0, 10).map((f) => (
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
          <p className="text-indigo-300 text-sm font-semibold mb-3 flex items-center gap-2">
            ❄️ Dezenas Frias
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            {frias.length === 0 ? (
              <p className="text-white/30 text-xs col-span-2">Nenhuma dezena com 0–1 aparição</p>
            ) : (
              frias.slice(0, 10).map((f) => (
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
