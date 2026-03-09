import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function gerarCodigo(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

interface ResendEmailResponse {
  id?: string;
  error?: { message: string };
}

async function enviarEmailResend(
  apiKey: string, 
  to: string, 
  subject: string, 
  html: string
): Promise<{ sucesso: boolean; erro?: string }> {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Lotofácil Inteligente <Solicitacao@palpitetech.com.br>',
      to: [to],
      subject,
      html,
    }),
  });

  const data: ResendEmailResponse = await response.json();

  if (!response.ok || data.error) {
    return { sucesso: false, erro: data.error?.message || 'Erro ao enviar email' };
  }

  return { sucesso: true };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_id, email, nome } = await req.json();

    if (!user_id || !email) {
      throw new Error('user_id e email são obrigatórios');
    }

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY não configurada');
    }
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Configuração do Supabase não encontrada');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Gerar código de 6 dígitos
    const codigo = gerarCodigo();

    // Invalidar códigos anteriores
    const { error: invalidateError } = await supabase
      .from('codigos_verificacao')
      .update({ usado: true })
      .eq('user_id', user_id)
      .eq('tipo', 'email')
      .eq('usado', false);

    if (invalidateError) {
      console.error('[AVISO] Falha ao invalidar códigos anteriores:', invalidateError);
    }

    // Salvar novo código (expira em 10 minutos)
    const expiraEm = new Date(Date.now() + 10 * 60 * 1000);
    
    const { error: insertError } = await supabase.from('codigos_verificacao').insert({
      user_id,
      codigo,
      tipo: 'email',
      destino: email,
      expira_em: expiraEm.toISOString(),
    });

    if (insertError) {
      console.error('[ERRO] Falha ao salvar código:', insertError);
      throw new Error('Erro ao gerar código de verificação');
    }

    // Enviar email via Resend API
    const htmlEmail = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
        <div style="background: white; border-radius: 16px; padding: 32px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <h1 style="font-size: 28px; color: #1f2937; margin-bottom: 20px; text-align: center;">
            Olá, ${nome || 'Usuário'}! 👋
          </h1>
          
          <p style="font-size: 18px; color: #4b5563; margin-bottom: 30px; text-align: center;">
            Seu código de verificação é:
          </p>
          
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 30px;">
            <span style="font-size: 42px; font-weight: bold; letter-spacing: 8px; color: white; font-family: monospace;">
              ${codigo}
            </span>
          </div>
          
          <p style="font-size: 16px; color: #6b7280; text-align: center; margin-bottom: 8px;">
            ⏱ Este código expira em <strong>10 minutos</strong>.
          </p>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
          
          <p style="font-size: 14px; color: #9ca3af; text-align: center;">
            Se você não solicitou este código, ignore este email.
          </p>
        </div>
      </body>
      </html>
    `;

    const emailResult = await enviarEmailResend(
      resendApiKey,
      email,
      'Seu código de verificação - Lotofácil',
      htmlEmail
    );

    if (!emailResult.sucesso) {
      console.error('[ERRO] Falha ao enviar email:', emailResult.erro);
      throw new Error('Erro ao enviar email. Verifique o endereço.');
    }

    console.log(`[EMAIL] Código enviado para ${email.slice(0, 3)}***@***`);

    // Mascarar email para resposta
    const [localPart, domain] = email.split('@');
    const mascarado = `${localPart.slice(0, 2)}***@${domain}`;

    return new Response(
      JSON.stringify({ 
        sucesso: true, 
        mensagem: 'Código enviado por email',
        destino_mascarado: mascarado
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[ERRO EMAIL]', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ sucesso: false, erro: errorMessage }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
