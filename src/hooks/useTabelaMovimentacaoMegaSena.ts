import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ResultadoRow {
  concurso_id: number;
  data_sorteio: string;
  dezenas: number[];
  qtd_impares: number | null;
  qtd_primos: number | null;
  qtd_moldura: number | null;
  qtd_repetidas: number | null;
}

interface DezenaStats {
  dezena: number;
  frequencia: number;
  frequenciaPercent: number;
  atrasoAtual: number;
  maiorAtraso: number;
  maiorSequencia: number;
  status: "quente" | "media" | "fria";
}

interface TabelaMovimentacaoMegaSenaData {
  resultados: ResultadoRow[];
  dezenaStats: DezenaStats[];
  ultimoConcurso: number;
}

export function useTabelaMovimentacaoMegaSena(limiteConcursos = 50) {
  return useQuery({
    queryKey: ["tabela-movimentacao-megasena", limiteConcursos],
    queryFn: async (): Promise<TabelaMovimentacaoMegaSenaData> => {
      const { data, error } = await supabase
        .from("resultados_megasena")
        .select("concurso_id, data_sorteio, dezenas, qtd_impares, qtd_primos, qtd_moldura, qtd_repetidas")
        .order("concurso_id", { ascending: false })
        .limit(limiteConcursos);

      if (error) throw error;
      if (!data || data.length === 0) {
        return {
          resultados: [],
          dezenaStats: [],
          ultimoConcurso: 0,
        };
      }

      // Ordenar por concurso crescente para cálculos
      const resultadosOrdenados = [...data].sort((a, b) => a.concurso_id - b.concurso_id);

      // Calcular estatísticas por dezena (60 dezenas)
      const dezenaStats = calcularEstatisticasDezenas(resultadosOrdenados);

      return {
        resultados: resultadosOrdenados,
        dezenaStats,
        ultimoConcurso: data[0]?.concurso_id ?? 0,
      };
    },
  });
}

function calcularEstatisticasDezenas(resultados: ResultadoRow[]): DezenaStats[] {
  const stats: DezenaStats[] = [];
  const totalConcursos = resultados.length;

  for (let dezena = 1; dezena <= 60; dezena++) {
    let frequencia = 0;
    let atrasoAtual = 0;
    let maiorAtraso = 0;
    let maiorSequencia = 0;
    let sequenciaAtual = 0;
    let atrasoTemp = 0;

    for (let i = 0; i < resultados.length; i++) {
      const sorteadas = resultados[i].dezenas;
      const saiu = sorteadas.includes(dezena);

      if (saiu) {
        frequencia++;
        sequenciaAtual++;
        if (sequenciaAtual > maiorSequencia) {
          maiorSequencia = sequenciaAtual;
        }
        if (atrasoTemp > maiorAtraso) {
          maiorAtraso = atrasoTemp;
        }
        atrasoTemp = 0;
      } else {
        atrasoTemp++;
        sequenciaAtual = 0;
      }
    }

    // Atraso atual (desde o último sorteio)
    for (let i = resultados.length - 1; i >= 0; i--) {
      if (resultados[i].dezenas.includes(dezena)) {
        break;
      }
      atrasoAtual++;
    }

    const frequenciaPercent = totalConcursos > 0 ? (frequencia / totalConcursos) * 100 : 0;

    // Classificar status (Mega Sena: ~10% é o esperado para cada dezena)
    let status: "quente" | "media" | "fria" = "media";
    if (frequenciaPercent >= 15) {
      status = "quente";
    } else if (frequenciaPercent <= 5) {
      status = "fria";
    }

    stats.push({
      dezena,
      frequencia,
      frequenciaPercent,
      atrasoAtual,
      maiorAtraso,
      maiorSequencia,
      status,
    });
  }

  return stats;
}
