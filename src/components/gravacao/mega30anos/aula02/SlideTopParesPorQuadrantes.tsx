import { useMemo } from "react";
import { calcularEstudo, type ConcursoMega } from "@/lib/megaEspecialEngine";
import { PARES_QUADRANTE } from "./aula02Helpers";
import DezenaBolaMega from "../DezenaBolaMega";
import Mega30Header from "../Mega30Header";

interface Props {
  concursos: ConcursoMega[];
}

const TOP_DESTAQUE = 3;

const POSICAO_LABEL: Record<number, string> = {
  1: "Superior Esquerdo",
  2: "Superior Direito",
  3: "Inferior Esquerdo",
  4: "Inferior Direito",
};

export default function SlideTopParesPorQuadrantes({ concursos }: Props) {
  const dados = useMemo(() => {
    return Object.entries(PARES_QUADRANTE).map(([q, dezenas]) => {
      const r = calcularEstudo(concursos, {
        estudoId: `aula02-quadrante-${q}`,
        agrupamento: "dezena",
        periodo: { tipo: "total" },
        topN: 6,
        restringirA: dezenas,
      });
      return {
        quadrante: Number(q),
        itens: r.ranking.map((i) => ({ dezena: i.chave, freq: i.freq })),
      };
    });
  }, [concursos]);

  return (
    <div className="w-full h-full flex flex-col pt-28 sm:pt-32 lg:pt-36 pb-3 sm:pb-4 px-2 sm:px-4">
      <Mega30Header
        aula={2}
        estudoNome="Top dezenas PARES por QUADRANTE"
        tipoAnalise="Apenas pares de cada um dos 4 quadrantes — Top 3 destacados"
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 lg:gap-4 max-w-[1180px] mx-auto w-full mt-2 flex-1 items-stretch content-stretch">
        {dados.map((d) => (
          <div
            key={d.quadrante}
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
                Quadrante {d.quadrante}
              </div>
              <div
                className="uppercase tracking-wider leading-none"
                style={{
                  color: "rgba(245,230,179,0.7)",
                  fontSize: "clamp(9px, 0.85vw, 12px)",
                }}
              >
                {POSICAO_LABEL[d.quadrante]}
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
                    {/* tamanho responsivo: sm em mobile, md em sm+, igual ao original em lg+ */}
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
