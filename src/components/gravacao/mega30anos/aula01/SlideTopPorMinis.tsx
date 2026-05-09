import { useMemo } from "react";
import { calcularEstudo, type ConcursoMega } from "@/lib/megaEspecialEngine";
import { DEZENAS_MINI } from "./aula01Helpers";
import DezenaBolaMega from "../DezenaBolaMega";
import Mega30Header from "../Mega30Header";

interface Props {
  concursos: ConcursoMega[];
  /** 1 = mostra MQ 1-8, 2 = mostra MQ 9-16 */
  pagina: 1 | 2;
}

const TOP_DESTAQUE = 2;

export default function SlideTopPorMinis({ concursos, pagina }: Props) {
  const dados = useMemo(() => {
    const inicio = pagina === 1 ? 1 : 9;
    const fim = pagina === 1 ? 8 : 16;
    const out: { mini: number; itens: { dezena: number; freq: number }[] }[] = [];
    for (let m = inicio; m <= fim; m++) {
      const dezenas = DEZENAS_MINI[m] ?? [];
      const r = calcularEstudo(concursos, {
        estudoId: `aula01-mini-${m}`,
        agrupamento: "dezena",
        periodo: { tipo: "total" },
        topN: dezenas.length,
        restringirA: dezenas,
      });
      out.push({
        mini: m,
        itens: r.ranking.map((i) => ({ dezena: i.chave, freq: i.freq })),
      });
    }
    return out;
  }, [concursos, pagina]);

  return (
    <div className="w-full h-full flex flex-col pt-24 pb-4 px-4">
      <Mega30Header
        aula={1}
        estudoNome="Top dezenas por MINI-QUADRANTE"
        tipoAnalise={`MQ ${pagina === 1 ? "1 a 8" : "9 a 16"} — Top 2 destacados em cada mini`}
      />
      <div className="grid grid-cols-4 grid-rows-2 gap-3 max-w-[1180px] mx-auto w-full mt-2 flex-1">
        {dados.map((d) => (
          <div
            key={d.mini}
            className="rounded-xl px-3 py-3 flex flex-col items-center"
            style={{
              background:
                "linear-gradient(180deg, rgba(10,40,24,0.92) 0%, rgba(6,28,16,0.92) 100%)",
              border: "2px solid rgba(212,175,55,0.7)",
              boxShadow: "0 4px 14px rgba(0,0,0,0.45)",
            }}
          >
            <div
              className="font-extrabold uppercase tracking-wide mb-2"
              style={{
                color: "#F5E6B3",
                fontFamily: "'Cinzel', serif",
                fontSize: 18,
                textShadow: "0 1px 3px rgba(0,0,0,0.6)",
              }}
            >
              MQ {d.mini}
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 flex-1">
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
                    <DezenaBolaMega numero={it.dezena} size="sm" freq={it.freq} />
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
