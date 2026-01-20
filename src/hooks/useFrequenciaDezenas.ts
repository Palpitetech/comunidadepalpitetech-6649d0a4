import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface DezenaEstatistica {
  dezena: number;
  ultimaVez: number;
  maiorSequencia: number;
  maiorAtraso: number;
  frequencia: number;
  melhorDupla: number;
  correlacaoDupla: number;
  status: "quente" | "frio" | "normal";
}

interface Concurso {
  concurso_id: number;
  dezenas: number[];
}

function calcularUltimaVez(dezena: number, concursos: Concurso[]): number {
  for (const concurso of concursos) {
    if (concurso.dezenas.includes(dezena)) {
      return concurso.concurso_id;
    }
  }
  return 0;
}

function calcularMaiorSequencia(dezena: number, concursos: Concurso[]): number {
  let maiorSequencia = 0;
  let sequenciaAtual = 0;

  // Percorre do mais antigo para o mais recente
  const concursosOrdenados = [...concursos].reverse();

  for (const concurso of concursosOrdenados) {
    if (concurso.dezenas.includes(dezena)) {
      sequenciaAtual++;
      maiorSequencia = Math.max(maiorSequencia, sequenciaAtual);
    } else {
      sequenciaAtual = 0;
    }
  }

  return maiorSequencia;
}

function calcularMaiorAtraso(dezena: number, concursos: Concurso[]): number {
  let maiorAtraso = 0;
  let atrasoAtual = 0;

  // Percorre do mais antigo para o mais recente
  const concursosOrdenados = [...concursos].reverse();

  for (const concurso of concursosOrdenados) {
    if (concurso.dezenas.includes(dezena)) {
      maiorAtraso = Math.max(maiorAtraso, atrasoAtual);
      atrasoAtual = 0;
    } else {
      atrasoAtual++;
    }
  }

  // Verifica atraso final
  maiorAtraso = Math.max(maiorAtraso, atrasoAtual);

  return maiorAtraso;
}

function calcularFrequencia(dezena: number, concursos: Concurso[]): number {
  if (concursos.length === 0) return 0;

  const aparicoes = concursos.filter((c) => c.dezenas.includes(dezena)).length;
  return Math.round((aparicoes / concursos.length) * 100);
}

function calcularMelhorDupla(
  dezena: number,
  concursos: Concurso[]
): { dupla: number; correlacao: number } {
  const aparicoesDezena = concursos.filter((c) =>
    c.dezenas.includes(dezena)
  ).length;

  if (aparicoesDezena === 0) return { dupla: 0, correlacao: 0 };

  let melhorDupla = 0;
  let maiorCorrelacao = 0;

  for (let outraDezena = 1; outraDezena <= 25; outraDezena++) {
    if (outraDezena === dezena) continue;

    const aparicaoJuntas = concursos.filter(
      (c) => c.dezenas.includes(dezena) && c.dezenas.includes(outraDezena)
    ).length;

    const correlacao = Math.round((aparicaoJuntas / aparicoesDezena) * 100);

    if (correlacao > maiorCorrelacao) {
      maiorCorrelacao = correlacao;
      melhorDupla = outraDezena;
    }
  }

  return { dupla: melhorDupla, correlacao: maiorCorrelacao };
}

function calcularAtrasoAtual(dezena: number, concursos: Concurso[]): number {
  let atraso = 0;

  for (const concurso of concursos) {
    if (concurso.dezenas.includes(dezena)) {
      break;
    }
    atraso++;
  }

  return atraso;
}

function determinarStatus(frequencia: number): "quente" | "frio" | "normal" {
  if (frequencia >= 60) return "quente";
  if (frequencia <= 40) return "frio";
  return "normal";
}

export function useFrequenciaDezenas(periodo: number) {
  return useQuery({
    queryKey: ["frequencia-dezenas", periodo],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("resultados")
        .select("concurso_id, dezenas")
        .order("concurso_id", { ascending: false })
        .limit(periodo);

      if (error) throw error;

      const concursos: Concurso[] = (data || []).map((r) => ({
        concurso_id: r.concurso_id,
        dezenas: r.dezenas as number[],
      }));

      const estatisticas: DezenaEstatistica[] = [];

      for (let dezena = 1; dezena <= 25; dezena++) {
        const frequencia = calcularFrequencia(dezena, concursos);
        const { dupla, correlacao } = calcularMelhorDupla(dezena, concursos);

        estatisticas.push({
          dezena,
          ultimaVez: calcularUltimaVez(dezena, concursos),
          maiorSequencia: calcularMaiorSequencia(dezena, concursos),
          maiorAtraso: calcularMaiorAtraso(dezena, concursos),
          frequencia,
          melhorDupla: dupla,
          correlacaoDupla: correlacao,
          status: determinarStatus(frequencia),
        });
      }

      return estatisticas;
    },
  });
}
