import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ResultadoRow {
  concurso_id: number;
  data_sorteio: string;
  dezenas: number[];
  ciclo_numero: number | null;
  dezenas_faltantes_ciclo: number[] | null;
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

interface CicloBloco {
  cicloNumero: number;
  concursos: ResultadoRow[];
  duracao: number;
  fechouEm: number;
}

interface TabelaMovimentacaoData {
  resultados: ResultadoRow[];
  ciclos: CicloBloco[];
  dezenaStats: DezenaStats[];
  cicloAtual: {
    ausentes: number[];
    numero: number | null;
  };
  ultimoConcurso: number;
}

export function useTabelaMovimentacao(limiteConcursos = 50) {
  return useQuery({
    queryKey: ["tabela-movimentacao", limiteConcursos],
    queryFn: async (): Promise<TabelaMovimentacaoData> => {
      // Buscar resultados
      const { data, error } = await supabase
        .from("resultados_loterias")
        .select("concurso_id:concurso, data_sorteio, dezenas, ciclo_numero, dezenas_faltantes_ciclo, qtd_impares, qtd_primos, qtd_moldura, qtd_repetidas")
        .order("concurso", { ascending: false })
        .limit(limiteConcursos);

      if (error) throw error;
      if (!data || data.length === 0) {
        return {
          resultados: [],
          ciclos: [],
          dezenaStats: [],
          cicloAtual: { ausentes: [], numero: null },
          ultimoConcurso: 0,
        };
      }

      // Ordenar por concurso crescente para cálculos
      const resultadosOrdenados = [...data].sort((a, b) => a.concurso_id - b.concurso_id);

      // Calcular estatísticas por dezena
      const dezenaStats = calcularEstatisticasDezenas(resultadosOrdenados);

      // Agrupar por ciclos
      const ciclos = agruparPorCiclos(resultadosOrdenados);

      // Encontrar ciclo atual e ausentes
      const ultimoResultado = resultadosOrdenados[resultadosOrdenados.length - 1];
      const cicloAtual = {
        ausentes: ultimoResultado?.dezenas_faltantes_ciclo ?? [],
        numero: ultimoResultado?.ciclo_numero ?? null,
      };

      return {
        resultados: [...data].sort((a, b) => a.concurso_id - b.concurso_id), // Mais antigo primeiro, mais novo embaixo
        ciclos,
        dezenaStats,
        cicloAtual,
        ultimoConcurso: data[0]?.concurso_id ?? 0,
      };
    },
  });
}

function calcularEstatisticasDezenas(resultados: ResultadoRow[]): DezenaStats[] {
  const stats: DezenaStats[] = [];
  const totalConcursos = resultados.length;

  for (let dezena = 1; dezena <= 25; dezena++) {
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

    // Classificar status
    let status: "quente" | "media" | "fria" = "media";
    if (frequenciaPercent >= 65) {
      status = "quente";
    } else if (frequenciaPercent <= 55) {
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

function agruparPorCiclos(resultados: ResultadoRow[]): CicloBloco[] {
  const ciclosMap = new Map<number, ResultadoRow[]>();

  for (const resultado of resultados) {
    if (resultado.ciclo_numero !== null) {
      if (!ciclosMap.has(resultado.ciclo_numero)) {
        ciclosMap.set(resultado.ciclo_numero, []);
      }
      ciclosMap.get(resultado.ciclo_numero)!.push(resultado);
    }
  }

  const ciclos: CicloBloco[] = [];

  for (const [cicloNumero, concursos] of ciclosMap) {
    const concursosOrdenados = [...concursos].sort((a, b) => a.concurso_id - b.concurso_id);
    ciclos.push({
      cicloNumero,
      concursos: concursosOrdenados,
      duracao: concursosOrdenados.length,
      fechouEm: concursosOrdenados[concursosOrdenados.length - 1].concurso_id,
    });
  }

  // Ordenar ciclos mais recentes primeiro
  ciclos.sort((a, b) => b.cicloNumero - a.cicloNumero);

  return ciclos;
}
