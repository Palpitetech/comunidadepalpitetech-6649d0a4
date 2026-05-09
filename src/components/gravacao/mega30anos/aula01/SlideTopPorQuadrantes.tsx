import { useMemo } from "react";
import { calcularEstudo, type ConcursoMega } from "@/lib/megaEspecialEngine";
import { DEZENAS_QUADRANTE } from "./aula01Helpers";
import DezenaBolaMega from "../DezenaBolaMega";
import Mega30Header from "../Mega30Header";

interface Props {
  concursos: ConcursoMega[];
}

const TOP_POR_QUADRANTE = 10;

const POSICAO_LABEL: Record<number, string> = {
  1: "Superior Esquerdo",
  2: "Superior Direito",
  3: "Inferior Esquerdo",
  4: "Inferior Direito",
};

export default function SlideTopPorQuadrantes({ concursos }: Props) {
  const dados = useMemo(() => {
    return Object.entries(DEZENAS_QUADRANTE).map(([q, dezenas]) => {
      const r = calcularEstudo(concursos, {
        estudoId: `aula01-quadrante-${q}`,
        agrupamento: "dezena",
        periodo: { tipo: "total" },
        topN: TOP_POR_QUADRANTE,
        restringirA: dezenas,
      });
      return {
        quadrante: Number(q),
        itens: r.ranking.map((i) => ({ dezena: i.chave, freq: i.freq })),
      };
    });
  }, [concursos]);

  return (
    <div className="w-full h-full flex flex-col pt-24 pb-4 px-4">
      <Mega30Header
        aula={1}
        estudoNome="Top dezenas por QUADRANTE"
        tipoAnalise={`Top ${TOP_POR_QUADRANTE} de cada um dos 4 quadrantes em 30 anos`}
      />
      <div className="grid grid-cols-2 gap-4 max-w-[1180px] mx-auto w-full mt-2 flex-1 items-center">
        {dados.map((d) => (
          <div
            key={d.quadrante}
            className="rounded-xl px-5 py-4"
            style={{
              background:
                "linear-gradient(180deg, rgba(10,40,24,0.92) 0%, rgba(6,28,16,0.92) 100%)",
              border: "2px solid rgba(212,175,55,0.7)",
              boxShadow: "0 4px 14px rgba(0,0,0,0.45)",
            }}
          >
            <div className="flex items-baseline justify-between mb-3">
              <div
                className="font-extrabold uppercase tracking-wide"
                style={{
                  color: "#F5E6B3",
                  fontFamily: "'Cinzel', serif",
                  fontSize: 22,
                  textShadow: "0 1px 3px rgba(0,0,0,0.6)",
                }}
              >
                Quadrante {d.quadrante}
              </div>
              <div
                className="text-xs uppercase tracking-wider"
                style={{ color: "rgba(245,230,179,0.7)" }}
              >
                {POSICAO_LABEL[d.quadrante]}
              </div>
            </div>
            <div className="grid grid-cols-5 grid-rows-2 gap-x-2 gap-y-3 justify-items-center">
              {d.itens.map((it, idx) => {
                const isTop3 = idx < 3;
                return (
                  <div
                    key={it.dezena}
                    className="rounded-md p-1"
                    style={
                      isTop3
                        ? {
                            border: "2px solid #E53935",
                            boxShadow: "0 0 8px rgba(229,57,53,0.55)",
                          }
                        : { border: "2px solid transparent" }
                    }
                  >
                    <DezenaBolaMega numero={it.dezena} size="md" freq={it.freq} />
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
