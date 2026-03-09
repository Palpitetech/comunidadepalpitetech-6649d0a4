import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// =============================================================================
// CORS
// =============================================================================

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-secret',
};

// =============================================================================
// Tipos
// =============================================================================

type TipoDisparo = 'resultado_novo' | 'comunidade';

interface SendNotificationsBody {
  titulo: string;
  mensagem: string;
  tipo_disparo: TipoDisparo;
  concurso_id?: number;
}

// =============================================================================
// Helpers
// =============================================================================

function maskPhone(phone: string) {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 6) return '***';
  return `${digits.slice(0, 2)}***${digits.slice(-2)}`;
}

function maskEmail(email: string) {
  const [u, d] = email.split('@');
  if (!u || !d) return '***';
  return `${u.slice(0, 2)}***@${d}`;
}

function formatarCelularE164(celular: string): string {
  const digits = celular.replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('55')) return `+${digits}`;
  return `+55${digits}`;
}

async function enviarSMSTwilio(params: {
  accountSid: string;
  authToken: string;
  from: string;
  to: string;
  body: string;
}) {
  const { accountSid, authToken, from, to, body } = params;

  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const form = new URLSearchParams();
  form.set('From', from);
  form.set('To', to);
  form.set('Body', body);

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${btoa(`${accountSid}:${authToken}`)}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: form.toString(),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Twilio ${res.status}: ${text}`);
  }
}

async function enviarEmailResend(params: {
  apiKey: string;
  to: string;
  subject: string;
  html: string;
}) {
  const { apiKey, to, subject, html } = params;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Comunidade Palpite Tech <solicitacao@palpitetech.com.br>',
      to: [to],
      subject,
      html,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Resend ${res.status}: ${text}`);
  }
}

function requireWebhookSecret(req: Request) {
  const expected = Deno.env.get('NOTIFICATIONS_WEBHOOK_SECRET');
  const got = req.headers.get('x-webhook-secret');
  return !!expected && !!got && got === expected;
}

// =============================================================================
// Handler
// =============================================================================

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const startedAt = Date.now();

  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Proteção anti-spam: exige segredo interno
    if (!requireWebhookSecret(req)) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = (await req.json()) as Partial<SendNotificationsBody>;
    const titulo = String(body.titulo || '').trim();
    const mensagem = String(body.mensagem || '').trim();
    const tipo_disparo = body.tipo_disparo as TipoDisparo;

    if (!titulo || !mensagem || (tipo_disparo !== 'resultado_novo' && tipo_disparo !== 'comunidade')) {
      return new Response(JSON.stringify({ error: 'Payload inválido' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const twilioSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const twilioToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const twilioFrom = Deno.env.get('TWILIO_PHONE_NUMBER');
    const resendKey = Deno.env.get('RESEND_API_KEY');

    if (!supabaseUrl || !supabaseServiceKey) throw new Error('Config backend ausente');
    if (!twilioSid || !twilioToken || !twilioFrom) throw new Error('Config Twilio ausente');
    if (!resendKey) throw new Error('Config Resend ausente');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    type Destinatario = {
      id: string;
      nome: string | null;
      celular: string | null;
      email: string | null;
      role: 'user' | 'premium' | 'moderator' | 'admin' | string;
      esta_no_periodo_teste?: boolean | null;
    };

    let destinatarios: Destinatario[] = [];

    if (tipo_disparo === 'resultado_novo') {
      const { data, error } = await supabase
        .from('usuarios_notificaveis_hoje')
        .select('id,nome,celular,email,role,esta_no_periodo_teste');
      if (error) throw new Error(error.message);
      destinatarios = (data || []) as unknown as Destinatario[];
    } else {
      // comunidade: todos com ao menos um canal
      const { data, error } = await supabase
        .from('perfis')
        .select('id,nome,celular,email');
      if (error) throw new Error(error.message);

      const ids = (data || []).map((p) => p.id);
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id,role')
        .in('user_id', ids);
      if (rolesError) throw new Error(rolesError.message);

      const roleByUser = new Map<string, string>();
      for (const r of rolesData || []) {
        // Mantém a role “mais forte” de forma simples (premium > admin/moderator/user não é necessário aqui)
        // se existir premium, prioriza premium
        if (r.role === 'premium') roleByUser.set(r.user_id, 'premium');
        else if (!roleByUser.has(r.user_id)) roleByUser.set(r.user_id, r.role);
      }

      destinatarios = (data || []).map((p) => ({
        id: p.id,
        nome: p.nome,
        celular: p.celular,
        email: (p as any).email ?? null,
        role: roleByUser.get(p.id) || 'user',
      }));
    }

    const resumo = {
      tipo_disparo,
      alvo_total: destinatarios.length,
      enviados_sms: 0,
      enviados_email: 0,
      falhas_sms: [] as Array<{ user_id: string; destino: string; erro: string }>,
      falhas_email: [] as Array<{ user_id: string; destino: string; erro: string }>,
    };

    const subject = titulo;
    const html = `
      <div style="font-family:ui-sans-serif,system-ui;line-height:1.4">
        <h2>${titulo}</h2>
        <p>${mensagem}</p>
      </div>
    `;

    for (const u of destinatarios) {
      const celular = u.celular ? formatarCelularE164(u.celular) : '';
      const email = u.email ? String(u.email).trim() : '';

      const podeReceber = (tipo_disparo === 'comunidade')
        ? true
        : (u.role === 'premium' || (u.role === 'user' && u.esta_no_periodo_teste));

      if (!podeReceber) continue;

      // Regra confirmada: grátis em teste também recebe SMS + Email
      const enviarEmail = !!email && (u.role === 'premium' || (u.role === 'user' && u.esta_no_periodo_teste));
      const enviarSms = !!celular && (u.role === 'premium' || (u.role === 'user' && u.esta_no_periodo_teste) || tipo_disparo === 'comunidade');

      if (enviarSms) {
        try {
          await enviarSMSTwilio({
            accountSid: twilioSid,
            authToken: twilioToken,
            from: twilioFrom,
            to: celular,
            body: `${titulo}: ${mensagem}`,
          });
          resumo.enviados_sms++;
        } catch (e) {
          const err = e instanceof Error ? e.message : String(e);
          resumo.falhas_sms.push({ user_id: u.id, destino: maskPhone(celular), erro: err });
        }
      }

      if (enviarEmail) {
        try {
          await enviarEmailResend({ apiKey: resendKey, to: email, subject, html });
          resumo.enviados_email++;
        } catch (e) {
          const err = e instanceof Error ? e.message : String(e);
          resumo.falhas_email.push({ user_id: u.id, destino: maskEmail(email), erro: err });
        }
      }
    }

    const elapsedMs = Date.now() - startedAt;
    return new Response(JSON.stringify({ sucesso: true, elapsedMs, ...resumo }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ sucesso: false, erro: err }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
