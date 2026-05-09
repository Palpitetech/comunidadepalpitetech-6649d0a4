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

interface ItemDezena {
  dezena: number;
  freq: number;
}

function MiniRow({ mini, itens }: { mini: number; itens: ItemDezena[] }) {
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
        className="flex items-baseline gap-1.5 shrink-0 w-16"
        style={{
          color: "#F5E6B3",
          fontFamily: "'Cinzel', serif",
          textShadow: "0 1px 3px rgba(0,0,0,0.6)",
        }}
      >
        <span className="text-[10px] uppercase tracking-wider opacity-70">MQ</span>
        <span className="font-extrabold leading-none" style={{ fontSize: 24 }}>
          {mini}
        </span>
      </div>
      <div className="flex flex-nowrap items-center gap-1.5 flex-1 justify-around">
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
              <DezenaBolaMega numero={it.dezena} size="sm" freq={it.freq} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function SlideTopPorMinis({ concursos, pagina }: Props) {
  const dados = useMemo(() => {
    const inicio = pagina === 1 ? 1 : 9;
    const fim = pagina === 1 ? 8 : 16;
    const out: { mini: number; itens: ItemDezena[] }[] = [];
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

  const left = dados.slice(0, 4);
  const right = dados.slice(4, 8);
  const inicio = pagina === 1 ? 1 : 9;
  const fim = pagina === 1 ? 8 : 16;

  return (
    <div className="w-full h-full flex flex-col pt-24 pb-4 px-4">
      <Mega30Header
        aula={1}
        estudoNome="Top dezenas por MINI-QUADRANTE"
        tipoAnalise={`MQ ${inicio} a ${fim} — Top 2 destacadas em cada mini`}
      />
      <div className="grid grid-cols-2 gap-4 max-w-[1180px] mx-auto w-full mt-2 flex-1 items-center">
        <div className="flex flex-col gap-2">
          {left.map((d) => (
            <MiniRow key={d.mini} mini={d.mini} itens={d.itens} />
          ))}
        </div>
        <div className="flex flex-col gap-2">
          {right.map((d) => (
            <MiniRow key={d.mini} mini={d.mini} itens={d.itens} />
          ))}
        </div>
      </div>
    </div>
  );
}
