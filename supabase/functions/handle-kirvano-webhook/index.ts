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

function pickPhone(payload: any): string | null {
  const phone = coalesce(
    payload?.phone,
    payload?.buyer?.phone,
    payload?.buyer?.phone_number,
    payload?.customer?.phone,
    payload?.customer?.phone_number,
    payload?.data?.buyer?.phone,
    payload?.data?.buyer?.phone_number,
    payload?.data?.customer?.phone,
    payload?.data?.customer?.phone_number,
  );
  if (typeof phone !== "string") return null;
  const normalized = phone.trim();
  return normalized ? normalized : null;
}

function pickCpf(payload: any): string | null {
  const doc = coalesce(payload?.document, payload?.customer?.document, payload?.buyer?.document);
  if (typeof doc !== "string") return null;
  const normalized = doc.replace(/\D/g, "").trim();
  return normalized ? normalized : null;
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
    // Accept both ISO and formats like "2023-12-18 16:37:45"
    const normalized = value.includes(" ") && !value.includes("T") ? value.replace(" ", "T") : value;
    const d = new Date(normalized);
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

type SubscriptionAction = "activate" | "cancel" | "delinquent" | "ignore";

function deriveSubscriptionAction(eventName: string, rawStatus: string): SubscriptionAction {
  const s = `${eventName} ${rawStatus}`.toLowerCase();

  // Apenas pagos/confirmados ativam acesso
  if (["paid", "approved", "confirmed", "success", "completed"].some((k) => s.includes(k))) return "activate";

  if (["cancel", "canceled", "cancelled", "refunded", "chargeback"].some((k) => s.includes(k))) return "cancel";

  if (["overdue", "past_due", "inadimpl", "unpaid", "failed"].some((k) => s.includes(k))) return "delinquent";

  // PENDING / boleto gerado / eventos intermediários: só audita
  return "ignore";
}

function addDaysToIso(days: number): string {
  const ms = Math.max(0, Math.trunc(days)) * 24 * 60 * 60 * 1000;
  return new Date(Date.now() + ms).toISOString();
}

function pickOfferId(payload: any): string | null {
  const products = payload?.products;
  if (!Array.isArray(products) || products.length === 0) return null;
  const main = products.find((p: any) => p && p.is_order_bump === false) ?? products[0];
  const offerId = main?.offer_id ?? main?.offerId;
  return typeof offerId === "string" && offerId.trim() ? offerId.trim() : null;
}

function pickCustomerName(payload: any): string | null {
  const name = coalesce(payload?.customer?.name, payload?.buyer?.name, payload?.name);
  return typeof name === "string" && name.trim() ? name.trim() : null;
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
  const envWebhookSecret = Deno.env.get("KIRVANO_WEBHOOK_SECRET") ?? "";

  if (!supabaseUrl || !serviceRoleKey) {
    logStep("Missing backend env vars");
    return new Response(JSON.stringify({ error: "Server misconfigured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Always fetch DB token; accept either env or DB token
  let dbWebhookToken = "";
  try {
    const sbAdmin = createClient(supabaseUrl, serviceRoleKey);
    const { data } = await sbAdmin
      .from("admin_settings")
      .select("kirvano_webhook_token")
      .eq("id", "default")
      .single();
    dbWebhookToken = data?.kirvano_webhook_token ?? "";
  } catch (_e) {
    logStep("Failed to fetch token from admin_settings");
  }

  const webhookSecrets = [envWebhookSecret, dbWebhookToken].filter(Boolean);

  if (webhookSecrets.length === 0) {
    logStep("No webhook secret configured (env or DB)");
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
      for (const secret of webhookSecrets) {
        const expected = await hmacSha256Hex(secret, rawBody);
        if (timingSafeEqual(signature.trim().toLowerCase(), expected)) {
          authorized = true;
          break;
        }
      }
    } else if (token) {
      authorized = webhookSecrets.some((s) => timingSafeEqual(token.trim(), s));
    } else if (queryAuth) {
      authorized = webhookSecrets.some((s) => timingSafeEqual(queryAuth.value, s));
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
  const email = pickEmail(payload);
  const phone = pickPhone(payload);
  const cpf = pickCpf(payload);
  const offerId = pickOfferId(payload);
  const customerName = pickCustomerName(payload);

  const action = deriveSubscriptionAction(eventName, rawStatus);
  const mappedStatus = mapToStatusAssinatura(`${eventName} ${rawStatus}`);
  const validUntilIso = pickValidUntil(payload);

  logStep("Webhook received", {
    eventName,
    rawStatus,
    mappedStatus,
    email: email ?? null,
    validUntilIso,
    offerId,
    action,
  });

  const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

  // Descobre método de autorização para auditoria
  const authMethod = (() => {
    if (isTestMode) return "test_mode";
    const signature = req.headers.get("x-kirvano-signature") || req.headers.get("kirvano-signature");
    const token = req.headers.get("x-kirvano-token") || req.headers.get("kirvano-token");
    const queryAuth = pickQueryAuth(req.url);
    if (signature) return "signature";
    if (token) return "token_header";
    if (queryAuth) return `query:${queryAuth.key}`;
    return "unknown";
  })();

  // 1) Auditoria: registra SEMPRE o evento recebido
  const { data: logRow, error: logInsertError } = await admin
    .from("kirvano_webhook_logs")
    .insert({
      event: eventName,
      status: rawStatus || null,
      email: email ?? null,
      phone,
      checkout_id: typeof payload?.checkout_id === "string" ? payload.checkout_id : null,
      sale_id: typeof payload?.sale_id === "string" ? payload.sale_id : null,
      payment_method: typeof payload?.payment_method === "string" ? payload.payment_method : null,
      purchase_type: typeof payload?.type === "string" ? payload.type : null,
      authorized_method: authMethod,
      raw_payload: payload ?? {},
    })
    .select("id")
    .maybeSingle();

  if (logInsertError) {
    logStep("Failed to insert kirvano_webhook_logs", { message: logInsertError.message });
    // Não falha o webhook por auditoria
  }

  const finalizeLog = async (patch: Record<string, any>) => {
    if (!logRow?.id) return;
    const { error } = await admin.from("kirvano_webhook_logs").update(patch).eq("id", logRow.id);
    if (error) logStep("Failed to update kirvano_webhook_logs", { message: error.message });
  };

  if (!email) {
    logStep("No email in payload", { keys: Object.keys(payload ?? {}) });
    await finalizeLog({ processed: true, process_result: "missing_email" });
    return new Response(JSON.stringify({ ok: true, skipped: true, reason: "missing_email" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Regra do negócio: apenas pagos/confirmados ativam acesso
  if (action === "ignore") {
    await finalizeLog({ processed: true, process_result: "ignored_non_paid" });
    return new Response(JSON.stringify({ ok: true, ignored: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { data: perfil, error: perfilError } = await admin
    .from("perfis")
    .select("id, email, status_assinatura, validade_assinatura")
    .ilike("email", email)
    .maybeSingle();

  if (perfilError) {
    logStep("Error fetching perfil", { message: perfilError.message });
    await finalizeLog({ processed: true, process_result: "error_fetch_user", error: perfilError.message });
    return new Response(JSON.stringify({ error: "Failed to fetch user" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Para ativar precisamos do mapeamento offer -> plano (validade definida por plano)
  if (action === "activate") {
    if (!offerId) {
      await finalizeLog({ processed: true, process_result: "missing_offer_id" });
      return new Response(JSON.stringify({ ok: true, skipped: true, reason: "missing_offer_id" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: offerMap, error: offerMapError } = await admin
      .from("kirvano_offer_plan_map")
      .select("plan_id, days_valid, is_active")
      .eq("offer_id", offerId)
      .eq("is_active", true)
      .maybeSingle();

    if (offerMapError) {
      await finalizeLog({ processed: true, process_result: "error_offer_map", error: offerMapError.message });
      return new Response(JSON.stringify({ error: "Failed to resolve offer mapping" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!offerMap?.plan_id) {
      logStep("Offer mapping not found", { offerId });
      await finalizeLog({ processed: true, process_result: "offer_mapping_not_found" });
      return new Response(JSON.stringify({ ok: true, skipped: true, reason: "offer_mapping_not_found" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Se não houver perfil, cria conta com email+telefone e tenta novamente
    let targetPerfilId = perfil?.id ?? null;
    let isNewAccount = false;
    if (!targetPerfilId) {
      logStep("Perfil not found for email (will create auth user)", { email });
      try {
        const password = crypto.randomUUID();
        const { error: createUserError } = await admin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: {
            nome: customerName ?? undefined,
            phone_number: phone ?? undefined,
          },
        });

        if (createUserError) {
          const msg = createUserError.message?.toLowerCase?.() ?? "";
          const alreadyExists = msg.includes("already") || msg.includes("exists") || msg.includes("registered");
          if (!alreadyExists) throw createUserError;
          logStep("Auth user already exists", { email });
        } else {
          isNewAccount = true;
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        logStep("Failed to create auth user", { message: msg });
        await finalizeLog({ processed: true, process_result: "error_create_user", error: msg });
        return new Response(JSON.stringify({ error: "Failed to create user" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: perfil2, error: perfil2Error } = await admin
        .from("perfis")
        .select("id, email")
        .ilike("email", email)
        .maybeSingle();

      if (perfil2Error || !perfil2?.id) {
        const msg = perfil2Error?.message ?? "perfil_not_created";
        await finalizeLog({ processed: true, process_result: "error_fetch_created_profile", error: msg });
        return new Response(JSON.stringify({ error: "Failed to load created profile" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      targetPerfilId = perfil2.id;

      // Envia email de boas-vindas com link para definir senha
      try {
        const siteUrl = "https://comunidadepalpitetech.lovable.app";
        const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
          type: "recovery",
          email,
          options: { redirectTo: `${siteUrl}/login` },
        });

        if (linkError) {
          logStep("Failed to generate recovery link", { message: linkError.message });
        } else {
          const recoveryLink = linkData?.properties?.action_link;
          if (recoveryLink) {
            const resendApiKey = Deno.env.get("RESEND_API_KEY");
            if (resendApiKey) {
              const displayName = customerName ?? "Jogador";
              const emailHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#ffffff;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:40px 24px;">
    <div style="text-align:center;margin-bottom:32px;">
      <h1 style="color:#1a1a2e;font-size:24px;margin:0 0 8px;">🎯 Bem-vindo(a) à Palpite Tech!</h1>
      <p style="color:#6b7280;font-size:16px;margin:0;">Sua conta foi criada com sucesso</p>
    </div>
    <div style="background:#f8fafc;border-radius:12px;padding:24px;margin-bottom:24px;">
      <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 16px;">
        Olá, <strong>${displayName}</strong>! 👋
      </p>
      <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 16px;">
        Seu acesso à <strong>Comunidade Palpite Tech</strong> já está ativo. Para entrar, clique no botão abaixo e defina sua senha:
      </p>
      <div style="text-align:center;margin:24px 0;">
        <a href="${recoveryLink}" style="display:inline-block;background:#7c3aed;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:16px;font-weight:bold;">
          Definir minha senha e acessar
        </a>
      </div>
      <p style="color:#6b7280;font-size:14px;line-height:1.5;margin:0;">
        Após definir sua senha, use seu email <strong>${email}</strong> para fazer login sempre que quiser.
      </p>
    </div>
    <div style="text-align:center;padding-top:16px;border-top:1px solid #e5e7eb;">
      <p style="color:#9ca3af;font-size:12px;margin:0;">
        Se você não solicitou essa conta, ignore este email.
      </p>
      <p style="color:#9ca3af;font-size:12px;margin:8px 0 0;">
        © Palpite Tech — Comunidade de Loteria
      </p>
    </div>
  </div>
</body>
</html>`;

              const resendRes = await fetch("https://api.resend.com/emails", {
                method: "POST",
                headers: {
                  "Authorization": `Bearer ${resendApiKey}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  from: "Palpite Tech <noreply@resend.dev>",
                  to: [email],
                  subject: "🎯 Seu acesso à Palpite Tech está pronto!",
                  html: emailHtml,
                }),
              });

              if (!resendRes.ok) {
                const errText = await resendRes.text();
                logStep("Resend email failed", { status: resendRes.status, body: errText });
              } else {
                logStep("Welcome email sent successfully", { email, isNewAccount });
              }
            } else {
              logStep("RESEND_API_KEY not configured, skipping welcome email");
            }
          }
        }
      } catch (emailErr) {
        logStep("Welcome email error (non-fatal)", { message: emailErr instanceof Error ? emailErr.message : String(emailErr) });
      }
    }

    const daysValid = typeof offerMap.days_valid === "number" ? offerMap.days_valid : 30;
    const validade = addDaysToIso(daysValid);

    const updateData: Record<string, any> = {
      status_assinatura: "ativa",
      validade_assinatura: validade,
      plan_id: offerMap.plan_id,
    };
    if (phone) updateData.celular = phone;
    if (cpf) updateData.cpf = cpf;
    if (customerName) updateData.nome = customerName;

    const { error: updateError } = await admin.from("perfis").update(updateData).eq("id", targetPerfilId);
    if (updateError) {
      logStep("Error updating perfil", { message: updateError.message });
      await finalizeLog({ processed: true, process_result: "error_update_profile", error: updateError.message });
      return new Response(JSON.stringify({ error: "Failed to update user" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Track referral conversion: mark referred user as converted and check milestones
    try {
      const { data: convite } = await admin
        .from("convites")
        .select("id, referrer_id, converted_at")
        .eq("referred_id", targetPerfilId)
        .maybeSingle();

      if (convite && !convite.converted_at) {
        await admin
          .from("convites")
          .update({ converted_at: new Date().toISOString() })
          .eq("id", convite.id);

        // Check if referrer hit a milestone
        await admin.rpc("check_referral_milestones", { p_referrer_id: convite.referrer_id });
        logStep("Referral conversion tracked", { referrer_id: convite.referrer_id, referred_id: targetPerfilId });
      }
    } catch (e) {
      logStep("Referral tracking error (non-fatal)", { message: e instanceof Error ? e.message : String(e) });
    }

    // Sync role premium
    const { data: existing, error: existingError } = await admin
      .from("user_roles")
      .select("id")
      .eq("user_id", targetPerfilId)
      .eq("role", "premium")
      .limit(1);

    if (!existingError && (!existing || existing.length === 0)) {
      const { error: insertError } = await admin.from("user_roles").insert({ user_id: targetPerfilId, role: "premium" });
      if (insertError) logStep("Failed to insert premium role", { message: insertError.message });
    }

    await finalizeLog({ processed: true, process_result: targetPerfilId === perfil?.id ? "updated_user_activated" : "created_user_activated" });
  } else {
    // cancel / delinquent: se existir perfil, atualiza status e remove premium
    if (!perfil?.id) {
      await finalizeLog({ processed: true, process_result: "no_profile_to_update" });
      return new Response(JSON.stringify({ ok: true, skipped: true, reason: "perfil_not_found" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const statusToSet = action === "cancel" ? "cancelada" : "inadimplente";
    const { error: updateError } = await admin.from("perfis").update({ status_assinatura: statusToSet }).eq("id", perfil.id);
    if (updateError) {
      await finalizeLog({ processed: true, process_result: "error_update_profile", error: updateError.message });
      return new Response(JSON.stringify({ error: "Failed to update user" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { error: deleteRoleError } = await admin.from("user_roles").delete().eq("user_id", perfil.id).eq("role", "premium");
    if (deleteRoleError) logStep("Failed to delete premium role", { message: deleteRoleError.message });
    await finalizeLog({ processed: true, process_result: action === "cancel" ? "canceled_removed_role" : "delinquent_removed_role" });
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
