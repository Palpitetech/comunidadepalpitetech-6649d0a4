import { Crosshair } from "lucide-react";

interface Props {
  concurso?: number;
  data?: string;
}

// V2 — Premium green-neon intro inspired by storyboard reference
export default function Slide1Intro({ concurso, data }: Props) {
  return (
    <div className="flex flex-col items-center justify-center gap-6 text-center w-full h-full animate-fade-in relative">
      {/* Top label bar */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 flex items-center gap-4 text-[11px] tracking-[0.5em] uppercase font-bold"
           style={{ color: "rgba(125, 255, 58, 0.7)" }}>
        <span className="text-white/40">Storyboard — 6 slides</span>
        <span className="text-[#7DFF3A]/30">|</span>
        <span style={{ textShadow: "0 0 14px rgba(125, 255, 58, 0.7)" }}>
          Posições Finais da Mega-Sena
        </span>
      </div>

      <div className="animate-scale-in flex flex-col items-center gap-5">
        <Crosshair
          className="h-14 w-14"
          style={{
            color: "#7DFF3A",
            filter: "drop-shadow(0 0 24px rgba(125, 255, 58, 0.85))",
          }}
        />

        <h1
          className="text-7xl md:text-9xl font-black tracking-tight leading-[0.92] max-w-6xl"
          style={{
            fontFamily: "'Inter', system-ui, sans-serif",
            color: "#F8FAFC",
            textShadow: "0 0 40px rgba(125, 255, 58, 0.15)",
          }}
        >
          POSIÇÕES FINAIS<br />
          <span
            style={{
              background: "linear-gradient(135deg, #B7FF8A 0%, #7DFF3A 50%, #39D353 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              fontStyle: "italic",
              textShadow: "0 0 60px rgba(125, 255, 58, 0.5)",
            }}
          >
            DA MEGA-SENA
          </span>
        </h1>

        <p className="text-[#F8FAFC]/55 text-sm md:text-base tracking-[0.45em] uppercase font-medium mt-2">
          Análise estatística das últimas 100 extrações
        </p>
      </div>

      {concurso && (
        <div
          className="rounded-2xl px-12 py-5 mt-4 backdrop-blur-sm"
          style={{
            background: "rgba(7, 12, 8, 0.6)",
            border: "1.5px solid rgba(125, 255, 58, 0.45)",
            boxShadow:
              "0 0 60px rgba(125, 255, 58, 0.25), inset 0 0 30px rgba(125, 255, 58, 0.05)",
          }}
        >
          <p
            className="text-[10px] uppercase tracking-[0.55em] mb-2 font-bold"
            style={{ color: "rgba(125, 255, 58, 0.7)" }}
          >
            Concurso
          </p>
          <p
            className="text-6xl md:text-7xl font-black leading-none"
            style={{
              color: "#7DFF3A",
              textShadow: "0 0 30px rgba(125, 255, 58, 0.8)",
              fontFeatureSettings: '"tnum"',
            }}
          >
            {concurso}
          </p>
          {data && (
            <p className="text-white/40 text-xs capitalize mt-2 tracking-wider">{data}</p>
          )}
        </div>
      )}

      {/* Bottom badges */}
      <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex items-center gap-8 text-[11px] tracking-[0.4em] uppercase font-bold"
           style={{ color: "rgba(248, 250, 252, 0.45)" }}>
        <span>◆ Estudo Técnico</span>
        <span style={{ color: "rgba(125, 255, 58, 0.5)" }}>•</span>
        <span>Dados Reais</span>
        <span style={{ color: "rgba(125, 255, 58, 0.5)" }}>•</span>
        <span>Estratégia Inteligente ◆</span>
      </div>

      {/* Animated glow pulse */}
      <style>{`
        @keyframes neonPulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
