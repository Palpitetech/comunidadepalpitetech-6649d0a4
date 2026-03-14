import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    // Auth check
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const token = authHeader.replace('Bearer ', '')
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token)
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const userId = claimsData.claims.sub as string

    // Check admin role
    const supabaseAdmin = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const { data: roleData } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .maybeSingle()

    if (!roleData) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const appId = Deno.env.get('ONESIGNAL_APP_ID')
    const restApiKey = Deno.env.get('ONESIGNAL_REST_API_KEY')

    if (!appId || !restApiKey) {
      throw new Error('ONESIGNAL_APP_ID ou ONESIGNAL_REST_API_KEY não configurados')
    }

    // Fetch app stats
    const appRes = await fetch(`https://api.onesignal.com/apps/${appId}`, {
      headers: { Authorization: `Basic ${restApiKey}` },
    })
    const appData = await appRes.json()

    // Fetch last 10 notifications
    const notifRes = await fetch(
      `https://api.onesignal.com/notifications?app_id=${appId}&limit=10`,
      { headers: { Authorization: `Basic ${restApiKey}` } },
    )
    const notifData = await notifRes.json()

    const notificacoes = (notifData.notifications || []).map((n: any) => ({
      id: n.id,
      titulo: n.headings?.pt ?? n.headings?.en ?? '—',
      enviadas: n.successful ?? 0,
      abertas: n.opened ?? 0,
      falhas: n.failed ?? 0,
      taxa_abertura: (n.successful ?? 0) > 0
        ? ((n.opened ?? 0) / (n.successful ?? 1) * 100).toFixed(1)
        : '0.0',
      data: n.queued_at || n.send_after || n.completed_at,
    }))

    return new Response(JSON.stringify({
      inscritos: appData.players ?? 0,
      notificaveis: appData.messageable_players ?? 0,
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
