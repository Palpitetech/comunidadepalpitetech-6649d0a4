import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TOTAL_DEZENAS_VOLANTE } from "@/lib/duplasena";

export interface EstatisticaDezena {
  dezena: number;
  ultimaVez: number;
  maiorSequencia: number;
  maiorAtraso: number;
  frequencia: number;
  melhorDupla: number;
  correlacaoDupla: number;
  melhorTrio?: [number, number];
  correlacaoTrio?: number;
  status: "quente" | "frio" | "normal";
}

export interface FrequenciaDuplaSenaResult {
  s1: EstatisticaDezena[];
  s2: EstatisticaDezena[];
}

interface ResultadoRaw {
  concurso_id: number;
  dezenas_sorteio1: number[];
  dezenas_sorteio2: number[];
}

function calcularEstatisticas(
  resultados: ResultadoRaw[],
  sorteioKey: "dezenas_sorteio1" | "dezenas_sorteio2"
): EstatisticaDezena[] {
  const estatisticas = new Map<number, EstatisticaDezena>();
  
  // Calcular correlações entre duplas
  const correlacaoDuplas = new Map<string, number>();
  const correlacaoTrios = new Map<string, number>();
  
  resultados.forEach((r) => {
    const dezenas = r[sorteioKey];
    // Contar duplas
    for (let i = 0; i < dezenas.length; i++) {
      for (let j = i + 1; j < dezenas.length; j++) {
        const key = [dezenas[i], dezenas[j]].sort((a, b) => a - b).join("-");
        correlacaoDuplas.set(key, (correlacaoDuplas.get(key) || 0) + 1);
      }
    }
    // Contar trios
    for (let i = 0; i < dezenas.length; i++) {
      for (let j = i + 1; j < dezenas.length; j++) {
        for (let k = j + 1; k < dezenas.length; k++) {
          const key = [dezenas[i], dezenas[j], dezenas[k]].sort((a, b) => a - b).join("-");
          correlacaoTrios.set(key, (correlacaoTrios.get(key) || 0) + 1);
        }
      }
    }
  });

  // Inicializar estatísticas base
  for (let d = 1; d <= TOTAL_DEZENAS_VOLANTE; d++) {
    const atrasoAtual = calcularAtraso(resultados, d, sorteioKey);
    estatisticas.set(d, {
      dezena: d,
      ultimaVez: encontrarUltimaVez(resultados, d, sorteioKey),
      maiorSequencia: calcularMaiorSequencia(resultados, d, sorteioKey),
      maiorAtraso: atrasoAtual,
      frequencia: calcularFrequencia(resultados, d, sorteioKey),
      melhorDupla: 0,
      correlacaoDupla: 0,
      melhorTrio: [0, 0],
      correlacaoTrio: 0,
      status: "normal",
    });
  }

  // Calcular melhor dupla e trio para cada dezena
  for (let d = 1; d <= TOTAL_DEZENAS_VOLANTE; d++) {
    const est = estatisticas.get(d)!;
    
    // Melhor dupla
    let melhorDuplaCount = 0;
    let melhorDuplaNum = 0;
    for (let other = 1; other <= TOTAL_DEZENAS_VOLANTE; other++) {
      if (other === d) continue;
      const key = [d, other].sort((a, b) => a - b).join("-");
      const count = correlacaoDuplas.get(key) || 0;
      if (count > melhorDuplaCount) {
        melhorDuplaCount = count;
        melhorDuplaNum = other;
      }
    }
    est.melhorDupla = melhorDuplaNum;
    est.correlacaoDupla = resultados.length > 0 
      ? Math.round((melhorDuplaCount / resultados.length) * 100) 
      : 0;

    // Melhor trio
    let melhorTrioCount = 0;
    let melhorTrioNums: [number, number] = [0, 0];
    for (let o1 = 1; o1 <= TOTAL_DEZENAS_VOLANTE; o1++) {
      if (o1 === d) continue;
      for (let o2 = o1 + 1; o2 <= TOTAL_DEZENAS_VOLANTE; o2++) {
        if (o2 === d) continue;
        const key = [d, o1, o2].sort((a, b) => a - b).join("-");
        const count = correlacaoTrios.get(key) || 0;
        if (count > melhorTrioCount) {
          melhorTrioCount = count;
          melhorTrioNums = [o1, o2];
        }
      }
    }
    est.melhorTrio = melhorTrioNums;
    est.correlacaoTrio = resultados.length > 0 
      ? Math.round((melhorTrioCount / resultados.length) * 100) 
      : 0;
  }

  // Atualizar status (quente >= 15%, frio <= 5%)
  estatisticas.forEach((est) => {
    if (est.frequencia >= 15) est.status = "quente";
    else if (est.frequencia <= 5) est.status = "frio";
  });

  return Array.from(estatisticas.values());
}

function encontrarUltimaVez(
  resultados: ResultadoRaw[],
  dezena: number,
  sorteioKey: "dezenas_sorteio1" | "dezenas_sorteio2"
): number {
  for (let i = 0; i < resultados.length; i++) {
    if (resultados[i][sorteioKey].includes(dezena)) {
      return resultados[i].concurso_id;
    }
  }
  return 0;
}

function calcularAtraso(
  resultados: ResultadoRaw[],
  dezena: number,
  sorteioKey: "dezenas_sorteio1" | "dezenas_sorteio2"
): number {
  if (resultados.length === 0) return 0;
  const ultima = encontrarUltimaVez(resultados, dezena, sorteioKey);
  if (ultima === 0) return resultados[0].concurso_id;
  return resultados[0].concurso_id - ultima;
}

function calcularMaiorSequencia(
  resultados: ResultadoRaw[],
  dezena: number,
  sorteioKey: "dezenas_sorteio1" | "dezenas_sorteio2"
): number {
  let maxSeq = 0;
  let currentSeq = 0;
  
  for (let i = resultados.length - 1; i >= 0; i--) {
    if (resultados[i][sorteioKey].includes(dezena)) {
      currentSeq++;
      maxSeq = Math.max(maxSeq, currentSeq);
    } else {
      currentSeq = 0;
    }
  }
  
  return maxSeq;
}

function calcularFrequencia(
  resultados: ResultadoRaw[],
  dezena: number,
  sorteioKey: "dezenas_sorteio1" | "dezenas_sorteio2"
): number {
  if (resultados.length === 0) return 0;
  const count = resultados.filter((r) => r[sorteioKey].includes(dezena)).length;
  return Math.round((count / resultados.length) * 100);
}

export function useFrequenciaDuplaSena(
  periodo: number = 50
): ReturnType<typeof useQuery<FrequenciaDuplaSenaResult>> {
  return useQuery({
    queryKey: ["frequencia-duplasena", periodo],
    queryFn: async (): Promise<FrequenciaDuplaSenaResult> => {
      const { data: resultados, error } = await supabase
        .from("resultados_duplasena")
        .select("concurso_id, dezenas_sorteio1, dezenas_sorteio2")
        .order("concurso_id", { ascending: false })
        .limit(periodo);

      if (error) throw error;
      if (!resultados || resultados.length === 0) {
        return {
          s1: [],
          s2: [],
        };
      }

      const dados = resultados as ResultadoRaw[];

      return {
        s1: calcularEstatisticas(dados, "dezenas_sorteio1"),
        s2: calcularEstatisticas(dados, "dezenas_sorteio2"),
      };
    },
    staleTime: 5 * 60 * 1000,
  });
}
