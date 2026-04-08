import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { DezenaEstatistica } from "@/hooks/useFrequenciaDezenas";

const TOTAL_DEZENAS = 80;

interface Concurso {
  concurso_id: number;
  dezenas: number[];
}

function calcularUltimaVez(dezena: number, concursos: Concurso[]): number {
  for (const c of concursos) {
    if (c.dezenas.includes(dezena)) return c.concurso_id;
  }
  return 0;
}

function calcularMaiorSequencia(dezena: number, concursos: Concurso[]): number {
  let maior = 0, atual = 0;
  for (const c of [...concursos].reverse()) {
    if (c.dezenas.includes(dezena)) { atual++; maior = Math.max(maior, atual); }
    else atual = 0;
  }
  return maior;
}

function calcularMaiorAtraso(dezena: number, concursos: Concurso[]): number {
  let maior = 0, atual = 0;
  for (const c of [...concursos].reverse()) {
    if (c.dezenas.includes(dezena)) { maior = Math.max(maior, atual); atual = 0; }
    else atual++;
  }
  return Math.max(maior, atual);
}

function calcularFrequencia(dezena: number, concursos: Concurso[]): number {
  if (concursos.length === 0) return 0;
  const aparicoes = concursos.filter((c) => c.dezenas.includes(dezena)).length;
  return Math.round((aparicoes / concursos.length) * 100);
}

function calcularMelhorDupla(dezena: number, concursos: Concurso[]): { dupla: number; correlacao: number } {
  const aparicoesDezena = concursos.filter((c) => c.dezenas.includes(dezena)).length;
  if (aparicoesDezena === 0) return { dupla: 0, correlacao: 0 };

  let melhorDupla = 0, maiorCorrelacao = 0;
  for (let outra = 1; outra <= TOTAL_DEZENAS; outra++) {
    if (outra === dezena) continue;
    const juntas = concursos.filter((c) => c.dezenas.includes(dezena) && c.dezenas.includes(outra)).length;
    const correlacao = Math.round((juntas / aparicoesDezena) * 100);
    if (correlacao > maiorCorrelacao) { maiorCorrelacao = correlacao; melhorDupla = outra; }
  }
  return { dupla: melhorDupla, correlacao: maiorCorrelacao };
}

function calcularMelhorTrio(dezena: number, concursos: Concurso[]): { trio: [number, number]; correlacao: number } {
  const aparicoesDezena = concursos.filter((c) => c.dezenas.includes(dezena)).length;
  if (aparicoesDezena === 0) return { trio: [0, 0], correlacao: 0 };

  let melhorTrio: [number, number] = [0, 0], maiorCorrelacao = 0;
  for (let d1 = 1; d1 <= TOTAL_DEZENAS; d1++) {
    if (d1 === dezena) continue;
    for (let d2 = d1 + 1; d2 <= TOTAL_DEZENAS; d2++) {
      if (d2 === dezena) continue;
      const juntas = concursos.filter((c) =>
        c.dezenas.includes(dezena) && c.dezenas.includes(d1) && c.dezenas.includes(d2)
      ).length;
      const correlacao = Math.round((juntas / aparicoesDezena) * 100);
      if (correlacao > maiorCorrelacao) { maiorCorrelacao = correlacao; melhorTrio = [d1, d2]; }
    }
  }
  return { trio: melhorTrio, correlacao: maiorCorrelacao };
}

/**
 * Quina sorteia 5 de 80 → frequência esperada ~6.25%
 * Thresholds: quente >= 10%, frio <= 3%
 */
function determinarStatus(frequencia: number): "quente" | "frio" | "normal" {
  if (frequencia >= 10) return "quente";
  if (frequencia <= 3) return "frio";
  return "normal";
}

export function useFrequenciaQuina(periodo: number) {
  return useQuery({
    queryKey: ["frequencia-quina", periodo],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("resultados_loterias")
        .select("concurso_id:concurso, dezenas")
        .eq("loteria", "quina")
        .order("concurso", { ascending: false })
        .limit(periodo);

      if (error) throw error;

      const concursos: Concurso[] = (data || []).map((r: any) => ({
        concurso_id: r.concurso_id,
        dezenas: r.dezenas as number[],
      }));

      const estatisticas: DezenaEstatistica[] = [];

      for (let dezena = 1; dezena <= TOTAL_DEZENAS; dezena++) {
        const frequencia = calcularFrequencia(dezena, concursos);
        const { dupla, correlacao } = calcularMelhorDupla(dezena, concursos);
        const { trio, correlacao: correlacaoTrio } = calcularMelhorTrio(dezena, concursos);

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
