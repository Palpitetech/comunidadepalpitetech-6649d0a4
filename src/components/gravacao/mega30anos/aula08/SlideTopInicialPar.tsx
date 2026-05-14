import { useMemo } from "react";
import type { ConcursoMega } from "@/lib/megaEspecialEngine";
import { topInicialPar } from "./aula08Helpers";
import RankingDezenaPar from "./RankingDezenaPar";
import Mega30Header from "../Mega30Header";

interface Props {
  concursos: ConcursoMega[];
}

export default function SlideTopInicialPar({ concursos }: Props) {
  const dados = useMemo(() => topInicialPar(concursos, 10), [concursos]);
  return (
    <div className="w-full h-full flex flex-col pt-32 pb-6 px-6">
      <Mega30Header
        aula={8}
        estudoNome="Top 10 dezenas pares — INICIAL"
        tipoAnalise={`Menor dezena par de cada concurso · ${concursos.length} concursos`}
      />
      <div className="max-w-[1280px] mx-auto w-full mt-2 flex-1 flex items-center">
        <RankingDezenaPar itens={dados} cor="#43A047" />
      </div>
    </div>
  );
}
