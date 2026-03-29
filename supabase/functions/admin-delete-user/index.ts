import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_id } = await req.json();

    if (!user_id) {
      return new Response(JSON.stringify({ error: "user_id required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Verify caller is admin
    const authHeader = req.headers.get("Authorization");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (authHeader) {
      const userClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: { user } } = await userClient.auth.getUser();
      if (user) {
        const adminCheck = createClient(supabaseUrl, supabaseServiceKey);
        const { data: role } = await adminCheck
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .eq("role", "admin")
          .maybeSingle();
        if (!role) {
          return new Response(JSON.stringify({ error: "Admin only" }), {
            status: 403,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          });
        }
      }
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
      { table: "events", column: "user_id" },
      { table: "referral_rewards", column: "user_id" },
      { table: "user_roles", column: "user_id" },
      { table: "perfis", column: "id" },
    ];

    const results: string[] = [];
    for (const { table, column } of tablesToClean) {
      const { error } = await supabase.from(table).delete().eq(column, user_id);
      results.push(`${table}: ${error ? error.message : "ok"}`);
    }

    const { error: authError } = await supabase.auth.admin.deleteUser(user_id);

    return new Response(JSON.stringify({
      success: !authError,
      auth_deleted: !authError,
      auth_error: authError?.message || null,
      tables: results,
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
