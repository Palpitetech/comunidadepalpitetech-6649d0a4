import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GRACE_PERIOD_DAYS = 3;
const SUPPORT_PHONE = "51981854281";

const logStep = (step: string, details?: unknown) => {
  const suffix = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[OVERDUE-CHECK] ${step}${suffix}`);
};

function formatDate(isoStr: string): string {
  const d = new Date(isoStr);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatarCelularE164(celular: string): string {
  const numeros = celular.replace(/\D/g, "");
  if (!numeros.startsWith("55")) return `+55${numeros}`;
  return `+${numeros}`;
}

async function enviarSMS(
  to: string,
  body: string,
): Promise<{ success: boolean; error?: string }> {
  const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID") ?? "";
  const authToken = Deno.env.get("TWILIO_AUTH_TOKEN") ?? "";
  const from = Deno.env.get("TWILIO_PHONE_NUMBER") ?? "";

  if (!accountSid || !authToken || !from) {
    return { success: false, error: "Twilio not configured" };
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const credentials = btoa(`${accountSid}:${authToken}`);

  const params = new URLSearchParams({ To: to, From: from, Body: body });

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${credentials}`,
      },
      body: params,
    });
    const data = await res.json();
    if (data.sid) return { success: true };
    return { success: false, error: data.message || "Unknown Twilio error" };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : String(e) };
  }
}

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
  const today = new Date().toISOString().split("T")[0];

  // 1) Find all inadimplente users
  const { data: inadimplentes, error } = await admin
    .from("perfis")
    .select("id, nome, email, celular, status_assinatura, validade_assinatura, plan_id")
    .eq("status_assinatura", "inadimplente")
    .eq("is_bot", false)
    .limit(500);

  if (error) {
    logStep("Error fetching inadimplentes", { message: error.message });
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!inadimplentes || inadimplentes.length === 0) {
    logStep("No inadimplente users found");
    return new Response(JSON.stringify({ ok: true, processed: 0 }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  logStep("Found inadimplentes", { count: inadimplentes.length });

  // 2) For each user, find when they became inadimplente (first SUBSCRIPTION_OVERDUE event)
  const emails = inadimplentes.map((p) => p.email).filter(Boolean);
  const { data: overdueLogs } = await admin
    .from("kirvano_webhook_logs")
    .select("email, received_at")
    .in("event", ["SUBSCRIPTION_OVERDUE"])
    .in("email", emails)
    .order("received_at", { ascending: true });

  // Map: email -> first overdue date
  const firstOverdueMap = new Map<string, Date>();
  for (const log of overdueLogs || []) {
    if (log.email && !firstOverdueMap.has(log.email.toLowerCase())) {
      firstOverdueMap.set(log.email.toLowerCase(), new Date(log.received_at));
    }
  }

  // Fetch plans for checkout links
  const { data: plans } = await admin.from("plans").select("id, name, checkout_link");
  const planMap = new Map((plans || []).map((p) => [p.id, p]));

  let remindedCount = 0;
  let removedCount = 0;
  let errorCount = 0;

  for (const perfil of inadimplentes) {
    if (!perfil.email) continue;

    const firstOverdue = firstOverdueMap.get(perfil.email.toLowerCase());
    if (!firstOverdue) {
      // No overdue event logged, use updated_at as fallback — skip for safety
      logStep("No overdue event found, skipping", { email: perfil.email });
      continue;
    }

    const daysSinceOverdue = Math.floor(
      (Date.now() - firstOverdue.getTime()) / (1000 * 60 * 60 * 24)
    );

    const plan = perfil.plan_id ? planMap.get(perfil.plan_id) : null;
    const planName = plan?.name || "Premium";
    const checkoutLink = plan?.checkout_link || "https://comunidadepalpitetech.lovable.app/planos";
    const customerName = perfil.nome || "Jogador";

    logStep("Processing", { email: perfil.email, daysSinceOverdue });

    if (daysSinceOverdue >= GRACE_PERIOD_DAYS) {
      // === DAY 3+: Remove premium role ===
      logStep("Removing premium role", { email: perfil.email, daysSinceOverdue });

      try {
        // Remove premium role
        await admin
          .from("user_roles")
          .delete()
          .eq("user_id", perfil.id)
          .eq("role", "premium");

        // Update status to inativa
        await admin
          .from("perfis")
          .update({ status_assinatura: "inativa" })
          .eq("id", perfil.id);

        removedCount++;

        // Send final notification email
        const dedupKey = `inadimplente_removido:${perfil.id}:${today}`;
        const { data: existing } = await admin
          .from("notificacoes_pendentes")
          .select("id")
          .eq("chave_dedup", dedupKey)
          .maybeSingle();

        if (!existing) {
          await fetch(`${supabaseUrl}/functions/v1/send-subscription-email`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${supabaseAnonKey}`,
              "Content-Type": "application/json",
              apikey: supabaseAnonKey,
            },
            body: JSON.stringify({
              type: "inadimplente_removido",
              to: perfil.email,
              customerName,
              planName,
              checkoutLink,
            }),
          });

          // SMS
          if (perfil.celular) {
            await enviarSMS(
              formatarCelularE164(perfil.celular),
              `⛔ ${customerName}, seu acesso Premium no Palpite Tech foi suspenso por inadimplência. Renove agora: ${checkoutLink} — Suporte: (${SUPPORT_PHONE.substring(0, 2)}) ${SUPPORT_PHONE.substring(2, 7)}-${SUPPORT_PHONE.substring(7)}`
            );
          }

          await admin.from("notificacoes_pendentes").insert({
            tipo: "inadimplente_removido",
            chave_dedup: dedupKey,
            payload: { user_id: perfil.id, email: perfil.email, daysSinceOverdue },
            processado: true,
            processado_em: new Date().toISOString(),
          });
        }
      } catch (e) {
        errorCount++;
        logStep("Error removing role", { email: perfil.email, error: e instanceof Error ? e.message : String(e) });
      }
    } else {
      // === DAY 1-2: Send daily reminder ===
      const daysLeft = GRACE_PERIOD_DAYS - daysSinceOverdue;
      const dedupKey = `inadimplente_lembrete:${perfil.id}:${today}`;

      const { data: existing } = await admin
        .from("notificacoes_pendentes")
        .select("id")
        .eq("chave_dedup", dedupKey)
        .maybeSingle();

      if (existing) {
        logStep("Already reminded today", { email: perfil.email });
        continue;
      }

      try {
        // Email
        await fetch(`${supabaseUrl}/functions/v1/send-subscription-email`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${supabaseAnonKey}`,
            "Content-Type": "application/json",
            apikey: supabaseAnonKey,
          },
          body: JSON.stringify({
            type: "inadimplente_lembrete",
            to: perfil.email,
            customerName,
            planName,
            checkoutLink,
            daysLeft: String(daysLeft),
          }),
        });

        // SMS
        if (perfil.celular) {
          await enviarSMS(
            formatarCelularE164(perfil.celular),
            `⚠️ ${customerName}, seu pagamento do Palpite Tech está pendente! Regularize em ${daysLeft} dia(s) para manter o acesso Premium. Renove: ${checkoutLink}`
          );
        }

        await admin.from("notificacoes_pendentes").insert({
          tipo: "inadimplente_lembrete",
          chave_dedup: dedupKey,
          payload: { user_id: perfil.id, email: perfil.email, daysSinceOverdue, daysLeft },
          processado: true,
          processado_em: new Date().toISOString(),
        });

        remindedCount++;
        logStep("Reminder sent", { email: perfil.email, daysLeft });
      } catch (e) {
        errorCount++;
        logStep("Error sending reminder", { email: perfil.email, error: e instanceof Error ? e.message : String(e) });
      }
    }
  }

  logStep("Finished", { remindedCount, removedCount, errorCount });

  return new Response(
    JSON.stringify({ ok: true, reminded: remindedCount, removed: removedCount, errors: errorCount }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
