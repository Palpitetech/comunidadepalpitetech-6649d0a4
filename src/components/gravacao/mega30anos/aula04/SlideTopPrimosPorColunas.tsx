import { useMemo } from "react";
import { calcularEstudo, type ConcursoMega } from "@/lib/megaEspecialEngine";
import { PRIMOS_COLUNA } from "./aula04Helpers";
import DezenaBolaMega from "../DezenaBolaMega";
import Mega30Header from "../Mega30Header";

interface Props {
  concursos: ConcursoMega[];
}

const TOP_DESTAQUE = 2;

export default function SlideTopPrimosPorColunas({ concursos }: Props) {
  const dados = useMemo(() => {
    return Object.entries(PRIMOS_COLUNA).map(([coluna, dezenas]) => {
      const r = calcularEstudo(concursos, {
        estudoId: `aula04-coluna-${coluna}`,
        agrupamento: "dezena",
        periodo: { tipo: "total" },
        topN: dezenas.length,
        restringirA: dezenas,
      });
      return {
        coluna: Number(coluna),
        itens: r.ranking.map((i) => ({ dezena: i.chave, freq: i.freq })),
      };
    });
  }, [concursos]);

  return (
    <div className="w-full h-full flex flex-col pt-28 sm:pt-32 lg:pt-36 pb-3 sm:pb-4 px-2 sm:px-4">
      <Mega30Header
        aula={4}
        estudoNome="Top dezenas PRIMAS por COLUNA"
        tipoAnalise="Apenas colunas com primos (1, 2, 3, 5, 7, 9) — Top 2 destacados"
      />
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 lg:gap-4 max-w-[1180px] mx-auto w-full mt-2 flex-1 items-stretch content-stretch">
        {dados.map((d) => (
          <div
            key={d.coluna}
            className="rounded-xl px-2 sm:px-4 lg:px-5 py-2 sm:py-3 lg:py-4 flex flex-col min-h-0"
            style={{
              background:
                "linear-gradient(180deg, rgba(10,40,24,0.92) 0%, rgba(6,28,16,0.92) 100%)",
              border: "2px solid rgba(212,175,55,0.7)",
              boxShadow: "0 4px 14px rgba(0,0,0,0.45)",
            }}
          >
            <div className="flex items-baseline justify-between gap-2 mb-2 sm:mb-3 flex-wrap">
              <div
                className="font-extrabold uppercase tracking-wide leading-none"
                style={{
                  color: "#F5E6B3",
                  fontFamily: "'Cinzel', serif",
                  fontSize: "clamp(15px, 1.6vw, 22px)",
                  textShadow: "0 1px 3px rgba(0,0,0,0.6)",
                }}
              >
                Coluna {d.coluna}
              </div>
              <div
                className="uppercase tracking-wider leading-none"
                style={{
                  color: "rgba(245,230,179,0.7)",
                  fontSize: "clamp(9px, 0.85vw, 12px)",
                }}
              >
                {d.itens.length} primo{d.itens.length > 1 ? "s" : ""}
              </div>
            </div>
            <div className="flex flex-wrap gap-x-1.5 sm:gap-x-2 gap-y-2 sm:gap-y-3 justify-center items-center flex-1 content-center">
              {d.itens.map((it, idx) => {
                const isTop = idx < TOP_DESTAQUE;
                return (
                  <div
                    key={it.dezena}
                    className="rounded-md p-0.5 sm:p-1"
                    style={
                      isTop
                        ? {
                            border: "2px solid #E53935",
                            boxShadow: "0 0 8px rgba(229,57,53,0.55)",
                          }
                        : { border: "2px solid transparent" }
                    }
                  >
                    <div className="hidden lg:block">
                      <DezenaBolaMega numero={it.dezena} size="md" freq={it.freq} />
                    </div>
                    <div className="hidden sm:block lg:hidden">
                      <DezenaBolaMega numero={it.dezena} size="sm" freq={it.freq} />
                    </div>
                    <div className="block sm:hidden">
                      <DezenaBolaMega numero={it.dezena} size="xs" freq={it.freq} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
