import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  TOTAL_DEZENAS_VOLANTE,
  contarPares,
  contarMoldura,
  contarPrimos,
  contarMultiplosDe3,
} from "@/lib/quina";

interface Concurso {
  concurso_id: number;
  dezenas: number[];
  data_sorteio: string;
  qtd_pares: number | null;
  qtd_moldura: number | null;
  qtd_repetidas: number | null;
  qtd_primos: number | null;
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

export interface TendenciaDiaQuina {
  ultimoConcurso: {
    id: number;
    data: string;
    dezenas: number[];
    impares: number;
    repetidas: number;
    moldura: number;
    primos: number;
    m3: number;
  };
  filtros: {
    impares: FiltroEstrategia;
    repetidas: FiltroEstrategia;
    moldura: FiltroEstrategia;
    primos: FiltroEstrategia;
    m3: FiltroEstrategia;
  };
  fixas: DezenaAnalise[];
  excluidas: DezenaAnalise[];
  grupos: {
    par: GrupoPerfeito | null;
    trio: GrupoPerfeito | null;
    quadra: GrupoPerfeito | null;
    quina: GrupoPerfeito | null;
  };
}

function calcularTop3Padrao(
  concursos: Concurso[],
  extrator: (c: Concurso) => number
): PadraoTop3[] {
  const contagem = new Map<number, number>();
  concursos.forEach((c) => {
    const valor = extrator(c);
    contagem.set(valor, (contagem.get(valor) ?? 0) + 1);
  });
  return Array.from(contagem.entries())
    .map(([valor, ocorrencias]) => ({
      valor,
      ocorrencias,
      porcentagem: (ocorrencias / concursos.length) * 100,
    }))
    .sort((a, b) => b.ocorrencias - a.ocorrencias)
    .slice(0, 3);
}

function calcularGrupos(
  concursos: Concurso[],
  tamanho: number
): GrupoPerfeito | null {
  const contagem = new Map<string, { dezenas: number[]; count: number }>();
  concursos.forEach((c) => {
    const dezenas = [...c.dezenas].sort((a, b) => a - b);
    const combinar = (arr: number[], tam: number, inicio = 0, atual: number[] = []): number[][] => {
      if (atual.length === tam) return [atual];
      const resultado: number[][] = [];
      for (let i = inicio; i <= arr.length - (tam - atual.length); i++) {
        resultado.push(...combinar(arr, tam, i + 1, [...atual, arr[i]]));
      }
      return resultado;
    };
    const combinacoes = combinar(dezenas, tamanho);
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

export function useTendenciasDiaQuina(periodo: number) {
  return useQuery({
    queryKey: ["tendencias-dia-quina", periodo],
    queryFn: async (): Promise<TendenciaDiaQuina> => {
      const { data, error } = await (supabase as any)
        .from("resultados_loterias")
        .select("concurso_id:concurso, dezenas, data_sorteio, qtd_pares, qtd_moldura, qtd_repetidas, qtd_primos")
        .eq("loteria", "quina")
        .order("concurso", { ascending: false })
        .limit(periodo + 1);

      if (error) throw error;

      const raw: Concurso[] = (data || []).map((r: any) => ({
        concurso_id: r.concurso_id,
        dezenas: r.dezenas as number[],
        data_sorteio: r.data_sorteio,
        qtd_pares: r.qtd_pares,
        qtd_moldura: r.qtd_moldura,
        qtd_repetidas: r.qtd_repetidas,
        qtd_primos: r.qtd_primos,
      }));

      const concursos = raw.slice(0, periodo);
      const ultimo = concursos[0];
      const penultimo = concursos[1];

      const concursosComM3 = concursos.map((c) => ({
        ...c,
        m3: contarMultiplosDe3(c.dezenas),
      }));

      const repetidasUltimo = penultimo
        ? ultimo.dezenas.filter((d) => penultimo.dezenas.includes(d)).length
        : ultimo.qtd_repetidas ?? 0;

      const ultimoConcurso = {
        id: ultimo.concurso_id,
        data: ultimo.data_sorteio,
        dezenas: ultimo.dezenas,
        impares: 5 - (ultimo.qtd_pares ?? contarPares(ultimo.dezenas)),
        repetidas: repetidasUltimo,
        moldura: ultimo.qtd_moldura ?? contarMoldura(ultimo.dezenas),
        primos: ultimo.qtd_primos ?? contarPrimos(ultimo.dezenas),
        m3: contarMultiplosDe3(ultimo.dezenas),
      };

      const filtros = {
        impares: {
          top3: calcularTop3Padrao(concursos, (c) => 5 - (c.qtd_pares ?? contarPares(c.dezenas))),
          ultimoConcurso: ultimoConcurso.impares,
        },
        repetidas: {
          top3: calcularTop3Padrao(concursos, (c) => c.qtd_repetidas ?? 0),
          ultimoConcurso: ultimoConcurso.repetidas,
        },
        moldura: {
          top3: calcularTop3Padrao(concursos, (c) => c.qtd_moldura ?? contarMoldura(c.dezenas)),
          ultimoConcurso: ultimoConcurso.moldura,
        },
        primos: {
          top3: calcularTop3Padrao(concursos, (c) => c.qtd_primos ?? contarPrimos(c.dezenas)),
          ultimoConcurso: ultimoConcurso.primos,
        },
        m3: {
          top3: calcularTop3Padrao(concursosComM3, (c) => (c as typeof concursosComM3[number]).m3),
          ultimoConcurso: ultimoConcurso.m3,
        },
      };

      // Frequência de dezenas (1-80)
      const frequenciaPorDezena = new Map<number, number>();
      for (let d = 1; d <= TOTAL_DEZENAS_VOLANTE; d++) {
        frequenciaPorDezena.set(d, 0);
      }
      concursos.forEach((c) => {
        c.dezenas.forEach((d) => {
          frequenciaPorDezena.set(d, (frequenciaPorDezena.get(d) ?? 0) + 1);
        });
      });

      const dezenasAnalise: DezenaAnalise[] = [];
      for (let d = 1; d <= TOTAL_DEZENAS_VOLANTE; d++) {
        const count = frequenciaPorDezena.get(d) ?? 0;
        const frequencia = Math.round((count / concursos.length) * 100);
        dezenasAnalise.push({ dezena: d, frequencia });
      }

      const fixas = dezenasAnalise
        .filter((d) => d.frequencia >= 70)
        .sort((a, b) => b.frequencia - a.frequencia);

      const excluidas = dezenasAnalise
        .filter((d) => d.frequencia <= 30)
        .sort((a, b) => a.frequencia - b.frequencia);

      const grupos = {
        par: calcularGrupos(concursos, 2),
        trio: calcularGrupos(concursos, 3),
        quadra: calcularGrupos(concursos, 4),
        quina: calcularGrupos(concursos, 5),
      };

      return {
        ultimoConcurso,
        filtros,
        fixas,
        excluidas,
        grupos,
      };
    },
  });
}
