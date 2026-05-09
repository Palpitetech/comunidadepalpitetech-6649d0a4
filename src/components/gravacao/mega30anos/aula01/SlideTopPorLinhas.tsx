import { useMemo } from "react";
import { calcularEstudo, type ConcursoMega } from "@/lib/megaEspecialEngine";
import CardSubdivisao from "./CardSubdivisao";
import { DEZENAS_LINHA } from "./aula01Helpers";
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
    <div className="w-full h-full flex flex-col pt-28 pb-8 px-8">
      <Mega30Header
        aula={1}
        estudoNome="Top dezenas por LINHA"
        tipoAnalise={`Top ${TOP_POR_LINHA} de cada linha em 30 anos`}
      />
      <div className="grid grid-cols-2 gap-4 max-w-5xl mx-auto w-full mt-4">
        {dados.map((d) => (
          <CardSubdivisao
            key={d.linha}
            titulo={`Linha ${d.linha}`}
            subtitulo={`Dezenas ${(d.linha - 1) * 10 + 1} a ${d.linha * 10}`}
            itens={d.itens}
            size="md"
          />
        ))}
      </div>
    </div>
  );
}
