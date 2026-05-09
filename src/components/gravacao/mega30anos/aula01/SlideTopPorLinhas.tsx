import { useMemo } from "react";
import { calcularEstudo, type ConcursoMega } from "@/lib/megaEspecialEngine";
import { DEZENAS_LINHA } from "./aula01Helpers";
import DezenaBolaMega from "../DezenaBolaMega";
import Mega30Header from "../Mega30Header";

interface Props {
  concursos: ConcursoMega[];
}

const TOP_POR_LINHA = 10;

export default function SlideTopPorLinhas({ concursos }: Props) {
  const dados = useMemo(() => {
    return Object.entries(DEZENAS_LINHA).map(([linha, dezenas]) => {
      const r = calcularEstudo(concursos, {
        estudoId: `aula01-linha-${linha}`,
        agrupamento: "dezena",
        periodo: { tipo: "total" },
        topN: TOP_POR_LINHA,
        restringirA: dezenas,
      });
      return {
        linha: Number(linha),
        itens: r.ranking.map((i) => ({ dezena: i.chave, freq: i.freq })),
      };
    });
  }, [concursos]);

  return (
    <div className="w-full h-full flex flex-col pt-24 pb-6 px-6">
      <Mega30Header
        aula={1}
        estudoNome="Top dezenas por LINHA"
        tipoAnalise={`Top ${TOP_POR_LINHA} de cada uma das 6 linhas em 30 anos`}
      />
      <div className="flex flex-col gap-2 max-w-6xl mx-auto w-full mt-3">
        {dados.map((d) => (
          <div
            key={d.linha}
            className="flex items-center gap-4 rounded-xl px-4 py-2"
            style={{
              background:
                "linear-gradient(180deg, rgba(10,40,24,0.92) 0%, rgba(6,28,16,0.92) 100%)",
              border: "2px solid rgba(212,175,55,0.7)",
              boxShadow: "0 4px 14px rgba(0,0,0,0.45)",
            }}
          >
            <div
              className="flex flex-col items-center justify-center shrink-0 w-16"
              style={{
                color: "#F5E6B3",
                fontFamily: "'Cinzel', serif",
                textShadow: "0 1px 3px rgba(0,0,0,0.6)",
              }}
            >
              <span className="text-[11px] uppercase tracking-wider opacity-75">
                L
              </span>
              <span className="font-extrabold leading-none" style={{ fontSize: 32 }}>
                {d.linha}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 flex-1 justify-center">
              {d.itens.map((it) => (
                <DezenaBolaMega
                  key={it.dezena}
                  numero={it.dezena}
                  size="sm"
                  freq={it.freq}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
