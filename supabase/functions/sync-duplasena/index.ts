import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Constantes da Dupla Sena (1 a 50)
const PRIMOS_DUPLASENA = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47];
const MOLDURA_DUPLASENA = [
  // Linha Superior (1-10)
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
  // Coluna Esquerda (11, 21, 31)
  11, 21, 31,
  // Coluna Direita (20, 30, 40)
  20, 30, 40,
  // Linha Inferior (41-50)
  41, 42, 43, 44, 45, 46, 47, 48, 49, 50
];

function isPar(n: number): boolean {
  return n % 2 === 0;
}

function isPrimo(n: number): boolean {
  return PRIMOS_DUPLASENA.includes(n);
}

function isMoldura(n: number): boolean {
  return MOLDURA_DUPLASENA.includes(n);
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

// Extrai o número do concurso do objeto de resultado
function getConcursoId(resultado: any): number {
  return resultado.numero_concurso || resultado.concurso || resultado.numero;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const API_TOKEN = Deno.env.get("LOTOFACIL_API_TOKEN");
    if (!API_TOKEN) {
      throw new Error("LOTOFACIL_API_TOKEN não configurado");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse body para opções
    let fromLatest = false;
    let limit = 50;
    let concursoEspecifico: number | null = null;
    try {
      const body = await req.json();
      fromLatest = body.from_latest === true;
      limit = body.limit || 50;
      concursoEspecifico = body.concurso || null;
    } catch {
      // Sem body, usar defaults
    }

    // Buscar último resultado da API (para saber o concurso mais recente)
    const latestUrl = `https://apiloterias.com.br/app/v2/resultado?loteria=duplasena&token=${API_TOKEN}`;
    console.log("Buscando último concurso da Dupla Sena na API...");
    
    const apiResponse = await fetch(latestUrl);
    if (!apiResponse.ok) {
      throw new Error(`Erro ao buscar API: ${apiResponse.status}`);
    }

    const ultimoResultado = await apiResponse.json();
    console.log("Resposta da API (primeiros 500 chars):", JSON.stringify(ultimoResultado).slice(0, 500));
    
    const ultimoConcursoAPI = getConcursoId(ultimoResultado);
    if (!ultimoConcursoAPI) {
      throw new Error(`Não foi possível obter o número do concurso da API. Chaves disponíveis: ${Object.keys(ultimoResultado).join(", ")}`);
    }
    console.log("Último concurso Dupla Sena API:", ultimoConcursoAPI);

    // Se um concurso específico foi solicitado
    if (concursoEspecifico) {
      const concursoUrl = `https://apiloterias.com.br/app/v2/resultado?loteria=duplasena&token=${API_TOKEN}&concurso=${concursoEspecifico}`;
      const res = await fetch(concursoUrl);
      if (!res.ok) {
        throw new Error(`Erro ao buscar concurso ${concursoEspecifico}: ${res.status}`);
      }
      
      const resultado = await res.json();
      
      // Dupla Sena tem dois sorteios: dezenas e dezenas_2
      const dezenasSorteio1 = resultado.dezenas.map((d: string) => parseInt(d, 10)).sort((a: number, b: number) => a - b);
      const dezenasSorteio2 = resultado.dezenas_2.map((d: string) => parseInt(d, 10)).sort((a: number, b: number) => a - b);
      
      // Buscar dezenas do concurso anterior para calcular repetidas
      const { data: anterior } = await supabase
        .from("resultados_duplasena")
        .select("dezenas_sorteio1, dezenas_sorteio2")
        .eq("concurso_id", concursoEspecifico - 1)
        .maybeSingle();
      
      const indicadoresS1 = calcularIndicadores(dezenasSorteio1, anterior?.dezenas_sorteio1 || []);
      const indicadoresS2 = calcularIndicadores(dezenasSorteio2, anterior?.dezenas_sorteio2 || []);
      const dataSorteio = converterDataBR(resultado.data_concurso);

      const registro = {
        concurso_id: getConcursoId(resultado),
        data_sorteio: dataSorteio,
        dezenas_sorteio1: dezenasSorteio1,
        dezenas_sorteio2: dezenasSorteio2,
        qtd_pares_s1: indicadoresS1.qtd_pares,
        qtd_impares_s1: indicadoresS1.qtd_impares,
        qtd_primos_s1: indicadoresS1.qtd_primos,
        qtd_moldura_s1: indicadoresS1.qtd_moldura,
        qtd_repetidas_s1: indicadoresS1.qtd_repetidas,
        qtd_pares_s2: indicadoresS2.qtd_pares,
        qtd_impares_s2: indicadoresS2.qtd_impares,
        qtd_primos_s2: indicadoresS2.qtd_primos,
        qtd_moldura_s2: indicadoresS2.qtd_moldura,
        qtd_repetidas_s2: indicadoresS2.qtd_repetidas,
        acumulou: resultado.acumulou,
        valor_acumulado: resultado.valor_acumulado || null,
        valor_estimado_proximo: resultado.valor_estimado_proximo || null,
        local_sorteio: resultado.local_sorteio || null,
        premiacao_json: resultado.premiacao || null,
        locais_ganhadores: resultado.ganhadores || null,
      };

      const { error } = await supabase
        .from("resultados_duplasena")
        .upsert(registro, { onConflict: "concurso_id" });

      if (error) {
        throw new Error(`Erro ao inserir: ${error.message}`);
      }

      return new Response(
        JSON.stringify({ message: "Concurso Dupla Sena sincronizado", concurso: concursoEspecifico }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Definir quais concursos buscar
    let concursosParaBuscar: number[] = [];

    if (fromLatest) {
      // Buscar os últimos X concursos a partir do mais recente
      for (let i = ultimoConcursoAPI; i > ultimoConcursoAPI - limit && i > 0; i--) {
        const { data: existe } = await supabase
          .from("resultados_duplasena")
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
        .from("resultados_duplasena")
        .select("concurso_id")
        .order("concurso_id", { ascending: false })
        .limit(1)
        .maybeSingle();

      const ultimoConcursoLocal = ultimoLocal?.concurso_id || 0;
      console.log("Último concurso Dupla Sena local:", ultimoConcursoLocal);

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

    console.log(`Buscando ${concursosParaBuscar.length} concursos da Dupla Sena...`);

    // Buscar histórico para calcular repetidas
    const { data: historico } = await supabase
      .from("resultados_duplasena")
      .select("concurso_id, dezenas_sorteio1, dezenas_sorteio2")
      .order("concurso_id", { ascending: false })
      .limit(5);

    const historicoMapS1 = new Map<number, number[]>();
    const historicoMapS2 = new Map<number, number[]>();
    historico?.forEach(h => {
      historicoMapS1.set(h.concurso_id, h.dezenas_sorteio1);
      historicoMapS2.set(h.concurso_id, h.dezenas_sorteio2);
    });

    const resultadosParaInserir: any[] = [];

    for (const concursoId of concursosParaBuscar) {
      try {
        let resultado;
        
        if (concursoId === ultimoConcursoAPI) {
          resultado = ultimoResultado;
        } else {
          const concursoUrl = `https://apiloterias.com.br/app/v2/resultado?loteria=duplasena&token=${API_TOKEN}&concurso=${concursoId}`;
          const res = await fetch(concursoUrl);
          if (!res.ok) {
            console.error(`Erro ao buscar concurso ${concursoId}: ${res.status}`);
            continue;
          }
          resultado = await res.json();
        }

        // Dupla Sena tem dois sorteios: dezenas e dezenas_2
        const dezenasSorteio1 = resultado.dezenas.map((d: string) => parseInt(d, 10)).sort((a: number, b: number) => a - b);
        const dezenasSorteio2 = resultado.dezenas_2.map((d: string) => parseInt(d, 10)).sort((a: number, b: number) => a - b);
        
        // Buscar dezenas do concurso anterior
        const dezenasAnterioresS1 = historicoMapS1.get(concursoId - 1) || [];
        const dezenasAnterioresS2 = historicoMapS2.get(concursoId - 1) || [];
        
        const indicadoresS1 = calcularIndicadores(dezenasSorteio1, dezenasAnterioresS1);
        const indicadoresS2 = calcularIndicadores(dezenasSorteio2, dezenasAnterioresS2);
        const dataSorteio = converterDataBR(resultado.data_concurso);

        resultadosParaInserir.push({
          concurso_id: getConcursoId(resultado),
          data_sorteio: dataSorteio,
          dezenas_sorteio1: dezenasSorteio1,
          dezenas_sorteio2: dezenasSorteio2,
          qtd_pares_s1: indicadoresS1.qtd_pares,
          qtd_impares_s1: indicadoresS1.qtd_impares,
          qtd_primos_s1: indicadoresS1.qtd_primos,
          qtd_moldura_s1: indicadoresS1.qtd_moldura,
          qtd_repetidas_s1: indicadoresS1.qtd_repetidas,
          qtd_pares_s2: indicadoresS2.qtd_pares,
          qtd_impares_s2: indicadoresS2.qtd_impares,
          qtd_primos_s2: indicadoresS2.qtd_primos,
          qtd_moldura_s2: indicadoresS2.qtd_moldura,
          qtd_repetidas_s2: indicadoresS2.qtd_repetidas,
          acumulou: resultado.acumulou,
          valor_acumulado: resultado.valor_acumulado || null,
          valor_estimado_proximo: resultado.valor_estimado_proximo || null,
          local_sorteio: resultado.local_sorteio || null,
          premiacao_json: resultado.premiacao || null,
          locais_ganhadores: resultado.ganhadores || null,
        });

        // Atualizar histórico para próxima iteração
        historicoMapS1.set(concursoId, dezenasSorteio1);
        historicoMapS2.set(concursoId, dezenasSorteio2);

        // Delay para não sobrecarregar API
        await new Promise(resolve => setTimeout(resolve, 300));
      } catch (err) {
        console.error(`Erro ao buscar concurso ${concursoId}:`, err);
      }
    }

    if (resultadosParaInserir.length > 0) {
      const { error } = await supabase
        .from("resultados_duplasena")
        .upsert(resultadosParaInserir, { onConflict: "concurso_id" });

      if (error) {
        throw new Error(`Erro ao inserir: ${error.message}`);
      }
    }

    const ultimoConcursoInserido = resultadosParaInserir.length > 0 
      ? resultadosParaInserir[resultadosParaInserir.length - 1]?.concurso_id 
      : ultimoConcursoAPI;

    // Push notification para novo resultado (apenas se inseriu exatamente 1 concurso novo)
    if (resultadosParaInserir.length === 1) {
      const webhookSecret = Deno.env.get('NOTIFICATIONS_WEBHOOK_SECRET');
      const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
      if (webhookSecret && supabaseAnonKey) {
        try {
          const fnUrl = `${supabaseUrl}/functions/v1/send-push`;
          const res = await fetch(fnUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${supabaseAnonKey}`,
              'x-webhook-secret': webhookSecret,
            },
            body: JSON.stringify({
              tipo: 'resultado_novo',
              titulo: 'Resultado Dupla Sena',
              mensagem: `Concurso ${ultimoConcursoInserido} disponível! Confira agora.`,
              loteria: 'duplasena',
              concurso_id: ultimoConcursoInserido,
            }),
          });
          if (res.ok) {
            console.log(`[PUSH] ✅ Push enviado para Dupla Sena concurso ${ultimoConcursoInserido}`);
          } else {
            const text = await res.text().catch(() => '');
            console.error(`[PUSH] Falha: ${res.status} ${text}`);
          }
        } catch (e) {
          console.error('[PUSH] Erro:', e);
        }
      }
    }

    return new Response(
      JSON.stringify({
        message: "Sincronização Dupla Sena concluída",
        api: "apiloterias.com.br",
        inseridos: resultadosParaInserir.length,
        ultimo_concurso: ultimoConcursoInserido,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Erro na sincronização Dupla Sena:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
