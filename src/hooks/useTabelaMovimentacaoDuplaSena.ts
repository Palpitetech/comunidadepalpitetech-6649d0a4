import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface LinhaColuna {
  indice: number;
  ocorrencias: number;
  frequencia: number;
  atraso: number;
  maiorAtraso: number;
}

interface TabelaMovimentacaoResult {
  sorteio1: {
    linhas: LinhaColuna[];
    colunas: LinhaColuna[];
  };
  sorteio2: {
    linhas: LinhaColuna[];
    colunas: LinhaColuna[];
  };
}

export function useTabelaMovimentacaoDuplaSena() {
  return useQuery({
    queryKey: ["tabela-movimentacao-duplasena"],
    queryFn: async (): Promise<TabelaMovimentacaoResult> => {
      const { data: resultados, error } = await supabase
        .from("resultados_duplasena")
        .select("dezenas_sorteio1, dezenas_sorteio2, concurso_id")
        .order("concurso_id", { ascending: false })
        .limit(1000);

      if (error) throw error;
      if (!resultados || resultados.length === 0) {
        return {
          sorteio1: { linhas: [], colunas: [] },
          sorteio2: { linhas: [], colunas: [] }
        };
      }

      const totalConcursos = resultados.length;

      // Inicializar contadores para linhas (1-5) e colunas (1-10) para ambos sorteios
      const contagemLinhasS1: Record<number, { ocorrencias: number; ultimoAtraso: number; maiorAtraso: number }> = {};
      const contagemColunasS1: Record<number, { ocorrencias: number; ultimoAtraso: number; maiorAtraso: number }> = {};
      const contagemLinhasS2: Record<number, { ocorrencias: number; ultimoAtraso: number; maiorAtraso: number }> = {};
      const contagemColunasS2: Record<number, { ocorrencias: number; ultimoAtraso: number; maiorAtraso: number }> = {};

      for (let i = 1; i <= 5; i++) {
        contagemLinhasS1[i] = { ocorrencias: 0, ultimoAtraso: 0, maiorAtraso: 0 };
        contagemLinhasS2[i] = { ocorrencias: 0, ultimoAtraso: 0, maiorAtraso: 0 };
      }
      for (let i = 1; i <= 10; i++) {
        contagemColunasS1[i] = { ocorrencias: 0, ultimoAtraso: 0, maiorAtraso: 0 };
        contagemColunasS2[i] = { ocorrencias: 0, ultimoAtraso: 0, maiorAtraso: 0 };
      }

      // Processar cada sorteio
      resultados.forEach((resultado, index) => {
        // Sorteio 1
        const dezenas1 = resultado.dezenas_sorteio1;
        dezenas1.forEach((dezena: number) => {
          const linha = Math.ceil(dezena / 10);
          const coluna = dezena % 10 === 0 ? 10 : dezena % 10;

          contagemLinhasS1[linha].ocorrencias++;
          contagemLinhasS1[linha].ultimoAtraso = 0;
          contagemColunasS1[coluna].ocorrencias++;
          contagemColunasS1[coluna].ultimoAtraso = 0;
        });

        // Sorteio 2
        const dezenas2 = resultado.dezenas_sorteio2;
        dezenas2.forEach((dezena: number) => {
          const linha = Math.ceil(dezena / 10);
          const coluna = dezena % 10 === 0 ? 10 : dezena % 10;

          contagemLinhasS2[linha].ocorrencias++;
          contagemLinhasS2[linha].ultimoAtraso = 0;
          contagemColunasS2[coluna].ocorrencias++;
          contagemColunasS2[coluna].ultimoAtraso = 0;
        });

        // Incrementar atraso para itens que não apareceram
        for (let linha = 1; linha <= 5; linha++) {
          if (!dezenas1.some((d: number) => Math.ceil(d / 10) === linha)) {
            contagemLinhasS1[linha].ultimoAtraso++;
            contagemLinhasS1[linha].maiorAtraso = Math.max(
              contagemLinhasS1[linha].maiorAtraso,
              contagemLinhasS1[linha].ultimoAtraso
            );
          }

          if (!dezenas2.some((d: number) => Math.ceil(d / 10) === linha)) {
            contagemLinhasS2[linha].ultimoAtraso++;
            contagemLinhasS2[linha].maiorAtraso = Math.max(
              contagemLinhasS2[linha].maiorAtraso,
              contagemLinhasS2[linha].ultimoAtraso
            );
          }
        }

        for (let coluna = 1; coluna <= 10; coluna++) {
          if (!dezenas1.some((d: number) => (d % 10 === 0 ? 10 : d % 10) === coluna)) {
            contagemColunasS1[coluna].ultimoAtraso++;
            contagemColunasS1[coluna].maiorAtraso = Math.max(
              contagemColunasS1[coluna].maiorAtraso,
              contagemColunasS1[coluna].ultimoAtraso
            );
          }

          if (!dezenas2.some((d: number) => (d % 10 === 0 ? 10 : d % 10) === coluna)) {
            contagemColunasS2[coluna].ultimoAtraso++;
            contagemColunasS2[coluna].maiorAtraso = Math.max(
              contagemColunasS2[coluna].maiorAtraso,
              contagemColunasS2[coluna].ultimoAtraso
            );
          }
        }
      });

      // Converter para arrays de LinhaColuna
      const converterParaArray = (
        contagem: Record<number, { ocorrencias: number; ultimoAtraso: number; maiorAtraso: number }>,
        total: number
      ): LinhaColuna[] => {
        return Object.entries(contagem).map(([indice, dados]) => ({
          indice: parseInt(indice),
          ocorrencias: dados.ocorrencias,
          frequencia: Math.round((dados.ocorrencias / total) * 100),
          atraso: dados.ultimoAtraso,
          maiorAtraso: dados.maiorAtraso
        }));
      };

      return {
        sorteio1: {
          linhas: converterParaArray(contagemLinhasS1, totalConcursos),
          colunas: converterParaArray(contagemColunasS1, totalConcursos)
        },
        sorteio2: {
          linhas: converterParaArray(contagemLinhasS2, totalConcursos),
          colunas: converterParaArray(contagemColunasS2, totalConcursos)
        }
      };
    }
  });
}
