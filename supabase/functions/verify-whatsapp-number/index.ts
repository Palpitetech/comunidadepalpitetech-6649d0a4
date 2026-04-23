// Edge function pública: verifica se um número de WhatsApp é oficial
// Fonte de verdade: tabela `chip_celulares` (apenas chips ativos)
// IMPORTANTE: NUNCA retorna a lista de números — só "match" booleano.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

/** Normaliza qualquer formato BR → 11 dígitos (DDD + 9 + número) ou 10 dígitos. */
function normalizeBR(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  let n = digits;
  // Remove +55 se vier
  if (n.startsWith("55") && (n.length === 12 || n.length === 13)) {
    n = n.substring(2);
  }
  if (n.length !== 10 && n.length !== 11) return null;
  // DDD válido
  const ddd = parseInt(n.substring(0, 2), 10);
  if (isNaN(ddd) || ddd < 11 || ddd > 99) return null;
  return n;
}

/** Gera variantes (com/sem 9º dígito) para casar com qualquer formato salvo no banco. */
function variants(n: string): string[] {
  const set = new Set<string>();
  set.add(n);
  set.add(`55${n}`);
  if (n.length === 11 && n[2] === "9") {
    const sem9 = n.substring(0, 2) + n.substring(3);
    set.add(sem9);
    set.add(`55${sem9}`);
  } else if (n.length === 10) {
    const com9 = n.substring(0, 2) + "9" + n.substring(2);
    set.add(com9);
    set.add(`55${com9}`);
  }
  return Array.from(set);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { numero } = await req.json().catch(() => ({ numero: "" }));
    if (typeof numero !== "string" || numero.length > 30) {
      return new Response(JSON.stringify({ ok: false, reason: "invalid_input" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const normalized = normalizeBR(numero);
    if (!normalized) {
      return new Response(
        JSON.stringify({ ok: true, verified: false, reason: "invalid_format" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const tries = variants(normalized);
    const { data, error } = await supabase
      .from("chip_celulares")
      .select("id")
      .eq("ativo", true)
      .in("numero", tries)
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("[verify-whatsapp-number] db error", error.message);
      return new Response(JSON.stringify({ ok: false, reason: "db_error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ ok: true, verified: !!data }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("[verify-whatsapp-number] crash", (e as Error).message);
    return new Response(JSON.stringify({ ok: false, reason: "server_error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
