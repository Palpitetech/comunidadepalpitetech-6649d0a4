import { useMemo } from "react";
import type { ConcursoMega } from "@/lib/megaEspecialEngine";
import { topInicialGeral } from "./aula07Helpers";
import RankingDezenaInicial from "./RankingDezenaInicial";
import Mega30Header from "../Mega30Header";

interface Props {
  concursos: ConcursoMega[];
}

export default function SlideTopInicialGeral({ concursos }: Props) {
  const dados = useMemo(() => topInicialGeral(concursos, 10), [concursos]);
  return (
    <div className="w-full h-full flex flex-col pt-32 pb-6 px-6">
      <Mega30Header
        aula={7}
        estudoNome="Top 10 dezenas de INÍCIO"
        tipoAnalise={`Menor dezena de cada concurso · ${concursos.length} concursos`}
      />
      <div className="max-w-[1280px] mx-auto w-full mt-2 flex-1 flex items-center">
        <RankingDezenaInicial itens={dados} cor="#D4AF37" />
      </div>
    </div>
  );
}
