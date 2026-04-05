import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ResultadoRow {
  concurso_id: number;
  data_sorteio: string;
  dezenas_sorteio1: number[];
  dezenas_sorteio2: number[];
  qtd_impares_s1: number | null;
  qtd_impares_s2: number | null;
  qtd_repetidas_s1: number | null;
  qtd_repetidas_s2: number | null;
}

export interface DezenaStatsDuplaSena {
  dezena: number;
  frequencia: number;
  frequenciaPercent: number;
  atrasoAtual: number;
  maiorAtraso: number;
  maiorSequencia: number;
  status: "quente" | "media" | "fria";
}

interface CicloBloco {
  cicloNumero: number;
  duracao: number;
  fechouEm: number;
}

export interface TabelaMovimentacaoDuplaSenaGridData {
  resultados: ResultadoRow[];
  dezenaStatsS1: DezenaStatsDuplaSena[];
  dezenaStatsS2: DezenaStatsDuplaSena[];
  ciclosS1: CicloBloco[];
  ciclosS2: CicloBloco[];
  cicloAtualS1: { ausentes: number[]; numero: number };
  cicloAtualS2: { ausentes: number[]; numero: number };
  ultimoConcurso: number;
}

export function useTabelaMovimentacaoDuplaSenaGrid(limiteConcursos = 50) {
  return useQuery({
    queryKey: ["tabela-movimentacao-duplasena-grid", limiteConcursos],
    queryFn: async (): Promise<TabelaMovimentacaoDuplaSenaGridData> => {
      const { data: rawData, error } = await (supabase as any)
        .from("resultados_loterias")
        .select("concurso, data_sorteio, dezenas, dezenas_sorteio2, qtd_impares, qtd_impares_s2, qtd_repetidas, qtd_repetidas_s2")
        .eq("loteria", "duplasena")
        .order("concurso", { ascending: false })
        .limit(Math.max(limiteConcursos, 200));
      const data = (rawData || []).map((r: any) => ({
        concurso_id: r.concurso,
        data_sorteio: r.data_sorteio,
        dezenas_sorteio1: r.dezenas,
        dezenas_sorteio2: r.dezenas_sorteio2,
        qtd_impares_s1: r.qtd_impares,
        qtd_impares_s2: r.qtd_impares_s2,
        qtd_repetidas_s1: r.qtd_repetidas,
        qtd_repetidas_s2: r.qtd_repetidas_s2,
      })) as ResultadoRow[];

      if (error) throw error;
      if (!data || data.length === 0) {
        return {
          resultados: [],
          dezenaStatsS1: [],
          dezenaStatsS2: [],
          ciclosS1: [],
          ciclosS2: [],
          cicloAtualS1: { ausentes: [], numero: 1 },
          cicloAtualS2: { ausentes: [], numero: 1 },
          ultimoConcurso: 0,
        };
      }

      const resultadosOrdenados = [...data].sort((a, b) => a.concurso_id - b.concurso_id) as ResultadoRow[];
      const sliced = resultadosOrdenados.slice(-limiteConcursos);

      const dezenaStatsS1 = calcularStats(sliced, "dezenas_sorteio1");
      const dezenaStatsS2 = calcularStats(sliced, "dezenas_sorteio2");

      const { ciclos: ciclosS1, cicloAtual: cicloAtualS1 } = calcularCiclos(resultadosOrdenados, "dezenas_sorteio1");
      const { ciclos: ciclosS2, cicloAtual: cicloAtualS2 } = calcularCiclos(resultadosOrdenados, "dezenas_sorteio2");

      return {
        resultados: sliced,
        dezenaStatsS1,
        dezenaStatsS2,
        ciclosS1,
        ciclosS2,
        cicloAtualS1,
        cicloAtualS2,
        ultimoConcurso: data[0]?.concurso_id ?? 0,
      };
    },
  });
}

function calcularStats(
  resultados: ResultadoRow[],
  key: "dezenas_sorteio1" | "dezenas_sorteio2"
): DezenaStatsDuplaSena[] {
  const stats: DezenaStatsDuplaSena[] = [];
  const total = resultados.length;

  for (let dezena = 1; dezena <= 50; dezena++) {
    let frequencia = 0;
    let atrasoAtual = 0;
    let maiorAtraso = 0;
    let maiorSequencia = 0;
    let sequenciaAtual = 0;
    let atrasoTemp = 0;

    for (let i = 0; i < total; i++) {
      if (resultados[i][key].includes(dezena)) {
        frequencia++;
        sequenciaAtual++;
        maiorSequencia = Math.max(maiorSequencia, sequenciaAtual);
        maiorAtraso = Math.max(maiorAtraso, atrasoTemp);
        atrasoTemp = 0;
      } else {
        atrasoTemp++;
        sequenciaAtual = 0;
      }
    }
    maiorAtraso = Math.max(maiorAtraso, atrasoTemp);

    for (let i = total - 1; i >= 0; i--) {
      if (resultados[i][key].includes(dezena)) break;
      atrasoAtual++;
    }

    const frequenciaPercent = total > 0 ? (frequencia / total) * 100 : 0;
    let status: "quente" | "media" | "fria" = "media";
    if (frequenciaPercent >= 15) status = "quente";
    else if (frequenciaPercent <= 5) status = "fria";

    stats.push({ dezena, frequencia, frequenciaPercent, atrasoAtual, maiorAtraso, maiorSequencia, status });
  }

  return stats;
}

function calcularCiclos(
  resultados: ResultadoRow[],
  key: "dezenas_sorteio1" | "dezenas_sorteio2"
): { ciclos: CicloBloco[]; cicloAtual: { ausentes: number[]; numero: number } } {
  const ciclos: CicloBloco[] = [];
  const todas = new Set(Array.from({ length: 50 }, (_, i) => i + 1));

  let vistas = new Set<number>();
  let count = 0;
  let cicloNum = 1;

  for (const r of resultados) {
    r[key].forEach((d) => vistas.add(d));
    count++;

    if (vistas.size === 50) {
      ciclos.push({ cicloNumero: cicloNum, duracao: count, fechouEm: r.concurso_id });
      vistas = new Set<number>();
      count = 0;
      cicloNum++;
    }
  }

  const ausentes = Array.from(todas).filter((d) => !vistas.has(d)).sort((a, b) => a - b);
  return { ciclos, cicloAtual: { ausentes, numero: cicloNum } };
}
