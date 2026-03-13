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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "Método não permitido" }, 405);
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

    // Validate token against admin_settings
    const { data: settings, error: settingsError } = await supabaseAdmin
      .from("admin_settings")
      .select("lead_webhook_token")
      .eq("id", "default")
      .single();

    if (settingsError || !settings) {
      return json({ error: "Erro ao validar token" }, 500);
    }

    if (settings.lead_webhook_token !== token) {
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
    } = body as {
      nome?: string;
      email?: string;
      celular?: string;
      tags?: string[];
      source?: string;
    };

    if (!email && !celular) {
      return json({ error: "email ou celular é obrigatório" }, 400);
    }

    const ip = req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip") || "unknown";

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

      if (celular) {
        const digits = celular.replace(/\D/g, "");
        const normalizedCelular = digits.startsWith("55") && (digits.length === 12 || digits.length === 13)
          ? digits.substring(2)
          : digits;

        // Update celular after creation since auth doesn't store it
        createPayload._celular = normalizedCelular;
      }

      const celularToUpdate = (createPayload._celular as string) || undefined;
      delete createPayload._celular;

      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser(
        createPayload as any
      );

      if (createError) {
        return json({ error: `Erro ao criar usuário: ${createError.message}` }, 400);
      }

      userId = newUser.user.id;
      isNew = true;

      // Update celular if provided (handle_new_user trigger already created the profile)
      if (celularToUpdate) {
        await supabaseAdmin
          .from("perfis")
          .update({ celular: celularToUpdate })
          .eq("id", userId);
      }
    }

    // Build final tags: always include "lead" + payload tags, merge with existing
    const newTags = ["lead", ...(payloadTags || [])];

    const { data: currentProfile } = await supabaseAdmin
      .from("perfis")
      .select("tags")
      .eq("id", userId)
      .single();

    const existingTags: string[] = currentProfile?.tags || [];
    const mergedTags = Array.from(new Set([...existingTags, ...newTags]));

    const updatePayload: Record<string, unknown> = { tags: mergedTags };
    if (nome?.trim() && isNew) updatePayload.nome = nome.trim();

    await supabaseAdmin
      .from("perfis")
      .update(updatePayload)
      .eq("id", userId);

    // Log event in system_events
    await supabaseAdmin.from("system_events").insert({
      event_type: "lead_externo",
      description: `Lead capturado: ${nome || email || celular} via ${source || "webhook"}`,
      source: source || "webhook",
      status: "success",
      metadata: {
        user_id: userId,
        email: email || null,
        celular: celular || null,
        tags: mergedTags,
        source: source || null,
        ip,
        is_new: isNew,
      },
    });

    return json({
      success: true,
      user_id: userId,
      is_new: isNew,
      tags: mergedTags,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro interno";
    console.error("receive-lead error:", err);
    return json({ error: message }, 500);
  }
});
