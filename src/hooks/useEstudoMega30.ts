import { useMemo } from "react";
import { useMegaEspecialBase } from "./useMegaEspecialBase";
import {
  calcularEstudo,
  type Agrupamento,
  type PeriodoFiltro,
  type EstudoResultado,
} from "@/lib/megaEspecialEngine";

interface Params {
  estudoId: string;
  agrupamento: Agrupamento;
  periodo: PeriodoFiltro;
  topN?: number;
  restringirA?: number[];
}

/**
 * Calcula um estudo a partir da base única.
 * Mesma engine que os slides admin → garante consistência.
 */
export function useEstudoMega30(params: Params): {
  data: EstudoResultado | null;
  isLoading: boolean;
  isError: boolean;
} {
  const base = useMegaEspecialBase();

  const data = useMemo(() => {
    if (!base.data) return null;
    return calcularEstudo(base.data, params);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    base.data,
    params.estudoId,
    params.agrupamento,
    params.periodo.tipo,
    params.periodo.valor,
    params.topN,
    params.restringirA?.join(","),
  ]);

  return {
    data,
    isLoading: base.isLoading,
    isError: base.isError,
  };
}
