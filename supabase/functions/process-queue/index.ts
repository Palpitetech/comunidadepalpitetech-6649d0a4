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
  ) as any;
}

async function selectInstance(supabase: any) {
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

/**
 * Resolve o texto final da mensagem:
 * 1. Se há `variant_id` válido → usa o conteúdo da variante.
 * 2. Senão, se há `template_id` → usa o conteúdo do template.
 * 3. Senão, se há `variables.mensagem_livre` → usa esse texto.
 * 4. Caso contrário, retorna string vazia.
 * Em todos os casos, aplica `resolveTemplate` para substituir variáveis.
 */
async function resolveMessageText(
  supabase: any,
  item: any
): Promise<string> {
  // 1) Variante (prioridade)
  if (item.variant_id) {
    const { data: variant } = await supabase
      .from("message_template_variants")
      .select("content")
      .eq("id", item.variant_id)
      .maybeSingle();
    if (variant?.content) {
      return resolveTemplate(variant.content, item.variables ?? {});
    }
    // se variante sumiu, cai no fallback do template
  }

  // 2) Template padrão
  if (item.template_id) {
    const { data: tpl } = await supabase
      .from("message_templates")
      .select("content")
      .eq("id", item.template_id)
      .maybeSingle();
    if (tpl?.content) {
      return resolveTemplate(tpl.content, item.variables ?? {});
    }
    return "";
  }

  // 3) Mensagem livre
  if (item.variables?.mensagem_livre) {
    return resolveTemplate(
      String(item.variables.mensagem_livre),
      item.variables as Record<string, string>
    );
  }

  return "";
}

async function sendMessage(
  supabase: any,
  item: any
): Promise<{ success: boolean; error?: string }> {
  // Mark as sending
  await supabase
    .from("message_queue")
    .update({ status: "sending" })
    .eq("id", item.id);

  // Single instance lookup — if none available, leave as pending and let cron retry
  const instance = await selectInstance(supabase);
  if (!instance) {
    await supabase
      .from("message_queue")
      .update({ status: "pending" })
      .eq("id", item.id);
    return { success: false, error: "Nenhuma instância disponível" };
  }

  // Resolve template (com variante) ou mensagem livre
  const messageText = await resolveMessageText(supabase, item);

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
    // Garante DDI 55 (Brasil): números salvos têm 10 ou 11 dígitos (DDD + número),
    // sem o DDI. Sem o 55, a Evolution interpreta o DDD como código de país e
    // responde { exists: false } com HTTP 400.
    const digits = String(item.recipient_phone || "").replace(/\D/g, "");
    const numberWithDdi =
      digits.startsWith("55") && (digits.length === 12 || digits.length === 13)
        ? digits
        : `55${digits}`;

    const url = `${EVOLUTION_API_URL}/message/sendText/${instance.evolution_instance_id}`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: EVOLUTION_API_KEY,
      },
      body: JSON.stringify({
        number: numberWithDdi,
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
    .order("priority", { ascending: false })
    .order("scheduled_at", { ascending: true })
    .limit(20);

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

    // Short safety delay between messages (instance cooldown handles the rest)
    if (i < items.length - 1) {
      await randomDelay(5_000, 10_000);
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
