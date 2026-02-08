import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Constantes da Mega Sena
const PRIMOS_MEGASENA = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59];
const MOLDURA_MEGASENA = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
  11, 21, 31, 41,
  20, 30, 40, 50,
  51, 52, 53, 54, 55, 56, 57, 58, 59, 60
];

function isPar(n: number): boolean {
  return n % 2 === 0;
}

function isPrimo(n: number): boolean {
  return PRIMOS_MEGASENA.includes(n);
}

function isMoldura(n: number): boolean {
  return MOLDURA_MEGASENA.includes(n);
}

function calcularIndicadores(dezenas: number[], dezenasAnteriores?: number[]) {
  const pares = dezenas.filter(isPar).length;
  const primos = dezenas.filter(isPrimo).length;
  const moldura = dezenas.filter(isMoldura).length;
  const repetidas = dezenasAnteriores 
    ? dezenas.filter(d => dezenasAnteriores.includes(d)).length 
    : 0;

  return {
    qtd_pares: pares,
    qtd_impares: 6 - pares,
    qtd_primos: primos,
    qtd_moldura: moldura,
    qtd_repetidas: repetidas,
  };
}

// Converter data brasileira (DD/MM/YYYY) para formato ISO (YYYY-MM-DD)
function converterDataBR(dataBR: string): string {
  const partes = dataBR.split("/");
  if (partes.length === 3) {
    return `${partes[2]}-${partes[1]}-${partes[0]}`;
  }
  return dataBR;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse body para opções
    let fromLatest = false;
    let limit = 50;
    try {
      const body = await req.json();
      fromLatest = body.from_latest === true;
      limit = body.limit || 50;
    } catch {
      // Sem body, usar defaults
    }

    // Buscar último resultado da API
    const apiResponse = await fetch("https://loteriascaixa-api.herokuapp.com/api/megasena/latest");
    if (!apiResponse.ok) {
      throw new Error(`Erro ao buscar API: ${apiResponse.status}`);
    }

    const ultimoResultado = await apiResponse.json();
    const ultimoConcursoAPI = ultimoResultado.concurso;
    console.log("Último concurso API:", ultimoConcursoAPI);

    // Definir quais concursos buscar
    let concursosParaBuscar: number[] = [];

    if (fromLatest) {
      // Buscar os últimos X concursos a partir do mais recente
      for (let i = ultimoConcursoAPI; i > ultimoConcursoAPI - limit && i > 0; i--) {
        // Verificar se já existe no banco
        const { data: existe } = await supabase
          .from("resultados_megasena")
          .select("concurso_id")
          .eq("concurso_id", i)
          .maybeSingle();
        
        if (!existe) {
          concursosParaBuscar.push(i);
        }
      }
      concursosParaBuscar = concursosParaBuscar.sort((a, b) => a - b);
    } else {
      // Modo padrão: buscar a partir do último local
      const { data: ultimoLocal } = await supabase
        .from("resultados_megasena")
        .select("concurso_id")
        .order("concurso_id", { ascending: false })
        .limit(1)
        .maybeSingle();

      const ultimoConcursoLocal = ultimoLocal?.concurso_id || 0;
      console.log("Último concurso local:", ultimoConcursoLocal);

      if (ultimoConcursoAPI <= ultimoConcursoLocal) {
        return new Response(
          JSON.stringify({ message: "Já está atualizado", ultimo_concurso: ultimoConcursoLocal }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      for (let i = ultimoConcursoLocal + 1; i <= ultimoConcursoAPI; i++) {
        concursosParaBuscar.push(i);
        if (concursosParaBuscar.length >= limit) break;
      }
    }

    if (concursosParaBuscar.length === 0) {
      return new Response(
        JSON.stringify({ message: "Já está atualizado", ultimo_concurso: ultimoConcursoAPI }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Buscando ${concursosParaBuscar.length} concursos...`);

    console.log(`Buscando ${concursosParaBuscar.length} concursos...`);

    // Buscar todos os resultados históricos para calcular repetidas
    const { data: historico } = await supabase
      .from("resultados_megasena")
      .select("concurso_id, dezenas")
      .order("concurso_id", { ascending: false })
      .limit(5);

    const historicoMap = new Map<number, number[]>();
    historico?.forEach(h => historicoMap.set(h.concurso_id, h.dezenas));

    const resultadosParaInserir: any[] = [];

    for (const concursoId of concursosParaBuscar) {
      try {
        let resultado;
        
        if (concursoId === ultimoConcursoAPI) {
          resultado = ultimoResultado;
        } else {
          const res = await fetch(`https://loteriascaixa-api.herokuapp.com/api/megasena/${concursoId}`);
          if (!res.ok) continue;
          resultado = await res.json();
        }

        const dezenas = resultado.dezenas.map((d: string) => parseInt(d, 10)).sort((a: number, b: number) => a - b);
        
        // Buscar dezenas do concurso anterior
        const dezenasAnteriores = historicoMap.get(concursoId - 1) || [];
        
        const indicadores = calcularIndicadores(dezenas, dezenasAnteriores);

        // Converter data para formato ISO
        const dataSorteio = converterDataBR(resultado.data);

        resultadosParaInserir.push({
          concurso_id: resultado.concurso,
          data_sorteio: dataSorteio,
          dezenas,
          acumulou: resultado.acumulou,
          valor_acumulado: resultado.valorAcumuladoProximoConcurso,
          valor_estimado_proximo: resultado.valorEstimadoProximoConcurso,
          local_sorteio: resultado.localSorteio,
          premiacao_json: resultado.premiacoes,
          locais_ganhadores: resultado.localGanhadores,
          ...indicadores,
        });

        // Atualizar histórico para próxima iteração
        historicoMap.set(concursoId, dezenas);

        // Delay para não sobrecarregar API
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (err) {
        console.error(`Erro ao buscar concurso ${concursoId}:`, err);
      }
    }

    if (resultadosParaInserir.length > 0) {
      const { error } = await supabase
        .from("resultados_megasena")
        .upsert(resultadosParaInserir, { onConflict: "concurso_id" });

      if (error) {
        throw new Error(`Erro ao inserir: ${error.message}`);
      }
    }

    return new Response(
      JSON.stringify({
        message: "Sincronização concluída",
        inseridos: resultadosParaInserir.length,
        ultimo_concurso: resultadosParaInserir[resultadosParaInserir.length - 1]?.concurso_id || ultimoConcursoLocal,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Erro na sincronização:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
