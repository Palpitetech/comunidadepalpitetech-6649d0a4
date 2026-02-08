import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface DezenaEstatisticaMegaSena {
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

  // Mega Sena tem 60 dezenas
  for (let outraDezena = 1; outraDezena <= 60; outraDezena++) {
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

  // Para Mega Sena (60 dezenas), limitar a busca para performance
  // Vamos buscar trios apenas entre dezenas que já apareceram junto com a dezena principal
  const dezenasRelacionadas = new Set<number>();
  concursos.forEach(c => {
    if (c.dezenas.includes(dezena)) {
      c.dezenas.forEach(d => {
        if (d !== dezena) dezenasRelacionadas.add(d);
      });
    }
  });

  const relacionadas = Array.from(dezenasRelacionadas).sort((a, b) => a - b);

  for (let i = 0; i < relacionadas.length; i++) {
    const d1 = relacionadas[i];
    for (let j = i + 1; j < relacionadas.length; j++) {
      const d2 = relacionadas[j];

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

// Para Mega Sena (6 de 60), a frequência esperada é ~10%
// Ajustamos os limiares proporcionalmente
function determinarStatus(frequencia: number): "quente" | "frio" | "normal" {
  // ~10% é a média esperada para Mega Sena
  // Quente: >= 15% (50% acima da média)
  // Frio: <= 5% (50% abaixo da média)
  if (frequencia >= 15) return "quente";
  if (frequencia <= 5) return "frio";
  return "normal";
}

export function useFrequenciaMegaSena(periodo: number) {
  return useQuery({
    queryKey: ["frequencia-megasena", periodo],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("resultados_megasena")
        .select("concurso_id, dezenas")
        .order("concurso_id", { ascending: false })
        .limit(periodo);

      if (error) throw error;

      const concursos: Concurso[] = (data || []).map((r) => ({
        concurso_id: r.concurso_id,
        dezenas: r.dezenas as number[],
      }));

      const estatisticas: DezenaEstatisticaMegaSena[] = [];

      // Mega Sena tem 60 dezenas
      for (let dezena = 1; dezena <= 60; dezena++) {
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
