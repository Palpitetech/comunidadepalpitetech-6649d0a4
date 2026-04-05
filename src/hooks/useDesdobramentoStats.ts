import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface EstatisticaItem {
  valor: number;
  ocorrencias: number;
  ranking: number;
}

export interface DesdobramentoStats {
  repetidas: EstatisticaItem[];
  impares: EstatisticaItem[];
  primos: EstatisticaItem[];
  moldura: EstatisticaItem[];
  isLoading: boolean;
}

export function useDesdobramentoStats() {
  const { data: repetidasData, isLoading: loadingRepetidas } = useQuery({
    queryKey: ["desdobramento-repetidas"],
    queryFn: async () => fetchStats("qtd_repetidas"),
  });

  const { data: imparesData, isLoading: loadingImpares } = useQuery({
    queryKey: ["desdobramento-impares"],
    queryFn: async () => {
      // Para ímpares, precisamos calcular manualmente (15 - qtd_pares)
      const { data, error } = await supabase
        .from("resultados_loterias")
        .eq("loteria", "lotofacil")
        .select("concurso_id:concurso, qtd_pares")
        .order("concurso", { ascending: false });

      if (error) throw error;
      if (!data || data.length === 0) return [];

      const totalConcursos = data.length;
      const agrupado = new Map<number, number>();

      data.forEach((r) => {
        const qtdImpares = 15 - (r.qtd_pares ?? 0);
        agrupado.set(qtdImpares, (agrupado.get(qtdImpares) ?? 0) + 1);
      });

      return Array.from(agrupado.entries())
        .map(([valor, ocorrencias]) => ({ valor, ocorrencias, ranking: 0 }))
        .sort((a, b) => b.ocorrencias - a.ocorrencias)
        .map((item, index) => ({ ...item, ranking: index + 1 }));
    },
  });

  const { data: primosData, isLoading: loadingPrimos } = useQuery({
    queryKey: ["desdobramento-primos"],
    queryFn: async () => fetchStats("qtd_primos"),
  });

  const { data: molduraData, isLoading: loadingMoldura } = useQuery({
    queryKey: ["desdobramento-moldura"],
    queryFn: async () => fetchStats("qtd_moldura"),
  });

  return {
    repetidas: repetidasData ?? [],
    impares: imparesData ?? [],
    primos: primosData ?? [],
    moldura: molduraData ?? [],
    isLoading: loadingRepetidas || loadingImpares || loadingPrimos || loadingMoldura,
  };
}

async function fetchStats(campo: "qtd_primos" | "qtd_repetidas" | "qtd_moldura"): Promise<EstatisticaItem[]> {
  const { data, error } = await supabase
    .from("resultados_loterias")
    .eq("loteria", "lotofacil")
    .select("concurso_id:concurso, qtd_primos, qtd_repetidas, qtd_moldura")
    .order("concurso", { ascending: false });

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
