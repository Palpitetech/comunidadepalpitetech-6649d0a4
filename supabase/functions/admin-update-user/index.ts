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

    // Validate caller is authenticated
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

    // Check admin role
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

    const body = await req.json();
    // `whatsapp` mantido como alias retrocompat — ambos viram `celular`
    // (o trigger sync_whatsapp_with_celular reflete em whatsapp automaticamente).
    const { user_id, email, nome, celular, whatsapp, is_blocked, admin_notes } = body;
    const celularFinal = celular ?? whatsapp;

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: "user_id é obrigatório" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Update email in auth.users if provided
    if (email) {
      const { error: authUpdateError } =
        await supabaseAdmin.auth.admin.updateUserById(user_id, {
          email: email.trim().toLowerCase(),
        });
      if (authUpdateError) {
        return new Response(
          JSON.stringify({
            error: `Erro ao atualizar email no auth: ${authUpdateError.message}`,
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // Update perfis table
    const perfilUpdate: Record<string, unknown> = {};
    if (nome !== undefined) perfilUpdate.nome = nome?.trim() || null;
    if (email !== undefined)
      perfilUpdate.email = email?.trim().toLowerCase() || null;
    if (whatsapp !== undefined) perfilUpdate.whatsapp = whatsapp?.trim() || null;
    if (is_blocked !== undefined) perfilUpdate.is_blocked = is_blocked;
    if (admin_notes !== undefined)
      perfilUpdate.admin_notes = admin_notes?.trim() || null;

    const { error: perfilError } = await supabaseAdmin
      .from("perfis")
      .update(perfilUpdate)
      .eq("id", user_id);

    if (perfilError) {
      return new Response(
        JSON.stringify({
          error: `Erro ao atualizar perfil: ${perfilError.message}`,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // If user was blocked, revoke all active sessions immediately
    if (is_blocked === true) {
      try {
        await supabaseAdmin.auth.admin.signOut(user_id, "global");
        console.log(`Sessões revogadas para usuário bloqueado: ${user_id}`);
      } catch (signOutErr) {
        console.error(`Erro ao revogar sessões de ${user_id}:`, signOutErr);
        // Don't fail the request — the block was applied successfully
      }
    }

    return new Response(JSON.stringify({ sucesso: true }), {
      status: 200,
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
