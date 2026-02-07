import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DEFAULT_SYSTEM_PROMPT = `Você é um especialista em Lotofácil da comunidade Palpite Tech.

Diretrizes:
- Seja prestativo e amigável
- Compartilhe conhecimento de forma clara
- Reconheça que loteria envolve sorte
- NUNCA mencione que é IA, bot ou modelo de linguagem`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Criar cliente com Service Role (admin)
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Verificar se quem chamou é admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user: caller } } = await supabaseClient.auth.getUser();
    if (!caller) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verificar se é admin
    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id)
      .eq("role", "admin")
      .single();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Apenas admins podem criar bots" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { nome, avatar_url, badge_emoji } = await req.json();

    if (!nome || nome.trim().length === 0) {
      return new Response(JSON.stringify({ error: "Nome é obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Gerar email único
    const slug = nome
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, "")
      .substring(0, 20);
    const email = `${slug}@guia.palpitetech.com`;

    // Verificar se já existe
    const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers();
    const userExists = existingUser?.users?.some(u => u.email === email);
    
    if (userExists) {
      return new Response(JSON.stringify({ error: `Bot com email ${email} já existe` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. Criar usuário via Admin API (não afeta sessão do caller)
    const randomPassword = `bot_${Date.now()}_${crypto.randomUUID().substring(0, 8)}`;
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: randomPassword,
      email_confirm: true,
      user_metadata: { nome, is_bot: true },
    });

    if (authError) {
      console.error("Erro ao criar usuário:", authError);
      return new Response(JSON.stringify({ error: authError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = authData.user.id;

    // 2. Atualizar perfil
    const { error: perfilError } = await supabaseAdmin
      .from("perfis")
      .update({
        is_bot: true,
        avatar_url: avatar_url || null,
        nome,
        email,
      })
      .eq("id", userId);

    if (perfilError) {
      console.error("Erro ao atualizar perfil:", perfilError);
    }

    // 3. Criar guide_personas com todos os campos obrigatórios
    const { data: guideData, error: guideError } = await supabaseAdmin
      .from("guide_personas")
      .insert({
        perfil_id: userId,
        cargo: "Especialista",
        especialidade: "Lotofácil",
        badge_emoji: badge_emoji || "🛡️",
        estilo_escrita: "profissional",
        system_prompt: DEFAULT_SYSTEM_PROMPT,
        ai_model: "google/gemini-3-flash-preview",
        ativo: false,
        can_create_posts: false,
        auto_reply_enabled: false,
        // Chat settings
        chat_enabled: false,
        chat_tags: [],
        chat_priority: 0,
        // Safety settings
        safety_enabled: true,
        safety_block_pii: false,
        safety_banned_topics: [],
        safety_banned_words: [],
        safety_style: "strict",
        // Comments
        can_comment_on_posts: true,
        max_comments_per_post: 10,
        // Bot interactions
        can_respond_to_bot_posts: false,
        can_reply_own_post_comments: false,
        is_strategy_author: false,
        is_sales_author: false,
        is_system_sales_author: false,
        // CTA override
        cta_override_enabled: false,
        cta_override_buttons: {},
      })
      .select("id")
      .single();

    if (guideError) {
      console.error("Erro ao criar guide_personas:", guideError);
      return new Response(JSON.stringify({ error: guideError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Bot criado com sucesso: ${nome} (${guideData.id})`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        bot_id: guideData.id,
        perfil_id: userId,
        email 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("Erro na função create-bot:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
