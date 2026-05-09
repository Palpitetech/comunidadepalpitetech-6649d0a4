import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { toCanonicalBR } from "../_shared/br-phone.ts";

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

function normalizePhone(raw: string): string {
  // Usa o helper compartilhado (insere o 9 quando faltar, valida DDD, remove DDI).
  // Se o número for inválido, devolve string vazia — o caller decide.
  return toCanonicalBR(raw) ?? "";
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
  const normalized = normalizePhone(phone);
  // Só retorna se for um número BR válido (10 ou 11 dígitos canônicos).
  return normalized.length === 10 || normalized.length === 11 ? normalized : null;
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

type SubscriptionAction = "activate" | "cancel" | "cancel_end_of_period" | "overdue_grace" | "delinquent" | "ignore";

function deriveSubscriptionAction(eventName: string, rawStatus: string): SubscriptionAction {
  const ev = eventName.toLowerCase();
  const s = `${eventName} ${rawStatus}`.toLowerCase();

  // Eventos de pagamento expirado/gerado são intermediários — nunca devem afetar assinatura
  const ignoredEvents = [
    "bank_slip_generated", "bank_slip_expired",
    "pix_generated", "pix_expired",
    "sale_refused",
  ];
  if (ignoredEvents.some((k) => ev.includes(k))) return "ignore";

  // Apenas pagos/confirmados ativam acesso
  if (["paid", "approved", "confirmed", "success", "completed"].some((k) => s.includes(k))) return "activate";

  // Cancelamento de assinatura recorrente: mantém acesso até fim da validade
  if (ev === "subscription_canceled" || ev === "subscription_cancelled") return "cancel_end_of_period";

  // Inadimplência de assinatura recorrente: mantém acesso temporário (grace period)
  if (ev === "subscription_overdue") return "overdue_grace";

  // Cancelamentos imediatos (reembolso, chargeback) removem acesso na hora
  if (["cancel", "canceled", "cancelled", "refunded", "chargeback"].some((k) => s.includes(k))) return "cancel";

  if (["overdue", "past_due", "inadimpl", "unpaid", "failed"].some((k) => s.includes(k))) return "delinquent";

  // Outros eventos intermediários: só audita
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

function pickAttribution(payload: any): Record<string, string> {
  const utm = payload?.utm ?? {};
  const cookies = payload?.cookies ?? {};
  const attr: Record<string, string> = {};

  const set = (key: string, val: unknown) => {
    if (typeof val === "string") {
      const trimmed = val.trim();
      if (trimmed && trimmed.toLowerCase() !== "null") attr[key] = trimmed;
    }
  };

  set("utm_source", utm.utm_source || utm.src);
  set("utm_medium", utm.utm_medium);
  set("utm_campaign", utm.utm_campaign);
  set("utm_content", utm.utm_content);
  set("utm_term", utm.utm_term);
  set("gclid", cookies.gclid);
  set("fbclid", cookies.fbclid);
  set("fbp", cookies.fbp);
  set("ttp", cookies.ttp);
  set("landing_page", payload?.checkout_url);
  set("source_channel", "kirvano");

  return attr;
}

async function isAdminFromBearer(authHeader: string | null) {
  if (!authHeader?.startsWith("Bearer ")) return false;

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  if (!supabaseUrl || !anonKey) return false;

  const client = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false },
    global: { headers: { Authorization: authHeader } },
  }) as any;

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
    const sbAdmin = createClient(supabaseUrl, serviceRoleKey) as any;
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

  const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } }) as any;

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

  // ============================================================
  // Mapeamento canônico de eventos da Kirvano → event_type interno
  // (deve cobrir TODOS os eventos que o webhook recebe)
  // ============================================================
  const KIRVANO_EVENT_MAP: Record<string, string> = {
    sale_approved: "compra_aprovada",
    sale_refunded: "compra_reembolsada",
    sale_chargeback: "compra_chargeback",
    sale_refused: "compra_recusada",
    subscription_renewed: "assinatura_renovada",
    subscription_canceled: "assinatura_cancelada",
    subscription_cancelled: "assinatura_cancelada",
    subscription_expired: "assinatura_expirada",
    subscription_overdue: "assinatura_inadimplente",
    pix_generated: "pix_gerado",
    pix_expired: "pix_expirado",
    bank_slip_generated: "boleto_gerado",
    bank_slip_expired: "boleto_expirado",
    abandoned_cart: "carrinho_abandonado",
    checkout_abandoned: "checkout_abandonado",
  };

  const mapKirvanoEventType = (raw: string): string => {
    const key = (raw || "").toLowerCase();
    return KIRVANO_EVENT_MAP[key] ?? key;
  };

  // Mapa event_type interno → tag no perfil (gestão de CRM, separada do log)
  const EVENT_TAG_MAP: Record<string, string> = {
    novo_cadastro: "comunidade",
    compra_aprovada: "ativo",
    assinatura_renovada: "ativo",
    pix_gerado: "pix_gerado",
    pix_expirado: "pix_expirado",
    boleto_gerado: "boleto_gerado",
    boleto_expirado: "boleto_expirado",
    assinatura_cancelada: "cancelado",
    assinatura_expirada: "cancelado",
    assinatura_inadimplente: "inadimplente",
    compra_reembolsada: "cancelado",
    compra_chargeback: "cancelado",
    checkout_abandonado: "checkout_abandonado",
    carrinho_abandonado: "carrinho_abandonado",
  };

  const PLAN_TAGS = ["gratis", "mensal", "semestral", "anual", "anual-vip"];

  const TAG_REMOVES: Record<string, string[]> = {
    inadimplente: ["ativo"],
    cancelado: ["ativo", "inadimplente"],
    ativo: ["inadimplente", "cancelado", "pix_expirado", "boleto_expirado", "pix_gerado", "boleto_gerado"],
    pix_expirado: ["pix_gerado"],
    boleto_expirado: ["boleto_gerado"],
  };

  // ============================================================
  // insertKirvanoEvent: SEMPRE grava em events (append-only).
  // - Se userId existir → grava com user_id
  // - Senão → grava com lead_email/lead_phone (lead anônimo)
  // ============================================================
  const insertKirvanoEvent = async (
    eventType: string,
    args: {
      userId?: string | null;
      meta?: Record<string, any>;
    } = {},
  ) => {
    try {
      const userId = args.userId ?? null;
      await admin.from("events").insert({
        user_id: userId,
        lead_email: userId ? null : (email ?? null),
        lead_phone: userId ? null : (phone ?? null),
        event_type: eventType,
        source: "kirvano",
        metadata: {
          ...(args.meta ?? {}),
          webhook_event: eventName,
          email: email ?? null,
          phone: phone ?? null,
        },
      });
      logStep("Event logged", { eventType, hasUser: !!userId });
    } catch (e) {
      logStep("Event insert error (non-fatal)", {
        eventType,
        message: e instanceof Error ? e.message : String(e),
      });
    }
  };

  // ============================================================
  // applyKirvanoTags: gerencia tags do perfil — só roda quando há userId.
  // Separado do log para deixar claro que events é append-only.
  // ============================================================
  const applyKirvanoTags = async (
    userId: string,
    eventType: string,
    meta: Record<string, any> = {},
  ) => {
    try {
      const tag = EVENT_TAG_MAP[eventType] ?? eventType;
      const { data: perfRow } = await admin
        .from("perfis")
        .select("tags")
        .eq("id", userId)
        .single();
      let currentTags: string[] = perfRow?.tags ?? [];

      const toRemove = TAG_REMOVES[tag] ?? [];
      if (toRemove.length > 0) {
        currentTags = currentTags.filter((t) => !toRemove.includes(t));
      }

      if (!currentTags.includes(tag)) {
        currentTags.push(tag);
      }

      if (meta.plan_id) {
        const { data: planRow } = await admin
          .from("plans")
          .select("slug")
          .eq("id", meta.plan_id)
          .single();
        if (planRow?.slug) {
          const slugToTag: Record<string, string> = {
            gratis: "gratis",
            mensal: "mensal",
            semestral: "semestral",
            anual: "anual",
            "plano-anual-vip": "anual-vip",
          };
          const planTag = slugToTag[planRow.slug] ?? planRow.slug;
          currentTags = currentTags.filter((t) => !PLAN_TAGS.includes(t));
          currentTags.push(planTag);
          logStep("Plan tag updated", { planTag, slug: planRow.slug });
        }
      }

      await admin.from("perfis").update({ tags: currentTags }).eq("id", userId);
      logStep("Tags applied", { eventType, tag, removed: toRemove, userId });
    } catch (e) {
      logStep("Apply tags error (non-fatal)", {
        eventType,
        message: e instanceof Error ? e.message : String(e),
      });
    }
  };

  // ============================================================
  // insertEvent (legado): mantém compatibilidade — log + tags.
  // Usado pelos blocos "activate/cancel/overdue" mais abaixo.
  // ============================================================
  const insertEvent = async (
    userId: string,
    eventType: string,
    meta: Record<string, any> = {},
  ) => {
    await insertKirvanoEvent(eventType, { userId, meta });
    await applyKirvanoTags(userId, eventType, meta);
  };

  // ============================================================
  // SEMPRE registra o evento na tabela `events` (append-only),
  // ANTES de qualquer decisão (ignore/activate/cancel).
  // - Se já existe perfil → user_id preenchido
  // - Se não existe → grava como lead anônimo (lead_email/lead_phone)
  // ============================================================
  const earlyEventType = mapKirvanoEventType(eventName);

  // Resolve perfil existente (se houver) — sem bloquear
  let earlyUserId: string | null = null;
  if (email) {
    try {
      const { data: perfilEarly } = await admin
        .from("perfis")
        .select("id")
        .ilike("email", email)
        .maybeSingle();
      if (perfilEarly?.id) earlyUserId = perfilEarly.id as string;
    } catch (_e) {
      // não-fatal
    }
  }

  // Resolve plan_slug a partir da oferta (útil para PIX/boleto/checkout)
  let earlyPlanSlug: string | null = null;
  if (offerId) {
    try {
      const { data: mapRow } = await admin
        .from("kirvano_offer_plan_map")
        .select("plan_id, plans:plan_id(slug)")
        .eq("offer_id", offerId)
        .eq("is_active", true)
        .maybeSingle();
      const planRel: any = (mapRow as any)?.plans;
      if (planRel?.slug) earlyPlanSlug = planRel.slug as string;
    } catch (_e) {
      // não-fatal
    }
  }

  // Metadata canônica gravada para QUALQUER evento da Kirvano
  const earlyPixMeta = (payload?.payment ?? {}) as Record<string, any>;
  const earlyMeta: Record<string, any> = {
    payment_method: payload?.payment_method ?? null,
    total_price: payload?.total_price ?? null,
    plan_slug: earlyPlanSlug,
    offer_id: offerId,
    sale_id: typeof payload?.sale_id === "string" ? payload.sale_id : null,
    checkout_id: typeof payload?.checkout_id === "string" ? payload.checkout_id : null,
    customer_name: customerName,
    raw_status: rawStatus || null,
  };
  // Para PIX: inclui dados do pagamento
  if (earlyEventType === "pix_gerado" || earlyEventType === "pix_expirado") {
    earlyMeta.pix_codigo = earlyPixMeta?.qrcode ?? null;
    earlyMeta.pix_expires_at = earlyPixMeta?.expires_at ?? null;
  }
  // Para assinaturas: inclui validade
  if (
    earlyEventType === "assinatura_renovada" ||
    earlyEventType === "assinatura_expirada" ||
    earlyEventType === "assinatura_cancelada" ||
    earlyEventType === "assinatura_inadimplente" ||
    earlyEventType === "compra_aprovada"
  ) {
    earlyMeta.valid_until = validUntilIso;
  }

  await insertKirvanoEvent(earlyEventType, { userId: earlyUserId, meta: earlyMeta });

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
    // Se for PIX gerado, envia email com dados do PIX
    const ev = eventName.toLowerCase();
    if (ev.includes("pix_generated") && email) {
      try {
        const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
        const pixPayment = payload?.payment ?? {};
        const emailPayload = {
          type: "pix_generated",
          to: email,
          customerName: customerName ?? "Jogador",
          pixQrCode: pixPayment.qrcode ?? null,
          pixQrCodeImage: pixPayment.qrcode_image ?? null,
          pixExpiresAt: pixPayment.expires_at ?? null,
          totalPrice: payload?.total_price ?? null,
        };
        const emailRes = await fetch(`${supabaseUrl}/functions/v1/send-subscription-email`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${supabaseAnonKey}`,
            "Content-Type": "application/json",
            apikey: supabaseAnonKey,
          },
          body: JSON.stringify(emailPayload),
        });
        if (emailRes.ok) {
          logStep("PIX email sent", { email });
        } else {
          logStep("PIX email failed", { status: emailRes.status });
        }
      } catch (e) {
        logStep("PIX email error (non-fatal)", { message: e instanceof Error ? e.message : String(e) });
      }
    }

    // Aplica tags + atribuição APENAS se houver perfil (evento já foi registrado acima)
    if (earlyUserId) {
      await applyKirvanoTags(earlyUserId, earlyEventType, earlyMeta);

      try {
        const attr = pickAttribution(payload);
        if (Object.keys(attr).length > 0) {
          await admin.rpc("merge_user_attribution", {
            p_user_id: earlyUserId,
            p_new_attr: attr,
            p_mark_purchase: false,
            p_source: `kirvano:${earlyEventType || "intermediate"}`,
          });
        }
      } catch (e) {
        logStep("Attribution merge error on intermediate event", { message: e instanceof Error ? e.message : String(e) });
      }
    }

    await finalizeLog({ processed: true, process_result: "ignored_non_paid" });
    return new Response(JSON.stringify({ ok: true, ignored: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Busca centralizada: email → celular (evita duplicar conta quando cliente paga
  // com email diferente do cadastro mas mesmo WhatsApp)
  const phoneNorm = phone ? normalizePhone(phone) : null;
  const { data: foundContact, error: foundErr } = await admin.rpc("find_user_by_contact", {
    p_email: email,
    p_celular: phoneNorm,
  });
  if (foundErr) {
    logStep("Error in find_user_by_contact", { message: foundErr.message });
  }
  const foundData = foundContact as { user_id?: string | null; found_by?: string | null; email?: string | null } | null;

  let perfil: { id: string; email: string | null; status_assinatura: string | null; validade_assinatura: string | null } | null = null;
  let perfilError: { message: string } | null = null;

  if (foundData?.user_id) {
    const { data: perfilFound, error: perfilFoundError } = await admin
      .from("perfis")
      .select("id, email, status_assinatura, validade_assinatura")
      .eq("id", foundData.user_id)
      .maybeSingle();
    perfil = perfilFound;
    perfilError = perfilFoundError;
    if (foundData.found_by === "celular") {
      logStep("Reusing existing account matched by phone", {
        original_email: foundData.email,
        kirvano_email: email,
      });
    }
  }

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
        const password = "12345678"; // senha padrão para auto-criação (usuário troca depois)
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

    // Marcador interno: confirma a ativação do acesso (separado do compra_aprovada gravado cedo)
    await insertKirvanoEvent("sale_confirmed", {
      userId: targetPerfilId!,
      meta: {
        plan_id: offerMap.plan_id,
        days_valid: daysValid,
        offer_id: offerId,
        payment_method: payload?.payment_method ?? null,
        customer_name: customerName,
        is_new_account: isNewAccount,
      },
    });
    // Aplica tags do plano (ativo + tag de plano)
    await applyKirvanoTags(targetPerfilId!, "compra_aprovada", { plan_id: offerMap.plan_id });

    // Atribuição de marketing — first-touch + marca primeira compra
    try {
      const attr = pickAttribution(payload);
      await admin.rpc("merge_user_attribution", {
        p_user_id: targetPerfilId,
        p_new_attr: attr,
        p_mark_purchase: true,
        p_purchase_at: new Date().toISOString(),
        p_source: "kirvano:sale_approved",
      });
      logStep("Attribution merged on activation", { user_id: targetPerfilId, keys: Object.keys(attr) });
    } catch (e) {
      logStep("Attribution merge error (non-fatal)", { message: e instanceof Error ? e.message : String(e) });
    }

    await finalizeLog({ processed: true, process_result: targetPerfilId === perfil?.id ? "updated_user_activated" : "created_user_activated" });
  } else if (action === "cancel_end_of_period") {
    // SUBSCRIPTION_CANCELED: mantém acesso até validade_assinatura expirar
    if (!perfil?.id) {
      await finalizeLog({ processed: true, process_result: "no_profile_to_update" });
      return new Response(JSON.stringify({ ok: true, skipped: true, reason: "perfil_not_found" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Marca como cancelada mas NÃO remove premium role — acesso continua até validade
    const { error: updateError } = await admin
      .from("perfis")
      .update({ status_assinatura: "cancelada" })
      .eq("id", perfil.id);

    if (updateError) {
      await finalizeLog({ processed: true, process_result: "error_update_profile", error: updateError.message });
      return new Response(JSON.stringify({ error: "Failed to update user" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    logStep("Subscription canceled (end of period)", {
      userId: perfil.id,
      validade: perfil.validade_assinatura,
    });

    // Envia email de cancelamento
    try {
      const resendApiKey = Deno.env.get("RESEND_API_KEY");
      if (resendApiKey && email) {
        const validadeDate = perfil.validade_assinatura
          ? new Date(perfil.validade_assinatura).toLocaleDateString("pt-BR")
          : "não definida";

        const emailHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#ffffff;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:40px 24px;">
    <div style="text-align:center;margin-bottom:32px;">
      <h1 style="color:#1a1a2e;font-size:24px;margin:0 0 8px;">Assinatura cancelada</h1>
      <p style="color:#6b7280;font-size:16px;margin:0;">Sentiremos sua falta! 😢</p>
    </div>
    <div style="background:#f8fafc;border-radius:12px;padding:24px;margin-bottom:24px;">
      <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 16px;">
        Olá! Recebemos o cancelamento da sua assinatura na <strong>Palpite Tech</strong>.
      </p>
      <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 16px;">
        Seu acesso continua ativo até <strong>${validadeDate}</strong>. Após essa data, sua conta voltará ao plano gratuito.
      </p>
      <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 16px;">
        Se mudar de ideia, você pode renovar a qualquer momento na página de planos.
      </p>
      <div style="text-align:center;margin:24px 0;">
        <a href="https://comunidadepalpitetech.lovable.app/planos" style="display:inline-block;background:#7c3aed;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:16px;font-weight:bold;">
          Ver planos
        </a>
      </div>
    </div>
    <div style="text-align:center;padding-top:16px;border-top:1px solid #e5e7eb;">
      <p style="color:#9ca3af;font-size:12px;margin:0;">© Palpite Tech — Comunidade de Loteria</p>
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
            subject: "Sua assinatura foi cancelada — Palpite Tech",
            html: emailHtml,
          }),
        });

        if (!resendRes.ok) {
          logStep("Cancellation email failed", { status: resendRes.status });
        } else {
          logStep("Cancellation email sent", { email });
        }
      }
    } catch (e) {
      logStep("Cancellation email error (non-fatal)", { message: e instanceof Error ? e.message : String(e) });
    }

    // Evento já foi registrado cedo — apenas aplica tags
    await applyKirvanoTags(perfil.id, "assinatura_cancelada", {
      validade: perfil.validade_assinatura,
    });

    await finalizeLog({ processed: true, process_result: "subscription_canceled_end_of_period" });
  } else if (action === "overdue_grace") {
    // SUBSCRIPTION_OVERDUE: marca inadimplente mas mantém premium (grace period)
    if (!perfil?.id) {
      await finalizeLog({ processed: true, process_result: "no_profile_to_update" });
      return new Response(JSON.stringify({ ok: true, skipped: true, reason: "perfil_not_found" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { error: updateError } = await admin
      .from("perfis")
      .update({ status_assinatura: "inadimplente" })
      .eq("id", perfil.id);

    if (updateError) {
      await finalizeLog({ processed: true, process_result: "error_update_profile", error: updateError.message });
      return new Response(JSON.stringify({ error: "Failed to update user" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    logStep("Subscription overdue (grace period)", {
      userId: perfil.id,
      validade: perfil.validade_assinatura,
    });

    // Envia email de aviso de inadimplência
    try {
      const resendApiKey = Deno.env.get("RESEND_API_KEY");
      if (resendApiKey && email) {
        const validadeDate = perfil.validade_assinatura
          ? new Date(perfil.validade_assinatura).toLocaleDateString("pt-BR")
          : "não definida";

        const emailHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#ffffff;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:40px 24px;">
    <div style="text-align:center;margin-bottom:32px;">
      <h1 style="color:#1a1a2e;font-size:24px;margin:0 0 8px;">⚠️ Pagamento pendente</h1>
      <p style="color:#6b7280;font-size:16px;margin:0;">Regularize para manter seu acesso</p>
    </div>
    <div style="background:#fefce8;border:1px solid #fbbf24;border-radius:12px;padding:24px;margin-bottom:24px;">
      <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 16px;">
        Olá, <strong>${customerName || (perfil as any).nome || "Jogador"}</strong>! 👋
      </p>
      <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 16px;">
        Identificamos que o pagamento da sua assinatura na <strong>Palpite Tech</strong> está pendente.
      </p>
      <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 16px;">
        Seu acesso continua ativo por enquanto, mas se o pagamento não for regularizado, ele será suspenso em breve.
      </p>
      <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 0;">
        <strong>Regularize agora para não perder acesso às ferramentas premium, palpites por IA e análises avançadas.</strong>
      </p>
      <div style="text-align:center;margin:24px 0;">
        <a href="https://comunidadepalpitetech.lovable.app/planos" style="display:inline-block;background:#7c3aed;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:16px;font-weight:bold;">
          Regularizar pagamento
        </a>
      </div>
    </div>
    <div style="background:#f0fdf4;border-radius:8px;padding:16px;margin-bottom:24px;text-align:center;">
      <p style="color:#374151;font-size:14px;margin:0 0 8px;"><strong>Precisa de ajuda?</strong></p>
      <a href="https://wa.me/5551981854281" style="display:inline-block;background:#25D366;color:#ffffff;text-decoration:none;padding:10px 24px;border-radius:8px;font-size:14px;font-weight:bold;">
        💬 Falar no WhatsApp
      </a>
    </div>
    <div style="text-align:center;padding-top:16px;border-top:1px solid #e5e7eb;">
      <p style="color:#9ca3af;font-size:12px;margin:0;">© Palpite Tech — Comunidade de Loteria</p>
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
            subject: "⚠️ Pagamento pendente — Palpite Tech",
            html: emailHtml,
          }),
        });

        if (!resendRes.ok) {
          logStep("Overdue email failed", { status: resendRes.status });
        } else {
          logStep("Overdue email sent", { email });
        }
      }
    } catch (e) {
      logStep("Overdue email error (non-fatal)", { message: e instanceof Error ? e.message : String(e) });
    }

    // Evento já foi registrado cedo — apenas aplica tags
    await applyKirvanoTags(perfil.id, "assinatura_inadimplente", {
      validade: perfil.validade_assinatura,
    });

    await finalizeLog({ processed: true, process_result: "subscription_overdue_grace" });
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

    const eventType = action === "cancel" ? "assinatura_cancelada" : "assinatura_inadimplente";
    // Evento já foi registrado cedo — apenas aplica tags
    await applyKirvanoTags(perfil.id, eventType, { action });

    const { error: deleteRoleError } = await admin.from("user_roles").delete().eq("user_id", perfil.id).eq("role", "premium");
    if (deleteRoleError) logStep("Failed to delete premium role", { message: deleteRoleError.message });
    await finalizeLog({ processed: true, process_result: action === "cancel" ? "canceled_removed_role" : "delinquent_removed_role" });
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
