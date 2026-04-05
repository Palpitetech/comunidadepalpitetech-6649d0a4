import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TOTAL_DEZENAS_VOLANTE } from "@/lib/duplasena";

interface DezenaFrequencia {
  dezena: number;
  quantidade: number;
  frequencia: number;
}

interface PosicaoData {
  posicao: number;
  top5: DezenaFrequencia[];
}

interface DezenasporPosicaoResult {
  sorteio1: PosicaoData[];
  sorteio2: PosicaoData[];
}

export function useDezenasporPosicaoDuplaSena(periodo: number = 100) {
  return useQuery({
    queryKey: ["dezenas-posicao-duplasena", periodo],
    queryFn: async (): Promise<DezenasporPosicaoResult> => {
      const { data: rawResultados, error } = await (supabase as any)
        .from("resultados_loterias")
        .select("dezenas, dezenas_sorteio2")
        .eq("loteria", "duplasena")
        .order("concurso", { ascending: false })
        .limit(periodo);
      const resultados = (rawResultados || []).map((r: any) => ({ dezenas_sorteio1: r.dezenas, dezenas_sorteio2: r.dezenas_sorteio2 }));

      if (error) throw error;
      if (!resultados || resultados.length === 0) {
        return { sorteio1: [], sorteio2: [] };
      }

      const totalConcursos = resultados.length;

      // Inicializar contagem para cada posição (1-6) e cada dezena (1-50) para ambos os sorteios
      const contagemS1: Record<number, Record<number, number>> = {};
      const contagemS2: Record<number, Record<number, number>> = {};
      
      for (let pos = 1; pos <= 6; pos++) {
        contagemS1[pos] = {};
        contagemS2[pos] = {};
        for (let dez = 1; dez <= TOTAL_DEZENAS_VOLANTE; dez++) {
          contagemS1[pos][dez] = 0;
          contagemS2[pos][dez] = 0;
        }
      }

      // Contar dezenas em cada posição para ambos os sorteios
      resultados.forEach((resultado) => {
        const dezenas1 = [...resultado.dezenas_sorteio1].sort((a, b) => a - b);
        const dezenas2 = [...resultado.dezenas_sorteio2].sort((a, b) => a - b);
        
        dezenas1.forEach((dezena, index) => {
          const posicao = index + 1;
          contagemS1[posicao][dezena]++;
        });
        
        dezenas2.forEach((dezena, index) => {
          const posicao = index + 1;
          contagemS2[posicao][dezena]++;
        });
      });

      // Calcular top 5 para cada posição em cada sorteio
      const calcularTopPorSorteio = (contagem: Record<number, Record<number, number>>): PosicaoData[] => {
        const dadosPosicoes: PosicaoData[] = [];
        
        for (let pos = 1; pos <= 6; pos++) {
          const dezenas = Object.entries(contagem[pos])
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
      };

      return {
        sorteio1: calcularTopPorSorteio(contagemS1),
        sorteio2: calcularTopPorSorteio(contagemS2),
      };
    },
  });
}
