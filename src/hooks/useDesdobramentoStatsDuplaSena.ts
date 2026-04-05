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

// Estatísticas combinadas de ambos os sorteios (mesmo jogo vale para S1 e S2)
export function useDesdobramentoStatsDuplaSena(): DesdobramentoStatsDuplaSena {
  const { data: repetidasData, isLoading: loadingRepetidas } = useQuery({
    queryKey: ["desdobramento-duplasena-repetidas-combined"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("resultados_loterias")
        .select("concurso, qtd_repetidas, qtd_repetidas_s2")
        .eq("loteria", "duplasena")
        .order("concurso", { ascending: false });

      if (error) throw error;
      if (!data || data.length === 0) return [];

      const agrupado = new Map<number, number>();

      data.forEach((r: any) => {
        const qtd1 = r.qtd_repetidas ?? 0;
        const qtd2 = r.qtd_repetidas_s2 ?? 0;
        agrupado.set(qtd1, (agrupado.get(qtd1) ?? 0) + 1);
        agrupado.set(qtd2, (agrupado.get(qtd2) ?? 0) + 1);
      });

      return Array.from(agrupado.entries())
        .map(([valor, ocorrencias]) => ({ valor, ocorrencias, ranking: 0 }))
        .sort((a, b) => b.ocorrencias - a.ocorrencias)
        .map((item, index) => ({ ...item, ranking: index + 1 }));
    },
  });

  const { data: imparesData, isLoading: loadingImpares } = useQuery({
    queryKey: ["desdobramento-duplasena-impares-combined"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("resultados_loterias")
        .select("concurso, qtd_pares, qtd_pares_s2")
        .eq("loteria", "duplasena")
        .order("concurso", { ascending: false });

      if (error) throw error;
      if (!data || data.length === 0) return [];

      const agrupado = new Map<number, number>();

      data.forEach((r: any) => {
        const qtdImpares1 = 6 - (r.qtd_pares ?? 0);
        const qtdImpares2 = 6 - (r.qtd_pares_s2 ?? 0);
        agrupado.set(qtdImpares1, (agrupado.get(qtdImpares1) ?? 0) + 1);
        agrupado.set(qtdImpares2, (agrupado.get(qtdImpares2) ?? 0) + 1);
      });

      return Array.from(agrupado.entries())
        .map(([valor, ocorrencias]) => ({ valor, ocorrencias, ranking: 0 }))
        .sort((a, b) => b.ocorrencias - a.ocorrencias)
        .map((item, index) => ({ ...item, ranking: index + 1 }));
    },
  });

  const { data: primosData, isLoading: loadingPrimos } = useQuery({
    queryKey: ["desdobramento-duplasena-primos-combined"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("resultados_loterias")
        .select("concurso, qtd_primos, qtd_primos_s2")
        .eq("loteria", "duplasena")
        .order("concurso", { ascending: false });

      if (error) throw error;
      if (!data || data.length === 0) return [];

      const agrupado = new Map<number, number>();

      data.forEach((r: any) => {
        const qtd1 = r.qtd_primos ?? 0;
        const qtd2 = r.qtd_primos_s2 ?? 0;
        agrupado.set(qtd1, (agrupado.get(qtd1) ?? 0) + 1);
        agrupado.set(qtd2, (agrupado.get(qtd2) ?? 0) + 1);
      });

      return Array.from(agrupado.entries())
        .map(([valor, ocorrencias]) => ({ valor, ocorrencias, ranking: 0 }))
        .sort((a, b) => b.ocorrencias - a.ocorrencias)
        .map((item, index) => ({ ...item, ranking: index + 1 }));
    },
  });

  const { data: molduraData, isLoading: loadingMoldura } = useQuery({
    queryKey: ["desdobramento-duplasena-moldura-combined"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("resultados_loterias")
        .select("concurso, qtd_moldura, qtd_moldura_s2")
        .eq("loteria", "duplasena")
        .order("concurso", { ascending: false });

      if (error) throw error;
      if (!data || data.length === 0) return [];

      const agrupado = new Map<number, number>();

      data.forEach((r: any) => {
        const qtd1 = r.qtd_moldura ?? 0;
        const qtd2 = r.qtd_moldura_s2 ?? 0;
        agrupado.set(qtd1, (agrupado.get(qtd1) ?? 0) + 1);
        agrupado.set(qtd2, (agrupado.get(qtd2) ?? 0) + 1);
      });

      return Array.from(agrupado.entries())
        .map(([valor, ocorrencias]) => ({ valor, ocorrencias, ranking: 0 }))
        .sort((a, b) => b.ocorrencias - a.ocorrencias)
        .map((item, index) => ({ ...item, ranking: index + 1 }));
    },
  });

  // Para múltiplos de 3, calcular manualmente a partir das dezenas de ambos os sorteios
  const { data: multiplosDe3Data, isLoading: loadingM3 } = useQuery({
    queryKey: ["desdobramento-duplasena-multiplosde3-combined"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("resultados_loterias")
        .select("dezenas, dezenas_sorteio2")
        .eq("loteria", "duplasena")
        .order("concurso", { ascending: false });

      if (error) throw error;
      if (!data || data.length === 0) return [];

      const agrupado = new Map<number, number>();

      data.forEach((r: any) => {
        const dezenas1 = r.dezenas || [];
        const dezenas2 = r.dezenas_sorteio2 || [];
        const qtdM3_1 = dezenas1.filter((d: number) => d % 3 === 0).length;
        const qtdM3_2 = dezenas2.filter((d: number) => d % 3 === 0).length;
        agrupado.set(qtdM3_1, (agrupado.get(qtdM3_1) ?? 0) + 1);
        agrupado.set(qtdM3_2, (agrupado.get(qtdM3_2) ?? 0) + 1);
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
