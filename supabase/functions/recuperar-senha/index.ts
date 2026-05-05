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

async function enviarEmailSenha(
  apiKey: string,
  to: string,
  nome: string,
  novaSenha: string
): Promise<{ sucesso: boolean; erro?: string }> {
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Comunidade Palpite Tech <solicitacao@palpitetech.com.br>",
        to: [to],
        subject: "Sua nova senha - ComunidadePalpiteTech",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; background: #ffffff;">
            <div style="text-align: center; margin-bottom: 24px;">
              <p style="color: #1E3A5F; margin: 0; font-size: 22px; font-weight: bold;">🍀 Comunidade Palpite Tech</p>
            </div>
            <h2 style="color: #1E3A5F; font-size: 20px; margin-bottom: 8px;">Recuperação de Senha</h2>
            <p style="color: #4a5568; font-size: 16px; line-height: 1.6;">Olá, ${nome}!</p>
            <p style="color: #4a5568; font-size: 16px; line-height: 1.6;">Sua senha foi redefinida com sucesso. Use a senha abaixo para fazer login:</p>
            <div style="background-color: #1E3A5F; padding: 28px 16px; border-radius: 12px; text-align: center; margin: 24px 0;">
              <p style="color: #ffffff; margin: 0 0 12px 0; font-size: 14px;">Sua nova senha:</p>
              <p style="color: #ffffff; font-size: 36px; letter-spacing: 10px; margin: 0; font-family: monospace; font-weight: bold;">${novaSenha}</p>
            </div>
            <div style="text-align: center; margin: 28px 0;">
              <a href="https://www.palpitetech.com.br/login" style="display: inline-block; background-color: #1E3A5F; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; padding: 14px 32px; border-radius: 12px;">Fazer Login</a>
            </div>
            <p style="color: #4a5568; font-size: 14px;">⚠️ Recomendamos que você altere sua senha após o login.</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
            <p style="color: #8a94a6; font-size: 13px; text-align: center;">Se você não solicitou esta recuperação, ignore este email.</p>
          </div>
        `,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { sucesso: false, erro: errorData.message || "Erro ao enviar email" };
    }

    await response.json();
    return { sucesso: true };
  } catch (error: any) {
    return { sucesso: false, erro: error.message };
  }
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
    let email: string | null = null;
    let nome: string | null = null;
    let metodoUsado: "email" | "sms" = "email";
    let destinoMascarado = "";

    if (isEmail) {
      const { data: perfil } = await supabase
        .from("perfis")
        .select("id, email, nome")
        .eq("email", identificadorLimpo)
        .single();

      if (!perfil) {
        const { data: perfilIlike } = await supabase
          .from("perfis")
          .select("id, email, nome")
          .ilike("email", identificadorLimpo)
          .limit(1)
          .single();

        if (perfilIlike) {
          userId = perfilIlike.id;
          email = perfilIlike.email;
          nome = perfilIlike.nome;
          destinoMascarado = mascararEmail(perfilIlike.email || identificadorLimpo);
        }
      } else {
        userId = perfil.id;
        email = perfil.email;
        nome = perfil.nome;
        destinoMascarado = mascararEmail(perfil.email || identificadorLimpo);
      }
      metodoUsado = "email";
    } else {
      const { data: perfil } = await supabase
        .from("perfis")
        .select("id, celular, nome, email")
        .eq("celular", identificadorLimpo)
        .single();

      if (perfil) {
        userId = perfil.id;
        nome = perfil.nome;
        email = perfil.email;
        destinoMascarado = mascararCelular(perfil.celular || identificadorLimpo);
        metodoUsado = "sms";

        // Se não tem email no perfil, buscar no auth
        if (!email && userId) {
          const { data: authUser } = await supabase.auth.admin.getUserById(userId);
          if (authUser?.user?.email) {
            email = authUser.user.email;
          }
        }
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

    if (!email) {
      return new Response(
        JSON.stringify({
          sucesso: false,
          erro: "Não foi possível encontrar um email vinculado a esta conta.",
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const senhaExibida = "12345678";
    const novaSenha = "12345678";

    // Redefinir senha
    const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
      password: novaSenha,
    });

    if (updateError) {
      console.error("Erro ao redefinir senha:", updateError);
      return new Response(
        JSON.stringify({ sucesso: false, erro: "Erro ao redefinir senha" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Enviar email com a nova senha
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      return new Response(
        JSON.stringify({ sucesso: false, erro: "Configuração de email ausente" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const nomeUsuario = nome || "Usuário";
    const envio = await enviarEmailSenha(resendApiKey, email, nomeUsuario, senhaExibida);

    if (!envio.sucesso) {
      console.error("Erro ao enviar email:", envio.erro);
      // Senha já foi alterada, mas email falhou
      return new Response(
        JSON.stringify({
          sucesso: true,
          user_id: userId,
          metodo: metodoUsado,
          destino_mascarado: destinoMascarado,
          senha_redefinida: true,
          email_enviado: false,
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    return new Response(
      JSON.stringify({
        sucesso: true,
        user_id: userId,
        metodo: metodoUsado,
        destino_mascarado: destinoMascarado,
        senha_redefinida: true,
        email_enviado: true,
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
