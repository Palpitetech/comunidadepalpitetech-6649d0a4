import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { DISPOSABLE_DOMAINS, COMMON_TYPOS } from "./disposable-domains.ts";
import { normalizePhoneBR } from "../_shared/br-phone.ts";

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
  const r = normalizePhoneBR(celular);
  if (!r.ok) {
    const map: Record<string, string> = {
      empty: "tamanho_invalido",
      too_short: "tamanho_invalido",
      too_long: "tamanho_invalido",
      invalid_ddd: "ddd_invalido",
      invalid_mobile: "nono_digito_invalido",
      sequence: "todos_iguais",
      non_br: "tamanho_invalido",
    };
    return { ok: false, reason: map[r.reason] ?? "tamanho_invalido" };
  }
  return { ok: true, normalized: r.canonical };
}

async function logBloqueio(
  supabaseAdmin: any,
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
    ) as any;

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
      slug,
      utm_source,
      utm_medium,
      utm_campaign,
      utm_content,
      utm_term,
      referrer,
      gclid,
      fbclid,
      pagina_origem,
      page_url,
    } = body as {
      nome?: string;
      email?: string;
      celular?: string;
      tags?: string[];
      slug?: string;
      utm_source?: string;
      utm_medium?: string;
      utm_campaign?: string;
      utm_content?: string;
      utm_term?: string;
      referrer?: string;
      gclid?: string;
      fbclid?: string;
      pagina_origem?: string;
      page_url?: string;
    };

    // Helper to normalize empty strings to null
    const cleanStr = (v: string | undefined | null) => {
      if (v === undefined || v === null) return null;
      const t = String(v).trim();
      return t.length > 0 ? t : null;
    };

    const slugClean = cleanStr(slug);
    const utmSourceClean = cleanStr(utm_source);
    const utmMediumClean = cleanStr(utm_medium);
    const utmCampaignClean = cleanStr(utm_campaign);
    const utmContentClean = cleanStr(utm_content);
    const utmTermClean = cleanStr(utm_term);
    const referrerClean = cleanStr(referrer);
    const gclidClean = cleanStr(gclid);
    const fbclidClean = cleanStr(fbclid);

    const hasNome = !!nome?.trim();
    const hasEmail = !!email?.trim();
    const hasCelular = !!celular?.trim();
    const camposCompletos = hasNome && hasEmail && hasCelular;

    // === NOVO FLUXO: leads parciais → leads_inbox (sem criar conta) ===
    if (!camposCompletos) {
      // Pelo menos 1 dado de contato é necessário
      if (!hasEmail && !hasCelular && !hasNome) {
        return json({ error: "Informe ao menos um dado de contato (nome, email ou celular)" }, 400);
      }

      let normalizedCelularLead: string | null = null;
      if (hasCelular) {
        const v = validateCelular(celular!);
        if (v.ok) normalizedCelularLead = v.normalized!;
      }

      const emailLowerLead = hasEmail ? email!.trim().toLowerCase() : null;
      const celularSave = normalizedCelularLead || (hasCelular ? celular!.replace(/\D/g, "") : null);
      const paginaOrigemValor = pagina_origem || page_url || null;

      // Deduplicação 24h por email/celular
      let existingLeadId: string | null = null;
      if (emailLowerLead) {
        const { data: ex } = await supabaseAdmin
          .from("leads_inbox")
          .select("id, tags, raw_payload")
          .eq("email", emailLowerLead)
          .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (ex) existingLeadId = ex.id as string;
      }
      if (!existingLeadId && celularSave) {
        const { data: ex2 } = await supabaseAdmin
          .from("leads_inbox")
          .select("id")
          .eq("celular", celularSave)
          .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (ex2) existingLeadId = ex2.id as string;
      }

      const tagsLead = Array.from(new Set([
        "lead_inbox",
        webhook.source_tag,
        ...((payloadTags || []) as string[]),
      ].filter(Boolean)));

      if (existingLeadId) {
        await supabaseAdmin
          .from("leads_inbox")
          .update({
            nome: nome?.trim() || undefined,
            email: emailLowerLead || undefined,
            celular: celularSave || undefined,
            slug: slugClean || undefined,
            utm_source: utmSourceClean || undefined,
            utm_medium: utmMediumClean || undefined,
            utm_campaign: utmCampaignClean || undefined,
            utm_content: utmContentClean || undefined,
            utm_term: utmTermClean || undefined,
            referrer: referrerClean || undefined,
            gclid: gclidClean || undefined,
            fbclid: fbclidClean || undefined,
            pagina_origem: paginaOrigemValor || undefined,
            tags: tagsLead,
            raw_payload: body,
            ip,
            updated_at: new Date().toISOString(),
          } as any)
          .eq("id", existingLeadId);
      } else {
        await supabaseAdmin.from("leads_inbox").insert({
          nome: nome?.trim() || null,
          email: emailLowerLead,
          celular: celularSave,
          slug: slugClean,
          utm_source: utmSourceClean,
          utm_medium: utmMediumClean,
          utm_campaign: utmCampaignClean,
          utm_content: utmContentClean,
          utm_term: utmTermClean,
          referrer: referrerClean,
          gclid: gclidClean,
          fbclid: fbclidClean,
          pagina_origem: paginaOrigemValor,
          tags: tagsLead,
          webhook_id: webhook.id,
          webhook_name: webhook.name,
          ip,
          raw_payload: body,
          status: "novo",
        } as any);
      }

      await supabaseAdmin.rpc("increment_lead_webhook_count" as any, { webhook_id: webhook.id });

      await supabaseAdmin.from("system_events").insert({
        event_type: "lead_inbox_capturado",
        description: `Lead parcial capturado (campos incompletos)`,
        source: "receive-lead",
        status: "success",
        metadata: {
          webhook_name: webhook.name,
          tem_nome: hasNome,
          tem_email: hasEmail,
          tem_celular: hasCelular,
          dedup: !!existingLeadId,
          slug: slugClean,
          utm_source: utmSourceClean,
          utm_campaign: utmCampaignClean,
          has_gclid: !!gclidClean,
          has_fbclid: !!fbclidClean,
          ip,
        },
      });

      return json({
        success: true,
        lead_inbox: true,
        deduped: !!existingLeadId,
        message: "Lead capturado (sem conta — dados incompletos)",
      });
    }

    // === VALIDAÇÕES ANTI-BOT (fluxo completo de criação de conta) ===

    // 1. Campos obrigatórios (já garantido acima, mas mantido para safety)
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

    // Check existência centralizada (email → celular) via RPC
    const emailLower = email.trim().toLowerCase();
    const { data: foundUser } = await supabaseAdmin.rpc("find_user_by_contact", {
      p_email: emailLower,
      p_celular: normalizedCelular,
    });
    const found = foundUser as { user_id?: string | null } | null;
    if (found?.user_id) userId = found.user_id;

    if (!userId) {
      const randomPassword = "12345678"; // senha padrão para auto-criação

      // email_confirm: false → email_verificado começa em false; trial ativa só após clique no magic link
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: emailLower,
        password: randomPassword,
        email_confirm: false,
        user_metadata: {
          nome: nome.trim(),
          origem: slugClean || "webhook",
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
    if (utmSourceClean && !profileData?.utm_source) {
      updatePayload.utm_source = utmSourceClean;
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
        source: slugClean || "webhook",
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

    // Propaga atribuição completa do lead → perfis.attribution (first-touch)
    try {
      const leadAttr: Record<string, string> = {};
      const setAttr = (k: string, v: string | null) => {
        if (v && v.trim()) leadAttr[k] = v.trim();
      };
      setAttr("utm_source", utmSourceClean);
      setAttr("utm_medium", utmMediumClean);
      setAttr("utm_campaign", utmCampaignClean);
      setAttr("utm_content", utmContentClean);
      setAttr("utm_term", utmTermClean);
      setAttr("gclid", gclidClean);
      setAttr("fbclid", fbclidClean);
      setAttr("referrer", referrerClean);
      setAttr("landing_page", pagina_origem || page_url || null);
      setAttr("slug", slugClean);
      setAttr("source_channel", "lead_webhook");

      if (Object.keys(leadAttr).length > 0) {
        await supabaseAdmin.rpc("merge_user_attribution" as any, {
          p_user_id: userId,
          p_new_attr: leadAttr,
          p_mark_purchase: false,
          p_source: "lead_webhook",
        });
      }
    } catch (e) {
      console.warn("[receive-lead] erro ao propagar atribuição:", e);
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
        source: slugClean || "webhook",
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

    // === Disparo imediato de WhatsApp privado para Bolão Mega Sena ===
    // O insert em `events` aciona trigger_queue_event_templates → enfileira
    // os templates com event_trigger='lead_bolao_mega_sena' (5 variantes em rotação).
    if (webhook.source_tag === "bolao_6_palpites_7_dezenas_ms_especial") {
      try {
        await supabaseAdmin.from("events").insert({
          user_id: userId,
          event_type: "lead_bolao_mega_sena",
          source: "receive-lead",
          metadata: {
            webhook_name: webhook.name,
            webhook_id: webhook.id,
            slug: slugClean,
            utm_source: utmSourceClean,
            utm_campaign: utmCampaignClean,
          },
        });
      } catch (e) {
        console.error("[receive-lead] erro ao emitir evento lead_bolao_mega_sena:", e);
      }
    }

    // Marca leads_inbox prévios como convertidos (mesmo email/celular)
    try {
      await supabaseAdmin
        .from("leads_inbox")
        .update({ status: "convertido", perfil_id: userId, updated_at: new Date().toISOString() })
        .or(`email.eq.${emailLower},celular.eq.${normalizedCelular}`)
        .neq("status", "convertido");
    } catch (e) {
      console.warn("[receive-lead] erro ao marcar leads_inbox como convertido:", e);
    }

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
          source: slugClean || "webhook",
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
