import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const body = await req.json();
    console.log("Webhook received:", JSON.stringify(body, null, 2));

    const { event, data, instance } = body;

    // Redireciona eventos de grupo para a função original
    if (event === "GROUP_PARTICIPANTS_UPDATE") {
      const groupWebhookUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/group-member-webhook`;
      return fetch(groupWebhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": req.headers.get("Authorization") || ""
        },
        body: JSON.stringify(body)
      });
    }

    if (event !== "MESSAGES_UPSERT") {
      return new Response(JSON.stringify({ message: "Event ignored" }), { status: 200 });
    }

    const message = data.message;
    if (!message) return new Response(JSON.stringify({ message: "No message data" }), { status: 200 });

    const key = message.key;
    const remoteJid = key.remoteJid;

    // Ignora se for grupo ou se for mensagem enviada pelo bot (fromMe)
    if (remoteJid.endsWith("@g.us") || key.fromMe) {
      return new Response(JSON.stringify({ message: "Group or outgoing message ignored" }), { status: 200 });
    }

    const phoneNumber = remoteJid.replace("@s.whatsapp.net", "");
    const instanceName = instance;
    
    // Extrai o conteúdo da mensagem (texto simples)
    let content = "";
    if (message.message?.conversation) {
      content = message.message.conversation;
    } else if (message.message?.extendedTextMessage?.text) {
      content = message.message.extendedTextMessage.text;
    }

    if (!content) {
      return new Response(JSON.stringify({ message: "Empty content ignored" }), { status: 200 });
    }

    // 1. Identificar a instância no banco
    const { data: dbInstance } = await supabase
      .from("whatsapp_instances")
      .select("id")
      .eq("evolution_instance_id", instanceName)
      .single();

    if (!dbInstance) {
      console.error(`Instance ${instanceName} not found in database`);
      return new Response(JSON.stringify({ error: "Instance not found" }), { status: 404 });
    }

    // 2. Upsert na conversa
    const { data: conversation, error: convError } = await supabase
      .from("whatsapp_chat_conversations")
      .upsert(
        {
          phone_number: phoneNumber,
          instance_id: dbInstance.id,
          profile_name: data.pushName || null,
          last_message_at: new Date().toISOString(),
          last_message_preview: content.substring(0, 100),
        },
        { onConflict: "phone_number" }
      )
      .select()
      .single();

    if (convError) {
      console.error("Error upserting conversation:", convError);
      throw convError;
    }

    // Incrementa unread_count (Upsert acima não incrementa sozinho de forma atômica facilmente sem RPC ou trigger)
    // Para simplificar esta etapa, faremos um update separado
    await supabase.rpc("increment_unread_count", { p_phone_number: phoneNumber });

    // 3. Inserir a mensagem
    const { error: msgError } = await supabase
      .from("whatsapp_chat_messages")
      .insert({
        conversation_id: conversation.id,
        phone_number: phoneNumber,
        instance_id: dbInstance.id,
        direction: "inbound",
        content: content,
        evolution_message_id: key.id,
        status: "received"
      });

    if (msgError) {
      console.error("Error inserting message:", msgError);
      throw msgError;
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
