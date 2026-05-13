import { useMemo } from "react";
import type { ConcursoMega } from "@/lib/megaEspecialEngine";
import { topDezenaInicialPorLinha } from "./aula05Helpers";
import DezenaBolaMega from "../DezenaBolaMega";
import Mega30Header from "../Mega30Header";

interface Props {
  concursos: ConcursoMega[];
}

export default function SlideTopInicialPorLinha({ concursos }: Props) {
  const dados = useMemo(() => topDezenaInicialPorLinha(concursos), [concursos]);
  const maxFreq = Math.max(...dados.map((d) => d.freq), 1);

  return (
    <div className="w-full h-full flex flex-col pt-36 pb-6 px-4">
      <Mega30Header
        aula={5}
        estudoNome="Top dezena INICIAL por linha"
        tipoAnalise="A dezena que mais foi a menor do sorteio em cada linha"
      />
      <div className="flex flex-col gap-2 max-w-[1180px] mx-auto w-full mt-2 flex-1 justify-center">
        {dados.map((d) => {
          const isTop = d.freq === maxFreq && d.dezena != null;
          return (
            <div
              key={d.linha}
              className="flex items-center gap-4 rounded-lg px-5 py-2"
              style={{
                background:
                  "linear-gradient(180deg, rgba(10,40,24,0.92) 0%, rgba(6,28,16,0.92) 100%)",
                border: `2px solid ${isTop ? "#E53935" : "rgba(212,175,55,0.55)"}`,
                boxShadow: isTop
                  ? "0 0 14px rgba(229,57,53,0.45), 0 3px 12px rgba(0,0,0,0.45)"
                  : "0 3px 12px rgba(0,0,0,0.45)",
                opacity: d.dezena == null ? 0.45 : 1,
              }}
            >
              <div
                className="flex items-baseline gap-1.5 shrink-0 w-14"
                style={{
                  color: "#F5E6B3",
                  fontFamily: "'Cinzel', serif",
                  textShadow: "0 1px 3px rgba(0,0,0,0.6)",
                }}
              >
                <span className="text-[11px] uppercase tracking-wider opacity-70">L</span>
                <span className="font-extrabold leading-none" style={{ fontSize: 28 }}>
                  {d.linha}
                </span>
              </div>
              <div className="flex-1 flex justify-center">
                {d.dezena != null ? (
                  <div
                    className="rounded-md"
                    style={
                      isTop
                        ? {
                            border: "2px solid #E53935",
                            boxShadow: "0 0 8px rgba(229,57,53,0.55)",
                            padding: 3,
                          }
                        : { border: "2px solid transparent", padding: 3 }
                    }
                  >
                    <DezenaBolaMega numero={d.dezena} size="lg" freq={d.freq} />
                  </div>
                ) : (
                  <span style={{ color: "rgba(245,230,179,0.5)" }}>—</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
