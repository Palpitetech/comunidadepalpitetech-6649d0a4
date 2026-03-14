import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

// Cleanup stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of rateLimitMap) {
    if (now > val.resetAt) rateLimitMap.delete(key);
  }
}, 300_000);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "Método não permitido" }, 405);
  }

  // Rate limit check
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

    // Validate token against lead_webhooks
    const { data: webhook, error: webhookError } = await supabaseAdmin
      .from("lead_webhooks")
      .select("id, name, source_tag, is_active")
      .eq("token", token)
      .eq("is_active", true)
      .maybeSingle();

    if (webhookError || !webhook) {
      return json({ error: "Token inválido" }, 403);
    }

    // Parse body
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

    if (!email && !celular) {
      return json({ error: "email ou celular é obrigatório" }, 400);
    }

    let userId: string | null = null;
    let isNew = false;

    // Check if user already exists by email or celular
    if (email) {
      const { data: existing } = await supabaseAdmin
        .from("perfis")
        .select("id")
        .eq("email", email.trim().toLowerCase())
        .maybeSingle();

      if (existing) userId = existing.id;
    }

    if (!userId && celular) {
      const digits = celular.replace(/\D/g, "");
      const normalizedCelular = digits.startsWith("55") && (digits.length === 12 || digits.length === 13)
        ? digits.substring(2)
        : digits;

      const { data: existing } = await supabaseAdmin
        .from("perfis")
        .select("id")
        .eq("celular", normalizedCelular)
        .maybeSingle();

      if (existing) userId = existing.id;
    }

    if (!userId) {
      // Create new user via auth
      const randomPassword = crypto.randomUUID().replace(/-/g, "").slice(0, 16);

      const createPayload: Record<string, unknown> = {
        password: randomPassword,
        email_confirm: true,
        user_metadata: {
          nome: nome?.trim() || undefined,
          origem: source || "webhook",
        },
      };

      if (email) {
        createPayload.email = email.trim().toLowerCase();
      }

      let celularToUpdate: string | undefined;
      if (celular) {
        const digits = celular.replace(/\D/g, "");
        celularToUpdate = digits.startsWith("55") && (digits.length === 12 || digits.length === 13)
          ? digits.substring(2)
          : digits;
      }

      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser(
        createPayload as any
      );

      if (createError) {
        return json({ error: `Erro ao criar usuário: ${createError.message}` }, 400);
      }

      userId = newUser.user.id;
      isNew = true;

      // Update celular if provided
      if (celularToUpdate) {
        await supabaseAdmin
          .from("perfis")
          .update({ celular: celularToUpdate })
          .eq("id", userId);
      }
    }

    // Build final tags: always include "lead" + webhook source_tag + payload tags
    const newTags = ["lead", webhook.source_tag, ...(payloadTags || [])];

    const { data: currentProfile } = await supabaseAdmin
      .from("perfis")
      .select("tags, utm_source")
      .eq("id", userId)
      .single();

    const existingTags: string[] = currentProfile?.tags || [];
    const mergedTags = Array.from(new Set([...existingTags, ...newTags]));

    const updatePayload: Record<string, unknown> = { tags: mergedTags };
    if (nome?.trim() && isNew) updatePayload.nome = nome.trim();
    // utm_source: nunca sobrescreve valor já existente
    if (utm_source && !currentProfile?.utm_source) {
      updatePayload.utm_source = utm_source;
    }

    await supabaseAdmin
      .from("perfis")
      .update(updatePayload)
      .eq("id", userId);

    // Atomic increment of webhook counter
    await supabaseAdmin.rpc("increment_lead_webhook_count" as any, { webhook_id: webhook.id });

    // Send activation magic link via email (only if email exists)
    let magicLinkStatus = "skipped";
    if (email) {
      try {
        const siteUrl = Deno.env.get("SITE_URL") || "https://comunidadepalpitetech.lovable.app";

        const { data: magicData, error: magicError } = await supabaseAdmin.auth.admin.generateLink({
          type: "magiclink",
          email: email.trim().toLowerCase(),
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
              to: email.trim().toLowerCase(),
              subject: "Ative sua conta e crie sua senha",
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #ffffff;">
                  <h1 style="color: #1a2e4a; font-size: 22px; margin-bottom: 8px;">Olá, ${nome?.trim() || "bem-vindo"}!</h1>
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

        // Log activation email event
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
    }

    return json({
      success: true,
      user_id: userId,
      is_new: isNew,
      tags: mergedTags,
      activation_email: magicLinkStatus,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro interno";
    console.error("receive-lead error:", err);
    return json({ error: message }, 500);
  }
});
