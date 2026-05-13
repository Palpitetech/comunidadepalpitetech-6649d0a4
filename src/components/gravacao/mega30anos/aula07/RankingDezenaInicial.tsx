import type { DezenaInicialFreq } from "./aula07Helpers";
import DezenaBolaMega from "../DezenaBolaMega";

interface Props {
  itens: DezenaInicialFreq[];
  /** cor do destaque (top 1) e da barra */
  cor?: string;
}

/**
 * Lista vertical de até 10 dezenas iniciais com barra horizontal,
 * frequência absoluta e percentual.
 */
export default function RankingDezenaInicial({
  itens,
  cor = "#D4AF37",
}: Props) {
  const max = Math.max(...itens.map((i) => i.freq), 1);

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {itens.map((it, idx) => {
        const isTop = idx === 0;
        const w = (it.freq / max) * 100;
        return (
          <div
            key={it.dezena}
            className="flex items-center gap-3 rounded-lg px-3 py-1.5"
            style={{
              background:
                "linear-gradient(180deg, rgba(10,40,24,0.92) 0%, rgba(6,28,16,0.92) 100%)",
              border: `2px solid ${isTop ? cor : "rgba(212,175,55,0.4)"}`,
              boxShadow: isTop
                ? `0 0 14px ${cor}66, 0 3px 12px rgba(0,0,0,0.45)`
                : "0 3px 10px rgba(0,0,0,0.35)",
            }}
          >
            {/* Posição */}
            <div
              className="shrink-0 w-9 text-center font-extrabold"
              style={{
                color: isTop ? cor : "rgba(245,230,179,0.8)",
                fontFamily: "'Cinzel', serif",
                fontSize: 22,
                textShadow: "0 1px 3px rgba(0,0,0,0.6)",
              }}
            >
              {idx + 1}º
            </div>

            {/* Bola */}
            <div className="shrink-0">
              <DezenaBolaMega numero={it.dezena} size="sm" />
            </div>

            {/* Barra */}
            <div className="flex-1 h-5 rounded-full relative overflow-hidden"
              style={{
                background: "rgba(0,0,0,0.45)",
                border: "1px solid rgba(212,175,55,0.25)",
              }}
            >
              <div
                className="h-full rounded-full"
                style={{
                  width: `${w}%`,
                  background: `linear-gradient(90deg, ${cor} 0%, ${cor}cc 100%)`,
                  boxShadow: isTop ? `0 0 10px ${cor}aa` : "none",
                  transition: "width 0.4s",
                }}
              />
            </div>

            {/* Freq + % */}
            <div
              className="shrink-0 text-right tabular-nums"
              style={{
                color: "#F5E6B3",
                fontFamily: "'Cinzel', serif",
                minWidth: 130,
              }}
            >
              <span className="font-extrabold" style={{ fontSize: 20 }}>
                {it.freq}×
              </span>
              <span className="opacity-70 ml-2" style={{ fontSize: 15 }}>
                {it.pct.toFixed(2)}%
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
