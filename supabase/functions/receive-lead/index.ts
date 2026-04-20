import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { DISPOSABLE_DOMAINS, COMMON_TYPOS } from "./disposable-domains.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// --- Rate Limiting (in-memory, 5 req/IP/min) ---
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 5;
const WINDOW_MS = 60_000;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  entry.count++;
  return entry.count > RATE_LIMIT;
}

setInterval(() => {
  const now = Date.now();
  for (const [key, val] of rateLimitMap) {
    if (now > val.resetAt) rateLimitMap.delete(key);
  }
}, 300_000);

// --- Validação ---

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return "***";
  const visible = local.slice(0, 2);
  return `${visible}${"*".repeat(Math.max(local.length - 2, 1))}@${domain}`;
}

const DISPOSABLE_DOMAINS = [
  "mailinator.com", "tempmail.com", "10minutemail.com", "guerrillamail.com",
  "yopmail.com", "throwaway.email", "trashmail.com", "fakeinbox.com",
  "getnada.com", "maildrop.cc", "sharklasers.com", "temp-mail.org",
  "dispostable.com", "mintemail.com",
];

const KEYBOARD_SEQUENCES = [
  "qwer", "wert", "erty", "rtyu", "tyui", "yuio", "uiop",
  "asdf", "sdfg", "dfgh", "fghj", "ghjk", "hjkl",
  "zxcv", "xcvb", "cvbn", "vbnm",
  "1234", "2345", "3456", "4567", "5678", "6789",
  "abcd", "bcde", "cdef",
];

function validateName(nome: string, email: string): string | null {
  const n = nome.trim();
  if (n.length < 3) return "Nome muito curto";
  if (n.toLowerCase() === email.trim().toLowerCase()) return "Nome inválido";
  // Apenas números/símbolos
  if (!/[a-zA-ZÀ-ÿ]/.test(n)) return "Nome deve conter letras";
  // Sequências de teclado óbvias no nome
  const lower = n.toLowerCase().replace(/\s/g, "");
  for (const seq of KEYBOARD_SEQUENCES) {
    if (lower.includes(seq)) return "Nome suspeito";
  }
  // 4+ consoantes seguidas
  if (/[bcdfghjklmnpqrstvwxyzç]{5,}/i.test(lower)) return "Nome suspeito";
  return null;
}

function validateEmail(email: string): string | null {
  const e = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return "formato_invalido";

  const [local, domain] = e.split("@");
  if (!local || !domain) return "formato_invalido";
  if (local.length < 4) return "local_curto";

  // Domínio descartável
  if (DISPOSABLE_DOMAINS.some((d) => domain === d || domain.endsWith(`.${d}`))) {
    return "dominio_descartavel";
  }

  // Repetição da mesma letra 3+ vezes (aaa, bbb)
  if (/(.)\1{2,}/.test(local)) return "padrao_bot_repeticao";

  // Sequência de teclado
  for (const seq of KEYBOARD_SEQUENCES) {
    if (local.includes(seq)) return "padrao_bot_teclado";
  }

  // 4+ consoantes seguidas sem vogal (jkhjk, gdfh, kjaslkdj)
  if (/[bcdfghjklmnpqrstvwxyz]{4,}/i.test(local)) return "padrao_bot_consoantes";

  // Razão consoantes/vogais muito alta (ex: "kjslk" — 0 vogais)
  const vowels = (local.match(/[aeiou]/gi) || []).length;
  const letters = (local.match(/[a-z]/gi) || []).length;
  if (letters >= 5 && vowels === 0) return "padrao_bot_sem_vogal";

  return null;
}

function validateCelular(celular: string): { ok: boolean; normalized?: string; reason?: string } {
  const digits = celular.replace(/\D/g, "");
  let normalized = digits;
  if (digits.startsWith("55") && (digits.length === 12 || digits.length === 13)) {
    normalized = digits.substring(2);
  }

  if (normalized.length < 10 || normalized.length > 11) {
    return { ok: false, reason: "tamanho_invalido" };
  }

  // DDD válido (11-99)
  const ddd = parseInt(normalized.substring(0, 2), 10);
  if (isNaN(ddd) || ddd < 11 || ddd > 99) {
    return { ok: false, reason: "ddd_invalido" };
  }

  // Se 11 dígitos, o terceiro deve ser 9 (celular)
  if (normalized.length === 11 && normalized[2] !== "9") {
    return { ok: false, reason: "nono_digito_invalido" };
  }

  // Sequências óbvias
  if (/^(\d)\1+$/.test(normalized)) return { ok: false, reason: "todos_iguais" };
  if (normalized === "12345678901" || normalized === "1234567890") {
    return { ok: false, reason: "sequencia_obvia" };
  }

  return { ok: true, normalized };
}

async function logBloqueio(
  supabaseAdmin: ReturnType<typeof createClient>,
  motivo: string,
  detalhe: string,
  payload: { nome?: string; email?: string; celular?: string },
  ip: string,
  webhookName?: string,
) {
  try {
    await supabaseAdmin.from("system_events").insert({
      event_type: "lead_bloqueado_validacao",
      description: `Lead bloqueado: ${motivo}`,
      source: "receive-lead",
      status: "blocked",
      metadata: {
        motivo,
        detalhe,
        ip,
        webhook_name: webhookName || null,
        email_mascarado: payload.email ? maskEmail(payload.email) : null,
        nome_recebido: payload.nome?.slice(0, 40) || null,
        celular_tamanho: payload.celular?.replace(/\D/g, "").length || 0,
      },
    });
  } catch (e) {
    console.error("[receive-lead] erro ao logar bloqueio:", e);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "Método não permitido" }, 405);
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || req.headers.get("cf-connecting-ip")
    || "unknown";

  if (isRateLimited(ip)) {
    return json({ error: "Muitas requisições. Tente novamente em 1 minuto." }, 429);
  }

  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token");

    if (!token) {
      return json({ error: "Token obrigatório (?token=xxx)" }, 401);
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: webhook, error: webhookError } = await supabaseAdmin
      .from("lead_webhooks")
      .select("id, name, source_tag, is_active")
      .eq("token", token)
      .eq("is_active", true)
      .maybeSingle();

    if (webhookError || !webhook) {
      return json({ error: "Token inválido" }, 403);
    }

    const body = await req.json();
    const {
      nome,
      email,
      celular,
      tags: payloadTags,
      source,
      utm_source,
    } = body as {
      nome?: string;
      email?: string;
      celular?: string;
      tags?: string[];
      source?: string;
      utm_source?: string;
    };

    // === VALIDAÇÕES ANTI-BOT ===

    // 1. Campos obrigatórios
    if (!nome?.trim() || !email?.trim() || !celular?.trim()) {
      await logBloqueio(supabaseAdmin, "campos_obrigatorios", "Nome, email ou celular ausente", { nome, email, celular }, ip, webhook.name);
      return json({ error: "Nome, email e celular são obrigatórios" }, 400);
    }

    // 2. Email
    const emailReason = validateEmail(email);
    if (emailReason) {
      await logBloqueio(supabaseAdmin, "email_invalido", emailReason, { nome, email, celular }, ip, webhook.name);
      if (emailReason === "formato_invalido" || emailReason === "local_curto" || emailReason === "dominio_descartavel") {
        return json({ error: "Email inválido. Informe um email real" }, 400);
      }
      return json({ error: "Cadastro suspeito detectado" }, 400);
    }

    // 3. Nome
    const nameReason = validateName(nome, email);
    if (nameReason) {
      await logBloqueio(supabaseAdmin, "nome_invalido", nameReason, { nome, email, celular }, ip, webhook.name);
      return json({ error: "Cadastro suspeito detectado" }, 400);
    }

    // 4. Celular
    const celValidation = validateCelular(celular);
    if (!celValidation.ok) {
      await logBloqueio(supabaseAdmin, "celular_invalido", celValidation.reason || "desconhecido", { nome, email, celular }, ip, webhook.name);
      return json({ error: "Celular inválido. Use formato (DDD) 9XXXX-XXXX" }, 400);
    }
    const normalizedCelular = celValidation.normalized!;

    // === FIM VALIDAÇÕES ===

    let userId: string | null = null;
    let isNew = false;

    // Check existência por email
    const emailLower = email.trim().toLowerCase();
    const { data: existingByEmail } = await supabaseAdmin
      .from("perfis")
      .select("id")
      .eq("email", emailLower)
      .maybeSingle();

    if (existingByEmail) userId = existingByEmail.id;

    // Check existência por celular
    if (!userId) {
      const { data: existingByCel } = await supabaseAdmin
        .from("perfis")
        .select("id")
        .eq("celular", normalizedCelular)
        .maybeSingle();

      if (existingByCel) userId = existingByCel.id;
    }

    if (!userId) {
      const randomPassword = crypto.randomUUID().replace(/-/g, "").slice(0, 16);

      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: emailLower,
        password: randomPassword,
        email_confirm: true,
        user_metadata: {
          nome: nome.trim(),
          origem: source || "webhook",
        },
      } as any);

      if (createError) {
        return json({ error: `Erro ao criar usuário: ${createError.message}` }, 400);
      }

      userId = newUser.user.id;
      isNew = true;

      await supabaseAdmin
        .from("perfis")
        .update({ celular: normalizedCelular })
        .eq("id", userId);
    }

    const newTags = ["lead", webhook.source_tag, ...(payloadTags || [])];

    if (isNew) {
      await new Promise((r) => setTimeout(r, 1000));
    }

    const { data: currentProfile } = await supabaseAdmin
      .from("perfis")
      .select("tags, utm_source")
      .eq("id", userId)
      .single();

    if (!currentProfile) {
      console.error(`[receive-lead] Perfil não encontrado para user ${userId} após criação`);
      await new Promise((r) => setTimeout(r, 1500));
      const { data: retryProfile } = await supabaseAdmin
        .from("perfis")
        .select("tags, utm_source")
        .eq("id", userId)
        .single();

      if (!retryProfile) {
        return json({ error: "Perfil não criado a tempo", user_id: userId }, 500);
      }
    }

    const profileData = currentProfile || (await supabaseAdmin.from("perfis").select("tags, utm_source").eq("id", userId).single()).data;
    const existingTags: string[] = profileData?.tags || [];
    const mergedTags = Array.from(new Set([...existingTags, ...newTags]));

    const updatePayload: Record<string, unknown> = { tags: mergedTags };
    if (nome.trim() && isNew) updatePayload.nome = nome.trim();
    if (utm_source && !profileData?.utm_source) {
      updatePayload.utm_source = utm_source;
    }

    const { error: updateError } = await supabaseAdmin
      .from("perfis")
      .update(updatePayload)
      .eq("id", userId);

    if (updateError) {
      console.error(`[receive-lead] Erro ao atualizar tags: ${updateError.message}`);
      await supabaseAdmin.from("system_events").insert({
        event_type: "lead_tag_update_error",
        description: `Falha ao atualizar tags do lead ${email || celular}`,
        source: source || "webhook",
        status: "error",
        metadata: {
          user_id: userId,
          attempted_tags: mergedTags,
          error: updateError.message,
          webhook_name: webhook.name,
        },
      });
      return json({ error: "Falha ao salvar tags", details: updateError.message }, 500);
    }

    const { data: verifyProfile } = await supabaseAdmin
      .from("perfis")
      .select("tags")
      .eq("id", userId)
      .single();

    const persistedTags = verifyProfile?.tags || [];
    const tagsOk = newTags.every((t: string) => persistedTags.includes(t));

    if (!tagsOk) {
      console.error(`[receive-lead] Tags não persistiram!`);
      await supabaseAdmin.from("system_events").insert({
        event_type: "lead_tag_persist_mismatch",
        description: `Tags não persistiram para ${email || celular}`,
        source: source || "webhook",
        status: "error",
        metadata: {
          user_id: userId,
          expected_tags: mergedTags,
          actual_tags: persistedTags,
          webhook_name: webhook.name,
        },
      });
    }

    await supabaseAdmin.rpc("increment_lead_webhook_count" as any, { webhook_id: webhook.id });

    // Magic link de ativação
    let magicLinkStatus = "skipped";
    try {
      const siteUrl = Deno.env.get("SITE_URL") || "https://comunidadepalpitetech.lovable.app";

      const { data: magicData, error: magicError } = await supabaseAdmin.auth.admin.generateLink({
        type: "magiclink",
        email: emailLower,
        options: {
          redirectTo: `${siteUrl}/ativar-conta`,
        },
      });

      if (!magicError && magicData?.properties?.hashed_token) {
        const token_hash = magicData.properties.hashed_token;
        const directLink = `${siteUrl}/ativar-conta?token_hash=${encodeURIComponent(token_hash)}&type=magiclink`;

        const resendRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: Deno.env.get("RESEND_FROM_EMAIL") ?? "Comunidade Palpite Tech <solicitacao@palpitetech.com.br>",
            to: emailLower,
            subject: "Ative sua conta e crie sua senha",
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #ffffff;">
                <h1 style="color: #1a2e4a; font-size: 22px; margin-bottom: 8px;">Olá, ${nome.trim()}!</h1>
                <p style="color: #4a5568; font-size: 16px; line-height: 1.6;">
                  Sua conta foi criada. Clique no botão abaixo para ativar e criar sua senha de acesso.
                </p>
                <div style="text-align: center; margin: 32px 0;">
                  <a href="${directLink}" style="display: inline-block; background-color: #1a2e4a; color: #ffffff; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-size: 16px; font-weight: 600;">
                    Ativar minha conta
                  </a>
                </div>
                <p style="color: #8a94a6; font-size: 13px; text-align: center;">
                  Este link expira em 24 horas.<br/>
                  Se não solicitou, ignore este email.
                </p>
              </div>
            `,
          }),
        });

        magicLinkStatus = resendRes.ok ? "success" : "error";
        await resendRes.text();
      } else {
        magicLinkStatus = "error";
      }

      await supabaseAdmin.from("system_events").insert({
        event_type: "lead_ativacao_email_enviado",
        description: `Email de ativação enviado para ${email}`,
        source: source || "webhook",
        status: magicLinkStatus,
        metadata: {
          user_id: userId,
          email,
          is_new: isNew,
          error: magicLinkStatus === "error" ? "Falha ao enviar magic link" : null,
        },
      });
    } catch (e) {
      console.error("Magic link error:", e);
      magicLinkStatus = "error";
    }

    return json({
      success: true,
      user_id: userId,
      is_new: isNew,
      tags: persistedTags,
      tags_verified: tagsOk,
      activation_email: magicLinkStatus,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro interno";
    console.error("receive-lead error:", err);
    return json({ error: message }, 500);
  }
});
