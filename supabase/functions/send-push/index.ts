import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-secret',
};

const APP_BASE_URL = 'https://comunidadepalpitetech.lovable.app';

interface SendPushBody {
  tipo: 'resultado_novo' | 'novo_post';
  titulo: string;
  mensagem: string;
  url?: string;
  // For resultado_novo
  loteria?: string;
  concurso_id?: number;
  // For novo_post
  post_id?: string;
  post_slug?: string;
}

function requireWebhookSecret(req: Request): boolean {
  const expected = Deno.env.get('NOTIFICATIONS_WEBHOOK_SECRET');
  const got = req.headers.get('x-webhook-secret');
  return !!expected && !!got && got === expected;
}

function buildUrl(body: SendPushBody): string {
  if (body.url) return body.url;

  if (body.tipo === 'resultado_novo') {
    const loteria = (body.loteria || 'lotofacil').toLowerCase();
    if (loteria === 'megasena' || loteria === 'mega-sena') return `${APP_BASE_URL}/megasena/resultados`;
    if (loteria === 'duplasena' || loteria === 'dupla-sena') return `${APP_BASE_URL}/duplasena/resultados`;
    return `${APP_BASE_URL}/resultados`;
  }

  if (body.tipo === 'novo_post' && body.post_id) {
    return `${APP_BASE_URL}/post/${body.post_id}`;
  }

  return APP_BASE_URL;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!requireWebhookSecret(req)) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = (await req.json()) as SendPushBody;
    const { titulo, mensagem, tipo } = body;

    if (!titulo || !mensagem || !tipo) {
      return new Response(JSON.stringify({ error: 'Payload inválido: titulo, mensagem e tipo são obrigatórios' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const appId = Deno.env.get('ONESIGNAL_APP_ID');
    const restApiKey = Deno.env.get('ONESIGNAL_REST_API_KEY');

    if (!appId || !restApiKey) {
      throw new Error('ONESIGNAL_APP_ID ou ONESIGNAL_REST_API_KEY não configurados');
    }

    const targetUrl = buildUrl(body);

    // Send to all subscribed users via OneSignal
    const oneSignalPayload: Record<string, unknown> = {
      app_id: appId,
      included_segments: ['Subscribed Users'],
      headings: { en: titulo },
      contents: { en: mensagem },
      url: targetUrl,
      // Web push specific
      chrome_web_icon: `${APP_BASE_URL}/pwa-192x192.png`,
      chrome_web_badge: `${APP_BASE_URL}/pwa-192x192.png`,
    };

    console.log(`[PUSH] Enviando push: tipo=${tipo}, titulo="${titulo}", url=${targetUrl}`);

    const res = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${restApiKey}`,
      },
      body: JSON.stringify(oneSignalPayload),
    });

    const responseData = await res.json();

    if (!res.ok) {
      console.error('[PUSH] Erro OneSignal:', JSON.stringify(responseData));
      throw new Error(`OneSignal ${res.status}: ${JSON.stringify(responseData)}`);
    }

    console.log(`[PUSH] ✅ Push enviado. Recipients: ${responseData.recipients || 0}`);

    return new Response(JSON.stringify({
      sucesso: true,
      recipients: responseData.recipients || 0,
      onesignal_id: responseData.id,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e);
    console.error('[PUSH] ❌ Erro:', err);
    return new Response(JSON.stringify({ sucesso: false, erro: err }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
