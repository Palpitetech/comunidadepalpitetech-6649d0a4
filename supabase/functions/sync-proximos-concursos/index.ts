import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const LOTERIAS = [
  { key: "lotofacil", param: "lotofacil" },
  { key: "megasena", param: "megasena" },
  { key: "duplasena", param: "duplasena" },
];

const BASE_URL = "https://apiloterias.com.br/app/v2/resultado";

function converterDataBR(dataBR: string): string | null {
  if (!dataBR) return null;
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

  // Auth via query param
  const url = new URL(req.url);
  const secret = url.searchParams.get("secret");
  const expectedSecret = Deno.env.get("NOTIFICATIONS_WEBHOOK_SECRET");

  if (!secret || secret !== expectedSecret) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const TOKEN = Deno.env.get("LOTOFACIL_API_TOKEN");
  if (!TOKEN) {
    return new Response(
      JSON.stringify({ error: "LOTOFACIL_API_TOKEN não configurado" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const results: Array<{ loteria: string; status: string; concurso?: string }> = [];

  for (const loteria of LOTERIAS) {
    try {
      const apiUrl = `${BASE_URL}?loteria=${loteria.param}&token=${TOKEN}&concurso=ultimos1`;
      console.log(`[sync-proximos] Buscando ${loteria.key}...`);

      const res = await fetch(apiUrl);
      if (!res.ok) {
        throw new Error(`API retornou ${res.status}`);
      }

      const rawData = await res.json();
      // API pode retornar array ou objeto
      const data = Array.isArray(rawData) ? rawData[0] : rawData;

      if (!data) {
        console.warn(`[sync-proximos] Sem dados para ${loteria.key}`);
        results.push({ loteria: loteria.key, status: "sem_dados" });
        continue;
      }

      console.log(
        `[sync-proximos] ${loteria.key} raw fields:`,
        JSON.stringify({
          numero_concurso: data.numero_concurso,
          data_proximo_concurso: data.data_proximo_concurso,
          valor_estimado_proximo_concurso: data.valor_estimado_proximo_concurso,
          acumulou: data.acumulou,
          valor_acumulado_proximo_concurso: data.valor_acumulado_proximo_concurso,
        })
      );

      // Next contest = current + 1
      const currentNum = parseInt(String(data.numero_concurso), 10);
      const nextNum = isNaN(currentNum) ? null : currentNum + 1;

      if (!nextNum) {
        console.warn(`[sync-proximos] Sem número de concurso para ${loteria.key}`);
        results.push({ loteria: loteria.key, status: "sem_numero" });
        continue;
      }

      const dataProximo = converterDataBR(data.data_proximo_concurso ?? "");

      // valor_estimado_proximo_concurso is the estimated prize
      // If acumulou=true AND valor_acumulado_proximo_concurso > 0, use that instead
      const premioEstimado =
        data.valor_estimado_proximo_concurso ??
        data.valor_acumulado_proximo_concurso ??
        0;

      // acumulou refers to current contest; for next contest display,
      // if valor_acumulado_proximo_concurso > 0, it means next is accumulated
      const acumulado =
        (data.valor_acumulado_proximo_concurso ?? 0) > 0 || data.acumulou === true;

      const { error } = await supabase.from("proximos_concursos").upsert(
        {
          loteria: loteria.key,
          numero_concurso: String(nextNum),
          data_sorteio: dataProximo,
          premio_estimado: premioEstimado,
          acumulado,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "loteria" }
      );

      if (error) {
        throw new Error(`DB upsert error: ${error.message}`);
      }

      console.log(
        `[sync-proximos] ✅ ${loteria.key}: concurso ${nextNum}, prêmio ${premioEstimado}, acumulado ${acumulado}`
      );
      results.push({ loteria: loteria.key, status: "ok", concurso: String(nextNum) });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[sync-proximos] ❌ ${loteria.key}: ${msg}`);
      results.push({ loteria: loteria.key, status: `erro: ${msg}` });
    }
  }

  return new Response(JSON.stringify({ success: true, results }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
