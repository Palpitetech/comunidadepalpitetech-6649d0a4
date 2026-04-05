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
  melhorTrio: [number, number];
  correlacaoTrio: number;
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

  const concursosOrdenados = [...concursos].reverse();

  for (const concurso of concursosOrdenados) {
    if (concurso.dezenas.includes(dezena)) {
      maiorAtraso = Math.max(maiorAtraso, atrasoAtual);
      atrasoAtual = 0;
    } else {
      atrasoAtual++;
    }
  }

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

function calcularMelhorTrio(
  dezena: number,
  concursos: Concurso[]
): { trio: [number, number]; correlacao: number } {
  const aparicoesDezena = concursos.filter((c) =>
    c.dezenas.includes(dezena)
  ).length;

  if (aparicoesDezena === 0) return { trio: [0, 0], correlacao: 0 };

  let melhorTrio: [number, number] = [0, 0];
  let maiorCorrelacao = 0;

  // Itera sobre todos os pares possíveis de outras dezenas
  for (let d1 = 1; d1 <= 25; d1++) {
    if (d1 === dezena) continue;

    for (let d2 = d1 + 1; d2 <= 25; d2++) {
      if (d2 === dezena) continue;

      const aparicaoTrio = concursos.filter(
        (c) =>
          c.dezenas.includes(dezena) &&
          c.dezenas.includes(d1) &&
          c.dezenas.includes(d2)
      ).length;

      const correlacao = Math.round((aparicaoTrio / aparicoesDezena) * 100);

      if (correlacao > maiorCorrelacao) {
        maiorCorrelacao = correlacao;
        melhorTrio = [d1, d2];
      }
    }
  }

  return { trio: melhorTrio, correlacao: maiorCorrelacao };
}

function determinarStatus(frequencia: number): "quente" | "frio" | "normal" {
  if (frequencia >= 71) return "quente";
  if (frequencia <= 39) return "frio";
  return "normal";
}

export function useFrequenciaDezenas(periodo: number) {
  return useQuery({
    queryKey: ["frequencia-dezenas", periodo],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("resultados_loterias")
        .eq("loteria", "lotofacil")
        .select("concurso_id:concurso, dezenas")
        .order("concurso", { ascending: false })
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
        const { trio, correlacao: correlacaoTrio } = calcularMelhorTrio(
          dezena,
          concursos
        );

        estatisticas.push({
          dezena,
          ultimaVez: calcularUltimaVez(dezena, concursos),
          maiorSequencia: calcularMaiorSequencia(dezena, concursos),
          maiorAtraso: calcularMaiorAtraso(dezena, concursos),
          frequencia,
          melhorDupla: dupla,
          correlacaoDupla: correlacao,
          melhorTrio: trio,
          correlacaoTrio,
          status: determinarStatus(frequencia),
        });
      }

      return estatisticas;
    },
  });
}
