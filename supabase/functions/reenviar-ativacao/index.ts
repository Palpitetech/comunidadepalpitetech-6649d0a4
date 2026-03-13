import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    // Validate JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAnon = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseAnon.auth.getUser(token);
    if (claimsError || !claimsData?.user) {
      return new Response(JSON.stringify({ error: "Token inválido" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.user.id;

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check profile
    const { data: perfil } = await supabaseAdmin
      .from("perfis")
      .select("email, email_verificado, nome")
      .eq("id", userId)
      .single();

    if (!perfil?.email) {
      return new Response(JSON.stringify({ error: "Email não encontrado" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (perfil.email_verificado) {
      return new Response(JSON.stringify({ error: "Email já verificado" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const siteUrl = Deno.env.get("SITE_URL") || "https://comunidadepalpitetech.lovable.app";

    // Generate magic link
    const { data: magicData, error: magicError } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email: perfil.email,
      options: {
        redirectTo: `${siteUrl}/ativar-conta`,
      },
    });

    if (magicError || !magicData?.properties?.hashed_token) {
      await supabaseAdmin.from("system_events").insert({
        event_type: "lead_ativacao_email_enviado",
        description: `Erro ao gerar magic link para ${perfil.email}`,
        source: "reenviar-ativacao",
        status: "error",
        metadata: { user_id: userId, error: magicError?.message },
      });

      return new Response(JSON.stringify({ error: "Erro ao gerar link" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use hashed_token directly from generateLink response
    const token_hash = magicData.properties.hashed_token;
    const directLink = `${siteUrl}/ativar-conta?token_hash=${encodeURIComponent(token_hash)}&type=magiclink`;

    // Send email via Resend
    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: Deno.env.get("RESEND_FROM_EMAIL") ?? "Comunidade Palpite Tech <solicitacao@palpitetech.com.br>",
        to: perfil.email,
        subject: "Ative sua conta e crie sua senha",
        html: buildActivationEmail(perfil.nome || perfil.email.split("@")[0], directLink),
      }),
    });

    const resendOk = resendRes.ok;
    await resendRes.text();

    await supabaseAdmin.from("system_events").insert({
      event_type: "lead_ativacao_email_enviado",
      description: `Email de ativação reenviado para ${perfil.email}`,
      source: "reenviar-ativacao",
      status: resendOk ? "success" : "error",
      metadata: { user_id: userId, email: perfil.email },
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro interno";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function buildActivationEmail(nome: string, actionLink: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #ffffff;">
      <h1 style="color: #1a2e4a; font-size: 22px; margin-bottom: 8px;">Olá, ${nome || "bem-vindo"}!</h1>
      <p style="color: #4a5568; font-size: 16px; line-height: 1.6;">
        Sua conta foi criada. Clique no botão abaixo para ativar e criar sua senha de acesso.
      </p>
      <div style="text-align: center; margin: 32px 0;">
        <a href="${actionLink}" style="display: inline-block; background-color: #1a2e4a; color: #ffffff; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-size: 16px; font-weight: 600;">
          Ativar minha conta
        </a>
      </div>
      <p style="color: #8a94a6; font-size: 13px; text-align: center;">
        Este link expira em 24 horas.<br/>
        Se não solicitou, ignore este email.
      </p>
    </div>
  `;
}
