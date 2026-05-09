import { useMemo } from "react";
import { calcularEstudo, type ConcursoMega } from "@/lib/megaEspecialEngine";
import { PARES_LINHA } from "./aula02Helpers";
import DezenaBolaMega from "../DezenaBolaMega";
import Mega30Header from "../Mega30Header";

interface Props {
  concursos: ConcursoMega[];
}

const TOP_DESTAQUE = 3;

export default function SlideTopParesPorLinhas({ concursos }: Props) {
  const dados = useMemo(() => {
    return Object.entries(PARES_LINHA).map(([linha, dezenas]) => {
      const r = calcularEstudo(concursos, {
        estudoId: `aula02-linha-${linha}`,
        agrupamento: "dezena",
        periodo: { tipo: "total" },
        topN: dezenas.length,
        restringirA: dezenas,
      });
      return {
        linha: Number(linha),
        itens: r.ranking.map((i) => ({ dezena: i.chave, freq: i.freq })),
      };
    });
  }, [concursos]);

  return (
    <div className="w-full h-full flex flex-col pt-24 pb-4 px-4">
      <Mega30Header
        aula={2}
        estudoNome="Top dezenas PARES por LINHA"
        tipoAnalise="Top 3 pares destacados em cada uma das 6 linhas"
      />
      <div className="flex flex-col gap-1.5 max-w-[1180px] mx-auto w-full mt-2 flex-1 justify-center">
        {dados.map((d) => (
          <div
            key={d.linha}
            className="flex items-center gap-3 rounded-lg px-3 py-1.5"
            style={{
              background:
                "linear-gradient(180deg, rgba(10,40,24,0.92) 0%, rgba(6,28,16,0.92) 100%)",
              border: "2px solid rgba(212,175,55,0.7)",
              boxShadow: "0 3px 12px rgba(0,0,0,0.45)",
            }}
          >
            <div
              className="flex items-baseline gap-1.5 shrink-0 w-12"
              style={{
                color: "#F5E6B3",
                fontFamily: "'Cinzel', serif",
                textShadow: "0 1px 3px rgba(0,0,0,0.6)",
              }}
            >
              <span className="text-[10px] uppercase tracking-wider opacity-70">L</span>
              <span className="font-extrabold leading-none" style={{ fontSize: 26 }}>
                {d.linha}
              </span>
            </div>
            <div className="flex flex-nowrap items-center gap-1.5 flex-1 justify-around">
              {d.itens.map((it, idx) => {
                const isTop = idx < TOP_DESTAQUE;
                return (
                  <div
                    key={it.dezena}
                    className="rounded-md p-1"
                    style={
                      isTop
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
