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
    const latestUrl = `https://apiloterias.com.br/app/v2/resultado?loteria=megasena&token=${API_TOKEN}&concurso=ultimos1`;
    console.log("Buscando último concurso da API...");
    
    const apiResponse = await fetch(latestUrl);
    if (!apiResponse.ok) {
      throw new Error(`Erro ao buscar API: ${apiResponse.status}`);
    }

    const ultimoResultado = await apiResponse.json();
    const ultimoConcursoAPI = ultimoResultado.numero_concurso;
    console.log("Último concurso API:", ultimoConcursoAPI);

    // Se um concurso específico foi solicitado
    if (concursoEspecifico) {
      const concursoUrl = `https://apiloterias.com.br/app/v2/resultado?loteria=megasena&token=${API_TOKEN}&concurso=${concursoEspecifico}`;
      const res = await fetch(concursoUrl);
      if (!res.ok) {
        throw new Error(`Erro ao buscar concurso ${concursoEspecifico}: ${res.status}`);
      }
      
      const resultado = await res.json();
      const dezenas = resultado.dezenas.map((d: string) => parseInt(d, 10)).sort((a: number, b: number) => a - b);
      
      // Buscar dezenas do concurso anterior
      const { data: anterior } = await supabase
        .from("resultados_megasena")
        .select("dezenas")
        .eq("concurso_id", concursoEspecifico - 1)
        .maybeSingle();
      
      const indicadores = calcularIndicadores(dezenas, anterior?.dezenas || []);
      const dataSorteio = converterDataBR(resultado.data_concurso);

      const registro = {
        concurso_id: resultado.numero_concurso,
        data_sorteio: dataSorteio,
        dezenas,
        acumulou: resultado.acumulou,
        valor_acumulado: resultado.valor_acumulado || null,
        valor_estimado_proximo: resultado.valor_estimado_proximo || null,
        local_sorteio: resultado.local_sorteio || null,
        premiacao_json: resultado.premiacao || null,
        locais_ganhadores: resultado.ganhadores || null,
        ...indicadores,
      };

      const { error } = await supabase
        .from("resultados_megasena")
        .upsert(registro, { onConflict: "concurso_id" });

      if (error) {
        throw new Error(`Erro ao inserir: ${error.message}`);
      }

      return new Response(
        JSON.stringify({ message: "Concurso sincronizado", concurso: concursoEspecifico }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Definir quais concursos buscar
    let concursosParaBuscar: number[] = [];

    if (fromLatest) {
      // Buscar os últimos X concursos a partir do mais recente
      for (let i = ultimoConcursoAPI; i > ultimoConcursoAPI - limit && i > 0; i--) {
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

    // Buscar histórico para calcular repetidas
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
          const concursoUrl = `https://apiloterias.com.br/app/v2/resultado?loteria=megasena&token=${API_TOKEN}&concurso=${concursoId}`;
          const res = await fetch(concursoUrl);
          if (!res.ok) {
            console.error(`Erro ao buscar concurso ${concursoId}: ${res.status}`);
            continue;
          }
          resultado = await res.json();
        }

        const dezenas = resultado.dezenas.map((d: string) => parseInt(d, 10)).sort((a: number, b: number) => a - b);
        
        // Buscar dezenas do concurso anterior
        const dezenasAnteriores = historicoMap.get(concursoId - 1) || [];
        
        const indicadores = calcularIndicadores(dezenas, dezenasAnteriores);
        const dataSorteio = converterDataBR(resultado.data_concurso);

        resultadosParaInserir.push({
          concurso_id: resultado.numero_concurso,
          data_sorteio: dataSorteio,
          dezenas,
          acumulou: resultado.acumulou,
          valor_acumulado: resultado.valor_acumulado || null,
          valor_estimado_proximo: resultado.valor_estimado_proximo || null,
          local_sorteio: resultado.local_sorteio || null,
          premiacao_json: resultado.premiacao || null,
          locais_ganhadores: resultado.ganhadores || null,
          ...indicadores,
        });

        // Atualizar histórico para próxima iteração
        historicoMap.set(concursoId, dezenas);

        // Delay para não sobrecarregar API
        await new Promise(resolve => setTimeout(resolve, 300));
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
              titulo: 'Resultado Mega Sena',
              mensagem: `Concurso ${ultimoConcursoInserido} disponível! Confira agora.`,
              loteria: 'megasena',
              concurso_id: ultimoConcursoInserido,
            }),
          });
          if (res.ok) {
            console.log(`[PUSH] ✅ Push enviado para Mega Sena concurso ${ultimoConcursoInserido}`);
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
        message: "Sincronização concluída",
        api: "apiloterias.com.br",
        inseridos: resultadosParaInserir.length,
        ultimo_concurso: ultimoConcursoInserido,
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
