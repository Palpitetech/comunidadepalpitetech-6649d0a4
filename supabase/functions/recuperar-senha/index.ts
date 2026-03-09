import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function mascararEmail(email: string): string {
  const [local, dominio] = email.split("@");
  if (local.length <= 2) {
    return `${local[0]}***@${dominio}`;
  }
  return `${local.slice(0, 2)}***@${dominio}`;
}

function mascararCelular(celular: string): string {
  const numeros = celular.replace(/\D/g, "");
  if (numeros.length >= 4) {
    return `***${numeros.slice(-4)}`;
  }
  return "***";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { identificador } = await req.json();

    if (!identificador) {
      return new Response(
        JSON.stringify({ sucesso: false, erro: "Identificador é obrigatório" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const isEmail = identificador.includes("@");
    const identificadorLimpo = isEmail ? identificador.trim().toLowerCase() : identificador.replace(/\D/g, "");

    let userId: string | null = null;
    let metodoUsado: "email" | "sms" = "email";
    let destinoMascarado = "";

    if (isEmail) {
      const { data: perfil } = await supabase
        .from("perfis")
        .select("id, email")
        .eq("email", identificadorLimpo)
        .single();

      if (!perfil) {
        const { data: perfilIlike } = await supabase
          .from("perfis")
          .select("id, email")
          .ilike("email", identificadorLimpo)
          .limit(1)
          .single();

        if (perfilIlike) {
          userId = perfilIlike.id;
          destinoMascarado = mascararEmail(perfilIlike.email || identificadorLimpo);
        }
      } else {
        userId = perfil.id;
        destinoMascarado = mascararEmail(perfil.email || identificadorLimpo);
      }
      metodoUsado = "email";
    } else {
      const { data: perfil } = await supabase
        .from("perfis")
        .select("id, celular")
        .eq("celular", identificadorLimpo)
        .single();

      if (perfil) {
        userId = perfil.id;
        destinoMascarado = mascararCelular(perfil.celular || identificadorLimpo);
        metodoUsado = "sms";
      }
    }

    if (!userId) {
      return new Response(
        JSON.stringify({
          sucesso: false,
          erro: "Usuário não encontrado. Verifique o email ou celular.",
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Redefinir senha para 123456 automaticamente
    const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
      password: "123456",
    });

    if (updateError) {
      console.error("Erro ao redefinir senha:", updateError);
      return new Response(
        JSON.stringify({ sucesso: false, erro: "Erro ao redefinir senha" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    return new Response(
      JSON.stringify({
        sucesso: true,
        user_id: userId,
        metodo: metodoUsado,
        destino_mascarado: destinoMascarado,
        senha_redefinida: true,
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Erro na recuperação de senha:", error);
    return new Response(
      JSON.stringify({ sucesso: false, erro: "Erro interno do servidor" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
