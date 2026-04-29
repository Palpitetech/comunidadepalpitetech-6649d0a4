import { TrendingUp } from "lucide-react";

const POSICOES = [
  { pos: "P1", highlight: false },
  { pos: "P2", highlight: false },
  { pos: "P3", highlight: false },
  { pos: "P4", highlight: true },
  { pos: "P5", highlight: true },
  { pos: "P6", highlight: true },
];

// V2 — Premium green-neon math explainer with horizontal range bar
export default function Slide2Explicacao() {
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

        <div className="w-full relative">
          {/* base bar */}
          <div
            className="w-full h-10 rounded-full relative overflow-hidden"
            style={{
              background: "rgba(15, 20, 16, 0.9)",
              border: "1.5px solid rgba(125, 255, 58, 0.2)",
              boxShadow: "inset 0 2px 8px rgba(0,0,0,0.6)",
            }}
          >
            {/* highlighted zone 30-60 */}
            <div
              className="absolute top-0 bottom-0 rounded-full"
              style={{
                left: `${((30 - 1) / 59) * 100}%`,
                width: `${((60 - 30) / 59) * 100}%`,
                background:
                  "linear-gradient(90deg, rgba(57, 211, 83, 0.6), #7DFF3A, #B7FF8A)",
                boxShadow:
                  "0 0 30px rgba(125, 255, 58, 0.8), inset 0 0 14px rgba(255,255,255,0.2)",
                animation: "neonGlow 2.4s ease-in-out infinite",
              }}
            />
          </div>

          {/* scale marks */}
          <div className="flex justify-between mt-3 px-1 font-mono text-sm font-bold tracking-wider">
            {[1, 15, 30, 45, 60].map((n) => {
              const inZone = n >= 30;
              return (
                <span
                  key={n}
                  style={{
                    color: inZone ? "#7DFF3A" : "rgba(248, 250, 252, 0.4)",
                    textShadow: inZone ? "0 0 10px rgba(125, 255, 58, 0.7)" : "none",
                  }}
                >
                  {String(n).padStart(2, "0")}
                </span>
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
          ◇ Janela: 100 sorteios ◇
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
