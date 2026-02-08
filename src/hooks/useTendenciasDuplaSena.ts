import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  contarPares,
  contarMoldura,
  contarPrimos,
} from "@/lib/duplasena";

interface Concurso {
  concurso_id: number;
  dezenas_sorteio1: number[];
  dezenas_sorteio2: number[];
  data_sorteio: string;
  qtd_pares_s1: number | null;
  qtd_moldura_s1: number | null;
  qtd_repetidas_s1: number | null;
  qtd_primos_s1: number | null;
  qtd_pares_s2: number | null;
  qtd_moldura_s2: number | null;
  qtd_repetidas_s2: number | null;
  qtd_primos_s2: number | null;
}

interface PadraoTop3 {
  valor: number;
  ocorrencias: number;
  porcentagem: number;
}

interface FiltroEstrategia {
  top3: PadraoTop3[];
  ultimoConcurso: number;
}

interface DezenaAnalise {
  dezena: number;
  frequencia: number;
}

interface GrupoPerfeito {
  dezenas: number[];
  ocorrencias: number;
  porcentagem: number;
}

export interface TendenciaDuplaSena {
  // Último resultado (ambos sorteios)
  ultimoConcurso: {
    id: number;
    data: string;
    dezenas_s1: number[];
    dezenas_s2: number[];
    impares_s1: number;
    impares_s2: number;
    repetidas_s1: number;
    repetidas_s2: number;
    moldura_s1: number;
    moldura_s2: number;
    primos_s1: number;
    primos_s2: number;
  };
  
  // Estratégias de filtro por sorteio
  filtros_s1: {
    impares: FiltroEstrategia;
    repetidas: FiltroEstrategia;
    moldura: FiltroEstrategia;
    primos: FiltroEstrategia;
  };
  filtros_s2: {
    impares: FiltroEstrategia;
    repetidas: FiltroEstrategia;
    moldura: FiltroEstrategia;
    primos: FiltroEstrategia;
  };
  
  // Dezenas por sorteio
  fixas_s1: DezenaAnalise[];
  excluidas_s1: DezenaAnalise[];
  fixas_s2: DezenaAnalise[];
  excluidas_s2: DezenaAnalise[];
  
  // Grupos perfeitos por sorteio
  grupos_s1: {
    dupla: GrupoPerfeito | null;
    trio: GrupoPerfeito | null;
    quadra: GrupoPerfeito | null;
    quina: GrupoPerfeito | null;
    sena: GrupoPerfeito | null;
  };
  grupos_s2: {
    dupla: GrupoPerfeito | null;
    trio: GrupoPerfeito | null;
    quadra: GrupoPerfeito | null;
    quina: GrupoPerfeito | null;
    sena: GrupoPerfeito | null;
  };
}

function calcularTop3Padrao(
  valores: number[]
): PadraoTop3[] {
  const contagem = new Map<number, number>();
  
  valores.forEach((v) => {
    contagem.set(v, (contagem.get(v) ?? 0) + 1);
  });
  
  return Array.from(contagem.entries())
    .map(([valor, ocorrencias]) => ({
      valor,
      ocorrencias,
      porcentagem: (ocorrencias / valores.length) * 100,
    }))
    .sort((a, b) => b.ocorrencias - a.ocorrencias)
    .slice(0, 3);
}

function calcularGrupos(
  concursos: Concurso[],
  dezenas: "dezenas_sorteio1" | "dezenas_sorteio2",
  tamanho: number
): GrupoPerfeito | null {
  const contagem = new Map<string, { dezenas: number[]; count: number }>();
  
  concursos.forEach((c) => {
    const dezenasArr = c[dezenas];
    const dezenas_sorted = [...dezenasArr].sort((a, b) => a - b);
    
    // Gerar todas as combinações do tamanho especificado
    const combinar = (arr: number[], tam: number, inicio = 0, atual: number[] = []): number[][] => {
      if (atual.length === tam) return [atual];
      const resultado: number[][] = [];
      for (let i = inicio; i <= arr.length - (tam - atual.length); i++) {
        resultado.push(...combinar(arr, tam, i + 1, [...atual, arr[i]]));
      }
      return resultado;
    };
    
    const combinacoes = combinar(dezenas_sorted, tamanho);
    combinacoes.forEach((combo) => {
      const key = combo.join("-");
      const existing = contagem.get(key);
      if (existing) {
        existing.count++;
      } else {
        contagem.set(key, { dezenas: combo, count: 1 });
      }
    });
  });
  
  const melhor = Array.from(contagem.values())
    .sort((a, b) => b.count - a.count)[0];
  
  if (!melhor) return null;
  
  return {
    dezenas: melhor.dezenas,
    ocorrencias: melhor.count,
    porcentagem: (melhor.count / concursos.length) * 100,
  };
}

export function useTendenciasDuplaSena(periodo: number) {
  return useQuery({
    queryKey: ["tendencias-duplasena", periodo],
    queryFn: async (): Promise<TendenciaDuplaSena> => {
      // Buscar período + 1 para calcular repetidas
      const { data, error } = await supabase
        .from("resultados_duplasena")
        .select("concurso_id, dezenas_sorteio1, dezenas_sorteio2, data_sorteio, qtd_pares_s1, qtd_moldura_s1, qtd_repetidas_s1, qtd_primos_s1, qtd_pares_s2, qtd_moldura_s2, qtd_repetidas_s2, qtd_primos_s2")
        .order("concurso_id", { ascending: false })
        .limit(periodo + 1);

      if (error) throw error;

      const raw: Concurso[] = (data || []).map((r) => ({
        concurso_id: r.concurso_id,
        dezenas_sorteio1: r.dezenas_sorteio1 as number[],
        dezenas_sorteio2: r.dezenas_sorteio2 as number[],
        data_sorteio: r.data_sorteio,
        qtd_pares_s1: r.qtd_pares_s1,
        qtd_moldura_s1: r.qtd_moldura_s1,
        qtd_repetidas_s1: r.qtd_repetidas_s1,
        qtd_primos_s1: r.qtd_primos_s1,
        qtd_pares_s2: r.qtd_pares_s2,
        qtd_moldura_s2: r.qtd_moldura_s2,
        qtd_repetidas_s2: r.qtd_repetidas_s2,
        qtd_primos_s2: r.qtd_primos_s2,
      }));

      const concursos = raw.slice(0, periodo);
      const ultimo = concursos[0];
      const penultimo = concursos[1];

      // Calcular repetidas
      const repetidasUltimo_s1 = penultimo
        ? ultimo.dezenas_sorteio1.filter((d) => penultimo.dezenas_sorteio1.includes(d)).length
        : ultimo.qtd_repetidas_s1 ?? 0;

      const repetidasUltimo_s2 = penultimo
        ? ultimo.dezenas_sorteio2.filter((d) => penultimo.dezenas_sorteio2.includes(d)).length
        : ultimo.qtd_repetidas_s2 ?? 0;

      // Último resultado
      const ultimoConcurso = {
        id: ultimo.concurso_id,
        data: ultimo.data_sorteio,
        dezenas_s1: ultimo.dezenas_sorteio1,
        dezenas_s2: ultimo.dezenas_sorteio2,
        impares_s1: 6 - (ultimo.qtd_pares_s1 ?? contarPares(ultimo.dezenas_sorteio1)),
        impares_s2: 6 - (ultimo.qtd_pares_s2 ?? contarPares(ultimo.dezenas_sorteio2)),
        repetidas_s1: repetidasUltimo_s1,
        repetidas_s2: repetidasUltimo_s2,
        moldura_s1: ultimo.qtd_moldura_s1 ?? contarMoldura(ultimo.dezenas_sorteio1),
        moldura_s2: ultimo.qtd_moldura_s2 ?? contarMoldura(ultimo.dezenas_sorteio2),
        primos_s1: ultimo.qtd_primos_s1 ?? contarPrimos(ultimo.dezenas_sorteio1),
        primos_s2: ultimo.qtd_primos_s2 ?? contarPrimos(ultimo.dezenas_sorteio2),
      };

      // Estratégias de filtro - Sorteio 1
      const valores_impares_s1 = concursos.map((c) => 6 - (c.qtd_pares_s1 ?? 0));
      const valores_repetidas_s1 = concursos.map((c) => c.qtd_repetidas_s1 ?? 0);
      const valores_moldura_s1 = concursos.map((c) => c.qtd_moldura_s1 ?? 0);
      const valores_primos_s1 = concursos.map((c) => c.qtd_primos_s1 ?? 0);

      const filtros_s1 = {
        impares: {
          top3: calcularTop3Padrao(valores_impares_s1),
          ultimoConcurso: ultimoConcurso.impares_s1,
        },
        repetidas: {
          top3: calcularTop3Padrao(valores_repetidas_s1),
          ultimoConcurso: ultimoConcurso.repetidas_s1,
        },
        moldura: {
          top3: calcularTop3Padrao(valores_moldura_s1),
          ultimoConcurso: ultimoConcurso.moldura_s1,
        },
        primos: {
          top3: calcularTop3Padrao(valores_primos_s1),
          ultimoConcurso: ultimoConcurso.primos_s1,
        },
      };

      // Estratégias de filtro - Sorteio 2
      const valores_impares_s2 = concursos.map((c) => 6 - (c.qtd_pares_s2 ?? 0));
      const valores_repetidas_s2 = concursos.map((c) => c.qtd_repetidas_s2 ?? 0);
      const valores_moldura_s2 = concursos.map((c) => c.qtd_moldura_s2 ?? 0);
      const valores_primos_s2 = concursos.map((c) => c.qtd_primos_s2 ?? 0);

      const filtros_s2 = {
        impares: {
          top3: calcularTop3Padrao(valores_impares_s2),
          ultimoConcurso: ultimoConcurso.impares_s2,
        },
        repetidas: {
          top3: calcularTop3Padrao(valores_repetidas_s2),
          ultimoConcurso: ultimoConcurso.repetidas_s2,
        },
        moldura: {
          top3: calcularTop3Padrao(valores_moldura_s2),
          ultimoConcurso: ultimoConcurso.moldura_s2,
        },
        primos: {
          top3: calcularTop3Padrao(valores_primos_s2),
          ultimoConcurso: ultimoConcurso.primos_s2,
        },
      };

      // Frequência de dezenas - Sorteio 1
      const frequenciaPorDezena_s1 = new Map<number, number>();
      for (let d = 1; d <= 50; d++) {
        frequenciaPorDezena_s1.set(d, 0);
      }

      concursos.forEach((c) => {
        c.dezenas_sorteio1.forEach((d) => {
          frequenciaPorDezena_s1.set(d, (frequenciaPorDezena_s1.get(d) ?? 0) + 1);
        });
      });

      const dezenasAnalise_s1: DezenaAnalise[] = [];
      for (let d = 1; d <= 50; d++) {
        const count = frequenciaPorDezena_s1.get(d) ?? 0;
        const frequencia = Math.round((count / concursos.length) * 100);
        dezenasAnalise_s1.push({ dezena: d, frequencia });
      }

      // Frequência de dezenas - Sorteio 2
      const frequenciaPorDezena_s2 = new Map<number, number>();
      for (let d = 1; d <= 50; d++) {
        frequenciaPorDezena_s2.set(d, 0);
      }

      concursos.forEach((c) => {
        c.dezenas_sorteio2.forEach((d) => {
          frequenciaPorDezena_s2.set(d, (frequenciaPorDezena_s2.get(d) ?? 0) + 1);
        });
      });

      const dezenasAnalise_s2: DezenaAnalise[] = [];
      for (let d = 1; d <= 50; d++) {
        const count = frequenciaPorDezena_s2.get(d) ?? 0;
        const frequencia = Math.round((count / concursos.length) * 100);
        dezenasAnalise_s2.push({ dezena: d, frequencia });
      }

      // Fixas e excluídas - Sorteio 1
      const fixas_s1 = dezenasAnalise_s1
        .filter((d) => d.frequencia >= 15)
        .sort((a, b) => b.frequencia - a.frequencia);

      const excluidas_s1 = dezenasAnalise_s1
        .filter((d) => d.frequencia <= 5)
        .sort((a, b) => a.frequencia - b.frequencia);

      // Fixas e excluídas - Sorteio 2
      const fixas_s2 = dezenasAnalise_s2
        .filter((d) => d.frequencia >= 15)
        .sort((a, b) => b.frequencia - a.frequencia);

      const excluidas_s2 = dezenasAnalise_s2
        .filter((d) => d.frequencia <= 5)
        .sort((a, b) => a.frequencia - b.frequencia);

      // Grupos perfeitos - Sorteio 1
      const grupos_s1 = {
        dupla: calcularGrupos(concursos, "dezenas_sorteio1", 2),
        trio: calcularGrupos(concursos, "dezenas_sorteio1", 3),
        quadra: calcularGrupos(concursos, "dezenas_sorteio1", 4),
        quina: calcularGrupos(concursos, "dezenas_sorteio1", 5),
        sena: calcularGrupos(concursos, "dezenas_sorteio1", 6),
      };

      // Grupos perfeitos - Sorteio 2
      const grupos_s2 = {
        dupla: calcularGrupos(concursos, "dezenas_sorteio2", 2),
        trio: calcularGrupos(concursos, "dezenas_sorteio2", 3),
        quadra: calcularGrupos(concursos, "dezenas_sorteio2", 4),
        quina: calcularGrupos(concursos, "dezenas_sorteio2", 5),
        sena: calcularGrupos(concursos, "dezenas_sorteio2", 6),
      };

      return {
        ultimoConcurso,
        filtros_s1,
        filtros_s2,
        fixas_s1,
        excluidas_s1,
        fixas_s2,
        excluidas_s2,
        grupos_s1,
        grupos_s2,
      };
    },
  });
}
