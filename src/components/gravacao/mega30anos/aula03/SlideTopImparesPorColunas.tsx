import { useMemo } from "react";
import { calcularEstudo, type ConcursoMega } from "@/lib/megaEspecialEngine";
import { IMPARES_COLUNA } from "./aula03Helpers";
import DezenaBolaMega from "../DezenaBolaMega";
import Mega30Header from "../Mega30Header";

interface Props {
  concursos: ConcursoMega[];
}

const TOP_DESTAQUE = 3;

interface ItemDezena {
  dezena: number;
  freq: number;
}

function ColunaRow({ coluna, itens }: { coluna: number; itens: ItemDezena[] }) {
  return (
    <div
      className="flex items-center gap-3 rounded-lg px-3 py-2"
      style={{
        background:
          "linear-gradient(180deg, rgba(10,40,24,0.92) 0%, rgba(6,28,16,0.92) 100%)",
        border: "2px solid rgba(212,175,55,0.7)",
        boxShadow: "0 3px 12px rgba(0,0,0,0.45)",
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
        <span className="text-[10px] uppercase tracking-wider opacity-70">C</span>
        <span className="font-extrabold leading-none" style={{ fontSize: 26 }}>
          {coluna}
        </span>
      </div>
      <div className="flex flex-nowrap items-center gap-2 flex-1 justify-around">
        {itens.map((it, idx) => {
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
  );
}

export default function SlideTopImparesPorColunas({ concursos }: Props) {
  const dados = useMemo(() => {
    return Object.entries(IMPARES_COLUNA).map(([coluna, dezenas]) => {
      const r = calcularEstudo(concursos, {
        estudoId: `aula03-coluna-${coluna}`,
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
    <div className="w-full h-full flex flex-col pt-24 pb-4 px-4">
      <Mega30Header
        aula={3}
        estudoNome="Top dezenas ÍMPARES por COLUNA"
        tipoAnalise="Apenas colunas ímpares (1,3,5,7,9) — Top 3 destacados"
      />
      <div className="flex flex-col gap-2 max-w-[900px] mx-auto w-full mt-2 flex-1 justify-center">
        {dados.map((d) => (
          <ColunaRow key={d.coluna} coluna={d.coluna} itens={d.itens} />
        ))}
      </div>
    </div>
  );
}
