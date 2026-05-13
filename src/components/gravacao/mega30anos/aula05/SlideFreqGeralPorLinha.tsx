import { useMemo } from "react";
import type { ConcursoMega } from "@/lib/megaEspecialEngine";
import { freqGeralPorLinha } from "./aula05Helpers";
import BarraLinhaHorizontal from "./BarraLinhaHorizontal";
import Mega30Header from "../Mega30Header";

interface Props {
  concursos: ConcursoMega[];
}

export default function SlideFreqGeralPorLinha({ concursos }: Props) {
  const dados = useMemo(() => freqGeralPorLinha(concursos), [concursos]);
  const max = Math.max(...dados.map((d) => d.freq), 1);
  const topFreq = max;

  return (
    <div className="w-full h-full flex flex-col pt-36 pb-6 px-4">
      <Mega30Header
        aula={5}
        estudoNome="Linha mais sorteada (GERAL)"
        tipoAnalise={`Distribuição de TODAS as 6 dezenas por linha · ${concursos.length} concursos`}
      />
      <div className="flex flex-col gap-2.5 max-w-[1280px] mx-auto w-full mt-2 flex-1 justify-center">
        {dados.map((d) => (
          <BarraLinhaHorizontal
            key={d.linha}
            linha={d.linha}
            freq={d.freq}
            pct={d.pct}
            max={max}
            destaque={d.freq === topFreq}
            corDestaque="#43A047"
          />
        ))}
      </div>
    </div>
  );
}
