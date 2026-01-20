import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function gerarCodigo(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function formatarCelularE164(celular: string): string {
  const numeros = celular.replace(/\D/g, "");
  if (numeros.startsWith("55")) {
    return `+${numeros}`;
  }
  return `+55${numeros}`;
}

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

async function enviarSMSTwilio(
  accountSid: string,
  authToken: string,
  from: string,
  to: string,
  body: string
): Promise<{ sucesso: boolean; erro?: string }> {
  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const auth = btoa(`${accountSid}:${authToken}`);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ To: to, From: from, Body: body }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { sucesso: false, erro: errorData.message || "Erro ao enviar SMS" };
    }

    await response.json();
    return { sucesso: true };
  } catch (error: any) {
    return { sucesso: false, erro: error.message };
  }
}

async function enviarEmailResend(
  apiKey: string,
  to: string,
  subject: string,
  html: string
): Promise<{ sucesso: boolean; erro?: string }> {
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Lotofácil Inteligente <onboarding@resend.dev>",
        to: [to],
        subject,
        html,
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

    // Detectar se é email ou celular
    const isEmail = identificador.includes("@");
    const identificadorLimpo = isEmail ? identificador.trim().toLowerCase() : identificador.replace(/\D/g, "");

    let userId: string | null = null;
    let email: string | null = null;
    let celular: string | null = null;
    let nome: string | null = null;
    let metodoDisponivel: "email" | "sms" | null = null;

    if (isEmail) {
      // Buscar por email na tabela auth.users
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      
      if (authError) {
        console.error("Erro ao buscar usuários:", authError);
        return new Response(
          JSON.stringify({ sucesso: false, erro: "Erro interno" }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      const user = authUsers.users.find(u => u.email?.toLowerCase() === identificadorLimpo);
      
      if (user) {
        userId = user.id;
        email = user.email!;
        metodoDisponivel = "email";

        // Buscar nome no perfil
        const { data: perfil } = await supabase
          .from("perfis")
          .select("nome, celular")
          .eq("id", userId)
          .single();

        if (perfil) {
          nome = perfil.nome;
          celular = perfil.celular;
        }
      }
    } else {
      // Buscar por celular na tabela perfis
      const { data: perfil, error: perfilError } = await supabase
        .from("perfis")
        .select("id, nome, celular")
        .eq("celular", identificadorLimpo)
        .single();

      if (!perfilError && perfil) {
        userId = perfil.id;
        celular = perfil.celular;
        nome = perfil.nome;
        metodoDisponivel = "sms";

        // Buscar email do usuário
        if (userId) {
          const { data: authUser } = await supabase.auth.admin.getUserById(userId);
          if (authUser?.user?.email) {
            email = authUser.user.email;
          }
        }
      }
    }

    // Mensagem genérica para não revelar se usuário existe
    if (!userId || !metodoDisponivel) {
      return new Response(
        JSON.stringify({ 
          sucesso: true, 
          mensagem: "Se o identificador estiver cadastrado, você receberá um código de verificação." 
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Gerar código
    const codigo = gerarCodigo();
    const expiraEm = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos

    // Invalidar códigos anteriores de recuperação
    await supabase
      .from("codigos_verificacao")
      .update({ usado: true })
      .eq("user_id", userId)
      .in("tipo", ["recuperacao_email", "recuperacao_sms"])
      .eq("usado", false);

    // Determinar destino e tipo
    const tipoRecuperacao = metodoDisponivel === "email" ? "recuperacao_email" : "recuperacao_sms";
    const destino = metodoDisponivel === "email" ? email! : celular!;

    // Salvar código no banco
    const { error: insertError } = await supabase
      .from("codigos_verificacao")
      .insert({
        user_id: userId,
        codigo,
        tipo: tipoRecuperacao,
        destino,
        expira_em: expiraEm.toISOString(),
        usado: false,
        tentativas: 0,
      });

    if (insertError) {
      console.error("Erro ao salvar código:", insertError);
      return new Response(
        JSON.stringify({ sucesso: false, erro: "Erro ao gerar código" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Enviar código
    let envioSucesso = false;
    let destinoMascarado = "";

    if (metodoDisponivel === "email") {
      const resendApiKey = Deno.env.get("RESEND_API_KEY");
      if (!resendApiKey) {
        return new Response(
          JSON.stringify({ sucesso: false, erro: "Configuração de email ausente" }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      const nomeUsuario = nome || "Usuário";
      const htmlEmail = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #16a34a; margin: 0;">🍀 Lotofácil Inteligente</h1>
          </div>
          <h2 style="color: #333;">Recuperação de Senha</h2>
          <p style="color: #666; font-size: 16px;">Olá, ${nomeUsuario}!</p>
          <p style="color: #666; font-size: 16px;">Recebemos uma solicitação para redefinir sua senha. Use o código abaixo:</p>
          <div style="background: linear-gradient(135deg, #16a34a 0%, #22c55e 100%); padding: 30px; border-radius: 16px; text-align: center; margin: 30px 0;">
            <p style="color: rgba(255,255,255,0.9); margin: 0 0 10px 0; font-size: 14px;">Seu código de recuperação:</p>
            <h1 style="color: white; font-size: 48px; letter-spacing: 12px; margin: 0; font-family: monospace;">${codigo}</h1>
          </div>
          <p style="color: #666; font-size: 14px;">⏱ Este código expira em <strong>10 minutos</strong>.</p>
          <p style="color: #999; font-size: 12px;">Se você não solicitou esta recuperação, ignore este email.</p>
        </div>
      `;

      const result = await enviarEmailResend(resendApiKey, email!, "Recuperação de Senha - Lotofácil", htmlEmail);
      envioSucesso = result.sucesso;
      destinoMascarado = mascararEmail(email!);
    } else {
      const twilioSid = Deno.env.get("TWILIO_ACCOUNT_SID");
      const twilioToken = Deno.env.get("TWILIO_AUTH_TOKEN");
      const twilioPhone = Deno.env.get("TWILIO_PHONE_NUMBER");

      if (!twilioSid || !twilioToken || !twilioPhone) {
        return new Response(
          JSON.stringify({ sucesso: false, erro: "Configuração de SMS ausente" }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      const celularE164 = formatarCelularE164(celular!);
      const mensagem = `Lotofacil: Seu codigo de recuperacao de senha e ${codigo}. Expira em 10 min.`;

      const result = await enviarSMSTwilio(twilioSid, twilioToken, twilioPhone, celularE164, mensagem);
      envioSucesso = result.sucesso;
      destinoMascarado = mascararCelular(celular!);
    }

    if (!envioSucesso) {
      return new Response(
        JSON.stringify({ sucesso: false, erro: "Erro ao enviar código" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    return new Response(
      JSON.stringify({
        sucesso: true,
        user_id: userId,
        metodo: metodoDisponivel,
        destino_mascarado: destinoMascarado,
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
