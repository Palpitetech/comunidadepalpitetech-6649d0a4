import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface EstatisticaItem {
  valor: number;
  ocorrencias: number;
  ranking: number;
}

export interface DesdobramentoStatsQuina {
  repetidas: EstatisticaItem[];
  impares: EstatisticaItem[];
  primos: EstatisticaItem[];
  moldura: EstatisticaItem[];
  multiplosDe3: EstatisticaItem[];
  isLoading: boolean;
}

function buildAgrupadoFromField(data: any[], campo: string): EstatisticaItem[] {
  const agrupado = new Map<number, number>();
  data.forEach((r: any) => {
    const qtd = r[campo] ?? 0;
    agrupado.set(qtd, (agrupado.get(qtd) ?? 0) + 1);
  });
  return Array.from(agrupado.entries())
    .map(([valor, ocorrencias]) => ({ valor, ocorrencias, ranking: 0 }))
    .sort((a, b) => b.ocorrencias - a.ocorrencias)
    .map((item, index) => ({ ...item, ranking: index + 1 }));
}

export function useDesdobramentoStatsQuina(): DesdobramentoStatsQuina {
  const { data: repetidasData, isLoading: loadingRepetidas } = useQuery({
    queryKey: ["desdobramento-quina-repetidas"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("resultados_loterias")
        .select("concurso, qtd_repetidas")
        .eq("loteria", "quina")
        .order("concurso", { ascending: false });
      if (error) throw error;
      if (!data || data.length === 0) return [];
      return buildAgrupadoFromField(data, "qtd_repetidas");
    },
  });

  const { data: imparesData, isLoading: loadingImpares } = useQuery({
    queryKey: ["desdobramento-quina-impares"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("resultados_loterias")
        .select("concurso, qtd_pares")
        .eq("loteria", "quina")
        .order("concurso", { ascending: false });
      if (error) throw error;
      if (!data || data.length === 0) return [];

      const agrupado = new Map<number, number>();
      data.forEach((r: any) => {
        const qtdImpares = 5 - (r.qtd_pares ?? 0);
        agrupado.set(qtdImpares, (agrupado.get(qtdImpares) ?? 0) + 1);
      });
      return Array.from(agrupado.entries())
        .map(([valor, ocorrencias]) => ({ valor, ocorrencias, ranking: 0 }))
        .sort((a, b) => b.ocorrencias - a.ocorrencias)
        .map((item, index) => ({ ...item, ranking: index + 1 }));
    },
  });

  const { data: primosData, isLoading: loadingPrimos } = useQuery({
    queryKey: ["desdobramento-quina-primos"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("resultados_loterias")
        .select("concurso, qtd_primos")
        .eq("loteria", "quina")
        .order("concurso", { ascending: false });
      if (error) throw error;
      if (!data || data.length === 0) return [];
      return buildAgrupadoFromField(data, "qtd_primos");
    },
  });

  const { data: molduraData, isLoading: loadingMoldura } = useQuery({
    queryKey: ["desdobramento-quina-moldura"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("resultados_loterias")
        .select("concurso, qtd_moldura")
        .eq("loteria", "quina")
        .order("concurso", { ascending: false });
      if (error) throw error;
      if (!data || data.length === 0) return [];
      return buildAgrupadoFromField(data, "qtd_moldura");
    },
  });

  const { data: multiplosDe3Data, isLoading: loadingM3 } = useQuery({
    queryKey: ["desdobramento-quina-multiplosde3"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("resultados_loterias")
        .select("dezenas")
        .eq("loteria", "quina")
        .order("concurso", { ascending: false });
      if (error) throw error;
      if (!data || data.length === 0) return [];

      const agrupado = new Map<number, number>();
      data.forEach((r: any) => {
        const dezenas = r.dezenas || [];
        const qtdM3 = dezenas.filter((d: number) => d % 3 === 0).length;
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
