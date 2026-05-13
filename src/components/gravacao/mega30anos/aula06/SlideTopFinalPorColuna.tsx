import { useMemo } from "react";
import type { ConcursoMega } from "@/lib/megaEspecialEngine";
import { topDezenaFinalPorColuna } from "./aula06Helpers";
import DezenaBolaMega from "../DezenaBolaMega";
import Mega30Header from "../Mega30Header";

interface Props {
  concursos: ConcursoMega[];
}

export default function SlideTopFinalPorColuna({ concursos }: Props) {
  const dados = useMemo(() => topDezenaFinalPorColuna(concursos), [concursos]);
  const maxFreq = Math.max(...dados.map((d) => d.freq), 1);

  return (
    <div className="w-full h-full flex flex-col pt-36 pb-6 px-4">
      <Mega30Header
        aula={6}
        estudoNome="Top dezena FINAL por coluna"
        tipoAnalise="A dezena que mais foi a maior do sorteio em cada coluna"
      />
      <div className="grid grid-cols-2 gap-2 max-w-[1280px] mx-auto w-full mt-2 flex-1 content-center">
        {dados.map((d) => {
          const isTop = d.freq === maxFreq && d.dezena != null;
          return (
            <div
              key={d.coluna}
              className="flex items-center gap-3 rounded-lg px-4 py-1.5"
              style={{
                background:
                  "linear-gradient(180deg, rgba(10,40,24,0.92) 0%, rgba(6,28,16,0.92) 100%)",
                border: `2px solid ${isTop ? "#1E88E5" : "rgba(212,175,55,0.55)"}`,
                boxShadow: isTop
                  ? "0 0 14px rgba(30,136,229,0.45), 0 3px 12px rgba(0,0,0,0.45)"
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
                <span className="text-[11px] uppercase tracking-wider opacity-70">C</span>
                <span className="font-extrabold leading-none" style={{ fontSize: 24 }}>
                  {d.coluna}
                </span>
              </div>
              <div className="flex-1 flex justify-center">
                {d.dezena != null ? (
                  <div
                    className="rounded-md"
                    style={
                      isTop
                        ? {
                            border: "2px solid #1E88E5",
                            boxShadow: "0 0 8px rgba(30,136,229,0.55)",
                            padding: 3,
                          }
                        : { border: "2px solid transparent", padding: 3 }
                    }
                  >
                    <DezenaBolaMega numero={d.dezena} size="md" freq={d.freq} />
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
