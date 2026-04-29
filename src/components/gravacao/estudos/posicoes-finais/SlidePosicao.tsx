import { Target, BarChart3 } from "lucide-react";

interface DezenaFreq {
  dezena: number;
  frequencia: number;
  quantidade: number;
}

interface Props {
  posicao: number;
  top: DezenaFreq[];
  destaque?: boolean;
  badge?: string;
  descricao: string;
}

// V2 — Premium green-neon position card slide
export default function SlidePosicao({ posicao, top, destaque, badge, descricao }: Props) {
  const cardSize = destaque ? 220 : 190;

  return (
    <div className="flex flex-col items-center justify-center gap-10 w-full h-full max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center flex flex-col items-center gap-3">
        <h2
          className="text-9xl md:text-[11rem] font-black leading-none tracking-tighter"
          style={{
            fontStyle: "italic",
            background: "linear-gradient(135deg, #B7FF8A 0%, #7DFF3A 50%, #39D353 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            textShadow: "0 0 80px rgba(125, 255, 58, 0.6)",
            filter: "drop-shadow(0 0 30px rgba(125, 255, 58, 0.4))",
          }}
        >
          P{posicao}
        </h2>

        <div className="flex items-center gap-3 mt-2">
          <Target className="h-5 w-5" style={{ color: "#7DFF3A" }} />
          <p
            className="text-base md:text-lg tracking-[0.55em] uppercase font-black"
            style={{ color: "#B7FF8A", textShadow: "0 0 14px rgba(125, 255, 58, 0.6)" }}
          >
            Top Frequentes
          </p>
        </div>

        {badge && (
          <span
            className="text-xs tracking-[0.35em] uppercase font-black px-4 py-1.5 rounded-full mt-2"
            style={{
              background: "linear-gradient(135deg, #39D353, #7DFF3A)",
              color: "#050805",
              boxShadow: "0 0 24px rgba(125, 255, 58, 0.7)",
            }}
          >
            ✦ {badge} ✦
          </span>
        )}
      </div>

      {/* Cards horizontal */}
      <div className="flex items-end justify-center gap-4 md:gap-6 flex-wrap">
        {top.map((d, i) => {
          const isFirst = i === 0;
          const size = isFirst ? cardSize + 30 : cardSize;
          return (
            <div
              key={d.dezena}
              className="flex flex-col items-center"
              style={{
                animation: `fadeUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${i * 0.13}s both`,
              }}
            >
              <div
                className="rounded-2xl flex flex-col items-center justify-center relative backdrop-blur-sm"
                style={{
                  width: size,
                  height: size,
                  background:
                    "linear-gradient(160deg, rgba(15, 25, 17, 0.9) 0%, rgba(7, 12, 8, 0.95) 100%)",
                  border: isFirst ? "2px solid #7DFF3A" : "1.5px solid rgba(125, 255, 58, 0.35)",
                  boxShadow: isFirst
                    ? "0 0 50px rgba(125, 255, 58, 0.55), inset 0 0 30px rgba(125, 255, 58, 0.08), 0 8px 30px rgba(0,0,0,0.6)"
                    : "0 0 24px rgba(125, 255, 58, 0.2), inset 0 0 20px rgba(125, 255, 58, 0.04), 0 4px 20px rgba(0,0,0,0.5)",
                }}
              >
                {/* Corner glow ticks */}
                <span className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 rounded-tl-lg"
                      style={{ borderColor: isFirst ? "#7DFF3A" : "rgba(125, 255, 58, 0.5)" }} />
                <span className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 rounded-tr-lg"
                      style={{ borderColor: isFirst ? "#7DFF3A" : "rgba(125, 255, 58, 0.5)" }} />
                <span className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 rounded-bl-lg"
                      style={{ borderColor: isFirst ? "#7DFF3A" : "rgba(125, 255, 58, 0.5)" }} />
                <span className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 rounded-br-lg"
                      style={{ borderColor: isFirst ? "#7DFF3A" : "rgba(125, 255, 58, 0.5)" }} />

                <span
                  className={isFirst ? "text-[7rem]" : "text-8xl"}
                  style={{
                    fontWeight: 900,
                    color: "#F8FAFC",
                    textShadow: isFirst
                      ? "0 0 35px rgba(125, 255, 58, 0.9), 0 0 12px rgba(183, 255, 138, 0.6)"
                      : "0 0 20px rgba(125, 255, 58, 0.55)",
                    fontFeatureSettings: '"tnum"',
                    lineHeight: 1,
                  }}
                >
                  {String(d.dezena).padStart(2, "0")}
                </span>

                {/* Divider */}
                <div
                  className="my-2 h-px"
                  style={{
                    width: "60%",
                    background:
                      "linear-gradient(90deg, transparent, rgba(125, 255, 58, 0.6), transparent)",
                  }}
                />

                <span
                  className={`font-mono font-black ${isFirst ? "text-2xl" : "text-xl"}`}
                  style={{
                    color: "#7DFF3A",
                    textShadow: "0 0 12px rgba(125, 255, 58, 0.7)",
                  }}
                >
                  {d.quantidade}×
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Description card */}
      <div
        className="rounded-2xl px-8 py-5 flex items-center gap-4 max-w-3xl backdrop-blur-sm"
        style={{
          background: "rgba(15, 25, 17, 0.65)",
          border: "1.5px solid rgba(125, 255, 58, 0.25)",
          boxShadow: "0 0 30px rgba(125, 255, 58, 0.12)",
        }}
      >
        <div
          className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center"
          style={{
            background: "rgba(125, 255, 58, 0.1)",
            border: "1px solid rgba(125, 255, 58, 0.4)",
          }}
        >
          <BarChart3 className="h-6 w-6" style={{ color: "#7DFF3A" }} />
        </div>
        <p className="text-[#F8FAFC]/85 text-lg md:text-xl leading-snug">
          {descricao}
        </p>
      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
