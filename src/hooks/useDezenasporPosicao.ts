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

export function useDezenasporPosicao(periodo: number = 100) {
  return useQuery({
    queryKey: ["dezenas-posicao", periodo],
    queryFn: async (): Promise<PosicaoData[]> => {
      const { data: resultados, error } = await supabase
        .from("resultados_loterias")
        .select("dezenas")
        .eq("loteria", "lotofacil")
        .order("concurso", { ascending: false })
        .limit(periodo);

      if (error) throw error;
      if (!resultados || resultados.length === 0) return [];

      const totalConcursos = resultados.length;

      // Inicializar contagem para cada posição (1-15) e cada dezena (1-25)
      const contagemPorPosicao: Record<number, Record<number, number>> = {};
      for (let pos = 1; pos <= 15; pos++) {
        contagemPorPosicao[pos] = {};
        for (let dez = 1; dez <= 25; dez++) {
          contagemPorPosicao[pos][dez] = 0;
        }
      }

      // Contar dezenas em cada posição
      resultados.forEach((resultado) => {
        const dezenas = [...resultado.dezenas].sort((a, b) => a - b);
        dezenas.forEach((dezena, index) => {
          const posicao = index + 1;
          contagemPorPosicao[posicao][dezena]++;
        });
      });

      // Calcular top 3 para cada posição
      const dadosPosicoes: PosicaoData[] = [];
      
      for (let pos = 1; pos <= 15; pos++) {
        const dezenas = Object.entries(contagemPorPosicao[pos])
          .map(([dez, qtd]) => ({
            dezena: parseInt(dez),
            quantidade: qtd,
            frequencia: Math.round((qtd / totalConcursos) * 100),
          }))
          .sort((a, b) => b.quantidade - a.quantidade)
          .slice(0, 3);

        dadosPosicoes.push({
          posicao: pos,
          top3: dezenas,
        });
      }

      return dadosPosicoes;
    },
  });
}
