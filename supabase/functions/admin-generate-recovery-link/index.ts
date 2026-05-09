import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } =
      await supabaseUser.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Sessão inválida" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const callerId = claimsData.claims.sub as string;

    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", callerId)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(
        JSON.stringify({ error: "Permissão negada — apenas admins" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { user_id, email } = body as { user_id?: string; email?: string };

    let targetEmail = email;
    let targetUserId = user_id;

    if (!targetEmail && targetUserId) {
      const { data: u } = await supabaseAdmin.auth.admin.getUserById(targetUserId);
      targetEmail = u?.user?.email ?? undefined;
    }

    if (!targetEmail) {
      return new Response(
        JSON.stringify({ error: "Usuário sem email cadastrado" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const redirectTo = "https://palpitetech.com.br/reset-password";

    const { data: linkData, error: linkError } =
      await supabaseAdmin.auth.admin.generateLink({
        type: "recovery",
        email: targetEmail,
        options: { redirectTo },
      });

    if (linkError || !linkData?.properties?.action_link) {
      return new Response(
        JSON.stringify({ error: linkError?.message || "Erro ao gerar link" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const actionLink = linkData.properties.action_link;
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1h

    if (!targetUserId) {
      targetUserId = linkData.user?.id;
    }

    // Audit log
    await supabaseAdmin.from("admin_audit_logs").insert({
      admin_id: callerId,
      action: "generate_recovery_link",
      table_name: "auth.users",
      details: {
        target_user_id: targetUserId,
        target_email: targetEmail,
        expires_at: expiresAt,
        redirect_to: redirectTo,
      },
    });

    return new Response(
      JSON.stringify({
        sucesso: true,
        action_link: actionLink,
        email: targetEmail,
        expires_at: expiresAt,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro inesperado";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
