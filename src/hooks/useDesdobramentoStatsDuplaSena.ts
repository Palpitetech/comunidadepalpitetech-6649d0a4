import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface EstatisticaItem {
  valor: number;
  ocorrencias: number;
  ranking: number;
}

export interface DesdobramentoStatsDuplaSena {
  repetidas: EstatisticaItem[];
  impares: EstatisticaItem[];
  primos: EstatisticaItem[];
  moldura: EstatisticaItem[];
  multiplosDe3: EstatisticaItem[];
  isLoading: boolean;
}

type SorteioKey = "sorteio1" | "sorteio2";

export function useDesdobramentoStatsDuplaSena(sorteio: SorteioKey = "sorteio1"): DesdobramentoStatsDuplaSena {
  const dezenasField = sorteio === "sorteio1" ? "dezenas_sorteio1" : "dezenas_sorteio2";
  const suffix = sorteio === "sorteio1" ? "_s1" : "_s2";

  const { data: repetidasData, isLoading: loadingRepetidas } = useQuery({
    queryKey: ["desdobramento-duplasena-repetidas", sorteio],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("resultados_duplasena")
        .select(`concurso_id, qtd_repetidas${suffix}`)
        .order("concurso_id", { ascending: false });

      if (error) throw error;
      if (!data || data.length === 0) return [];

      const agrupado = new Map<number, number>();

      data.forEach((r: Record<string, unknown>) => {
        const qtd = (r[`qtd_repetidas${suffix}`] as number) ?? 0;
        agrupado.set(qtd, (agrupado.get(qtd) ?? 0) + 1);
      });

      return Array.from(agrupado.entries())
        .map(([valor, ocorrencias]) => ({ valor, ocorrencias, ranking: 0 }))
        .sort((a, b) => b.ocorrencias - a.ocorrencias)
        .map((item, index) => ({ ...item, ranking: index + 1 }));
    },
  });

  const { data: imparesData, isLoading: loadingImpares } = useQuery({
    queryKey: ["desdobramento-duplasena-impares", sorteio],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("resultados_duplasena")
        .select(`concurso_id, qtd_pares${suffix}`)
        .order("concurso_id", { ascending: false });

      if (error) throw error;
      if (!data || data.length === 0) return [];

      const agrupado = new Map<number, number>();

      data.forEach((r: Record<string, unknown>) => {
        // 6 dezenas por sorteio
        const qtdImpares = 6 - ((r[`qtd_pares${suffix}`] as number) ?? 0);
        agrupado.set(qtdImpares, (agrupado.get(qtdImpares) ?? 0) + 1);
      });

      return Array.from(agrupado.entries())
        .map(([valor, ocorrencias]) => ({ valor, ocorrencias, ranking: 0 }))
        .sort((a, b) => b.ocorrencias - a.ocorrencias)
        .map((item, index) => ({ ...item, ranking: index + 1 }));
    },
  });

  const { data: primosData, isLoading: loadingPrimos } = useQuery({
    queryKey: ["desdobramento-duplasena-primos", sorteio],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("resultados_duplasena")
        .select(`concurso_id, qtd_primos${suffix}`)
        .order("concurso_id", { ascending: false });

      if (error) throw error;
      if (!data || data.length === 0) return [];

      const agrupado = new Map<number, number>();

      data.forEach((r: Record<string, unknown>) => {
        const qtd = (r[`qtd_primos${suffix}`] as number) ?? 0;
        agrupado.set(qtd, (agrupado.get(qtd) ?? 0) + 1);
      });

      return Array.from(agrupado.entries())
        .map(([valor, ocorrencias]) => ({ valor, ocorrencias, ranking: 0 }))
        .sort((a, b) => b.ocorrencias - a.ocorrencias)
        .map((item, index) => ({ ...item, ranking: index + 1 }));
    },
  });

  const { data: molduraData, isLoading: loadingMoldura } = useQuery({
    queryKey: ["desdobramento-duplasena-moldura", sorteio],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("resultados_duplasena")
        .select(`concurso_id, qtd_moldura${suffix}`)
        .order("concurso_id", { ascending: false });

      if (error) throw error;
      if (!data || data.length === 0) return [];

      const agrupado = new Map<number, number>();

      data.forEach((r: Record<string, unknown>) => {
        const qtd = (r[`qtd_moldura${suffix}`] as number) ?? 0;
        agrupado.set(qtd, (agrupado.get(qtd) ?? 0) + 1);
      });

      return Array.from(agrupado.entries())
        .map(([valor, ocorrencias]) => ({ valor, ocorrencias, ranking: 0 }))
        .sort((a, b) => b.ocorrencias - a.ocorrencias)
        .map((item, index) => ({ ...item, ranking: index + 1 }));
    },
  });

  // Para múltiplos de 3, calcular manualmente a partir das dezenas
  const { data: multiplosDe3Data, isLoading: loadingM3 } = useQuery({
    queryKey: ["desdobramento-duplasena-multiplosde3", sorteio],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("resultados_duplasena")
        .select(dezenasField)
        .order("concurso_id", { ascending: false });

      if (error) throw error;
      if (!data || data.length === 0) return [];

      const agrupado = new Map<number, number>();

      data.forEach((r: Record<string, unknown>) => {
        const dezenas = (r[dezenasField] as number[]) || [];
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
