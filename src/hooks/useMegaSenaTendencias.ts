import { useMemo } from "react";
import { useMegaSenaResultados } from "./useMegaSenaResultados";

export interface EstatisticaPadrao {
  valorPrincipal: number;
  valorComplementar?: number;
  ocorrencias: number;
  porcentagem: number;
  atrasoAtual: number;
  ultimaVez: number | null; // concurso_id
}

export function useMegaSenaTendencias(periodo: number = 100) {
  const { data: resultados, isLoading, error } = useMegaSenaResultados(periodo);

  const estatisticas = useMemo(() => {
    if (!resultados || resultados.length === 0) {
      return null;
    }

    const total = resultados.length;
    const ultimoConcurso = resultados[0].concurso_id;

    // Estatísticas de Pares/Ímpares (0-6 pares possíveis em 6 dezenas)
    const paresStats: Record<number, { count: number; ultimaVez: number | null }> = {};
    for (let i = 0; i <= 6; i++) {
      paresStats[i] = { count: 0, ultimaVez: null };
    }

    // Estatísticas de Moldura (0-6 possíveis)
    const molduraStats: Record<number, { count: number; ultimaVez: number | null }> = {};
    for (let i = 0; i <= 6; i++) {
      molduraStats[i] = { count: 0, ultimaVez: null };
    }

    // Estatísticas de Primos (0-6 possíveis)
    const primosStats: Record<number, { count: number; ultimaVez: number | null }> = {};
    for (let i = 0; i <= 6; i++) {
      primosStats[i] = { count: 0, ultimaVez: null };
    }

    // Estatísticas de Repetidas (0-6 possíveis)
    const repetidasStats: Record<number, { count: number; ultimaVez: number | null }> = {};
    for (let i = 0; i <= 6; i++) {
      repetidasStats[i] = { count: 0, ultimaVez: null };
    }

    // Processar resultados
    resultados.forEach((r) => {
      const pares = r.qtd_pares ?? 0;
      const moldura = r.qtd_moldura ?? 0;
      const primos = r.qtd_primos ?? 0;
      const repetidas = r.qtd_repetidas ?? 0;

      paresStats[pares].count++;
      if (!paresStats[pares].ultimaVez) paresStats[pares].ultimaVez = r.concurso_id;

      molduraStats[moldura].count++;
      if (!molduraStats[moldura].ultimaVez) molduraStats[moldura].ultimaVez = r.concurso_id;

      primosStats[primos].count++;
      if (!primosStats[primos].ultimaVez) primosStats[primos].ultimaVez = r.concurso_id;

      repetidasStats[repetidas].count++;
      if (!repetidasStats[repetidas].ultimaVez) repetidasStats[repetidas].ultimaVez = r.concurso_id;
    });

    // Converter para formato de exibição
    const formatStats = (
      stats: Record<number, { count: number; ultimaVez: number | null }>,
      maxVal: number
    ): EstatisticaPadrao[] => {
      return Array.from({ length: maxVal + 1 }, (_, i) => ({
        valorPrincipal: i,
        valorComplementar: maxVal - i,
        ocorrencias: stats[i].count,
        porcentagem: (stats[i].count / total) * 100,
        atrasoAtual: stats[i].ultimaVez
          ? ultimoConcurso - stats[i].ultimaVez
          : total,
        ultimaVez: stats[i].ultimaVez,
      }));
    };

    return {
      pares: formatStats(paresStats, 6),
      moldura: formatStats(molduraStats, 6),
      primos: formatStats(primosStats, 6),
      repetidas: formatStats(repetidasStats, 6),
      totalConcursos: total,
      ultimoConcurso,
    };
  }, [resultados]);

  return {
    estatisticas,
    isLoading,
    error,
  };
}
