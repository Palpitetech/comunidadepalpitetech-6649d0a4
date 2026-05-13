import { useMemo } from "react";
import type { ConcursoMega } from "@/lib/megaEspecialEngine";
import { freqInicioPorColuna } from "./aula06Helpers";
import BarraColunaHorizontal from "./BarraColunaHorizontal";
import Mega30Header from "../Mega30Header";

interface Props {
  concursos: ConcursoMega[];
}

export default function SlideFreqInicioPorColuna({ concursos }: Props) {
  const dados = useMemo(() => freqInicioPorColuna(concursos), [concursos]);
  const max = Math.max(...dados.map((d) => d.freq), 1);

  return (
    <div className="w-full h-full flex flex-col pt-36 pb-6 px-4">
      <Mega30Header
        aula={6}
        estudoNome="Coluna da dezena INICIAL"
        tipoAnalise={`Quantas vezes cada coluna entregou a menor dezena · ${concursos.length} concursos`}
      />
      <div className="flex flex-col gap-1.5 max-w-[1280px] mx-auto w-full mt-2 flex-1 justify-center">
        {dados.map((d) => (
          <BarraColunaHorizontal
            key={d.coluna}
            coluna={d.coluna}
            freq={d.freq}
            pct={d.pct}
            max={max}
            destaque={d.freq === max}
          />
        ))}
      </div>
    </div>
  );
}
