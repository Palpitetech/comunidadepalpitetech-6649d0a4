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

export default function SlidePosicao({ posicao, top, destaque, badge, descricao }: Props) {
  const cardSize = destaque ? 220 : 180;
  const numberSize = destaque ? "text-7xl" : "text-6xl";
  const glowColor = destaque
    ? "0 0 80px rgba(124, 58, 237, 0.55)"
    : "0 0 40px rgba(124, 58, 237, 0.25)";

  return (
    <div className="flex flex-col items-center justify-center gap-10 w-full h-full max-w-6xl mx-auto">
      <div className="text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <span
            className="text-sm tracking-[0.4em] uppercase font-bold px-4 py-1.5 rounded-full"
            style={{
              background: "rgba(124, 58, 237, 0.15)",
              color: "#C4B5FD",
              border: "1px solid rgba(124, 58, 237, 0.4)",
            }}
          >
            Posição {posicao}
          </span>
          {badge && (
            <span
              className="text-xs tracking-[0.3em] uppercase font-bold px-3 py-1.5 rounded-full"
              style={{
                background: "linear-gradient(135deg, #7C3AED, #A78BFA)",
                color: "#FFFFFF",
                boxShadow: "0 0 20px rgba(124, 58, 237, 0.6)",
              }}
            >
              {badge}
            </span>
          )}
        </div>
        <h2 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight">
          Top dezenas — <span className="text-purple-300">P{posicao}</span>
        </h2>
        <p className="text-white/55 text-xl md:text-2xl mt-4 max-w-3xl mx-auto">
          {descricao}
        </p>
      </div>

      <div className="flex items-end justify-center gap-5 md:gap-7 flex-wrap">
        {top.map((d, i) => {
          const isFirst = i === 0;
          return (
            <div
              key={d.dezena}
              className="flex flex-col items-center gap-3"
              style={{
                animation: `fade-in 0.6s ease-out ${i * 0.12}s both`,
              }}
            >
              <div
                className="rounded-3xl flex flex-col items-center justify-center relative"
                style={{
                  width: isFirst ? cardSize + 30 : cardSize,
                  height: isFirst ? cardSize + 30 : cardSize,
                  background: isFirst
                    ? "linear-gradient(145deg, #1E1B4B, #111827)"
                    : "#111827",
                  border: isFirst ? "2px solid #7C3AED" : "1px solid #1F2937",
                  boxShadow: isFirst ? glowColor : "0 4px 20px rgba(0,0,0,0.4)",
                }}
              >
                {isFirst && (
                  <span className="absolute top-3 right-3 text-[10px] font-bold text-purple-300 tracking-widest uppercase">
                    #1
                  </span>
                )}
                <span
                  className={`${numberSize} font-extrabold leading-none`}
                  style={{
                    color: isFirst ? "#F9FAFB" : "#E5E7EB",
                    textShadow: isFirst ? "0 0 30px rgba(124,58,237,0.6)" : "none",
                  }}
                >
                  {String(d.dezena).padStart(2, "0")}
                </span>
                <span
                  className={`mt-3 font-bold ${
                    isFirst ? "text-purple-300 text-2xl" : "text-purple-400/80 text-xl"
                  }`}
                >
                  {d.frequencia}%
                </span>
              </div>
              <span className="text-white/40 text-sm">
                {d.quantidade}× em 100
              </span>
            </div>
          );
        })}
      </div>

      <div
        className="rounded-xl px-6 py-3 text-white/70 text-base md:text-lg max-w-3xl text-center"
        style={{
          background: "rgba(255, 255, 255, 0.03)",
          border: "1px solid rgba(255, 255, 255, 0.06)",
        }}
      >
        Frequência calculada nos últimos <span className="text-purple-300 font-bold">100 concursos</span> da Mega-Sena
      </div>
    </div>
  );
}
