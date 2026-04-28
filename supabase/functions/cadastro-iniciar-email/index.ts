// Funil de cadastro — Etapa 1: recebe email, envia código de 6 dígitos via Resend.
// Cria/atualiza um registro em `cadastros_pendentes` (sem auth.users ainda).
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
};

const json = (b: Record<string, unknown>, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: corsHeaders });

const gerarCodigo = () => Math.floor(100000 + Math.random() * 900000).toString();

function buildHtml(codigo: string) {
  return `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:20px;background:#f9fafb;">
    <div style="background:white;border-radius:16px;padding:32px;">
      <h1 style="font-size:24px;color:#1f2937;text-align:center;">Confirme seu e-mail</h1>
      <p style="font-size:16px;color:#4b5563;text-align:center;">Seu código de verificação é:</p>
      <div style="background:linear-gradient(135deg,#10b981,#059669);border-radius:12px;padding:24px;text-align:center;margin:24px 0;">
        <span style="font-size:42px;font-weight:bold;letter-spacing:8px;color:white;font-family:monospace;">${codigo}</span>
      </div>
      <p style="font-size:14px;color:#6b7280;text-align:center;">⏱ Expira em <strong>10 minutos</strong>.</p>
      <p style="font-size:12px;color:#9ca3af;text-align:center;margin-top:24px;">Se você não solicitou, ignore este email.</p>
    </div></body></html>`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  try {
    const { email: rawEmail, attribution, referral_code } = await req.json();
    const email = String(rawEmail ?? '').trim().toLowerCase();
    if (!email || !email.includes('@')) return json({ sucesso: false, erro: 'E-mail inválido' }, 400);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const resendKey = Deno.env.get('RESEND_API_KEY');
    if (!resendKey) return json({ sucesso: false, erro: 'Configuração de e-mail ausente' }, 500);

    const supabase = createClient(supabaseUrl, serviceKey);

    // Bloqueia se email já tem conta ativa
    const { data: perfilExistente } = await supabase
      .from('perfis')
      .select('id, email_verificado')
      .eq('email', email)
      .maybeSingle();
    if (perfilExistente?.email_verificado) {
      return json({ sucesso: false, erro: 'JA_CADASTRADO', mensagem: 'Esse e-mail já tem conta. Use Entrar.' }, 409);
    }

    // Busca cadastro pendente em aberto
    const { data: existing } = await supabase
      .from('cadastros_pendentes')
      .select('id, email_codigo_enviado_em')
      .eq('email', email)
      .eq('finalizado', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Rate limit: 1 envio a cada 60s
    if (existing?.email_codigo_enviado_em) {
      const diff = Date.now() - new Date(existing.email_codigo_enviado_em).getTime();
      if (diff < 60_000) {
        const wait = Math.ceil((60_000 - diff) / 1000);
        return json({ sucesso: false, erro: 'AGUARDE', mensagem: `Aguarde ${wait}s para reenviar.` }, 429);
      }
    }

    const codigo = gerarCodigo();
    const expira = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    const enviadoEm = new Date().toISOString();

    let cadastroId = existing?.id;
    if (cadastroId) {
      await supabase.from('cadastros_pendentes').update({
        email_codigo: codigo,
        email_codigo_expira_em: expira,
        email_codigo_enviado_em: enviadoEm,
        email_tentativas: 0,
        email_verificado: false,
      }).eq('id', cadastroId);
    } else {
      const { data: inserted, error: insErr } = await supabase
        .from('cadastros_pendentes')
        .insert({
          email,
          email_codigo: codigo,
          email_codigo_expira_em: expira,
          email_codigo_enviado_em: enviadoEm,
          attribution: attribution ?? {},
          referral_code: referral_code ?? null,
        })
        .select('id')
        .single();
      if (insErr) {
        console.error('[CADASTRO-EMAIL] insert', insErr);
        return json({ sucesso: false, erro: 'Erro interno ao iniciar cadastro' }, 500);
      }
      cadastroId = inserted.id;
    }

    // Envia email via Resend
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Comunidade Palpite Tech <solicitacao@palpitetech.com.br>',
        to: [email],
        subject: 'Seu código de cadastro - Palpite Tech',
        html: buildHtml(codigo),
      }),
    });
    if (!r.ok) {
      const errBody = await r.text();
      console.error('[CADASTRO-EMAIL] resend', errBody);
      return json({ sucesso: false, erro: 'Falha ao enviar e-mail. Confira o endereço.' }, 500);
    }

    const [local, dom] = email.split('@');
    return json({
      sucesso: true,
      cadastro_id: cadastroId,
      destino_mascarado: `${local.slice(0, 2)}***@${dom}`,
      mensagem: 'Código enviado para o seu e-mail.',
    });
  } catch (e) {
    console.error('[CADASTRO-EMAIL] erro', e);
    return json({ sucesso: false, erro: 'Erro inesperado' }, 500);
  }
});
