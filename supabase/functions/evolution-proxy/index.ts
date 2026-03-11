import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

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
    const { action, instanceName, number, text } = await req.json();

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
      case "logout":
        url = `${EVOLUTION_API_URL}/instance/logout/${instanceName}`;
        method = "DELETE";
        break;
      case "delete":
        url = `${EVOLUTION_API_URL}/instance/delete/${instanceName}`;
        method = "DELETE";
        break;
      case "sendText":
        url = `${EVOLUTION_API_URL}/message/sendText/${instanceName}`;
        method = "POST";
        body = JSON.stringify({ number, text });
        break;
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
