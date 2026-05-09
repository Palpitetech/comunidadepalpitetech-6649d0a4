import { useMemo } from "react";
import { calcularEstudo, type ConcursoMega } from "@/lib/megaEspecialEngine";
import { DEZENAS_COLUNA } from "./aula01Helpers";
import DezenaBolaMega from "../DezenaBolaMega";
import Mega30Header from "../Mega30Header";

interface Props {
  concursos: ConcursoMega[];
}

const TOP_POR_COLUNA = 5;

interface ItemDezena {
  dezena: number;
  freq: number;
}

function ColunaRow({ coluna, itens }: { coluna: number; itens: ItemDezena[] }) {
  return (
    <div
      className="flex items-center gap-3 rounded-lg px-3 py-1.5"
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
      <div className="flex flex-nowrap items-center gap-1.5 flex-1 justify-around">
        {itens.map((it) => (
          <DezenaBolaMega key={it.dezena} numero={it.dezena} size="sm" freq={it.freq} />
        ))}
      </div>
    </div>
  );
}

export default function SlideTopPorColunas({ concursos }: Props) {
  const dados = useMemo(() => {
    return Object.entries(DEZENAS_COLUNA).map(([coluna, dezenas]) => {
      const r = calcularEstudo(concursos, {
        estudoId: `aula01-coluna-${coluna}`,
        agrupamento: "dezena",
        periodo: { tipo: "total" },
        topN: TOP_POR_COLUNA,
        restringirA: dezenas,
      });
      return {
        coluna: Number(coluna),
        itens: r.ranking.map((i) => ({ dezena: i.chave, freq: i.freq })),
      };
    });
  }, [concursos]);

  const left = dados.slice(0, 5);
  const right = dados.slice(5, 10);

  return (
    <div className="w-full h-full flex flex-col pt-24 pb-4 px-4">
      <Mega30Header
        aula={1}
        estudoNome="Top dezenas por COLUNA"
        tipoAnalise={`Top ${TOP_POR_COLUNA} de cada uma das 10 colunas em 30 anos`}
      />
      <div className="grid grid-cols-2 gap-4 max-w-[1180px] mx-auto w-full mt-2 flex-1 items-center">
        <div className="flex flex-col gap-1.5">
          {left.map((d) => (
            <ColunaRow key={d.coluna} coluna={d.coluna} itens={d.itens} />
          ))}
        </div>
        <div className="flex flex-col gap-1.5">
          {right.map((d) => (
            <ColunaRow key={d.coluna} coluna={d.coluna} itens={d.itens} />
          ))}
        </div>
      </div>
    </div>
  );
}
