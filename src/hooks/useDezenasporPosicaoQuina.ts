import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface DezenaFrequencia {
  dezena: number;
  quantidade: number;
  frequencia: number;
}

interface PosicaoData {
  posicao: number;
  top3: DezenaFrequencia[];
}

export function useDezenasporPosicaoQuina(periodo: number = 100) {
  return useQuery({
    queryKey: ["dezenas-posicao-quina", periodo],
    queryFn: async (): Promise<PosicaoData[]> => {
      const { data: resultados, error } = await (supabase as any)
        .from("resultados_loterias")
        .select("dezenas")
        .eq("loteria", "quina")
        .order("concurso", { ascending: false })
        .limit(periodo);

      if (error) throw error;
      if (!resultados || resultados.length === 0) return [];

      const totalConcursos = resultados.length;

      // 5 posições, 80 dezenas
      const contagemPorPosicao: Record<number, Record<number, number>> = {};
      for (let pos = 1; pos <= 5; pos++) {
        contagemPorPosicao[pos] = {};
        for (let dez = 1; dez <= 80; dez++) {
          contagemPorPosicao[pos][dez] = 0;
        }
      }

      resultados.forEach((resultado: any) => {
        const dezenas = [...resultado.dezenas].sort((a: number, b: number) => a - b);
        dezenas.forEach((dezena: number, index: number) => {
          const posicao = index + 1;
          if (posicao <= 5) {
            contagemPorPosicao[posicao][dezena]++;
          }
        });
      });

      const dadosPosicoes: PosicaoData[] = [];

      for (let pos = 1; pos <= 5; pos++) {
        const dezenas = Object.entries(contagemPorPosicao[pos])
          .map(([dez, qtd]) => ({
            dezena: parseInt(dez),
            quantidade: qtd,
            frequencia: Math.round((qtd / totalConcursos) * 100),
          }))
          .sort((a, b) => b.quantidade - a.quantidade)
          .slice(0, 3);

        dadosPosicoes.push({ posicao: pos, top3: dezenas });
      }

      return dadosPosicoes;
    },
  });
}
