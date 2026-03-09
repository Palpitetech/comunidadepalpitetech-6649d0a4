import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: unknown) => {
  const suffix = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[SUBSCRIPTION-REMINDERS] ${step}${suffix}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(JSON.stringify({ error: "Server misconfigured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

  const now = new Date();
  const today = now.toISOString().split("T")[0]; // YYYY-MM-DD

  // Calculate target dates
  const in7Days = new Date(now);
  in7Days.setDate(in7Days.getDate() + 7);
  const in7DaysStr = in7Days.toISOString().split("T")[0];

  const in3Days = new Date(now);
  in3Days.setDate(in3Days.getDate() + 3);
  const in3DaysStr = in3Days.toISOString().split("T")[0];

  const ago7Days = new Date(now);
  ago7Days.setDate(ago7Days.getDate() - 7);
  const ago7DaysStr = ago7Days.toISOString().split("T")[0];

  // Fetch all active/inadimplente users with validade_assinatura set
  const { data: perfis, error } = await admin
    .from("perfis")
    .select("id, nome, email, validade_assinatura, status_assinatura, plan_id")
    .not("validade_assinatura", "is", null)
    .not("email", "is", null)
    .eq("is_bot", false)
    .limit(1000);

  if (error) {
    logStep("Error fetching perfis", { message: error.message });
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Fetch plans for checkout links
  const { data: plans } = await admin.from("plans").select("id, name, checkout_link");
  const planMap = new Map((plans || []).map((p) => [p.id, p]));

  // Dedup key: type + user_id + date
  const dedupKeys: string[] = [];
  const emailsToSend: Array<{
    type: string;
    to: string;
    customerName: string;
    validadeAssinatura: string;
    planName: string;
    checkoutLink: string;
    dedupKey: string;
  }> = [];

  for (const perfil of perfis || []) {
    if (!perfil.email || !perfil.validade_assinatura) continue;

    const validade = new Date(perfil.validade_assinatura);
    const validadeDate = validade.toISOString().split("T")[0];
    const plan = perfil.plan_id ? planMap.get(perfil.plan_id) : null;
    const planName = plan?.name || "Premium";
    const checkoutLink = plan?.checkout_link || "";

    const base = {
      to: perfil.email,
      customerName: perfil.nome || "Jogador",
      validadeAssinatura: perfil.validade_assinatura,
      planName,
      checkoutLink,
    };

    // Expira em 7 dias (validade date == today + 7)
    if (validadeDate === in7DaysStr && perfil.status_assinatura === "ativa") {
      const key = `expira_7dias:${perfil.id}:${today}`;
      dedupKeys.push(key);
      emailsToSend.push({ ...base, type: "expira_7dias", dedupKey: key });
    }

    // Expira em 3 dias
    if (validadeDate === in3DaysStr && perfil.status_assinatura === "ativa") {
      const key = `expira_3dias:${perfil.id}:${today}`;
      dedupKeys.push(key);
      emailsToSend.push({ ...base, type: "expira_3dias", dedupKey: key });
    }

    // Expirou hoje (renove)
    if (validadeDate === today && (perfil.status_assinatura === "ativa" || perfil.status_assinatura === "inativa")) {
      const key = `renove_assinatura:${perfil.id}:${today}`;
      dedupKeys.push(key);
      emailsToSend.push({ ...base, type: "renove_assinatura", dedupKey: key });
    }

    // Atrasada em 7 dias
    if (validadeDate === ago7DaysStr) {
      const key = `atrasada_7dias:${perfil.id}:${today}`;
      dedupKeys.push(key);
      emailsToSend.push({ ...base, type: "atrasada_7dias", dedupKey: key });
    }
  }

  if (emailsToSend.length === 0) {
    logStep("No reminders to send today");
    return new Response(JSON.stringify({ ok: true, sent: 0 }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Check dedup: which ones were already sent today?
  const { data: existing } = await admin
    .from("notificacoes_pendentes")
    .select("chave_dedup")
    .in("chave_dedup", dedupKeys)
    .eq("processado", true);

  const alreadySent = new Set((existing || []).map((e) => e.chave_dedup));

  let sentCount = 0;
  let errorCount = 0;

  for (const email of emailsToSend) {
    if (alreadySent.has(email.dedupKey)) {
      logStep("Skipping (already sent)", { key: email.dedupKey });
      continue;
    }

    try {
      // Call send-subscription-email function
      const res = await fetch(`${supabaseUrl}/functions/v1/send-subscription-email`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${supabaseAnonKey}`,
          "Content-Type": "application/json",
          apikey: supabaseAnonKey,
        },
        body: JSON.stringify({
          type: email.type,
          to: email.to,
          customerName: email.customerName,
          validadeAssinatura: email.validadeAssinatura,
          planName: email.planName,
          checkoutLink: email.checkoutLink,
        }),
      });

      if (res.ok) {
        sentCount++;
        // Record in notificacoes_pendentes for dedup
        await admin.from("notificacoes_pendentes").insert({
          tipo: `email_${email.type}`,
          chave_dedup: email.dedupKey,
          payload: { to: email.to, type: email.type },
          processado: true,
          processado_em: new Date().toISOString(),
        });
        logStep("Email sent", { type: email.type, to: email.to });
      } else {
        const errText = await res.text();
        errorCount++;
        logStep("Email send failed", { type: email.type, to: email.to, status: res.status, error: errText });
      }
    } catch (e) {
      errorCount++;
      logStep("Email send exception", { type: email.type, error: e instanceof Error ? e.message : String(e) });
    }
  }

  logStep("Finished", { sentCount, errorCount, total: emailsToSend.length });

  return new Response(JSON.stringify({ ok: true, sent: sentCount, errors: errorCount }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
