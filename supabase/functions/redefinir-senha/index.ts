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
    const { user_id, codigo, nova_senha } = await req.json();

    if (!user_id || !codigo || !nova_senha) {
      return new Response(
        JSON.stringify({ sucesso: false, erro: "Dados incompletos" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (nova_senha.length < 6) {
      return new Response(
        JSON.stringify({ sucesso: false, erro: "A senha deve ter pelo menos 6 caracteres" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Buscar código de recuperação válido
    const { data: codigoData, error: codigoError } = await supabase
      .from("codigos_verificacao")
      .select("*")
      .eq("user_id", user_id)
      .in("tipo", ["recuperacao_email", "recuperacao_sms"])
      .eq("usado", false)
      .gt("expira_em", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (codigoError || !codigoData) {
      return new Response(
        JSON.stringify({ sucesso: false, erro: "Código expirado ou inválido. Solicite um novo." }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Verificar número de tentativas
    if (codigoData.tentativas >= 5) {
      // Marcar código como usado
      await supabase
        .from("codigos_verificacao")
        .update({ usado: true })
        .eq("id", codigoData.id);

      return new Response(
        JSON.stringify({ sucesso: false, erro: "Muitas tentativas incorretas. Solicite um novo código." }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Verificar código
    if (codigoData.codigo !== codigo) {
      // Incrementar tentativas
      await supabase
        .from("codigos_verificacao")
        .update({ tentativas: codigoData.tentativas + 1 })
        .eq("id", codigoData.id);

      const tentativasRestantes = 5 - (codigoData.tentativas + 1);
      return new Response(
        JSON.stringify({ 
          sucesso: false, 
          erro: `Código incorreto. ${tentativasRestantes} tentativa${tentativasRestantes !== 1 ? 's' : ''} restante${tentativasRestantes !== 1 ? 's' : ''}.` 
        }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Código correto - atualizar senha do usuário
    const { error: updateError } = await supabase.auth.admin.updateUserById(user_id, {
      password: nova_senha,
    });

    if (updateError) {
      console.error("Erro ao atualizar senha:", updateError);
      return new Response(
        JSON.stringify({ sucesso: false, erro: "Erro ao atualizar senha" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Marcar código como usado
    await supabase
      .from("codigos_verificacao")
      .update({ usado: true })
      .eq("id", codigoData.id);

    // Invalidar todos os outros códigos de recuperação do usuário
    await supabase
      .from("codigos_verificacao")
      .update({ usado: true })
      .eq("user_id", user_id)
      .in("tipo", ["recuperacao_email", "recuperacao_sms"])
      .eq("usado", false);

    return new Response(
      JSON.stringify({ sucesso: true, mensagem: "Senha alterada com sucesso!" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Erro ao redefinir senha:", error);
    return new Response(
      JSON.stringify({ sucesso: false, erro: "Erro interno do servidor" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
