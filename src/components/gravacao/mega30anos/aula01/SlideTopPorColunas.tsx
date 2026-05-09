import { useMemo } from "react";
import { calcularEstudo, type ConcursoMega } from "@/lib/megaEspecialEngine";
import CardSubdivisao from "./CardSubdivisao";
import { DEZENAS_COLUNA } from "./aula01Helpers";
import Mega30Header from "../Mega30Header";

interface Props {
  concursos: ConcursoMega[];
}

const TOP_POR_COLUNA = 10;

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

  return (
    <div className="w-full h-full flex flex-col pt-28 pb-8 px-6">
      <Mega30Header
        aula={1}
        estudoNome="Top dezenas por COLUNA"
        tipoAnalise={`Top ${TOP_POR_COLUNA} de cada coluna em 30 anos`}
      />
      <div className="grid grid-cols-5 gap-3 max-w-6xl mx-auto w-full mt-4">
        {dados.map((d) => (
          <CardSubdivisao
            key={d.coluna}
            titulo={`Col ${d.coluna}`}
            itens={d.itens}
            size="sm"
          />
        ))}
      </div>
    </div>
  );
}
