import { useMemo } from "react";
import type { ConcursoMega } from "@/lib/megaEspecialEngine";
import { topFinalPares } from "./aula08Helpers";
import RankingDezenaFinal from "./RankingDezenaFinal";
import Mega30Header from "../Mega30Header";

interface Props {
  concursos: ConcursoMega[];
}

export default function SlideTopFinalPares({ concursos }: Props) {
  const dados = useMemo(() => topFinalPares(concursos, 10), [concursos]);
  return (
    <div className="w-full h-full flex flex-col pt-32 pb-6 px-6">
      <Mega30Header
        aula={8}
        estudoNome="Top 10 dezenas de FINAL — PARES"
        tipoAnalise={`Quando a maior dezena foi par · ${concursos.length} concursos`}
      />
      <div className="max-w-[1280px] mx-auto w-full mt-2 flex-1 flex items-center">
        <RankingDezenaFinal itens={dados} cor="#43A047" />
      </div>
    </div>
  );
}
