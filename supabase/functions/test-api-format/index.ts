import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const API_TOKEN = Deno.env.get("LOTOFACIL_API_TOKEN");
  
  const loterias = ["quina", "diadesorte", "lotomania"];
  const results: Record<string, any> = {};

  for (const loteria of loterias) {
    const url = `https://apiloterias.com.br/app/v2/resultado?loteria=${loteria}&token=${API_TOKEN}&concurso=ultimos1`;
    const res = await fetch(url);
    const data = await res.json();
    // Show all top-level keys and their types
    results[loteria] = {
      keys: Object.keys(data),
      is_array: Array.isArray(data),
      numero_concurso: data.numero_concurso,
      concurso: data.concurso,
      sample: JSON.stringify(data).substring(0, 500),
    };
  }

  return new Response(JSON.stringify(results, null, 2), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
