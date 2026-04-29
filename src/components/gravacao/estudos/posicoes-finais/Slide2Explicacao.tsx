import { TrendingUp } from "lucide-react";

const POSICOES = [
  { pos: "P1", highlight: false },
  { pos: "P2", highlight: false },
  { pos: "P3", highlight: false },
  { pos: "P4", highlight: true },
  { pos: "P5", highlight: true },
  { pos: "P6", highlight: true },
];

interface Props {
  janela?: number;
}

// V2 — Premium green-neon math explainer with horizontal range bar
export default function Slide2Explicacao({ janela = 20 }: Props) {
  return (
    <div className="flex flex-col items-center justify-center gap-12 w-full h-full max-w-6xl mx-auto">
      <div className="text-center">
        <p
          className="text-xs tracking-[0.55em] uppercase font-bold mb-4"
          style={{ color: "rgba(125, 255, 58, 0.75)" }}
        >
          ◆ O Que Diz a Matemática ◆
        </p>
        <h2
          className="text-6xl md:text-7xl font-black tracking-tight"
          style={{ color: "#F8FAFC", textShadow: "0 0 40px rgba(125, 255, 58, 0.2)" }}
        >
          POSIÇÕES FINAIS
        </h2>
        <p className="text-[#F8FAFC]/65 text-xl md:text-2xl mt-6 max-w-4xl mx-auto leading-relaxed">
          Toda sequência pode ser ordenada de forma crescente.<br />
          Estatisticamente,{" "}
          <span style={{ color: "#7DFF3A", fontWeight: 700 }}>P4, P5 e P6</span>{" "}
          concentram{" "}
          <span style={{ color: "#B7FF8A", fontWeight: 700 }}>dezenas maiores</span>.
        </p>
      </div>

      {/* Sequência P1 < P2 < ... < P6 — círculos */}
      <div className="flex items-center justify-center gap-3 md:gap-5 flex-wrap">
        {POSICOES.map((f, i) => (
          <div key={f.pos} className="flex items-center gap-3 md:gap-4">
            <div
              className="rounded-full flex items-center justify-center transition-all"
              style={{
                width: 96,
                height: 96,
                background: f.highlight
                  ? "radial-gradient(circle at 30% 30%, rgba(125, 255, 58, 0.18), rgba(7, 12, 8, 0.9))"
                  : "rgba(15, 20, 16, 0.8)",
                border: f.highlight ? "2px solid #7DFF3A" : "1.5px solid rgba(125, 255, 58, 0.15)",
                boxShadow: f.highlight
                  ? "0 0 35px rgba(125, 255, 58, 0.6), inset 0 0 20px rgba(125, 255, 58, 0.15)"
                  : "inset 0 0 20px rgba(0,0,0,0.5)",
              }}
            >
              <span
                className="text-3xl font-black tracking-tight"
                style={{
                  color: f.highlight ? "#B7FF8A" : "rgba(248, 250, 252, 0.4)",
                  textShadow: f.highlight ? "0 0 16px rgba(125, 255, 58, 0.9)" : "none",
                }}
              >
                {f.pos}
              </span>
            </div>
            {i < POSICOES.length - 1 && (
              <span
                className="text-3xl font-light"
                style={{ color: "rgba(125, 255, 58, 0.55)" }}
              >
                {"<"}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* RANGE BAR — faixa horizontal 01 → 60 */}
      <div className="w-full max-w-4xl flex flex-col items-center gap-5">
        <p
          className="text-sm tracking-[0.45em] uppercase font-bold"
          style={{ color: "rgba(125, 255, 58, 0.85)" }}
        >
          ◆ Faixa Mais Provável ◆
        </p>

        <div className="w-full relative pt-8 pb-10">
          {/* Floating "30 — 60" label above zone */}
          <div
            className="absolute top-0 -translate-x-1/2 flex flex-col items-center gap-1"
            style={{
              left: `${(((30 + 60) / 2 - 1) / 59) * 100}%`,
            }}
          >
            <span
              className="text-[10px] tracking-[0.4em] uppercase font-black px-2.5 py-1 rounded-md whitespace-nowrap"
              style={{
                color: "#050805",
                background: "linear-gradient(135deg, #B7FF8A, #7DFF3A)",
                boxShadow: "0 0 18px rgba(125, 255, 58, 0.7)",
              }}
            >
              Faixa Provável
            </span>
            <span
              className="w-px h-2"
              style={{ background: "rgba(125, 255, 58, 0.7)" }}
            />
          </div>

          {/* base bar (track) */}
          <div
            className="w-full h-12 rounded-full relative overflow-hidden"
            style={{
              background:
                "linear-gradient(180deg, rgba(7, 12, 8, 0.95), rgba(15, 20, 16, 0.85))",
              border: "1.5px solid rgba(125, 255, 58, 0.22)",
              boxShadow:
                "inset 0 2px 10px rgba(0,0,0,0.7), 0 0 20px rgba(125, 255, 58, 0.08)",
            }}
          >
            {/* Tick marks every 5 numbers — full track */}
            {Array.from({ length: 12 }, (_, i) => {
              const n = (i + 1) * 5; // 5, 10, ..., 60
              const left = ((n - 1) / 59) * 100;
              const isMajor = n % 15 === 0;
              const inZone = n >= 30;
              return (
                <div
                  key={n}
                  className="absolute top-0 bottom-0"
                  style={{
                    left: `${left}%`,
                    width: 1,
                    background: inZone
                      ? "rgba(125, 255, 58, 0.45)"
                      : "rgba(248, 250, 252, 0.18)",
                    opacity: isMajor ? 1 : 0.55,
                  }}
                />
              );
            })}

            {/* highlighted zone 30-60 */}
            <div
              className="absolute top-1 bottom-1 rounded-full"
              style={{
                left: `${((30 - 1) / 59) * 100}%`,
                width: `${((60 - 30) / 59) * 100}%`,
                background:
                  "linear-gradient(90deg, rgba(57, 211, 83, 0.85), #7DFF3A 50%, #B7FF8A)",
                boxShadow:
                  "0 0 35px rgba(125, 255, 58, 0.85), 0 0 12px rgba(183, 255, 138, 0.9), inset 0 0 16px rgba(255,255,255,0.25)",
                animation: "neonGlow 2.4s ease-in-out infinite",
              }}
            />

            {/* Zone start marker (30) */}
            <div
              className="absolute top-0 bottom-0"
              style={{
                left: `${((30 - 1) / 59) * 100}%`,
                width: 2,
                background: "#B7FF8A",
                boxShadow: "0 0 14px rgba(183, 255, 138, 1)",
              }}
            />
            {/* Zone end marker (60) */}
            <div
              className="absolute top-0 bottom-0"
              style={{
                left: `${((60 - 1) / 59) * 100}%`,
                width: 2,
                background: "#B7FF8A",
                boxShadow: "0 0 14px rgba(183, 255, 138, 1)",
              }}
            />
          </div>

          {/* Tick labels — full scale 01, 10, 20, 30, 40, 50, 60 */}
          <div className="absolute left-0 right-0 bottom-0 h-8 pointer-events-none">
            {[1, 10, 20, 30, 40, 50, 60].map((n) => {
              const left = ((n - 1) / 59) * 100;
              const inZone = n >= 30;
              return (
                <div
                  key={n}
                  className="absolute top-0 -translate-x-1/2 flex flex-col items-center gap-1"
                  style={{ left: `${left}%` }}
                >
                  <span
                    className="w-px h-2"
                    style={{
                      background: inZone
                        ? "rgba(125, 255, 58, 0.7)"
                        : "rgba(248, 250, 252, 0.3)",
                    }}
                  />
                  <span
                    className="font-mono text-sm font-black tracking-wider"
                    style={{
                      color: inZone ? "#7DFF3A" : "rgba(248, 250, 252, 0.45)",
                      textShadow: inZone
                        ? "0 0 12px rgba(125, 255, 58, 0.85)"
                        : "none",
                    }}
                  >
                    {String(n).padStart(2, "0")}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div
          className="rounded-2xl px-8 py-4 flex items-center gap-3 backdrop-blur-sm"
          style={{
            background: "rgba(125, 255, 58, 0.06)",
            border: "1.5px solid rgba(125, 255, 58, 0.35)",
            boxShadow: "0 0 30px rgba(125, 255, 58, 0.15)",
          }}
        >
          <TrendingUp className="h-6 w-6" style={{ color: "#7DFF3A" }} />
          <p className="text-[#F8FAFC] text-lg md:text-xl">
            <span className="text-[10px] tracking-[0.4em] uppercase block mb-1" style={{ color: "rgba(125, 255, 58, 0.7)" }}>
              Maior concentração estatística
            </span>
            <span className="text-3xl font-black" style={{ color: "#B7FF8A", textShadow: "0 0 18px rgba(125, 255, 58, 0.7)" }}>
              30 — 60
            </span>
          </p>
        </div>

        <p className="text-[#F8FAFC]/45 text-xs tracking-[0.3em] uppercase font-bold mt-1">
          ◇ Janela: {janela} sorteios ◇
        </p>
      </div>

      <style>{`
        @keyframes neonGlow {
          0%, 100% { filter: brightness(1); }
          50% { filter: brightness(1.25); }
        }
      `}</style>
    </div>
  );
}
