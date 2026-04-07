import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function getSupabase() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
}

/** Auto-configure the group-member-webhook on an instance if not yet done */
async function ensureWebhookConfigured(
  instanceName: string,
  evolutionUrl: string,
  evolutionKey: string
) {
  const supabase = getSupabase();

  // Check if already configured
  const { data: inst } = await supabase
    .from("whatsapp_instances")
    .select("id, webhook_configured")
    .eq("evolution_instance_id", instanceName)
    .limit(1)
    .single();

  if (!inst || inst.webhook_configured) return;

  const webhookUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/group-member-webhook`;

  try {
    const res = await fetch(
      `${evolutionUrl}/webhook/set/${instanceName}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: evolutionKey,
        },
        body: JSON.stringify({
          webhook: {
            enabled: true,
            url: webhookUrl,
            webhookByEvents: true,
            events: ["GROUP_PARTICIPANTS_UPDATE"],
          },
        }),
      }
    );

    if (res.ok) {
      await supabase
        .from("whatsapp_instances")
        .update({ webhook_configured: true })
        .eq("id", inst.id);
      console.log(`[evolution-proxy] Webhook configured for ${instanceName}`);
    } else {
      console.error(`[evolution-proxy] Failed to set webhook for ${instanceName}: HTTP ${res.status}`);
    }
  } catch (err: any) {
    console.error(`[evolution-proxy] Error setting webhook for ${instanceName}:`, err.message);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const EVOLUTION_API_URL = Deno.env.get("EVOLUTION_API_URL");
  const EVOLUTION_API_KEY = Deno.env.get("EVOLUTION_API_KEY");

  if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY) {
    return new Response(
      JSON.stringify({ error: "Evolution API não configurada" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const reqBody = await req.json();
    const { action, instanceName, number, text } = reqBody;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      apikey: EVOLUTION_API_KEY,
    };

    let url: string;
    let method = "GET";
    let body: string | undefined;

    switch (action) {
      case "fetchInstances":
        url = `${EVOLUTION_API_URL}/instance/fetchInstances`;
        break;
      case "connect":
        url = `${EVOLUTION_API_URL}/instance/connect/${instanceName}`;
        break;
      case "connectionState":
        url = `${EVOLUTION_API_URL}/instance/connectionState/${instanceName}`;
        break;
      case "restart":
        url = `${EVOLUTION_API_URL}/instance/restart/${instanceName}`;
        method = "PUT";
        break;
      case "logout": {
        url = `${EVOLUTION_API_URL}/instance/logout/${instanceName}`;
        method = "DELETE";
        // Reset webhook_configured on logout
        const supabase = getSupabase();
        await supabase
          .from("whatsapp_instances")
          .update({ webhook_configured: false })
          .eq("evolution_instance_id", instanceName);
        break;
      }
      case "delete": {
        url = `${EVOLUTION_API_URL}/instance/delete/${instanceName}`;
        method = "DELETE";
        // Reset webhook_configured on delete
        const supabaseDel = getSupabase();
        await supabaseDel
          .from("whatsapp_instances")
          .update({ webhook_configured: false })
          .eq("evolution_instance_id", instanceName);
        break;
      }
      case "sendText":
        url = `${EVOLUTION_API_URL}/message/sendText/${instanceName}`;
        method = "POST";
        body = JSON.stringify({ number, text });
        break;
      case "fetchGroups":
        url = `${EVOLUTION_API_URL}/group/fetchAllGroups/${instanceName}?getParticipants=false`;
        break;
      case "fetchGroupParticipants": {
        const groupJid = reqBody.groupJid || '';
        url = `${EVOLUTION_API_URL}/group/participants/${instanceName}?groupJid=${encodeURIComponent(groupJid)}`;
        break;
      }
      case "setWebhook": {
        url = `${EVOLUTION_API_URL}/webhook/set/${instanceName}`;
        method = "POST";
        body = JSON.stringify({
          webhook: {
            enabled: reqBody.enabled ?? true,
            url: reqBody.webhookUrl,
            webhookByEvents: true,
            events: reqBody.events || ["GROUP_PARTICIPANTS_UPDATE"],
          },
        });
        break;
      }
      default:
        return new Response(
          JSON.stringify({ error: `Ação desconhecida: ${action}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    const res = await fetch(url, { method, headers, body });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return new Response(
        JSON.stringify({ error: data?.message || data?.error || `HTTP ${res.status}`, details: data }),
        { status: res.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Auto-configure webhook when instance connects successfully
    if (action === "connect" && instanceName) {
      // If no QR returned, instance is already connected → configure webhook
      const base64 = data?.base64 || data?.qrcode?.base64 || data?.qr || null;
      if (!base64) {
        // Already connected, ensure webhook is set
        ensureWebhookConfigured(instanceName, EVOLUTION_API_URL, EVOLUTION_API_KEY).catch(console.error);
      }
    }

    if (action === "connectionState" && instanceName) {
      const state = data?.instance?.state || data?.state || data?.connectionStatus;
      if (state === "open") {
        ensureWebhookConfigured(instanceName, EVOLUTION_API_URL, EVOLUTION_API_KEY).catch(console.error);
      }
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
