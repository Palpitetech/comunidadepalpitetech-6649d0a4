import { useMemo } from "react";
import { calcularEstudo, type ConcursoMega } from "@/lib/megaEspecialEngine";
import { PRIMOS_MINI } from "./aula04Helpers";
import DezenaBolaMega from "../DezenaBolaMega";
import Mega30Header from "../Mega30Header";

interface Props {
  concursos: ConcursoMega[];
  /** 1 = MQ 1-8, 2 = MQ 9-15 (omitindo MQ8 e MQ13 que não têm primos) */
  pagina: 1 | 2;
}

const TOP_DESTAQUE = 1;

interface ItemDezena {
  dezena: number;
  freq: number;
}

function MiniRow({ mini, itens }: { mini: number; itens: ItemDezena[] }) {
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
      <div className="flex flex-nowrap items-center gap-3 flex-1 justify-around">
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

export default function SlideTopPrimosPorMinis({ concursos, pagina }: Props) {
  const dados = useMemo(() => {
    // Lista todos os MQs com primos, em ordem
    const todos = Object.keys(PRIMOS_MINI)
      .map(Number)
      .sort((a, b) => a - b);
    // Pag 1 = primeiros 7 (MQ1..MQ7), Pag 2 = restantes (MQ9..MQ15 sem MQ13) = 6
    const meio = Math.ceil(todos.length / 2);
    const slice = pagina === 1 ? todos.slice(0, meio) : todos.slice(meio);
    return slice.map((m) => {
      const dezenas = PRIMOS_MINI[m];
      const r = calcularEstudo(concursos, {
        estudoId: `aula04-mini-${m}`,
        agrupamento: "dezena",
        periodo: { tipo: "total" },
        topN: dezenas.length,
        restringirA: dezenas,
      });
      return {
        mini: m,
        itens: r.ranking.map((i) => ({ dezena: i.chave, freq: i.freq })),
      };
    });
  }, [concursos, pagina]);

  const meio = Math.ceil(dados.length / 2);
  const left = dados.slice(0, meio);
  const right = dados.slice(meio);

  const inicio = dados[0]?.mini ?? 0;
  const fim = dados[dados.length - 1]?.mini ?? 0;

  return (
    <div className="w-full h-full flex flex-col pt-24 pb-4 px-4">
      <Mega30Header
        aula={4}
        estudoNome="Top dezenas PRIMAS por MINI-QUADRANTE"
        tipoAnalise={`MQ ${inicio} a ${fim} — primo mais sorteado destacado`}
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
