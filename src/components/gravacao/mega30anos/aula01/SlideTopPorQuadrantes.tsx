import { useMemo } from "react";
import { calcularEstudo, type ConcursoMega } from "@/lib/megaEspecialEngine";
import CardSubdivisao from "./CardSubdivisao";
import { DEZENAS_QUADRANTE } from "./aula01Helpers";
import Mega30Header from "../Mega30Header";

interface Props {
  concursos: ConcursoMega[];
}

const TOP_POR_QUADRANTE = 8;

const POSICAO_LABEL: Record<number, string> = {
  1: "Superior Esquerdo",
  2: "Superior Direito",
  3: "Inferior Esquerdo",
  4: "Inferior Direito",
};

export default function SlideTopPorQuadrantes({ concursos }: Props) {
  const dados = useMemo(() => {
    return Object.entries(DEZENAS_QUADRANTE).map(([q, dezenas]) => {
      const r = calcularEstudo(concursos, {
        estudoId: `aula01-quadrante-${q}`,
        agrupamento: "dezena",
        periodo: { tipo: "total" },
        topN: TOP_POR_QUADRANTE,
        restringirA: dezenas,
      });
      return {
        quadrante: Number(q),
        itens: r.ranking.map((i) => ({ dezena: i.chave, freq: i.freq })),
      };
    });
  }, [concursos]);

  return (
    <div className="w-full h-full flex flex-col pt-28 pb-8 px-8">
      <Mega30Header
        aula={1}
        estudoNome="Top dezenas por QUADRANTE"
        tipoAnalise={`Top ${TOP_POR_QUADRANTE} de cada quadrante em 30 anos`}
      />
      <div className="grid grid-cols-2 gap-5 max-w-5xl mx-auto w-full mt-4">
        {dados.map((d) => (
          <CardSubdivisao
            key={d.quadrante}
            titulo={`Quadrante ${d.quadrante}`}
            subtitulo={POSICAO_LABEL[d.quadrante]}
            itens={d.itens}
            size="md"
          />
        ))}
      </div>
    </div>
  );
}
