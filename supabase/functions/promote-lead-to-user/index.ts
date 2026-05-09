import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { normalizePhoneBR } from "../_shared/br-phone.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type",
};

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function normalizeCelular(v: string): { ok: boolean; normalized?: string } {
  const r = normalizePhoneBR(v);
  return r.ok ? { ok: true, normalized: r.canonical } : { ok: false };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Método não permitido" }, 405);

  try {
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (!token) return json({ error: "Não autenticado" }, 401);

    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    );

    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();
    if (userError || !user) return json({ error: "Sessão inválida" }, 401);

    // Verifica se é admin
    const { data: roleData } = await supabaseAuth
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleData) return json({ error: "Acesso restrito a administradores" }, 403);

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json();
    const { lead_id, nome: bodyNome, email: bodyEmail, celular: bodyCelular } = body as {
      lead_id?: string;
      nome?: string;
      email?: string;
      celular?: string;
    };

    if (!lead_id) return json({ error: "lead_id obrigatório" }, 400);

    const { data: lead, error: leadErr } = await supabaseAdmin
      .from("leads_inbox")
      .select("*")
      .eq("id", lead_id)
      .maybeSingle();

    if (leadErr || !lead) return json({ error: "Lead não encontrado" }, 404);
    if (lead.status === "convertido") return json({ error: "Lead já foi convertido" }, 400);

    const nome = (bodyNome || lead.nome || "").trim();
    const email = (bodyEmail || lead.email || "").trim().toLowerCase();
    const celularRaw = (bodyCelular || lead.celular || "").trim();

    if (!nome || !email || !celularRaw) {
      return json({ error: "Nome, email e celular são obrigatórios para promover o lead" }, 400);
    }

    const celCheck = normalizeCelular(celularRaw);
    if (!celCheck.ok) return json({ error: "Celular inválido" }, 400);
    const celular = celCheck.normalized!;

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: "Email inválido" }, 400);

    // Verifica se já existe perfil (busca centralizada email → celular)
    const { data: foundUser } = await supabaseAdmin.rpc("find_user_by_contact", {
      p_email: email,
      p_celular: celular,
    });
    const foundData = foundUser as { user_id?: string | null } | null;
    let userId: string | null = foundData?.user_id ?? null;

    let isNew = false;
    if (!userId) {
      const randomPassword = "12345678"; // senha padrão para auto-criação
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: randomPassword,
        email_confirm: false,
        user_metadata: { nome, origem: lead.slug || lead.utm_source || "lead_inbox_promote" },
      } as any);

      if (createError) return json({ error: `Erro ao criar usuário: ${createError.message}` }, 400);

      userId = newUser.user.id;
      isNew = true;

      // Aguarda trigger handle_new_user
      await new Promise((r) => setTimeout(r, 600));

      // Lead inbox → perfil pendente até confirmar email
      await supabaseAdmin
        .from("perfis")
        .update({
          celular,
          email_verificado: false,
          plan_id: null,
          status_assinatura: "pendente",
          validade_assinatura: null,
          trial_used: false,
          utm_source: lead.utm_source || null,
        })
        .eq("id", userId);

      await supabaseAdmin
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("role", "premium");
    }

    // Merge tags (lead tags + tag de promoção)
    const baseTags = ["lead", "promovido_de_lead", ...(lead.tags || [])].filter((t: string) => t && t !== "lead_inbox");
    const { data: currentProfile } = await supabaseAdmin
      .from("perfis")
      .select("tags")
      .eq("id", userId)
      .single();
    const merged = Array.from(new Set([...(currentProfile?.tags || []), ...baseTags]));
    await supabaseAdmin.from("perfis").update({ tags: merged }).eq("id", userId);

    // Propaga atribuição do lead → perfis.attribution (first-touch)
    try {
      const promoteAttr: Record<string, string> = {};
      const setAttr = (k: string, v: string | null | undefined) => {
        if (v && String(v).trim()) promoteAttr[k] = String(v).trim();
      };
      setAttr("utm_source", lead.utm_source);
      setAttr("utm_medium", lead.utm_medium);
      setAttr("utm_campaign", lead.utm_campaign);
      setAttr("utm_content", lead.utm_content);
      setAttr("utm_term", lead.utm_term);
      setAttr("gclid", lead.gclid);
      setAttr("fbclid", lead.fbclid);
      setAttr("referrer", lead.referrer);
      setAttr("landing_page", lead.pagina_origem);
      setAttr("slug", lead.slug);
      setAttr("lead_id", lead.id);
      setAttr("source_channel", "lead_promote");

      if (Object.keys(promoteAttr).length > 0) {
        await supabaseAdmin.rpc("merge_user_attribution" as any, {
          p_user_id: userId,
          p_new_attr: promoteAttr,
          p_mark_purchase: false,
          p_source: "lead_promote",
        });
      }
    } catch (e) {
      console.warn("[promote-lead-to-user] erro ao propagar atribuição:", e);
    }

    // Marca lead como convertido
    await supabaseAdmin
      .from("leads_inbox")
      .update({ status: "convertido", perfil_id: userId, updated_at: new Date().toISOString() })
      .eq("id", lead_id);

    await supabaseAdmin.from("system_events").insert({
      event_type: "lead_inbox_promovido",
      description: `Lead promovido a usuário pelo admin`,
      source: "promote-lead-to-user",
      status: "success",
      metadata: { lead_id, user_id: userId, is_new: isNew, admin_id: user.id },
    });

    return json({ success: true, user_id: userId, is_new: isNew });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro interno";
    console.error("promote-lead-to-user error:", err);
    return json({ error: message }, 500);
  }
});
