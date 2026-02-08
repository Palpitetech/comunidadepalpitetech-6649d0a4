import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface EstatisticaItem {
  valor: number;
  ocorrencias: number;
  ranking: number;
}

export interface DesdobramentoStatsMegaSena {
  repetidas: EstatisticaItem[];
  impares: EstatisticaItem[];
  primos: EstatisticaItem[];
  moldura: EstatisticaItem[];
  multiplosDe3: EstatisticaItem[];
  isLoading: boolean;
}

export function useDesdobramentoStatsMegaSena(): DesdobramentoStatsMegaSena {
  const { data: repetidasData, isLoading: loadingRepetidas } = useQuery({
    queryKey: ["desdobramento-megasena-repetidas"],
    queryFn: async () => fetchStats("qtd_repetidas"),
  });

  const { data: imparesData, isLoading: loadingImpares } = useQuery({
    queryKey: ["desdobramento-megasena-impares"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("resultados_megasena")
        .select("concurso_id, qtd_pares")
        .order("concurso_id", { ascending: false });

      if (error) throw error;
      if (!data || data.length === 0) return [];

      const agrupado = new Map<number, number>();

      data.forEach((r) => {
        // 6 dezenas por sorteio
        const qtdImpares = 6 - (r.qtd_pares ?? 0);
        agrupado.set(qtdImpares, (agrupado.get(qtdImpares) ?? 0) + 1);
      });

      return Array.from(agrupado.entries())
        .map(([valor, ocorrencias]) => ({ valor, ocorrencias, ranking: 0 }))
        .sort((a, b) => b.ocorrencias - a.ocorrencias)
        .map((item, index) => ({ ...item, ranking: index + 1 }));
    },
  });

  const { data: primosData, isLoading: loadingPrimos } = useQuery({
    queryKey: ["desdobramento-megasena-primos"],
    queryFn: async () => fetchStats("qtd_primos"),
  });

  const { data: molduraData, isLoading: loadingMoldura } = useQuery({
    queryKey: ["desdobramento-megasena-moldura"],
    queryFn: async () => fetchStats("qtd_moldura"),
  });

  // Para múltiplos de 3, calcular manualmente a partir das dezenas
  const { data: multiplosDe3Data, isLoading: loadingM3 } = useQuery({
    queryKey: ["desdobramento-megasena-multiplosde3"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("resultados_megasena")
        .select("dezenas")
        .order("concurso_id", { ascending: false });

      if (error) throw error;
      if (!data || data.length === 0) return [];

      const agrupado = new Map<number, number>();

      data.forEach((r) => {
        const qtdM3 = (r.dezenas || []).filter((d: number) => d % 3 === 0).length;
        agrupado.set(qtdM3, (agrupado.get(qtdM3) ?? 0) + 1);
      });

      return Array.from(agrupado.entries())
        .map(([valor, ocorrencias]) => ({ valor, ocorrencias, ranking: 0 }))
        .sort((a, b) => b.ocorrencias - a.ocorrencias)
        .map((item, index) => ({ ...item, ranking: index + 1 }));
    },
  });

  return {
    repetidas: repetidasData ?? [],
    impares: imparesData ?? [],
    primos: primosData ?? [],
    moldura: molduraData ?? [],
    multiplosDe3: multiplosDe3Data ?? [],
    isLoading: loadingRepetidas || loadingImpares || loadingPrimos || loadingMoldura || loadingM3,
  };
}

async function fetchStats(campo: "qtd_primos" | "qtd_repetidas" | "qtd_moldura"): Promise<EstatisticaItem[]> {
  const { data, error } = await supabase
    .from("resultados_megasena")
    .select("concurso_id, qtd_primos, qtd_repetidas, qtd_moldura")
    .order("concurso_id", { ascending: false });

  if (error) throw error;
  if (!data || data.length === 0) return [];

  const agrupado = new Map<number, number>();

  data.forEach((r) => {
    const qtd = r[campo] ?? 0;
    agrupado.set(qtd, (agrupado.get(qtd) ?? 0) + 1);
  });

  return Array.from(agrupado.entries())
    .map(([valor, ocorrencias]) => ({ valor, ocorrencias, ranking: 0 }))
    .sort((a, b) => b.ocorrencias - a.ocorrencias)
    .map((item, index) => ({ ...item, ranking: index + 1 }));
}
