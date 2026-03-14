import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

type RequestBody = {
  action?: 'send_test'
}

function pickNotificationTitle(headings: Record<string, string> | null | undefined) {
  if (!headings) return '—'
  return headings.pt ?? headings['pt-BR'] ?? headings.en ?? Object.values(headings)[0] ?? '—'
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const appId = Deno.env.get('ONESIGNAL_APP_ID')
    const restApiKey = Deno.env.get('ONESIGNAL_REST_API_KEY')
    const webhookSecret = Deno.env.get('NOTIFICATIONS_WEBHOOK_SECRET')

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const token = authHeader.replace('Bearer ', '')
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token)
    if (claimsError || !claimsData?.claims?.sub) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const userId = claimsData.claims.sub

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)
    const { data: roleData } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .maybeSingle()

    if (!roleData) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!appId || !restApiKey) {
      throw new Error('ONESIGNAL_APP_ID ou ONESIGNAL_REST_API_KEY não configurados')
    }

    const rawBody = await req.text()
    const body: RequestBody = rawBody ? JSON.parse(rawBody) : {}

    if (body.action === 'send_test') {
      if (!webhookSecret) {
        throw new Error('NOTIFICATIONS_WEBHOOK_SECRET não configurado')
      }

      const pushRes = await fetch(`${supabaseUrl}/functions/v1/send-push`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${supabaseAnonKey}`,
          'x-webhook-secret': webhookSecret,
        },
        body: JSON.stringify({
          tipo: 'novo_post',
          titulo: 'Teste de notificação',
          mensagem: 'Se você recebeu isto, o push está funcionando!',
          post_slug: 'teste-push',
        }),
      })

      const pushData = await pushRes.json()
      if (!pushRes.ok) {
        return new Response(JSON.stringify({ error: 'Erro ao enviar push de teste', details: pushData }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      return new Response(JSON.stringify({ sucesso: true, resultado: pushData }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const appRes = await fetch(`https://api.onesignal.com/apps/${appId}`, {
      headers: { Authorization: `Basic ${restApiKey}` },
    })
    const appData = await appRes.json()
    console.log('[get-push-stats] app data:', JSON.stringify(appData))

    if (!appRes.ok) {
      throw new Error(`OneSignal apps error ${appRes.status}: ${JSON.stringify(appData)}`)
    }

    const notifRes = await fetch(`https://api.onesignal.com/notifications?app_id=${appId}&limit=10`, {
      headers: { Authorization: `Basic ${restApiKey}` },
    })
    const notifData = await notifRes.json()

    if (!notifRes.ok) {
      throw new Error(`OneSignal notifications error ${notifRes.status}: ${JSON.stringify(notifData)}`)
    }

    const notificacoes = (notifData.notifications || []).map((n: any) => {
      const enviadas = Number(n.successful ?? 0)
      const abertas = Number(n.opened ?? 0)
      const taxa = enviadas > 0 ? Number(((abertas / enviadas) * 100).toFixed(1)) : 0

      return {
        id: n.id,
        titulo: pickNotificationTitle(n.headings),
        enviadas,
        abertas,
        falhas: Number(n.failed ?? 0),
        taxa_abertura: taxa,
        data: n.queued_at || n.send_after || n.completed_at || null,
      }
    })

    const rawPlayers = Number(appData.players ?? 0)
    const rawMessagable = Number(appData.messagable_players ?? appData.messageable_players ?? 0)
    const notificaveis = rawMessagable > 0 ? rawMessagable : rawPlayers

    return new Response(JSON.stringify({
      inscritos: rawPlayers,
      notificaveis,
      _raw_players: appData.players,
      _raw_messagable: appData.messagable_players ?? appData.messageable_players,
      _app_name: appData.name,
      notificacoes,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e)
    console.error('[get-push-stats] Error:', err)
    return new Response(JSON.stringify({ error: err }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
