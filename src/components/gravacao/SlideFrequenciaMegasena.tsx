import { formatarDezena } from "@/lib/megasena";
import type { FrequenciaDezena, DuplaFrequente } from "@/hooks/useGravacaoData";

interface SlideFrequenciaMegasenaProps {
  frequenciaDezenas: FrequenciaDezena[];
  topDuplas: DuplaFrequente[];
}

export default function SlideFrequenciaMegasena({ frequenciaDezenas, topDuplas }: SlideFrequenciaMegasenaProps) {
  const dezenaMap = new Map(frequenciaDezenas.map((f) => [f.dezena, f]));
  const quentes = frequenciaDezenas.filter((f) => f.tipo === "quente");
  const frias = frequenciaDezenas.filter((f) => f.tipo === "fria");

  return (
    <div className="flex w-full h-full gap-6">
      {/* Left 35%: Grid 6x10 + Top Duplas */}
      <div className="w-[35%] flex flex-col items-center justify-center gap-4">
        <div>
          <p className="text-emerald-300/60 text-sm mb-3 tracking-wide text-center">
            Frequência — Últimos 12
          </p>
          <div className="grid grid-cols-10 gap-[3px]">
            {Array.from({ length: 60 }, (_, i) => i + 1).map((num) => {
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
                  className={`w-7 h-7 md:w-8 md:h-8 rounded flex flex-col items-center justify-center ${bg}`}
                >
                  <span className="text-[8px] md:text-[9px] font-bold leading-none">
                    {formatarDezena(num)}
                  </span>
                  {info && info.freq > 0 && (
                    <span className="text-[6px] opacity-70 leading-none">
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
              <span className="text-white/50 text-[10px]">Quentes (4+)</span>
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
            <p className="text-emerald-300 text-xs font-semibold mb-2 flex items-center gap-1.5">
              🤝 Duplas Mais Frequentes
            </p>
            <div className="space-y-1.5">
              {topDuplas.map((dupla, i) => (
                <div
                  key={`${dupla.d1}-${dupla.d2}`}
                  className="flex items-center gap-3 rounded-lg px-3 py-2"
                  style={{
                    background: "rgba(16, 185, 129, 0.12)",
                    border: "1px solid rgba(16, 185, 129, 0.25)",
                  }}
                >
                  <span className="text-emerald-400/60 text-xs font-bold min-w-[16px]">
                    {i + 1}º
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white"
                      style={{ background: "linear-gradient(135deg, #10B981, #059669)" }}
                    >
                      {formatarDezena(dupla.d1)}
                    </span>
                    <span
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white"
                      style={{ background: "linear-gradient(135deg, #10B981, #059669)" }}
                    >
                      {formatarDezena(dupla.d2)}
                    </span>
                  </div>
                  <span className="text-white/50 text-xs ml-auto">
                    {dupla.freq}× em 12
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
          <p className="text-emerald-300 text-sm font-semibold mb-3 flex items-center gap-2">
            🔥 Dezenas Quentes
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            {quentes.length === 0 ? (
              <p className="text-white/30 text-xs col-span-2">Nenhuma dezena com 4+ aparições</p>
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
                    {f.freq}× em 12
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
          <p className="text-emerald-300 text-sm font-semibold mb-3 flex items-center gap-2">
            ❄️ Dezenas Frias
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            {frias.length === 0 ? (
              <p className="text-white/30 text-xs col-span-2">Nenhuma dezena com 0–1 aparições</p>
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
                    {f.freq}× em 12
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
