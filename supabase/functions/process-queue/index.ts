import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const EVOLUTION_API_URL = Deno.env.get("EVOLUTION_API_URL")!;
const EVOLUTION_API_KEY = Deno.env.get("EVOLUTION_API_KEY")!;

function getSupabase() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
}

async function selectInstance(supabase: ReturnType<typeof createClient>) {
  const { data, error } = await supabase.rpc("select_best_instance");
  if (error || !data || data.length === 0) return null;
  // Return in the shape the rest of the code expects
  return {
    id: data[0].instance_id,
    evolution_instance_id: data[0].evolution_instance_id,
    phone_number: data[0].phone_number,
  };
}

function resolveTemplate(
  content: string,
  variables: Record<string, string>
): string {
  let result = content;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replaceAll(`{{${key}}}`, value ?? "");
  }
  return result;
}

async function sendMessage(
  supabase: ReturnType<typeof createClient>,
  item: any
): Promise<{ success: boolean; error?: string }> {
  // Mark as sending
  await supabase
    .from("message_queue")
    .update({ status: "sending" })
    .eq("id", item.id);

  // Retry loop: wait for an available instance (up to 3 attempts, 60s between)
  let instance: any = null;
  for (let attempt = 1; attempt <= 3; attempt++) {
    instance = await selectInstance(supabase);
    if (instance) break;
    if (attempt < 3) {
      console.warn(`[process-queue] Aguardando instância disponível (tentativa ${attempt}/3) para item ${item.id}...`);
      await new Promise((r) => setTimeout(r, 60_000));
    }
  }

  if (!instance) {
    await supabase
      .from("message_queue")
      .update({ status: "pending" })
      .eq("id", item.id);
    return { success: false, error: "Nenhuma instância disponível após 3 tentativas" };
  }

  // Resolve template or free message
  let messageText = "";
  if (item.template_id) {
    const { data: tpl } = await supabase
      .from("message_templates")
      .select("content")
      .eq("id", item.template_id)
      .single();
    messageText = tpl
      ? resolveTemplate(tpl.content, item.variables ?? {})
      : "";
  } else if (item.variables?.mensagem_livre) {
    // Free-text message: resolve variables in the free message content
    messageText = resolveTemplate(
      String(item.variables.mensagem_livre),
      item.variables as Record<string, string>
    );
  }

  if (!messageText) {
    await supabase
      .from("message_queue")
      .update({
        status: "failed",
        error_message: item.template_id
          ? "Template não encontrado ou vazio"
          : "Mensagem livre vazia",
        retry_count: (item.retry_count ?? 0) + 1,
      })
      .eq("id", item.id);
    return { success: false, error: "Mensagem vazia" };
  }

  // Call Evolution API
  try {
    const url = `${EVOLUTION_API_URL}/message/sendText/${instance.evolution_instance_id}`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: EVOLUTION_API_KEY,
      },
      body: JSON.stringify({
        number: item.recipient_phone,
        text: messageText,
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      await supabase
        .from("message_queue")
        .update({
          status: "failed",
          error_message: `HTTP ${res.status}: ${errBody.slice(0, 200)}`,
          retry_count: (item.retry_count ?? 0) + 1,
        })
        .eq("id", item.id);
      return { success: false, error: `HTTP ${res.status}` };
    }

    await res.text(); // consume body

    const now = new Date().toISOString();

    // Update queue item as sent
    await supabase
      .from("message_queue")
      .update({
        status: "sent",
        sent_at: now,
        instance_id: instance.id,
      })
      .eq("id", item.id);

    // Centralized usage registration
    await supabase.rpc("register_instance_usage", { p_instance_id: instance.id });

    // Insert send_log
    await supabase.from("send_logs").insert({
      queue_id: item.id,
      instance_id: instance.id,
      recipient_phone: item.recipient_phone,
      message_content: messageText,
      status: "sent",
      sent_at: now,
    });

    return { success: true };
  } catch (err: any) {
    await supabase
      .from("message_queue")
      .update({
        status: "failed",
        error_message: err.message?.slice(0, 200) ?? "Erro desconhecido",
        retry_count: (item.retry_count ?? 0) + 1,
      })
      .eq("id", item.id);
    return { success: false, error: err.message };
  }
}

function randomDelay(minMs: number, maxMs: number): Promise<void> {
  const ms = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function processQueue() {
  const supabase = getSupabase();
  const errors: string[] = [];
  let processed = 0;

  const { data: items, error } = await supabase
    .from("message_queue")
    .select("*")
    .eq("status", "pending")
    .order("scheduled_at", { ascending: true })
    .limit(5);

  if (error) {
    return { processed: 0, errors: [error.message] };
  }

  if (!items?.length) {
    return { processed: 0, errors: [] };
  }

  for (let i = 0; i < items.length; i++) {
    const result = await sendMessage(supabase, items[i]);
    if (result.success) {
      processed++;
    } else if (result.error) {
      errors.push(result.error);
    }

    // Random delay 3-5 min between messages (skip after last)
    if (i < items.length - 1) {
      await randomDelay(3 * 60 * 1000, 5 * 60 * 1000);
    }
  }

  return { processed, errors };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const result = await processQueue();
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
