import { useMemo } from "react";
import { calcularEstudo, type ConcursoMega } from "@/lib/megaEspecialEngine";
import CardSubdivisao from "./CardSubdivisao";
import { DEZENAS_MINI } from "./aula01Helpers";
import Mega30Header from "../Mega30Header";

interface Props {
  concursos: ConcursoMega[];
  /** 1 = mostra MQ 1-8, 2 = mostra MQ 9-16 */
  pagina: 1 | 2;
}

const TOP_POR_MINI = 10;

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
        topN: Math.min(TOP_POR_MINI, dezenas.length),
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
    <div className="w-full h-full flex flex-col pt-28 pb-8 px-6">
      <Mega30Header
        aula={1}
        estudoNome="Top dezenas por MINI-QUADRANTE"
        tipoAnalise={`MQ ${pagina === 1 ? "1 a 8" : "9 a 16"} — Top ${TOP_POR_MINI}`}
      />
      <div className="grid grid-cols-4 gap-3 max-w-6xl mx-auto w-full mt-4">
        {dados.map((d) => (
          <CardSubdivisao
            key={d.mini}
            titulo={`MQ ${d.mini}`}
            itens={d.itens}
            size="sm"
          />
        ))}
      </div>
    </div>
  );
}
