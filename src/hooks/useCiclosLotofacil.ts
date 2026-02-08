import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ResultadoCiclo {
  concurso_id: number;
  data_sorteio: string;
  dezenas: number[];
  ciclo_numero: number | null;
  dezenas_faltantes_ciclo: number[] | null;
  qtd_impares: number | null;
  qtd_primos: number | null;
  qtd_moldura: number | null;
  qtd_repetidas: number | null;
}

interface CicloInfo {
  numero: number;
  concursos: ResultadoCiclo[];
  concursoInicio: number;
  concursoFim: number;
  duracao: number;
  ultimaDezena: number | null;
}

interface EstatisticasCiclo {
  mediaConcursos: number;
  cicloMaisRapido: CicloInfo | null;
  cicloMaisLento: CicloInfo | null;
  ultimasDezenas: { dezena: number; vezes: number }[];
}

export function useCiclosLotofacil(limiteCiclos = 10) {
  return useQuery({
    queryKey: ["ciclos-lotofacil", limiteCiclos],
    queryFn: async () => {
      // Buscar resultados ordenados por concurso (mais recente primeiro)
      const { data, error } = await supabase
        .from("resultados")
        .select("concurso_id, data_sorteio, dezenas, ciclo_numero, dezenas_faltantes_ciclo, qtd_impares, qtd_primos, qtd_moldura, qtd_repetidas")
        .order("concurso_id", { ascending: false })
        .limit(500);

      if (error) throw error;
      if (!data || data.length === 0) return { ciclos: [], estatisticas: null };

      // Agrupar por ciclo
      const ciclosMap = new Map<number, ResultadoCiclo[]>();
      
      for (const resultado of data) {
        if (resultado.ciclo_numero !== null) {
          const cicloNum = resultado.ciclo_numero;
          if (!ciclosMap.has(cicloNum)) {
            ciclosMap.set(cicloNum, []);
          }
          ciclosMap.get(cicloNum)!.push(resultado);
        }
      }

      // Converter para array e ordenar
      const ciclosArray: CicloInfo[] = [];
      
      for (const [numero, concursos] of ciclosMap) {
        // Ordenar concursos do ciclo por ID ascendente
        const concursosOrdenados = [...concursos].sort((a, b) => a.concurso_id - b.concurso_id);
        
        // Encontrar última dezena a sair (dezenas_faltantes_ciclo do penúltimo = [última])
        let ultimaDezena: number | null = null;
        
        // Procurar o concurso anterior ao fechamento do ciclo
        for (let i = concursosOrdenados.length - 2; i >= 0; i--) {
          const faltantes = concursosOrdenados[i].dezenas_faltantes_ciclo;
          if (faltantes && faltantes.length === 1) {
            ultimaDezena = faltantes[0];
            break;
          }
        }
        
        ciclosArray.push({
          numero,
          concursos: concursosOrdenados,
          concursoInicio: concursosOrdenados[0].concurso_id,
          concursoFim: concursosOrdenados[concursosOrdenados.length - 1].concurso_id,
          duracao: concursosOrdenados.length,
          ultimaDezena,
        });
      }

      // Ordenar ciclos por número (mais recente primeiro)
      ciclosArray.sort((a, b) => b.numero - a.numero);

      // Limitar ciclos retornados
      const ciclosLimitados = ciclosArray.slice(0, limiteCiclos);

      // Calcular estatísticas
      const ciclosCompletos = ciclosArray.filter(c => c.duracao >= 2); // Ciclos com dados suficientes
      
      const mediaConcursos = ciclosCompletos.length > 0
        ? ciclosCompletos.reduce((sum, c) => sum + c.duracao, 0) / ciclosCompletos.length
        : 0;

      const cicloMaisRapido = ciclosCompletos.length > 0
        ? ciclosCompletos.reduce((min, c) => c.duracao < min.duracao ? c : min, ciclosCompletos[0])
        : null;

      const cicloMaisLento = ciclosCompletos.length > 0
        ? ciclosCompletos.reduce((max, c) => c.duracao > max.duracao ? c : max, ciclosCompletos[0])
        : null;

      // Contar últimas dezenas
      const contadorUltimas = new Map<number, number>();
      for (const ciclo of ciclosCompletos) {
        if (ciclo.ultimaDezena !== null) {
          contadorUltimas.set(ciclo.ultimaDezena, (contadorUltimas.get(ciclo.ultimaDezena) || 0) + 1);
        }
      }
      
      const ultimasDezenas = Array.from(contadorUltimas.entries())
        .map(([dezena, vezes]) => ({ dezena, vezes }))
        .sort((a, b) => b.vezes - a.vezes)
        .slice(0, 5);

      const estatisticas: EstatisticasCiclo = {
        mediaConcursos,
        cicloMaisRapido,
        cicloMaisLento,
        ultimasDezenas,
      };

      return { ciclos: ciclosLimitados, estatisticas };
    },
  });
}
