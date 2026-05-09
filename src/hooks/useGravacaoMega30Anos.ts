import { useMemo } from "react";
import { useMegaEspecialBase } from "./useMegaEspecialBase";
import {
  topDezenasGeral,
  topDezenasPorMes,
  topDezenasPorAno,
  topDezenasPorSemestre,
  listarAnos,
  type EstudoResultado,
} from "@/lib/megaEspecialEngine";

/** Tipo legado mantido para os slides já existentes do Estudo 01. */
export interface DezenaFreq {
  dezena: number;
  freq: number;
}

export interface Mega30AnosData {
  totalConcursos: number;
  primeiroConcurso: { numero: number; data: string };
  ultimoConcurso: { numero: number; data: string };
  topPorMes: Record<number, DezenaFreq[]>;
  topPorAno: Record<number, DezenaFreq[]>;
  topPorSemestre: { primeiro: DezenaFreq[]; segundo: DezenaFreq[] };
  top15Geral: DezenaFreq[];
  anosOrdenados: number[];
}

function toLegacy(r: EstudoResultado): DezenaFreq[] {
  return r.ranking.map((it) => ({ dezena: it.chave, freq: it.freq }));
}

/**
 * Hook legado: agora apenas adapta a saída da engine única ao formato
 * usado pelos slides existentes. Zero duplicação de cálculo.
 */
export function useGravacaoMega30Anos() {
  const base = useMegaEspecialBase();

  const data = useMemo<Mega30AnosData | null>(() => {
    if (!base.data || base.data.length === 0) return null;

    const concursos = base.data;
    const porMes = topDezenasPorMes(concursos, 15);
    const porAno = topDezenasPorAno(concursos, 15);
    const porSem = topDezenasPorSemestre(concursos, 15);
    const geral = topDezenasGeral(concursos, 15);

    const topPorMes: Record<number, DezenaFreq[]> = {};
    for (const m of Object.keys(porMes)) topPorMes[+m] = toLegacy(porMes[+m]);

    const topPorAno: Record<number, DezenaFreq[]> = {};
    for (const a of Object.keys(porAno)) topPorAno[+a] = toLegacy(porAno[+a]);

    const first = concursos[0];
    const last = concursos[concursos.length - 1];

    return {
      totalConcursos: concursos.length,
      primeiroConcurso: { numero: first.concurso, data: first.data_sorteio },
      ultimoConcurso: { numero: last.concurso, data: last.data_sorteio },
      topPorMes,
      topPorAno,
      topPorSemestre: {
        primeiro: toLegacy(porSem.primeiro),
        segundo: toLegacy(porSem.segundo),
      },
      top15Geral: toLegacy(geral),
      anosOrdenados: listarAnos(concursos),
    };
  }, [base.data]);

  return {
    data,
    isLoading: base.isLoading,
    isError: base.isError,
  };
}
