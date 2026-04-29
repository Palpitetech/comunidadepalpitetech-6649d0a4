const FAIXAS = [
  { pos: "P1", min: 1, max: 20, label: "1 — 20" },
  { pos: "P2", min: 8, max: 30, label: "8 — 30" },
  { pos: "P3", min: 18, max: 42, label: "18 — 42" },
  { pos: "P4", min: 28, max: 52, label: "28 — 52", highlight: true },
  { pos: "P5", min: 38, max: 58, label: "38 — 58", highlight: true },
  { pos: "P6", min: 45, max: 60, label: "45 — 60", highlight: true },
];

export default function Slide2Explicacao() {
  return (
    <div className="flex flex-col items-center justify-center gap-10 w-full h-full max-w-6xl mx-auto">
      <div className="text-center">
        <p className="text-purple-400 text-sm tracking-[0.4em] uppercase font-medium mb-3">
          Como funciona
        </p>
        <h2 className="text-5xl md:text-6xl font-extrabold text-white tracking-tight">
          A regra crescente
        </h2>
        <p className="text-white/60 text-xl mt-4 max-w-3xl mx-auto">
          Toda Mega-Sena tem 6 dezenas em ordem crescente. Cada posição tem uma faixa estatística previsível.
        </p>
      </div>

      {/* Sequência P1 < P2 < ... < P6 */}
      <div className="flex items-center justify-center gap-2 md:gap-3 flex-wrap">
        {FAIXAS.map((f, i) => (
          <div key={f.pos} className="flex items-center gap-2 md:gap-3">
            <div
              className="rounded-2xl flex items-center justify-center"
              style={{
                width: 88,
                height: 88,
                background: f.highlight ? "rgba(124, 58, 237, 0.18)" : "#111827",
                border: f.highlight ? "2px solid #7C3AED" : "1px solid #1F2937",
                boxShadow: f.highlight ? "0 0 30px rgba(124, 58, 237, 0.4)" : "none",
              }}
            >
              <span
                className={`text-3xl font-extrabold ${
                  f.highlight ? "text-purple-200" : "text-white/70"
                }`}
              >
                {f.pos}
              </span>
            </div>
            {i < FAIXAS.length - 1 && (
              <span className="text-purple-400/70 text-3xl font-light">{"<"}</span>
            )}
          </div>
        ))}
      </div>

      {/* Gráfico de faixas horizontal */}
      <div className="w-full max-w-5xl space-y-3">
        <div className="flex items-center justify-between text-white/40 text-xs uppercase tracking-wider px-1">
          <span>Dezena 1</span>
          <span className="text-emerald-400/70">Faixa-chave 30 — 60</span>
          <span>Dezena 60</span>
        </div>

        {FAIXAS.map((f) => {
          const left = ((f.min - 1) / 59) * 100;
          const width = ((f.max - f.min) / 59) * 100;
          return (
            <div key={f.pos} className="flex items-center gap-4">
              <span
                className={`w-10 text-base font-bold ${
                  f.highlight ? "text-purple-300" : "text-white/50"
                }`}
              >
                {f.pos}
              </span>
              <div className="flex-1 relative h-7 rounded-md bg-white/[0.03] border border-white/5">
                {/* Zona-chave 30-60 background */}
                <div
                  className="absolute top-0 bottom-0 bg-emerald-500/[0.05] border-l border-r border-emerald-500/20"
                  style={{
                    left: `${((30 - 1) / 59) * 100}%`,
                    width: `${((60 - 30) / 59) * 100}%`,
                  }}
                />
                {/* Faixa da posição */}
                <div
                  className="absolute top-1 bottom-1 rounded-sm"
                  style={{
                    left: `${left}%`,
                    width: `${width}%`,
                    background: f.highlight
                      ? "linear-gradient(90deg, #7C3AED, #A78BFA)"
                      : "linear-gradient(90deg, #4B5563, #6B7280)",
                    boxShadow: f.highlight ? "0 0 20px rgba(124, 58, 237, 0.5)" : "none",
                  }}
                />
              </div>
              <span
                className={`w-28 text-right text-base font-mono ${
                  f.highlight ? "text-purple-200 font-bold" : "text-white/40"
                }`}
              >
                {f.label}
              </span>
            </div>
          );
        })}
      </div>

      <div
        className="rounded-xl px-6 py-3 text-emerald-300 text-base md:text-lg max-w-3xl text-center"
        style={{
          background: "rgba(16, 185, 129, 0.08)",
          border: "1px solid rgba(16, 185, 129, 0.25)",
        }}
      >
        <span className="font-bold">P4, P5 e P6</span> concentram as dezenas decisivas — quase sempre entre 30 e 60.
      </div>
    </div>
  );
}
