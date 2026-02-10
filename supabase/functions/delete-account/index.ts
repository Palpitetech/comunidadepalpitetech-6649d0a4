import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Não autorizado" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify user identity
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseUser.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: "Token inválido" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const userId = claimsData.claims.sub as string;

    // Use service role for cascade deletion
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Delete user data from all tables in order
    const tablesToClean = [
      { table: "chat_messages", column: "user_id" },
      { table: "chat_daily_usage", column: "user_id" },
      { table: "chat_conversations", column: "user_id" },
      { table: "palpites_salvos", column: "user_id" },
      { table: "palpites_pastas", column: "user_id" },
      { table: "post_likes", column: "user_id" },
      { table: "post_comments", column: "user_id" },
      { table: "postagens", column: "user_id" },
      { table: "gerador_daily_usage", column: "user_id" },
      { table: "fechamento_auto_usage", column: "user_id" },
      { table: "codigos_verificacao", column: "user_id" },
      { table: "user_roles", column: "user_id" },
      { table: "perfis", column: "id" },
    ];

    for (const { table, column } of tablesToClean) {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq(column, userId);

      if (error) {
        console.error(`Erro ao deletar ${table}:`, error.message);
        // Continue deletion even if one table fails
      }
    }

    // Delete auth user
    const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(userId);

    if (deleteAuthError) {
      console.error("Erro ao deletar usuário auth:", deleteAuthError);
      return new Response(
        JSON.stringify({ error: "Erro ao excluir conta. Tente novamente." }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: "Conta excluída com sucesso" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Erro ao excluir conta:", error);
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
