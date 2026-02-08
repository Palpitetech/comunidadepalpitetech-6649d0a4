import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  isPar, 
  isMoldura, 
  MOLDURA_LOTOFACIL 
} from "@/lib/lotofacil";

interface Concurso {
  concurso_id: number;
  dezenas: number[];
  qtd_pares: number | null;
  qtd_moldura: number | null;
  qtd_repetidas: number | null;
}

interface DezenaAnalise {
  dezena: number;
  frequencia: number;
  atrasoAtual: number;
  status: "quente" | "frio" | "normal";
}

interface CombinacaoMoldura {
  qtdMoldura: number;
  qtdMiolo: number;
  ocorrencias: number;
  porcentagem: number;
}

interface MelhorDupla {
  dezenas: [number, number];
  ocorrencias: number;
  porcentagem: number;
}

export interface TendenciaDia {
  // Dezenas sugeridas
  fixas: DezenaAnalise[];
  excluidas: DezenaAnalise[];
  
  // Filtros sugeridos
  sugestaoPares: number;
  sugestaoRepetidas: number;
  sugestaoMoldura: number;
  
  // Rankings
  melhoresMolduras: CombinacaoMoldura[];
  melhoresDuplas: MelhorDupla[];
  
  // Contexto
  ultimoConcurso: number;
  dezanasUltimoConcurso: number[];
}

export function useTendenciasDia(periodo: number) {
  return useQuery({
    queryKey: ["tendencias-dia", periodo],
    queryFn: async (): Promise<TendenciaDia> => {
      const { data, error } = await supabase
        .from("resultados")
        .select("concurso_id, dezenas, qtd_pares, qtd_moldura, qtd_repetidas")
        .order("concurso_id", { ascending: false })
        .limit(periodo);

      if (error) throw error;
      
      const concursos: Concurso[] = (data || []).map((r) => ({
        concurso_id: r.concurso_id,
        dezenas: r.dezenas as number[],
        qtd_pares: r.qtd_pares,
        qtd_moldura: r.qtd_moldura,
        qtd_repetidas: r.qtd_repetidas,
      }));

      const ultimoConcurso = concursos[0]?.concurso_id ?? 0;
      const dezanasUltimoConcurso = concursos[0]?.dezenas ?? [];

      // Calcular frequência de cada dezena
      const frequenciaPorDezena = new Map<number, { aparicoes: number; ultimaVez: number }>();
      
      for (let d = 1; d <= 25; d++) {
        frequenciaPorDezena.set(d, { aparicoes: 0, ultimaVez: 0 });
      }

      concursos.forEach((c) => {
        c.dezenas.forEach((d) => {
          const atual = frequenciaPorDezena.get(d)!;
          atual.aparicoes++;
          if (atual.ultimaVez === 0) {
            atual.ultimaVez = c.concurso_id;
          }
        });
      });

      // Análise de dezenas
      const dezenasAnalise: DezenaAnalise[] = [];
      
      for (let d = 1; d <= 25; d++) {
        const stats = frequenciaPorDezena.get(d)!;
        const frequencia = Math.round((stats.aparicoes / concursos.length) * 100);
        const atrasoAtual = ultimoConcurso - stats.ultimaVez;
        
        let status: "quente" | "frio" | "normal" = "normal";
        if (frequencia >= 71) status = "quente";
        else if (frequencia <= 39) status = "frio";
        
        dezenasAnalise.push({ dezena: d, frequencia, atrasoAtual, status });
      }

      // Fixas: dezenas quentes (alta frequência)
      const fixas = dezenasAnalise
        .filter(d => d.status === "quente")
        .sort((a, b) => b.frequencia - a.frequencia)
        .slice(0, 5);

      // Excluídas: dezenas frias (baixa frequência)
      const excluidas = dezenasAnalise
        .filter(d => d.status === "frio")
        .sort((a, b) => a.frequencia - b.frequencia)
        .slice(0, 5);

      // Calcular média de pares, moldura, repetidas
      const mediaPares = concursos.reduce((acc, c) => acc + (c.qtd_pares ?? 0), 0) / concursos.length;
      const mediaMoldura = concursos.reduce((acc, c) => acc + (c.qtd_moldura ?? 0), 0) / concursos.length;
      const mediaRepetidas = concursos.reduce((acc, c) => acc + (c.qtd_repetidas ?? 0), 0) / concursos.length;

      // Melhores combinações de moldura
      const molduraCount = new Map<number, number>();
      concursos.forEach((c) => {
        const qtd = c.qtd_moldura ?? 0;
        molduraCount.set(qtd, (molduraCount.get(qtd) ?? 0) + 1);
      });

      const melhoresMolduras: CombinacaoMoldura[] = Array.from(molduraCount.entries())
        .map(([qtdMoldura, ocorrencias]) => ({
          qtdMoldura,
          qtdMiolo: 15 - qtdMoldura,
          ocorrencias,
          porcentagem: (ocorrencias / concursos.length) * 100,
        }))
        .sort((a, b) => b.ocorrencias - a.ocorrencias)
        .slice(0, 3);

      // Melhores duplas (pares de dezenas que mais saem juntas)
      const duplasCount = new Map<string, number>();
      
      concursos.forEach((c) => {
        const dezenas = c.dezenas.sort((a, b) => a - b);
        for (let i = 0; i < dezenas.length; i++) {
          for (let j = i + 1; j < dezenas.length; j++) {
            const key = `${dezenas[i]}-${dezenas[j]}`;
            duplasCount.set(key, (duplasCount.get(key) ?? 0) + 1);
          }
        }
      });

      const melhoresDuplas: MelhorDupla[] = Array.from(duplasCount.entries())
        .map(([key, ocorrencias]) => {
          const [d1, d2] = key.split("-").map(Number);
          return {
            dezenas: [d1, d2] as [number, number],
            ocorrencias,
            porcentagem: (ocorrencias / concursos.length) * 100,
          };
        })
        .sort((a, b) => b.ocorrencias - a.ocorrencias)
        .slice(0, 3);

      return {
        fixas,
        excluidas,
        sugestaoPares: Math.round(mediaPares),
        sugestaoRepetidas: Math.round(mediaRepetidas),
        sugestaoMoldura: Math.round(mediaMoldura),
        melhoresMolduras,
        melhoresDuplas,
        ultimoConcurso,
        dezanasUltimoConcurso,
      };
    },
  });
}
