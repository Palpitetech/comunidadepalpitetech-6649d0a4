import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface DezenaFrequencia {
  dezena: number;
  quantidade: number;
  frequencia: number;
}

interface PosicaoData {
  posicao: number;
  top5: DezenaFrequencia[];
}

/**
 * Frequência das dezenas por posição (1–6) na Mega-Sena.
 * @param periodo Quantidade de concursos analisados (default 100)
 * @param concursoRef Se informado, limita a análise aos `periodo` concursos com número ≤ concursoRef
 */
export function useDezenasporPosicaoMegaSena(periodo: number = 100, concursoRef?: number) {
  return useQuery({
    queryKey: ["dezenas-posicao-megasena", periodo, concursoRef ?? "latest"],
    queryFn: async (): Promise<PosicaoData[]> => {
      let query = (supabase as any)
        .from("resultados_loterias")
        .select("dezenas")
        .eq("loteria", "megasena")
        .order("concurso", { ascending: false })
        .limit(periodo);

      if (concursoRef) {
        query = query.lte("concurso", concursoRef);
      }

      const { data: resultados, error } = await query;

      if (error) throw error;
      if (!resultados || resultados.length === 0) return [];

      const totalConcursos = resultados.length;

      const contagemPorPosicao: Record<number, Record<number, number>> = {};
      for (let pos = 1; pos <= 6; pos++) {
        contagemPorPosicao[pos] = {};
        for (let dez = 1; dez <= 60; dez++) {
          contagemPorPosicao[pos][dez] = 0;
        }
      }

      resultados.forEach((resultado: any) => {
        const dezenas = [...resultado.dezenas].sort((a, b) => a - b);
        dezenas.forEach((dezena, index) => {
          const posicao = index + 1;
          if (posicao <= 6) {
            contagemPorPosicao[posicao][dezena]++;
          }
        });
      });

      const dadosPosicoes: PosicaoData[] = [];

      for (let pos = 1; pos <= 6; pos++) {
        const dezenas = Object.entries(contagemPorPosicao[pos])
          .map(([dez, qtd]) => ({
            dezena: parseInt(dez),
            quantidade: qtd,
            frequencia: Math.round((qtd / totalConcursos) * 100),
          }))
          .sort((a, b) => b.quantidade - a.quantidade)
          .slice(0, 5);

        dadosPosicoes.push({
          posicao: pos,
          top5: dezenas,
        });
      }

      return dadosPosicoes;
    },
  });
}
