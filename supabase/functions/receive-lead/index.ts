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

// Lista de descartáveis agora vem de ./disposable-domains.ts (DISPOSABLE_DOMAINS Set ~300+)


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

type EmailValidationResult =
  | { ok: true; normalized: string }
  | { ok: false; reason: string; sugestao?: string };

function validateEmail(email: string): EmailValidationResult {
  const e = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return { ok: false, reason: "formato_invalido" };

  const [local, domain] = e.split("@");
  if (!local || !domain) return { ok: false, reason: "formato_invalido" };
  if (local.length < 4) return { ok: false, reason: "local_curto" };

  // Typo de provedor grande → sugestão
  if (COMMON_TYPOS[domain]) {
    return {
      ok: false,
      reason: "typo_detectado",
      sugestao: `${local}@${COMMON_TYPOS[domain]}`,
    };
  }

  // Domínio descartável (Set ~300+)
  if (DISPOSABLE_DOMAINS.has(domain)) {
    return { ok: false, reason: "dominio_descartavel" };
  }
  // Subdomínio de descartável (ex: foo.mailinator.com)
  const parts = domain.split(".");
  for (let i = 1; i < parts.length; i++) {
    const candidate = parts.slice(i).join(".");
    if (DISPOSABLE_DOMAINS.has(candidate)) {
      return { ok: false, reason: "dominio_descartavel" };
    }
  }

  // Repetição da mesma letra 3+ vezes (aaa, bbb)
  if (/(.)\1{2,}/.test(local)) return { ok: false, reason: "padrao_bot_repeticao" };

  // Sequência de teclado
  for (const seq of KEYBOARD_SEQUENCES) {
    if (local.includes(seq)) return { ok: false, reason: "padrao_bot_teclado" };
  }

  // 4+ consoantes seguidas sem vogal
  if (/[bcdfghjklmnpqrstvwxyz]{4,}/i.test(local)) return { ok: false, reason: "padrao_bot_consoantes" };

  // Sem nenhuma vogal
  const vowels = (local.match(/[aeiou]/gi) || []).length;
  const letters = (local.match(/[a-z]/gi) || []).length;
  if (letters >= 5 && vowels === 0) return { ok: false, reason: "padrao_bot_sem_vogal" };

  return { ok: true, normalized: e };
}

// MX lookup: domínio precisa aceitar email
async function dominioTemMX(domain: string): Promise<boolean> {
  try {
    // Timeout de 3s para não travar a request
    const ac = new AbortController();
    const timeout = setTimeout(() => ac.abort(), 3000);
    const records = await Deno.resolveDns(domain, "MX", { signal: ac.signal });
    clearTimeout(timeout);
    return Array.isArray(records) && records.length > 0;
  } catch (_e) {
    return false;
  }
}

// TODO (Camada 4): Plugar SMTP probe (Hunter.io / Abstract API) aqui se spam continuar.
// Adicionar secret HUNTER_API_KEY e checar resposta antes de criar perfil.


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

    // 2. Email — sintaxe + descartável + typo
    const emailCheck = validateEmail(email);
    if (!emailCheck.ok) {
      await logBloqueio(supabaseAdmin, "email_invalido", emailCheck.reason, { nome, email, celular }, ip, webhook.name);

      if (emailCheck.reason === "typo_detectado" && emailCheck.sugestao) {
        return json({
          error: `Você quis dizer ${emailCheck.sugestao}?`,
          sugestao: emailCheck.sugestao,
        }, 400);
      }
      if (emailCheck.reason === "dominio_descartavel") {
        return json({ error: "Use um email pessoal permanente" }, 400);
      }
      if (emailCheck.reason === "formato_invalido" || emailCheck.reason === "local_curto") {
        return json({ error: "Email inválido. Informe um email real" }, 400);
      }
      return json({ error: "Cadastro suspeito detectado" }, 400);
    }

    // 2b. MX do domínio precisa existir
    const emailDomain = emailCheck.normalized.split("@")[1];
    const temMX = await dominioTemMX(emailDomain);
    if (!temMX) {
      await logBloqueio(supabaseAdmin, "mx_inexistente", `domínio ${emailDomain} sem MX`, { nome, email, celular }, ip, webhook.name);
      return json({ error: "Domínio do email não recebe correio. Verifique o endereço." }, 400);
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

      // email_confirm: false → email_verificado começa em false; trial ativa só após clique no magic link
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: emailLower,
        password: randomPassword,
        email_confirm: false,
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

      // Aguarda trigger handle_new_user popular o perfil
      await new Promise((r) => setTimeout(r, 600));

      // Reverte trial automático: lead fica PENDENTE até confirmar email.
      // O trigger ativar_trial_pos_confirmacao reativa quando email_verificado vira true.
      await supabaseAdmin
        .from("perfis")
        .update({
          celular: normalizedCelular,
          email_verificado: false,
          plan_id: null,
          status_assinatura: "pendente",
          validade_assinatura: null,
          trial_used: false,
        })
        .eq("id", userId);

      // Remove role premium (handle_new_user adiciona) — só ganha após confirmar
      await supabaseAdmin
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("role", "premium");

      // Loga criação pendente
      await supabaseAdmin.from("system_events").insert({
        event_type: "email_pendente_criado",
        description: `Lead criado aguardando confirmação de email: ${maskEmail(emailLower)}`,
        source: "receive-lead",
        status: "pending",
        metadata: {
          user_id: userId,
          email_mascarado: maskEmail(emailLower),
          ip,
          webhook_name: webhook.name,
        },
      });
    }

    const newTags = ["lead", webhook.source_tag, ...(payloadTags || [])];
    // Se é novo lead, marcar como pendente de confirmação
    if (isNew) {
      newTags.push("email_pendente");
    }

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

    // Email de boas-vindas (sem magic link — verificação acontece no /login via OTP de 6 dígitos)
    let welcomeEmailStatus = "skipped";
    if (isNew) {
      try {
        const siteUrl = Deno.env.get("SITE_URL") || "https://comunidadepalpitetech.com.br";
        const loginUrl = `${siteUrl}/login`;

        const resendRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: Deno.env.get("RESEND_FROM_EMAIL") ?? "Comunidade Palpite Tech <solicitacao@palpitetech.com.br>",
            to: emailLower,
            subject: "Bem-vindo ao Palpite Tech! Ative sua conta",
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #ffffff;">
                <h1 style="color: #1a2e4a; font-size: 22px; margin-bottom: 8px;">Olá, ${nome.trim()}!</h1>
                <p style="color: #4a5568; font-size: 16px; line-height: 1.6;">
                  Seu cadastro foi recebido. Para ativar sua conta e ganhar
                  <strong>3 dias grátis de acesso premium</strong>, siga os passos:
                </p>
                <ol style="color: #4a5568; font-size: 15px; line-height: 1.8; padding-left: 20px;">
                  <li>Acesse o site clicando no botão abaixo</li>
                  <li>Digite seu email (<strong>${emailLower}</strong>)</li>
                  <li>Você receberá um código de 6 dígitos por email</li>
                  <li>Pronto! Trial liberado.</li>
                </ol>
                <div style="text-align: center; margin: 32px 0;">
                  <a href="${loginUrl}" style="display: inline-block; background-color: #1a2e4a; color: #ffffff; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-size: 16px; font-weight: 600;">
                    Ativar minha conta
                  </a>
                </div>
                <p style="color: #8a94a6; font-size: 13px; text-align: center; margin-top: 24px;">
                  Dúvidas? WhatsApp: <a href="https://wa.me/5551981854281" style="color: #1a2e4a;">(51) 98185-4281</a>
                </p>
              </div>
            `,
          }),
        });

        welcomeEmailStatus = resendRes.ok ? "success" : "error";
        await resendRes.text();

        await supabaseAdmin.from("system_events").insert({
          event_type: "lead_recebido_pendente",
          description: `Lead criado e email de boas-vindas enviado para ${maskEmail(emailLower)}`,
          source: source || "webhook",
          status: welcomeEmailStatus,
          metadata: {
            user_id: userId,
            email_mascarado: maskEmail(emailLower),
            is_new: isNew,
            webhook_name: webhook.name,
          },
        });
      } catch (e) {
        console.error("Welcome email error:", e);
        welcomeEmailStatus = "error";
      }
    }

    return json({
      success: true,
      user_id: userId,
      is_new: isNew,
      tags: persistedTags,
      tags_verified: tagsOk,
      welcome_email: welcomeEmailStatus,
      message: "Acesse o site e faça login com seu email para ativar sua conta",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro interno";
    console.error("receive-lead error:", err);
    return json({ error: message }, 500);
  }
});
