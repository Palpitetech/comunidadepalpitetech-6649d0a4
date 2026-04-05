import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PRIMOS_MEGASENA = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59];
const MOLDURA_MEGASENA = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
  11, 21, 31, 41,
  20, 30, 40, 50,
  51, 52, 53, 54, 55, 56, 57, 58, 59, 60
];
const FIBONACCI_MEGASENA = [1, 2, 3, 5, 8, 13, 21, 34, 55];

function isPar(n: number): boolean { return n % 2 === 0; }
function isPrimo(n: number): boolean { return PRIMOS_MEGASENA.includes(n); }
function isMoldura(n: number): boolean { return MOLDURA_MEGASENA.includes(n); }

function calcularIndicadores(dezenas: number[], dezenasAnteriores?: number[]) {
  const pares = dezenas.filter(isPar).length;
  const sorted = [...dezenas].sort((a, b) => a - b);
  let seqCount = 0;
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === sorted[i - 1] + 1) seqCount++;
  }
  return {
    qtd_pares: pares,
    qtd_impares: 6 - pares,
    qtd_primos: dezenas.filter(isPrimo).length,
    qtd_moldura: dezenas.filter(isMoldura).length,
    qtd_fibonacci: dezenas.filter(d => FIBONACCI_MEGASENA.includes(d)).length,
    qtd_repetidas: dezenasAnteriores ? dezenas.filter(d => dezenasAnteriores.includes(d)).length : 0,
    soma: dezenas.reduce((a, b) => a + b, 0),
    sequencias: seqCount,
  };
}

function converterDataBR(dataBR: string): string {
  const partes = dataBR.split("/");
  if (partes.length === 3) return `${partes[2]}-${partes[1]}-${partes[0]}`;
  return dataBR;
}

function extrairNumeroConcurso(r: any): number {
  if (typeof r.concurso === 'number') return r.concurso;
  if (typeof r.concurso === 'string') return parseInt(r.concurso, 10);
  if (typeof r.numero === 'number') return r.numero;
  if (typeof r.numero === 'string') return parseInt(r.numero, 10);
  if (typeof r.numero_concurso === 'number') return r.numero_concurso;
  if (typeof r.numero_concurso === 'string') return parseInt(r.numero_concurso, 10);
  return 0;
}

function extrairData(r: any): string {
  const campos = ['data', 'data_sorteio', 'dataApuracao', 'dataSorteio', 'data_concurso', 'dataConcurso'];
  for (const campo of campos) {
    if (r[campo] && typeof r[campo] === 'string') return converterDataBR(r[campo]);
  }
  return new Date().toISOString().split('T')[0];
}

const LOTERIA = "megasena";
const TABLE = "resultados_loterias";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const API_TOKEN = Deno.env.get("LOTOFACIL_API_TOKEN");
    if (!API_TOKEN) throw new Error("LOTOFACIL_API_TOKEN não configurado");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let fromLatest = false;
    let limit = 50;
    let concursoEspecifico: number | null = null;
    let action: string | null = null;
    try {
      const body = await req.json();
      fromLatest = body.from_latest === true;
      limit = body.limit || 50;
      concursoEspecifico = body.concurso || null;
      action = body.action || null;
    } catch { /* defaults */ }

    // Helper: build a unified record for resultados_loterias
    function buildRegistro(resultado: any, dezenas: number[], indicadores: ReturnType<typeof calcularIndicadores>) {
      return {
        loteria: LOTERIA,
        concurso: extrairNumeroConcurso(resultado),
        data_sorteio: extrairData(resultado),
        dezenas,
        acumulou: resultado.acumulou ?? false,
        valor_acumulado: resultado.valor_acumulado || null,
        valor_estimado_proximo: resultado.valor_estimado_proximo || null,
        local_sorteio: resultado.local_sorteio || null,
        premiacao_json: resultado.premiacao || [],
        locais_ganhadores: resultado.ganhadores || [],
        ...indicadores,
      };
    }

    // ── REPROCESS HISTORY ──────────────────────────────────────
    if (action === 'reprocess_history') {
      console.log('[REPROCESS] Iniciando reprocessamento megasena...');
      const { data: existentes } = await supabase.from(TABLE).select('concurso').eq('loteria', LOTERIA).order('concurso', { ascending: true });
      if (!existentes?.length) return new Response(JSON.stringify({ success: true, reprocessados: 0 }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      let reprocessados = 0, erros = 0;
      let prevDez: number[] = [];
      for (const item of existentes) {
        try {
          const res = await fetch(`https://apiloterias.com.br/app/v2/resultado?loteria=megasena&token=${API_TOKEN}&concurso=${item.concurso}`);
          if (!res.ok) { erros++; continue; }
          const resultado = await res.json();
          const dezenas = resultado.dezenas.map((d: string) => parseInt(d, 10)).sort((a: number, b: number) => a - b);
          const ind = calcularIndicadores(dezenas, prevDez);
          const reg = buildRegistro(resultado, dezenas, ind);
          // Override concurso from item in case API returns different key
          reg.concurso = item.concurso;
          const { error } = await supabase.from(TABLE).upsert(reg, { onConflict: 'loteria,concurso' });
          if (error) { erros++; } else { reprocessados++; }
          prevDez = dezenas;
          await new Promise(r => setTimeout(r, 300));
        } catch { erros++; }
      }
      return new Response(JSON.stringify({ success: true, reprocessados, erros }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // ── SYNC NORMAL ────────────────────────────────────────────
    const latestUrl = `https://apiloterias.com.br/app/v2/resultado?loteria=megasena&token=${API_TOKEN}&concurso=ultimos1`;
    console.log("Buscando último concurso da API...");
    const apiResponse = await fetch(latestUrl);
    if (!apiResponse.ok) throw new Error(`Erro ao buscar API: ${apiResponse.status}`);
    const ultimoResultado = await apiResponse.json();
    const ultimoConcursoAPI = extrairNumeroConcurso(ultimoResultado);
    console.log("Último concurso API:", ultimoConcursoAPI);

    // Concurso específico
    if (concursoEspecifico) {
      const concursoUrl = `https://apiloterias.com.br/app/v2/resultado?loteria=megasena&token=${API_TOKEN}&concurso=${concursoEspecifico}`;
      const res = await fetch(concursoUrl);
      if (!res.ok) throw new Error(`Erro ao buscar concurso ${concursoEspecifico}: ${res.status}`);
      const resultado = await res.json();
      const dezenas = resultado.dezenas.map((d: string) => parseInt(d, 10)).sort((a: number, b: number) => a - b);

      const { data: anterior } = await supabase
        .from(TABLE).select("dezenas")
        .eq("loteria", LOTERIA).eq("concurso", concursoEspecifico - 1)
        .maybeSingle();

      const indicadores = calcularIndicadores(dezenas, anterior?.dezenas || []);
      const reg = buildRegistro(resultado, dezenas, indicadores);

      const { error } = await supabase.from(TABLE).upsert(reg, { onConflict: "loteria,concurso" });
      if (error) throw new Error(`Erro ao inserir: ${error.message}`);

      return new Response(
        JSON.stringify({ message: "Concurso sincronizado", concurso: concursoEspecifico }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Definir quais concursos buscar
    let concursosParaBuscar: number[] = [];

    if (fromLatest) {
      for (let i = ultimoConcursoAPI; i > ultimoConcursoAPI - limit && i > 0; i--) {
        const { data: existe } = await supabase
          .from(TABLE).select("concurso")
          .eq("loteria", LOTERIA).eq("concurso", i)
          .maybeSingle();
        if (!existe) concursosParaBuscar.push(i);
      }
      concursosParaBuscar = concursosParaBuscar.sort((a, b) => a - b);
    } else {
      const { data: ultimoLocal } = await supabase
        .from(TABLE).select("concurso")
        .eq("loteria", LOTERIA)
        .order("concurso", { ascending: false })
        .limit(1).maybeSingle();

      const ultimoConcursoLocal = ultimoLocal?.concurso || 0;
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

    // Histórico para calcular repetidas
    const { data: historico } = await supabase
      .from(TABLE).select("concurso, dezenas")
      .eq("loteria", LOTERIA)
      .order("concurso", { ascending: false }).limit(5);

    const historicoMap = new Map<number, number[]>();
    historico?.forEach(h => historicoMap.set(h.concurso, h.dezenas));

    const resultadosParaInserir: any[] = [];

    for (const concursoId of concursosParaBuscar) {
      try {
        let resultado;
        if (concursoId === ultimoConcursoAPI) {
          resultado = ultimoResultado;
        } else {
          const concursoUrl = `https://apiloterias.com.br/app/v2/resultado?loteria=megasena&token=${API_TOKEN}&concurso=${concursoId}`;
          const res = await fetch(concursoUrl);
          if (!res.ok) { console.error(`Erro ao buscar concurso ${concursoId}: ${res.status}`); continue; }
          resultado = await res.json();
        }

        const dezenas = resultado.dezenas.map((d: string) => parseInt(d, 10)).sort((a: number, b: number) => a - b);
        const dezenasAnteriores = historicoMap.get(concursoId - 1) || [];
        const indicadores = calcularIndicadores(dezenas, dezenasAnteriores);
        resultadosParaInserir.push(buildRegistro(resultado, dezenas, indicadores));
        historicoMap.set(concursoId, dezenas);
        await new Promise(resolve => setTimeout(resolve, 300));
      } catch (err) {
        console.error(`Erro ao buscar concurso ${concursoId}:`, err);
      }
    }

    if (resultadosParaInserir.length > 0) {
      const { error } = await supabase
        .from(TABLE).upsert(resultadosParaInserir, { onConflict: "loteria,concurso" });
      if (error) throw new Error(`Erro ao inserir: ${error.message}`);
    }

    const ultimoConcursoInserido = resultadosParaInserir.length > 0
      ? resultadosParaInserir[resultadosParaInserir.length - 1]?.concurso
      : ultimoConcursoAPI;

    // Push notification
    if (resultadosParaInserir.length === 1) {
      const webhookSecret = Deno.env.get('NOTIFICATIONS_WEBHOOK_SECRET');
      const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
      if (webhookSecret && supabaseAnonKey) {
        try {
          const fnUrl = `${supabaseUrl}/functions/v1/send-push`;
          const res = await fetch(fnUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${supabaseAnonKey}`, 'x-webhook-secret': webhookSecret },
            body: JSON.stringify({
              tipo: 'resultado_novo',
              titulo: 'Resultado Mega Sena',
              mensagem: `Concurso ${ultimoConcursoInserido} disponível! Confira agora.`,
              loteria: 'megasena',
              concurso_id: ultimoConcursoInserido,
            }),
          });
          if (res.ok) console.log(`[PUSH] ✅ Push enviado para Mega Sena concurso ${ultimoConcursoInserido}`);
          else { const text = await res.text().catch(() => ''); console.error(`[PUSH] Falha: ${res.status} ${text}`); }
        } catch (e) { console.error('[PUSH] Erro:', e); }
      }
    }

    // Fire and forget: sync próximos concursos
    const syncProximosSecret = Deno.env.get('NOTIFICATIONS_WEBHOOK_SECRET');
    if (syncProximosSecret) {
      fetch(`${supabaseUrl}/functions/v1/sync-proximos-concursos?secret=${syncProximosSecret}`, { method: 'POST' })
        .catch(err => console.error('[sync-megasena] Erro ao atualizar proximos:', err));
    }

    return new Response(
      JSON.stringify({ message: "Sincronização concluída", api: "apiloterias.com.br", inseridos: resultadosParaInserir.length, ultimo_concurso: ultimoConcursoInserido }),
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
