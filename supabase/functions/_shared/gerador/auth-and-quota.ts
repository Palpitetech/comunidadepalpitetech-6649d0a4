// =============================================================================
// Auth + plano + quota — único ponto de verdade para os geradores.
// =============================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export interface AuthAndQuotaResult {
  ok: true;
  userId: string;
  isAdmin: boolean;
  hasGeradorFeature: boolean;
  maxPerDay: number;        // -1 = infinito (admin)
  remainingToday: number;
  currentUsage: number;     // só usado em /gerador (não-atômico legacy)
  supabaseAdmin: any;
}

export interface AuthAndQuotaError {
  ok: false;
  status: number;
  body: Record<string, unknown>;
}

interface CheckOptions {
  /** Header Authorization vindo do request */
  authHeader: string | null;
  /** Loteria (apenas para metadata/log) */
  loteria?: string;
  /** Se true, exige feature `gerador` no plano. Se false (default), só checa assinatura ativa. */
  requireGeradorFeature?: boolean;
  /** Quando true, NÃO tenta consultar quota (será incrementada à parte via RPC atômica). */
  skipQuotaRead?: boolean;
}

/**
 * Faz auth + checa admin + carrega perfil/plano + lê uso diário (não atômico).
 * Para quota atômica, use `incrementarQuotaAtomica()` em seguida.
 */
export async function checkAuthAndQuota(
  opts: CheckOptions,
): Promise<AuthAndQuotaResult | AuthAndQuotaError> {
  const { authHeader, requireGeradorFeature = true, skipQuotaRead = false } = opts;

  if (!authHeader) {
    return { ok: false, status: 401, body: { error: "Não autorizado" } };
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

  const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();
  if (userError || !user) {
    return { ok: false, status: 401, body: { error: "Usuário não autenticado" } };
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

  // Admin?
  const { data: userRole } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .maybeSingle();
  const isAdmin = !!userRole;

  if (isAdmin) {
    return {
      ok: true,
      userId: user.id,
      isAdmin: true,
      hasGeradorFeature: true,
      maxPerDay: -1,
      remainingToday: 999,
      currentUsage: 0,
      supabaseAdmin,
    };
  }

  // Plano
  const { data: perfil } = await supabaseAdmin
    .from("perfis")
    .select("plan_id, custom_features, status_assinatura, validade_assinatura")
    .eq("id", user.id)
    .maybeSingle();

  const isPlanActive = perfil?.status_assinatura === "ativa";
  const isExpired = perfil?.validade_assinatura
    && new Date(perfil.validade_assinatura) < new Date();

  let geradorMaxPerDay = 1;
  let hasGeradorFeature = false;

  if (perfil?.plan_id && isPlanActive && !isExpired) {
    const { data: plan } = await supabaseAdmin
      .from("plans")
      .select("features, gerador_max_per_day")
      .eq("id", perfil.plan_id)
      .maybeSingle();

    if (plan) {
      const features = (plan.features as Record<string, boolean>) || {};
      hasGeradorFeature = features.gerador === true;
      geradorMaxPerDay = plan.gerador_max_per_day || 1;
    }
  }

  if (perfil?.custom_features) {
    const customFeatures = perfil.custom_features as Record<string, boolean>;
    if (customFeatures.gerador !== undefined) {
      hasGeradorFeature = customFeatures.gerador;
    }
  }

  if (requireGeradorFeature && !hasGeradorFeature) {
    return {
      ok: false,
      status: 403,
      body: {
        error: "Recurso premium. Ative seu plano para gerar palpites.",
        requires_subscription: true,
      },
    };
  }

  // Quota (não atômica — só leitura)
  let currentUsage = 0;
  if (!skipQuotaRead) {
    const today = new Date().toISOString().split("T")[0];
    const { data: usage } = await supabaseAdmin
      .from("gerador_daily_usage")
      .select("count")
      .eq("user_id", user.id)
      .eq("day", today)
      .maybeSingle();
    currentUsage = usage?.count || 0;
  }

  const remainingToday = Math.max(geradorMaxPerDay - currentUsage, 0);

  if (remainingToday <= 0 && geradorMaxPerDay > 0) {
    return {
      ok: false,
      status: 429,
      body: {
        error: "Limite diário atingido",
        remaining_today: 0,
        max_per_day: geradorMaxPerDay,
      },
    };
  }

  return {
    ok: true,
    userId: user.id,
    isAdmin: false,
    hasGeradorFeature,
    maxPerDay: geradorMaxPerDay,
    remainingToday,
    currentUsage,
    supabaseAdmin,
  };
}

/**
 * Incrementa quota não-atômica do gerador tradicional (gerador_daily_usage).
 * Mantido para compat com motores legacy enquanto não há RPC atômica.
 */
export async function incrementarQuotaLegacy(
  supabaseAdmin: any,
  userId: string,
  currentUsage: number,
): Promise<void> {
  const today = new Date().toISOString().split("T")[0];
  await supabaseAdmin
    .from("gerador_daily_usage")
    .upsert({
      user_id: userId,
      day: today,
      count: currentUsage + 1,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id,day" });
}

/**
 * Incrementa quota atômica para o gerador tradicional via RPC.
 * Retorna { remaining, limitReached }.
 */
export async function incrementarQuotaGerador(
  supabaseAdmin: any,
  userId: string,
  maxPerDay: number,
): Promise<{ remaining: number; limitReached: boolean; error?: string }> {
  if (maxPerDay <= 0) {
    return { remaining: 999, limitReached: false }; // admin / sem limite
  }
  const { data, error } = await supabaseAdmin
    .rpc("incrementar_uso_gerador", { p_user_id: userId, p_max: maxPerDay });

  if (error) {
    const msg = (error as any)?.message || "";
    if (msg.includes("LIMIT_REACHED")) {
      return { remaining: 0, limitReached: true };
    }
    return { remaining: 0, limitReached: false, error: msg };
  }
  return { remaining: typeof data === "number" ? data : 0, limitReached: false };
}
