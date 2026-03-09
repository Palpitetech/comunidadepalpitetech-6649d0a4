import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function gerarCodigo(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function formatarCelularE164(celular: string): string {
  const numeros = celular.replace(/\D/g, '');
  if (!numeros.startsWith('55')) {
    return `+55${numeros}`;
  }
  return `+${numeros}`;
}

async function enviarSMSTwilio(
  to: string,
  body: string,
  accountSid: string,
  authToken: string,
  from: string
): Promise<{ success: boolean; error?: string; sid?: string }> {
  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  
  const credentials = btoa(`${accountSid}:${authToken}`);
  
  const params = new URLSearchParams({
    To: to,
    From: from,
    Body: body,
  });

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${credentials}`,
    },
    body: params,
  });

  const data = await response.json();
  
  if (data.sid) {
    return { success: true, sid: data.sid };
  }
  
  return { success: false, error: data.message || 'Erro ao enviar SMS' };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_id, celular, tipo = 'sms' } = await req.json();

    if (!user_id || !celular) {
      throw new Error('user_id e celular são obrigatórios');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const twilioPhoneNumber = Deno.env.get('TWILIO_PHONE_NUMBER');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Configuração do Supabase não encontrada');
    }

    if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
      throw new Error('Configuração do Twilio não encontrada');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Gerar código de 6 dígitos
    const codigo = gerarCodigo();
    const celularFormatado = formatarCelularE164(celular);

    // Usar o tipo passado ou default 'sms'
    const tipoVerificacao = tipo || 'sms';

    // Invalidar códigos anteriores do mesmo usuário e tipo
    await supabase
      .from('codigos_verificacao')
      .update({ usado: true })
      .eq('user_id', user_id)
      .eq('tipo', tipoVerificacao)
      .eq('usado', false);

    // Salvar novo código (expira em 10 minutos)
    const expiraEm = new Date(Date.now() + 10 * 60 * 1000);
    
    const { error: insertError } = await supabase.from('codigos_verificacao').insert({
      user_id,
      codigo,
      tipo: tipoVerificacao,
      destino: celularFormatado,
      expira_em: expiraEm.toISOString(),
    });

    if (insertError) {
      console.error('[ERRO] Falha ao salvar código:', insertError);
      throw new Error('Falha ao gerar código de verificação');
    }

    // Enviar SMS via Twilio
    const result = await enviarSMSTwilio(
      celularFormatado,
      `Comunidade Palpite Tech: Seu codigo de verificacao e ${codigo}. Valido por 10 min.`,
      twilioAccountSid,
      twilioAuthToken,
      twilioPhoneNumber
    );

    if (!result.success) {
      console.error('[ERRO] Falha ao enviar SMS:', result.error);
      throw new Error(result.error || 'Falha ao enviar SMS');
    }

    console.log(`[SMS] Código enviado para ${celularFormatado.slice(0, -4)}**** - SID: ${result.sid}`);

    // Mascarar número para resposta
    const destinoMascarado = celularFormatado.length > 8 
      ? `${celularFormatado.slice(0, 6)}****${celularFormatado.slice(-2)}`
      : celularFormatado;

    return new Response(
      JSON.stringify({ 
        sucesso: true, 
        mensagem: 'Código enviado por SMS',
        destino_mascarado: destinoMascarado
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[ERRO SMS]', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ sucesso: false, erro: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
