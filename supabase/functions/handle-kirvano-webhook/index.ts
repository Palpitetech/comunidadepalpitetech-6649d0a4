import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-test-mode, x-kirvano-signature, x-kirvano-token",
};

const logStep = (step: string, details?: unknown) => {
  const suffix = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[KIRVANO-WEBHOOK] ${step}${suffix}`);
};

function pickQueryAuth(reqUrl: string): { key: string; value: string } | null {
  // Some providers send the secret/token via querystring.
  // We accept multiple common keys to be resilient.
  let url: URL;
  try {
    url = new URL(reqUrl);
  } catch (_e) {
    return null;
  }

  const keys = ["token", "secret", "webhook_secret", "access_token"];
  for (const key of keys) {
    const value = url.searchParams.get(key);
    if (typeof value === "string" && value.trim()) {
      return { key, value: value.trim() };
    }
  }
  return null;
}

function timingSafeEqual(a: string, b: string) {
  // Deno doesn't provide constant-time string compare; do a byte compare.
  const aBytes = new TextEncoder().encode(a);
  const bBytes = new TextEncoder().encode(b);
  if (aBytes.length !== bBytes.length) return false;
  let diff = 0;
  for (let i = 0; i < aBytes.length; i++) diff |= aBytes[i] ^ bBytes[i];
  return diff === 0;
}

async function hmacSha256Hex(secret: string, payload: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function coalesce<T>(...values: Array<T | null | undefined>): T | undefined {
  for (const v of values) if (v !== null && v !== undefined) return v;
  return undefined;
}

function pickEmail(payload: any): string | undefined {
  const email = coalesce(
    payload?.email,
    payload?.buyer?.email,
    payload?.customer?.email,
    payload?.data?.buyer?.email,
    payload?.data?.customer?.email,
    payload?.subscription?.customer?.email,
    payload?.subscription?.email,
  );
  if (typeof email !== "string") return undefined;
  const normalized = email.trim().toLowerCase();
  return normalized.includes("@") ? normalized : undefined;
}

function pickEventName(payload: any): string {
  const ev = coalesce(payload?.event, payload?.type, payload?.name, payload?.action);
  return typeof ev === "string" ? ev : "unknown";
}

function pickStatus(payload: any): string {
  const st = coalesce(
    payload?.status,
    payload?.subscription?.status,
    payload?.data?.status,
    payload?.data?.subscription?.status,
  );
  return typeof st === "string" ? st : "";
}

function parseDateToIsoMaybe(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === "string") {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  }
  if (typeof value === "number") {
    // accept unix seconds or ms
    const ms = value < 1e12 ? value * 1000 : value;
    const d = new Date(ms);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  }
  return null;
}

function pickValidUntil(payload: any): string | null {
  return (
    parseDateToIsoMaybe(
      coalesce(
        payload?.valid_until,
        payload?.validade,
        payload?.subscription?.current_period_end,
        payload?.subscription?.current_period_end_at,
        payload?.subscription?.next_billing_at,
        payload?.data?.subscription?.current_period_end,
        payload?.data?.subscription?.next_billing_at,
      ),
    ) ?? null
  );
}

function mapToStatusAssinatura(statusOrEvent: string): "ativa" | "cancelada" | "inadimplente" | "inativa" {
  const s = (statusOrEvent || "").toLowerCase();

  if (
    [
      "active",
      "ativa",
      "approved",
      "paid",
      "confirmed",
      "success",
      "completed",
    ].some((k) => s.includes(k))
  ) {
    return "ativa";
  }

  if (["cancel", "canceled", "cancelled", "refunded", "chargeback"].some((k) => s.includes(k))) {
    return "cancelada";
  }

  if (["overdue", "past_due", "inadimpl", "unpaid", "failed"].some((k) => s.includes(k))) {
    return "inadimplente";
  }

  return "inativa";
}

async function isAdminFromBearer(authHeader: string | null) {
  if (!authHeader?.startsWith("Bearer ")) return false;

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  if (!supabaseUrl || !anonKey) return false;

  const client = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false },
    global: { headers: { Authorization: authHeader } },
  });

  const token = authHeader.replace("Bearer ", "");
  const { data: userData, error: userError } = await client.auth.getUser(token);
  if (userError || !userData.user?.id) return false;

  const { data: isAdmin, error: roleError } = await client.rpc("has_role", {
    _user_id: userData.user.id,
    _role: "admin",
  });

  if (roleError) return false;
  return Boolean(isAdmin);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const webhookSecret = Deno.env.get("KIRVANO_WEBHOOK_SECRET") ?? "";

  if (!supabaseUrl || !serviceRoleKey) {
    logStep("Missing backend env vars");
    return new Response(JSON.stringify({ error: "Server misconfigured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  if (!webhookSecret) {
    logStep("Missing KIRVANO_WEBHOOK_SECRET");
    return new Response(JSON.stringify({ error: "Webhook secret not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const rawBody = await req.text();
  // Consume body already via text()
  let payload: any = null;
  try {
    payload = rawBody ? JSON.parse(rawBody) : {};
  } catch (_e) {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const isTestMode = (req.headers.get("x-test-mode") || "").toLowerCase() === "true";
  const authHeader = req.headers.get("authorization");

  let authorized = false;
  if (isTestMode) {
    authorized = await isAdminFromBearer(authHeader);
    logStep("Test mode", { authorized });
  }

  if (!authorized) {
    const signature = req.headers.get("x-kirvano-signature") || req.headers.get("kirvano-signature");
    const token = req.headers.get("x-kirvano-token") || req.headers.get("kirvano-token");
    const queryAuth = pickQueryAuth(req.url);

    if (signature) {
      const expected = await hmacSha256Hex(webhookSecret, rawBody);
      authorized = timingSafeEqual(signature.trim().toLowerCase(), expected);
    } else if (token) {
      authorized = timingSafeEqual(token.trim(), webhookSecret);
    } else if (queryAuth) {
      authorized = timingSafeEqual(queryAuth.value, webhookSecret);
      logStep("Auth via query", { key: queryAuth.key, authorized });
    }
  }

  if (!authorized) {
    const signature = req.headers.get("x-kirvano-signature") || req.headers.get("kirvano-signature");
    const token = req.headers.get("x-kirvano-token") || req.headers.get("kirvano-token");
    const queryAuth = pickQueryAuth(req.url);
    logStep("Unauthorized webhook", {
      hasSignatureHeader: Boolean(signature),
      hasTokenHeader: Boolean(token),
      hasQueryToken: Boolean(queryAuth),
      queryKeyUsed: queryAuth?.key ?? null,
      isTestMode,
    });
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const eventName = pickEventName(payload);
  const rawStatus = pickStatus(payload);
  const mappedStatus = mapToStatusAssinatura(`${eventName} ${rawStatus}`);
  const email = pickEmail(payload);
  const validUntilIso = pickValidUntil(payload);

  logStep("Webhook received", {
    eventName,
    rawStatus,
    mappedStatus,
    email: email ?? null,
    validUntilIso,
  });

  if (!email) {
    // We accept the webhook to avoid provider retries; but we can't map it.
    logStep("No email in payload", { keys: Object.keys(payload ?? {}) });
    return new Response(JSON.stringify({ ok: true, skipped: true, reason: "missing_email" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

  const { data: perfil, error: perfilError } = await admin
    .from("perfis")
    .select("id, email, status_assinatura, validade_assinatura")
    .ilike("email", email)
    .maybeSingle();

  if (perfilError) {
    logStep("Error fetching perfil", { message: perfilError.message });
    return new Response(JSON.stringify({ error: "Failed to fetch user" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!perfil?.id) {
    logStep("Perfil not found for email", { email });
    return new Response(JSON.stringify({ ok: true, skipped: true, reason: "perfil_not_found" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const updateData: Record<string, any> = {
    status_assinatura: mappedStatus,
  };
  if (validUntilIso) updateData.validade_assinatura = validUntilIso;

  const { error: updateError } = await admin.from("perfis").update(updateData).eq("id", perfil.id);
  if (updateError) {
    logStep("Error updating perfil", { message: updateError.message });
    return new Response(JSON.stringify({ error: "Failed to update user" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Sync role premium
  if (mappedStatus === "ativa") {
    const { data: existing, error: existingError } = await admin
      .from("user_roles")
      .select("id")
      .eq("user_id", perfil.id)
      .eq("role", "premium")
      .limit(1);

    if (!existingError && (!existing || existing.length === 0)) {
      const { error: insertError } = await admin
        .from("user_roles")
        .insert({ user_id: perfil.id, role: "premium" });
      if (insertError) logStep("Failed to insert premium role", { message: insertError.message });
    }
  } else {
    const { error: deleteRoleError } = await admin
      .from("user_roles")
      .delete()
      .eq("user_id", perfil.id)
      .eq("role", "premium");
    if (deleteRoleError) logStep("Failed to delete premium role", { message: deleteRoleError.message });
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
