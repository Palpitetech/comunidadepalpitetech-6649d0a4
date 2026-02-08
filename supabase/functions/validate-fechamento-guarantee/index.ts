import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// FC05 Matrix - 350 games (20 numbers, 15 per game, 14-point guarantee)
const FC05_REMOVALS = [
  [15,16,17,18,19],[12,13,17,18,19],[10,11,17,18,19],[8,9,17,18,19],[6,7,17,18,19],
  [4,5,17,18,19],[2,3,17,18,19],[0,1,17,18,19],[13,14,16,18,19],[11,12,16,18,19],
  [9,10,16,18,19],[7,8,16,18,19],[5,6,16,18,19],[3,4,16,18,19],[1,2,16,18,19],
  [0,14,15,18,19],[12,13,15,18,19],[10,11,15,18,19],[8,9,15,18,19],[6,7,15,18,19],
  [4,5,15,18,19],[2,3,15,18,19],[0,1,15,18,19],[13,14,16,17,19],[11,12,16,17,19],
  [9,10,16,17,19],[7,8,16,17,19],[5,6,16,17,19],[3,4,16,17,19],[1,2,16,17,19],
  [0,14,15,17,19],[12,13,15,17,19],[10,11,15,17,19],[8,9,15,17,19],[6,7,15,17,19],
  [4,5,15,17,19],[2,3,15,17,19],[0,1,15,17,19],[13,14,15,16,19],[11,12,15,16,19],
  [9,10,15,16,19],[7,8,15,16,19],[5,6,15,16,19],[3,4,15,16,19],[1,2,15,16,19],
  [0,14,17,18,19],[13,14,16,17,18],[11,12,16,17,18],[9,10,16,17,18],[7,8,16,17,18],
  [5,6,16,17,18],[3,4,16,17,18],[1,2,16,17,18],[0,14,15,17,18],[12,13,15,17,18],
  [10,11,15,17,18],[8,9,15,17,18],[6,7,15,17,18],[4,5,15,17,18],[2,3,15,17,18],
  [0,1,15,17,18],[13,14,15,16,18],[11,12,15,16,18],[9,10,15,16,18],[7,8,15,16,18],
  [5,6,15,16,18],[3,4,15,16,18],[1,2,15,16,18],[0,14,15,16,17],[12,13,15,16,17],
  [10,11,15,16,17],[8,9,15,16,17],[6,7,15,16,17],[4,5,15,16,17],[2,3,15,16,17],
  [0,1,15,16,17],[5,9,13,14,19],[3,7,11,14,19],[1,8,10,14,19],[0,6,12,14,19],
  [4,9,11,13,19],[2,7,10,13,19],[0,5,8,13,19],[6,11,12,14,19],[3,8,9,14,19],
  [1,6,10,14,19],[4,7,12,13,19],[2,5,11,12,19],[0,9,10,12,19],[4,8,10,11,19],
  [3,6,13,14,19],[1,5,9,12,19],[2,8,11,14,19],[0,4,6,9,19],[3,10,12,13,19],
  [1,7,8,13,19],[7,9,12,14,19],[5,10,11,14,19],[2,4,13,14,19],[0,3,11,14,19],
  [6,8,9,13,19],[4,10,12,14,19],[1,3,9,11,19],[0,7,13,14,19],[2,6,8,14,19],
  [5,7,11,13,19],[1,4,11,12,19],[0,2,9,14,19],[6,10,13,14,19],[3,5,8,12,19],
  [8,11,12,13,19],[1,4,6,14,19],[2,10,11,13,19],[0,5,7,9,19],[3,4,7,14,19],
  [7,10,12,13,19],[1,2,6,13,19],[0,8,9,11,19],[4,5,6,11,19],[0,3,7,10,19],
  [5,9,13,14,18],[3,7,11,14,18],[1,8,10,14,18],[0,6,12,14,18],[4,9,11,13,18],
  [2,7,10,13,18],[0,5,8,13,18],[6,11,12,14,18],[3,8,9,14,18],[1,6,10,14,18],
  [4,7,12,13,18],[2,5,11,12,18],[0,9,10,12,18],[4,8,10,11,18],[3,6,13,14,18],
  [1,5,9,12,18],[2,8,11,14,18],[0,4,6,9,18],[3,10,12,13,18],[1,7,8,13,18],
  [7,9,12,14,18],[5,10,11,14,18],[2,4,13,14,18],[0,3,11,14,18],[6,8,9,13,18],
  [4,10,12,14,18],[1,3,9,11,18],[0,7,13,14,18],[2,6,8,14,18],[5,7,11,13,18],
  [1,4,11,12,18],[0,2,9,14,18],[6,10,13,14,18],[3,5,8,12,18],[8,11,12,13,18],
  [1,4,6,14,18],[2,10,11,13,18],[0,5,7,9,18],[3,4,7,14,18],[7,10,12,13,18],
  [1,2,6,13,18],[0,8,9,11,18],[4,5,6,11,18],[0,3,7,10,18],[5,9,13,14,17],
  [3,7,11,14,17],[1,8,10,14,17],[0,6,12,14,17],[4,9,11,13,17],[2,7,10,13,17],
  [0,5,8,13,17],[6,11,12,14,17],[3,8,9,14,17],[1,6,10,14,17],[4,7,12,13,17],
  [2,5,11,12,17],[0,9,10,12,17],[4,8,10,11,17],[3,6,13,14,17],[1,5,9,12,17],
  [2,8,11,14,17],[0,4,6,9,17],[3,10,12,13,17],[1,7,8,13,17],[7,9,12,14,17],
  [5,10,11,14,17],[2,4,13,14,17],[0,3,11,14,17],[6,8,9,13,17],[4,10,12,14,17],
  [1,3,9,11,17],[0,7,13,14,17],[2,6,8,14,17],[5,7,11,13,17],[1,4,11,12,17],
  [0,2,9,14,17],[6,10,13,14,17],[3,5,8,12,17],[8,11,12,13,17],[1,4,6,14,17],
  [2,10,11,13,17],[0,5,7,9,17],[3,4,7,14,17],[7,10,12,13,17],[1,2,6,13,17],
  [0,8,9,11,17],[4,5,6,11,17],[0,3,7,10,17],[5,9,13,14,16],[3,7,11,14,16],
  [1,8,10,14,16],[0,6,12,14,16],[4,9,11,13,16],[2,7,10,13,16],[0,5,8,13,16],
  [6,11,12,14,16],[3,8,9,14,16],[1,6,10,14,16],[4,7,12,13,16],[2,5,11,12,16],
  [0,9,10,12,16],[4,8,10,11,16],[3,6,13,14,16],[1,5,9,12,16],[2,8,11,14,16],
  [0,4,6,9,16],[3,10,12,13,16],[1,7,8,13,16],[7,9,12,14,16],[5,10,11,14,16],
  [2,4,13,14,16],[0,3,11,14,16],[6,8,9,13,16],[4,10,12,14,16],[1,3,9,11,16],
  [0,7,13,14,16],[2,6,8,14,16],[5,7,11,13,16],[1,4,11,12,16],[0,2,9,14,16],
  [6,10,13,14,16],[3,5,8,12,16],[8,11,12,13,16],[1,4,6,14,16],[2,10,11,13,16],
  [0,5,7,9,16],[3,4,7,14,16],[7,10,12,13,16],[1,2,6,13,16],[0,8,9,11,16],
  [4,5,6,11,16],[0,3,7,10,16],[5,9,13,14,15],[3,7,11,14,15],[1,8,10,14,15],
  [0,6,12,14,15],[4,9,11,13,15],[2,7,10,13,15],[0,5,8,13,15],[6,11,12,14,15],
  [3,8,9,14,15],[1,6,10,14,15],[4,7,12,13,15],[2,5,11,12,15],[0,9,10,12,15],
  [4,8,10,11,15],[3,6,13,14,15],[1,5,9,12,15],[2,8,11,14,15],[0,4,6,9,15],
  [3,10,12,13,15],[1,7,8,13,15],[7,9,12,14,15],[5,10,11,14,15],[2,4,13,14,15],
  [0,3,11,14,15],[6,8,9,13,15],[4,10,12,14,15],[1,3,9,11,15],[0,7,13,14,15],
  [2,6,8,14,15],[5,7,11,13,15],[1,4,11,12,15],[0,2,9,14,15],[6,10,13,14,15],
  [3,5,8,12,15],[8,11,12,13,15],[1,4,6,14,15],[2,10,11,13,15],[0,5,7,9,15],
  [3,4,7,14,15],[7,10,12,13,15],[1,2,6,13,15],[0,8,9,11,15],[4,5,6,11,15],
  [0,3,7,10,15],[5,9,10,13,14],[3,7,8,11,14],[1,6,11,12,14],[0,4,10,11,14],
  [2,9,11,12,14],[0,7,8,9,14],[4,6,8,13,14],[2,5,6,10,14],[1,3,12,13,14],
  [3,5,9,11,14],[0,2,7,11,14],[6,7,9,10,14],[1,4,8,9,14],[4,5,7,10,14],
  [0,1,10,13,14],[2,3,8,10,14],[8,10,12,13,14],[1,5,7,12,14],[0,6,9,11,14],
  [3,4,9,10,14],[2,4,6,11,14],[5,6,12,13,14],[1,9,10,11,14],[0,3,5,6,14],
  [2,8,9,12,14],[4,11,13,14,19],[3,9,12,14,19],[0,10,11,13,19],[2,6,7,12,19],
  [1,5,8,11,19],[5,8,10,14,19],[4,6,7,9,19],[2,3,6,9,19],[0,1,4,12,19],
  [7,8,11,12,19],[3,5,10,11,19],[1,9,13,14,19],[0,2,4,8,19],[6,9,10,11,19],
  [2,5,9,10,19],[0,1,3,13,19],[4,8,12,13,19],[1,6,7,11,19],[3,4,5,14,19],
  [0,2,11,12,19],[7,8,9,10,19],[5,6,8,9,19],[0,3,4,9,19],[1,10,12,14,19],
  [2,3,7,8,19],[4,11,13,14,18],[3,9,12,14,18],[0,10,11,13,18],[2,6,7,12,18],
  [1,5,8,11,18],[5,8,10,14,18],[4,6,7,9,18],[2,3,6,9,18],[0,1,4,12,18],
  [7,8,11,12,18],[3,5,10,11,18],[1,9,13,14,18],[0,2,4,8,18],[6,9,10,11,18],
  [2,5,9,10,18],[0,1,3,13,18],[4,8,12,13,18],[1,6,7,11,18],[3,4,5,14,18],
  [0,2,11,12,18],[7,8,9,10,18],[5,6,8,9,18],[0,3,4,9,18],[1,10,12,14,18],
  [2,3,7,8,18],[4,11,13,14,17],[3,9,12,14,17],[0,10,11,13,17],[2,6,7,12,17],
  [1,5,8,11,17],[5,8,10,14,17],[4,6,7,9,17],[2,3,6,9,17],[0,1,4,12,17],
  [7,8,11,12,17],[3,5,10,11,17],[1,9,13,14,17],[0,2,4,8,17],[6,9,10,11,17],
  [2,5,9,10,17],[0,1,3,13,17],[4,8,12,13,17],[1,6,7,11,17],[3,4,5,14,17],
  [0,2,11,12,17],[7,8,9,10,17],[5,6,8,9,17],[0,3,4,9,17],[1,10,12,14,17],
  [2,3,7,8,17],[4,11,13,14,16],[3,9,12,14,16],[0,10,11,13,16],[2,6,7,12,16],
  [1,5,8,11,16],[5,8,10,14,16],[4,6,7,9,16],[2,3,6,9,16],[0,1,4,12,16],
  [7,8,11,12,16],[3,5,10,11,16],[1,9,13,14,16],[0,2,4,8,16],[6,9,10,11,16],
  [2,5,9,10,16],[0,1,3,13,16],[4,8,12,13,16],[1,6,7,11,16],[3,4,5,14,16],
  [0,2,11,12,16],[7,8,9,10,16],[5,6,8,9,16],[0,3,4,9,16],[1,10,12,14,16],
  [2,3,7,8,16],[4,11,13,14,15],[3,9,12,14,15],[0,10,11,13,15],[2,6,7,12,15],
  [1,5,8,11,15],[5,8,10,14,15],[4,6,7,9,15],[2,3,6,9,15],[0,1,4,12,15],
  [7,8,11,12,15],[3,5,10,11,15],[1,9,13,14,15],[0,2,4,8,15],[6,9,10,11,15],
  [2,5,9,10,15],[0,1,3,13,15],[4,8,12,13,15],[1,6,7,11,15],[3,4,5,14,15],
  [0,2,11,12,15],[7,8,9,10,15],[5,6,8,9,15],[0,3,4,9,15],[1,10,12,14,15],
  [2,3,7,8,15]
];

interface ValidationResult {
  concurso: number;
  data_sorteio: string;
  dezenas_sorteio: number[];
  dezenas_fechamento: number[];
  melhor_acerto: number;
  jogo_melhor_acerto: number;
  garantia_cumprida: boolean;
  distribuicao_acertos: Record<number, number>;
}

function generateGamesFromRemovals(dezenas: number[], removals: number[][]): number[][] {
  return removals.map(removal => {
    return dezenas.filter((_, idx) => !removal.includes(idx));
  });
}

function countMatches(jogo: number[], sorteio: number[]): number {
  return jogo.filter(d => sorteio.includes(d)).length;
}

function validateAgainstResult(
  dezenasFechamento: number[],
  dezenasSorteio: number[],
  concurso: number,
  dataSorteio: string
): ValidationResult {
  const jogos = generateGamesFromRemovals(dezenasFechamento, FC05_REMOVALS);
  
  const distribuicao: Record<number, number> = {};
  let melhorAcerto = 0;
  let jogoMelhorAcerto = 0;

  jogos.forEach((jogo, idx) => {
    const acertos = countMatches(jogo, dezenasSorteio);
    distribuicao[acertos] = (distribuicao[acertos] || 0) + 1;
    
    if (acertos > melhorAcerto) {
      melhorAcerto = acertos;
      jogoMelhorAcerto = idx + 1;
    }
  });

  return {
    concurso,
    data_sorteio: dataSorteio,
    dezenas_sorteio: dezenasSorteio,
    dezenas_fechamento: dezenasFechamento,
    melhor_acerto: melhorAcerto,
    jogo_melhor_acerto: jogoMelhorAcerto,
    garantia_cumprida: melhorAcerto >= 14,
    distribuicao_acertos: distribuicao,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const body = await req.json().catch(() => ({}));
    const { quantidade = 100, dezenas_teste } = body;

    // Fetch historical results
    const { data: resultados, error } = await supabase
      .from("resultados")
      .select("concurso_id, data_sorteio, dezenas")
      .order("concurso_id", { ascending: false })
      .limit(quantidade);

    if (error) {
      throw new Error(`Erro ao buscar resultados: ${error.message}`);
    }

    if (!resultados?.length) {
      return new Response(
        JSON.stringify({ error: "Nenhum resultado encontrado" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const validationResults: ValidationResult[] = [];
    let sucessos = 0;
    let falhas = 0;
    const distribuicaoGlobal: Record<number, number> = {};

    for (const resultado of resultados) {
      const dezenasSorteio = resultado.dezenas as number[];
      
      // Use test numbers if provided, otherwise use last 20 drawn numbers pattern
      // For real validation, we need to simulate which 20 numbers user would have chosen
      // Here we'll test using the 20 most frequent numbers from recent draws
      let dezenasFechamento: number[];
      
      if (dezenas_teste && dezenas_teste.length === 20) {
        dezenasFechamento = dezenas_teste;
      } else {
        // Simulate: use 15 from the result + 5 random from remaining
        // This simulates a "near-hit" scenario
        const remaining = Array.from({ length: 25 }, (_, i) => i + 1)
          .filter(n => !dezenasSorteio.includes(n));
        const extra = remaining.slice(0, 5);
        dezenasFechamento = [...dezenasSorteio, ...extra].sort((a, b) => a - b);
      }

      const validationResult = validateAgainstResult(
        dezenasFechamento,
        dezenasSorteio,
        resultado.concurso_id,
        resultado.data_sorteio
      );

      validationResults.push(validationResult);

      if (validationResult.garantia_cumprida) {
        sucessos++;
      } else {
        falhas++;
      }

      // Aggregate distribution
      for (const [acertos, count] of Object.entries(validationResult.distribuicao_acertos)) {
        distribuicaoGlobal[parseInt(acertos)] = (distribuicaoGlobal[parseInt(acertos)] || 0) + count;
      }
    }

    const taxaSucesso = (sucessos / resultados.length) * 100;

    const summary = {
      estrategia: "FC05",
      descricao: "20 dezenas, 350 jogos, garantia 14 pontos",
      total_concursos_testados: resultados.length,
      sucessos,
      falhas,
      taxa_sucesso: `${taxaSucesso.toFixed(2)}%`,
      distribuicao_acertos_global: Object.fromEntries(
        Object.entries(distribuicaoGlobal).sort((a, b) => parseInt(b[0]) - parseInt(a[0]))
      ),
      nota: dezenas_teste 
        ? "Validação com dezenas personalizadas" 
        : "Simulação: cada teste usa 15 dezenas do sorteio + 5 aleatórias (cenário otimista)",
      primeiros_resultados: validationResults.slice(0, 10),
    };

    console.log(`[validate-fechamento] FC05 testado em ${resultados.length} concursos: ${taxaSucesso.toFixed(2)}% de sucesso`);

    return new Response(
      JSON.stringify(summary),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Erro na validação:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
