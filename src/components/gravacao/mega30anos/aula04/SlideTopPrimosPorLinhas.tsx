import { useMemo } from "react";
import { calcularEstudo, type ConcursoMega } from "@/lib/megaEspecialEngine";
import { PRIMOS_LINHA } from "./aula04Helpers";
import DezenaBolaMega from "../DezenaBolaMega";
import Mega30Header from "../Mega30Header";

interface Props {
  concursos: ConcursoMega[];
}

const TOP_DESTAQUE = 1;

export default function SlideTopPrimosPorLinhas({ concursos }: Props) {
  const dados = useMemo(() => {
    return Object.entries(PRIMOS_LINHA).map(([linha, dezenas]) => {
      const r = calcularEstudo(concursos, {
        estudoId: `aula04-linha-${linha}`,
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
    <div className="w-full h-full flex flex-col pt-36 pb-3 px-4">
      <Mega30Header
        aula={4}
        estudoNome="Top dezenas PRIMOS por LINHA"
        tipoAnalise="Top 1 primo destacado em cada uma das 6 linhas"
      />
      <div className="flex flex-col gap-1.5 max-w-[1180px] mx-auto w-full mt-2 flex-1 justify-center">
        {dados.map((d) => (
          <div
            key={d.linha}
            className="flex items-center gap-3 rounded-lg px-4 py-1.5"
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
              <span className="font-extrabold leading-none" style={{ fontSize: 24 }}>
                {d.linha}
              </span>
            </div>
            <div className="flex flex-nowrap items-center gap-4 flex-1 justify-evenly">
              {d.itens.map((it, idx) => {
                const isTop = idx < TOP_DESTAQUE;
                return (
                  <div
                    key={it.dezena}
                    className="rounded-md"
                    style={
                      isTop
                        ? {
                            border: "2px solid #E53935",
                            boxShadow: "0 0 8px rgba(229,57,53,0.55)",
                            padding: 2,
                          }
                        : { border: "2px solid transparent", padding: 2 }
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
