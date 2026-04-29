import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FREE_PLAN_ID = "65f08789-debf-4e31-b182-7c73c2823b1b";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(JSON.stringify({ error: "Server misconfigured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  try {
    console.log("[EXPIRATION-CHECK] Iniciando verificação de assinaturas expiradas...");

    // 1) Identificar usuários onde validade_assinatura < NOW() e o status ainda consta como ativo/cancelada
    const now = new Date().toISOString();
    
    const { data: expiredUsers, error: fetchError } = await admin
      .from("perfis")
      .select("id, email, status_assinatura, tags")
      .lt("validade_assinatura", now)
      .in("status_assinatura", ["ativa", "cancelada"])
      .eq("is_bot", false);

    if (fetchError) {
      throw fetchError;
    }

    if (!expiredUsers || expiredUsers.length === 0) {
      console.log("[EXPIRATION-CHECK] Nenhuma assinatura expirada encontrada.");
      return new Response(JSON.stringify({ ok: true, processed: 0 }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[EXPIRATION-CHECK] Encontrados ${expiredUsers.length} usuários com assinatura expirada.`);

    let processedCount = 0;
    let errorCount = 0;

    for (const user of expiredUsers) {
      try {
        console.log(`[EXPIRATION-CHECK] Processando downgrade para: ${user.email} (${user.id})`);

        // Atualizar tags: remover "ativo", adicionar "expirado"
        let currentTags: string[] = user.tags || [];
        currentTags = currentTags.filter(t => t !== "ativo");
        if (!currentTags.includes("expirado")) {
          currentTags.push("expirado");
        }

        // 2) Automação de Downgrade para Plano Gratuito
        // Alteração automática do plan_id para o ID do plano gratuito e status para inativa
        const { error: updateError } = await admin
          .from("perfis")
          .update({
            plan_id: FREE_PLAN_ID,
            status_assinatura: "inativa",
            tags: currentTags
          })
          .eq("id", user.id);

        if (updateError) throw updateError;

        // 3) Garantir que o acesso às funcionalidades pagas seja bloqueado instantaneamente
        // Remove a role 'premium' da tabela user_roles
        const { error: roleError } = await admin
          .from("user_roles")
          .delete()
          .eq("user_id", user.id)
          .eq("role", "premium");

        if (roleError) {
          console.error(`[EXPIRATION-CHECK] Erro ao remover role premium para ${user.email}:`, roleError.message);
        }

        // Registrar evento de expiração (append-only)
        await admin.from("events").insert({
          user_id: user.id,
          event_type: "assinatura_expirada",
          source: "system",
          metadata: {
            previous_status: user.status_assinatura,
            email: user.email
          }
        });

        processedCount++;
      } catch (err) {
        console.error(`[EXPIRATION-CHECK] Erro ao processar usuário ${user.id}:`, err);
        errorCount++;
      }
    }

    console.log(`[EXPIRATION-CHECK] Concluído. Processados: ${processedCount}, Erros: ${errorCount}`);

    return new Response(
      JSON.stringify({ ok: true, processed: processedCount, errors: errorCount }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("[EXPIRATION-CHECK] Erro fatal:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
