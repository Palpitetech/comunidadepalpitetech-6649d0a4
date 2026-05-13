import { useMemo } from "react";
import type { ConcursoMega } from "@/lib/megaEspecialEngine";
import { freqInicioPorLinha } from "./aula05Helpers";
import BarraLinhaHorizontal from "./BarraLinhaHorizontal";
import Mega30Header from "../Mega30Header";

interface Props {
  concursos: ConcursoMega[];
}

export default function SlideFreqInicioPorLinha({ concursos }: Props) {
  const dados = useMemo(() => freqInicioPorLinha(concursos), [concursos]);
  const max = Math.max(...dados.map((d) => d.freq), 1);
  const topFreq = max;

  return (
    <div className="w-full h-full flex flex-col pt-36 pb-6 px-4">
      <Mega30Header
        aula={5}
        estudoNome="Linha da dezena INICIAL"
        tipoAnalise={`Quantas vezes cada linha entregou a menor dezena · ${concursos.length} concursos`}
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
          />
        ))}
      </div>
    </div>
  );
}
