import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface DezenaFreq {
  dezena: number;
  freq: number;
}

export interface Mega30AnosData {
  totalConcursos: number;
  primeiroConcurso: { numero: number; data: string };
  ultimoConcurso: { numero: number; data: string };
  topPorMes: Record<number, DezenaFreq[]>; // 1..12 -> top 15
  topPorAno: Record<number, DezenaFreq[]>; // ano -> top 15
  topPorSemestre: { primeiro: DezenaFreq[]; segundo: DezenaFreq[] };
  top15Geral: DezenaFreq[];
  anosOrdenados: number[];
}

function topN(counts: Map<number, number>, n: number): DezenaFreq[] {
  return Array.from(counts.entries())
    .map(([dezena, freq]) => ({ dezena, freq }))
    .sort((a, b) => b.freq - a.freq || a.dezena - b.dezena)
    .slice(0, n);
}

export function useGravacaoMega30Anos() {
  return useQuery<Mega30AnosData>({
    queryKey: ["gravacao-mega-30anos"],
    staleTime: 60 * 60 * 1000,
    queryFn: async () => {
      // Paginar pois >1000 registros
      const all: { concurso: number; data_sorteio: string; dezenas: number[] }[] = [];
      const PAGE = 1000;
      let from = 0;
      while (true) {
        const { data, error } = await (supabase as any)
          .from("resultados_loterias")
          .select("concurso, data_sorteio, dezenas")
          .eq("loteria", "megasena")
          .order("concurso", { ascending: true })
          .range(from, from + PAGE - 1);
        if (error) throw error;
        if (!data || data.length === 0) break;
        all.push(...data);
        if (data.length < PAGE) break;
        from += PAGE;
      }

      const porMes = new Map<number, Map<number, number>>();
      const porAno = new Map<number, Map<number, number>>();
      const porSemestre = [new Map<number, number>(), new Map<number, number>()];
      const geral = new Map<number, number>();

      for (let i = 1; i <= 12; i++) porMes.set(i, new Map());

      for (const row of all) {
        const dt = new Date(row.data_sorteio + "T00:00:00");
        const mes = dt.getMonth() + 1;
        const ano = dt.getFullYear();
        const sem = mes <= 6 ? 0 : 1;

        if (!porAno.has(ano)) porAno.set(ano, new Map());
        const mapMes = porMes.get(mes)!;
        const mapAno = porAno.get(ano)!;
        const mapSem = porSemestre[sem];

        for (const d of row.dezenas) {
          mapMes.set(d, (mapMes.get(d) ?? 0) + 1);
          mapAno.set(d, (mapAno.get(d) ?? 0) + 1);
          mapSem.set(d, (mapSem.get(d) ?? 0) + 1);
          geral.set(d, (geral.get(d) ?? 0) + 1);
        }
      }

      const topPorMes: Record<number, DezenaFreq[]> = {};
      for (const [m, map] of porMes) topPorMes[m] = topN(map, 15);

      const topPorAno: Record<number, DezenaFreq[]> = {};
      const anosOrdenados = Array.from(porAno.keys()).sort((a, b) => a - b);
      for (const a of anosOrdenados) topPorAno[a] = topN(porAno.get(a)!, 15);

      return {
        totalConcursos: all.length,
        primeiroConcurso: { numero: all[0]?.concurso ?? 0, data: all[0]?.data_sorteio ?? "" },
        ultimoConcurso: { numero: all.at(-1)?.concurso ?? 0, data: all.at(-1)?.data_sorteio ?? "" },
        topPorMes,
        topPorAno,
        topPorSemestre: {
          primeiro: topN(porSemestre[0], 15),
          segundo: topN(porSemestre[1], 15),
        },
        top15Geral: topN(geral, 15),
        anosOrdenados,
      };
    },
  });
}
