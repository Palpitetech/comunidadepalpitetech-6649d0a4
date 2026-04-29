import { CheckCircle2, XCircle, RefreshCw, Trophy, Calendar } from "lucide-react";

interface Props {
  trio: number[];
  premioEstimado?: string;
  proximoConcurso?: number;
}

const CHECKLIST = [
  { ok: true, text: "Use o trio como base do fechamento." },
  { ok: true, text: "Combine com dezenas intermediárias para equilibrar." },
  { ok: false, text: "Evite terminar com dezenas fora da faixa 30–60." },
  { ok: true, text: "Reavalie diariamente — estatística muda sempre.", icon: "refresh" as const },
];

// V2 — Premium green-neon strategic conclusion
export default function Slide6Conclusao({ trio, premioEstimado, proximoConcurso }: Props) {
  return (
    <div className="flex flex-col items-center justify-center gap-8 w-full h-full max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center">
        <p
          className="text-xs tracking-[0.55em] uppercase font-bold mb-3"
          style={{ color: "rgba(125, 255, 58, 0.75)" }}
        >
          ◆ Conclusão Estratégica ◆
        </p>
        <h2
          className="text-5xl md:text-6xl font-black tracking-tight"
          style={{ color: "#F8FAFC" }}
        >
          TRIO RECOMENDADO
        </h2>
      </div>

      {/* Trio em círculos grandes — destaque máximo */}
      <div className="flex items-center justify-center gap-6 md:gap-12">
        {trio.map((dez, i) => (
          <div
            key={i}
            className="flex flex-col items-center gap-3"
            style={{
              animation: `fadeScale 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${i * 0.18}s both`,
            }}
          >
            <div
              className="rounded-full flex items-center justify-center relative"
              style={{
                width: 200,
                height: 200,
                background:
                  "radial-gradient(circle at 30% 25%, rgba(125, 255, 58, 0.12), rgba(7, 12, 8, 0.95) 70%)",
                border: "2.5px solid #7DFF3A",
                boxShadow:
                  "0 0 70px rgba(125, 255, 58, 0.65), inset 0 0 40px rgba(125, 255, 58, 0.12), 0 0 0 1px rgba(183, 255, 138, 0.3)",
                animation: "neonPulse 3s ease-in-out infinite",
              }}
            >
              <span
                className="text-8xl font-black"
                style={{
                  color: "#F8FAFC",
                  textShadow:
                    "0 0 35px rgba(125, 255, 58, 0.95), 0 0 12px rgba(183, 255, 138, 0.7)",
                  fontFeatureSettings: '"tnum"',
                }}
              >
                {String(dez).padStart(2, "0")}
              </span>
            </div>
            <span
              className="text-sm font-black tracking-[0.45em] uppercase"
              style={{
                color: "#7DFF3A",
                textShadow: "0 0 12px rgba(125, 255, 58, 0.6)",
              }}
            >
              P{i + 4}
            </span>
          </div>
        ))}
      </div>

      {/* Bottom row: checklist + prêmio */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full max-w-5xl">
        {/* Checklist 2/3 */}
        <div
          className="md:col-span-2 rounded-2xl p-6 backdrop-blur-sm"
          style={{
            background: "rgba(15, 25, 17, 0.7)",
            border: "1.5px solid rgba(125, 255, 58, 0.25)",
            boxShadow: "0 0 30px rgba(125, 255, 58, 0.1)",
          }}
        >
          <div className="space-y-3">
            {CHECKLIST.map((item, i) => {
              const Icon = item.icon === "refresh" ? RefreshCw : item.ok ? CheckCircle2 : XCircle;
              const color = item.icon === "refresh" ? "#B7FF8A" : item.ok ? "#7DFF3A" : "#EF4444";
              return (
                <div key={i} className="flex items-center gap-4">
                  <div
                    className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
                    style={{
                      background: `${color}1A`,
                      border: `1.5px solid ${color}55`,
                      boxShadow: `0 0 16px ${color}40`,
                    }}
                  >
                    <Icon className="w-5 h-5" style={{ color }} strokeWidth={2.5} />
                  </div>
                  <span className="text-[#F8FAFC]/90 text-base md:text-lg leading-snug">
                    {item.text}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Próximo prêmio 1/3 */}
        {premioEstimado && (
          <div
            className="rounded-2xl p-6 flex flex-col items-center justify-center text-center backdrop-blur-sm"
            style={{
              background:
                "linear-gradient(160deg, rgba(125, 255, 58, 0.1), rgba(57, 211, 83, 0.04))",
              border: "1.5px solid rgba(125, 255, 58, 0.45)",
              boxShadow: "0 0 50px rgba(125, 255, 58, 0.2), inset 0 0 30px rgba(125, 255, 58, 0.05)",
            }}
          >
            <Trophy
              className="h-9 w-9 mb-2"
              style={{ color: "#B7FF8A", filter: "drop-shadow(0 0 12px rgba(125, 255, 58, 0.7))" }}
            />
            <p
              className="text-[10px] uppercase tracking-[0.45em] font-black mb-1"
              style={{ color: "rgba(125, 255, 58, 0.75)" }}
            >
              Próximo Prêmio
            </p>
            <p
              className="text-3xl md:text-4xl font-black leading-tight"
              style={{
                color: "#F8FAFC",
                textShadow: "0 0 20px rgba(125, 255, 58, 0.7)",
              }}
            >
              {premioEstimado}
            </p>
          </div>
        )}
      </div>

      {/* Footer ribbon */}
      <div className="flex items-center justify-center gap-4 mt-2 text-[10px] tracking-[0.4em] uppercase font-bold"
           style={{ color: "rgba(248, 250, 252, 0.45)" }}>
        {proximoConcurso && (
          <>
            <Calendar className="h-3.5 w-3.5" style={{ color: "#7DFF3A" }} />
            <span>Concurso {proximoConcurso}</span>
            <span style={{ color: "rgba(125, 255, 58, 0.5)" }}>•</span>
          </>
        )}
        <span>Estudo Diário</span>
        <span style={{ color: "rgba(125, 255, 58, 0.5)" }}>•</span>
        <span>Análise Real</span>
        <span style={{ color: "rgba(125, 255, 58, 0.5)" }}>•</span>
        <span style={{ color: "#7DFF3A" }}>Mais Inteligência, Mais Estratégia</span>
      </div>

      <p className="text-[#F8FAFC]/30 text-[10px] tracking-[0.35em] uppercase">
        Este material é informativo e não garante resultados · Loteria envolve sorte
      </p>

      <style>{`
        @keyframes fadeScale {
          from { opacity: 0; transform: scale(0.85); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes neonPulse {
          0%, 100% {
            box-shadow: 0 0 70px rgba(125, 255, 58, 0.55), inset 0 0 40px rgba(125, 255, 58, 0.12), 0 0 0 1px rgba(183, 255, 138, 0.3);
          }
          50% {
            box-shadow: 0 0 90px rgba(125, 255, 58, 0.8), inset 0 0 50px rgba(125, 255, 58, 0.2), 0 0 0 1px rgba(183, 255, 138, 0.5);
          }
        }
      `}</style>
    </div>
  );
}
