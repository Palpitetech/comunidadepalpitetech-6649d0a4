import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface Slot {
  id: string;
  schedule_times: string[];
  last_scheduled_index: number;
  message_type?: "ai" | "manual";
  message_content?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const EVOLUTION_API_URL = Deno.env.get("EVOLUTION_API_URL");
  const EVOLUTION_API_KEY = Deno.env.get("EVOLUTION_API_KEY");
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const { action, force, config_id, slot_id } = await req.json();

    if (action === "prepare") {
      return await handlePrepare(supabase, { force, config_id });
    } else if (action === "send") {
      return await handleSend(supabase, EVOLUTION_API_URL!, EVOLUTION_API_KEY!);
    } else if (action === "send_now") {
      return await handleSendNow(supabase, config_id, slot_id);
    } else {
      return jsonResponse({ error: `Ação desconhecida: ${action}` }, 400);
    }
  } catch (err: any) {
    console.error("group-blast error:", err);
    return jsonResponse({ error: err.message }, 500);
  }
});

function jsonResponse(body: any, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ─── PREPARE ─────────────────────────────────────────────
async function handlePrepare(
  supabase: any,
  opts: { force?: boolean; config_id?: string }
) {
  let query = supabase
    .from("group_blast_configs")
    .select("*")
    .eq("is_active", true);

  if (opts.config_id) {
    query = supabase
      .from("group_blast_configs")
      .select("*")
      .eq("id", opts.config_id);
  }

  const { data: configs, error: cfgErr } = await query;
  if (cfgErr) throw cfgErr;

  let prepared = 0;

  for (const config of configs || []) {
    const slots: Slot[] = config.slots ?? [];
    if (slots.length === 0) continue;

    let updatedSlots = [...slots];

    for (let slotIdx = 0; slotIdx < slots.length; slotIdx++) {
      const slot = slots[slotIdx];
      const times = (slot.schedule_times || []).slice().sort();
      if (times.length === 0) continue;

      const nextIndex =
        ((slot.last_scheduled_index ?? -1) + 1) % times.length;
      const nextTime = times[nextIndex]; // e.g. "08:00"

      const [hh, mm] = nextTime.split(":");
      const now = new Date();
      let scheduled: Date;

      if (opts.force) {
        // Each slot 30s apart
        scheduled = new Date(Date.now() + 30_000 * (slotIdx + 1));
      } else {
        scheduled = new Date(
          Date.UTC(
            now.getUTCFullYear(),
            now.getUTCMonth(),
            now.getUTCDate(),
            parseInt(hh) + 3, // BRT → UTC
            parseInt(mm),
            0,
            0
          )
        );

        // Check if already scheduled today (by created_at, not scheduled_for)
        // This prevents overnight slots (scheduled_for in next day UTC)
        // from blocking the next day's prepare run
        const todayStartUTC = new Date();
        todayStartUTC.setUTCHours(0, 0, 0, 0);
        const todayEndUTC = new Date();
        todayEndUTC.setUTCHours(23, 59, 59, 999);

        const { count } = await supabase
          .from("group_blast_logs")
          .select("id", { count: "exact", head: true })
          .eq("config_id", config.id)
          .eq("slot_id", slot.id)
          .gte("created_at", todayStartUTC.toISOString())
          .lt("created_at", todayEndUTC.toISOString())
          .neq("status", "failed");

        if ((count ?? 0) > 0) continue; // already scheduled today
      }

      // Insert log WITHOUT message_content (will be generated on send)
      const { error: insertErr } = await supabase
        .from("group_blast_logs")
        .insert({
          config_id: config.id,
          slot_id: slot.id,
          group_jid: config.group_jid,
          message_content: "",
          scheduled_for: scheduled.toISOString(),
          status: "pending",
        });

      if (insertErr) {
        console.error(
          `Error inserting log for config ${config.id} slot ${slot.id}:`,
          insertErr
        );
        continue;
      }

      // Update last_scheduled_index for this slot
      updatedSlots = updatedSlots.map((s) =>
        s.id === slot.id ? { ...s, last_scheduled_index: nextIndex } : s
      );

      prepared++;
    }

    // Persist updated slot indices
    await supabase
      .from("group_blast_configs")
      .update({
        slots: updatedSlots,
        updated_at: new Date().toISOString(),
      })
      .eq("id", config.id);
  }

  return jsonResponse({ prepared });
}

// ─── SEND ────────────────────────────────────────────────
async function handleSend(
  supabase: any,
  evolutionUrl: string,
  evolutionKey: string
) {
  // Fetch pending logs that are due
  const { data: logs, error: logsErr } = await supabase
    .from("group_blast_logs")
    .select("*")
    .eq("status", "pending")
    .lte("scheduled_for", new Date().toISOString())
    .order("scheduled_for", { ascending: true })
    .limit(5);

  if (logsErr) throw logsErr;
  if (!logs || logs.length === 0) {
    return jsonResponse({ sent: 0, failed: 0, message: "Nenhum pendente" });
  }

  // Fetch online instances (round-robin by last_message_at)
  const { data: instances, error: instErr } = await supabase
    .from("whatsapp_instances")
    .select("id, evolution_instance_id, last_message_at")
    .eq("status", "online")
    .order("last_message_at", { ascending: true, nullsFirst: true });

  if (instErr) throw instErr;
  if (!instances || instances.length === 0) {
    console.warn("group-blast send: sem instâncias online");
    return jsonResponse({ skipped: "sem instâncias online" });
  }

  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY") ?? "";
  const BASE_URL = Deno.env.get("COMMUNITY_BASE_URL") ?? "";

  let sent = 0;
  let failed = 0;

  for (let i = 0; i < logs.length; i++) {
    const log = logs[i];
    const instance = instances[i % instances.length];

    try {
      // Fetch config to get slot info
      const { data: configData } = await supabase
        .from("group_blast_configs")
        .select("slots")
        .eq("id", log.config_id)
        .maybeSingle();

      const slots: Slot[] = configData?.slots ?? [];
      const slot = slots.find((s: Slot) => s.id === log.slot_id);

      let messageContent: string | null = null;

      if (slot?.message_type === "manual" && slot?.message_content?.trim()) {
        // Use manual text from slot
        messageContent = slot.message_content.trim();
      } else {
        // Generate via AI (default behavior)
        const { data: latestPost } = await supabase
          .from("postagens")
          .select("id, slug, titulo, conteudo, tipo")
          .neq("tipo", "comentario")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (latestPost) {
          messageContent = await generateAIMessage(
            LOVABLE_API_KEY,
            BASE_URL,
            latestPost
          );
        }

        if (!messageContent) {
          console.warn(
            `[group-blast] Sem post ou IA falhou para log ${log.id}, skip`
          );
          // Leave as pending to retry later
          continue;
        }
      }

      if (!messageContent) {
        continue;
      }

      // Send to group
      const res = await fetch(
        `${evolutionUrl}/message/sendText/${instance.evolution_instance_id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: evolutionKey,
          },
          body: JSON.stringify({
            number: log.group_jid,
            text: messageContent,
            linkPreview: false,
          }),
        }
      );

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(
          errData?.message || errData?.error || `HTTP ${res.status}`
        );
      }

      // Mark as sent with the generated message
      await supabase
        .from("group_blast_logs")
        .update({
          status: "sent",
          sent_at: new Date().toISOString(),
          message_content: messageContent,
          instance_id: instance.id,
          evolution_instance_id: instance.evolution_instance_id,
        })
        .eq("id", log.id);

      // Update instance last_message_at
      await supabase
        .from("whatsapp_instances")
        .update({ last_message_at: new Date().toISOString() })
        .eq("id", instance.id);

      sent++;
    } catch (err: any) {
      console.error(`Failed to send log ${log.id}:`, err.message);
      await supabase
        .from("group_blast_logs")
        .update({
          status: "failed",
          error_message: err.message,
        })
        .eq("id", log.id);
      failed++;
    }
  }

  return jsonResponse({ sent, failed });
}

// ─── AI MESSAGE GENERATION ──────────────────────────────
async function generateAIMessage(
  apiKey: string,
  baseUrl: string,
  post: { id: string; slug?: string | null; titulo: string | null; conteudo: string; tipo: string | null }
): Promise<string | null> {
  if (!apiKey) {
    console.error("[group-blast] LOVABLE_API_KEY não configurada");
    return null;
  }

  const postPath = post.slug || post.id;

  const prompt = `Você é assistente de uma comunidade de loterias.
Crie uma mensagem para WhatsApp seguindo EXATAMENTE este formato:

[GANCHO — 1 linha impactante sobre o post]

[RESUMO — máximo 2 linhas diretas sobre o conteúdo do post]

Vamos interagir lá na comunidade, deixe seu comentário lá 👇
${baseUrl}/comunidade/post/${postPath}?utm=grupo

Regras obrigatórias:
- Gancho: 1 linha curta e impactante, desperta curiosidade, sem revelar tudo
- Resumo: máximo 2 linhas, direto ao ponto
- A penúltima linha SEMPRE deve ser exatamente: "Vamos interagir lá na comunidade, deixe seu comentário lá 👇"
- O link SEMPRE na última linha sozinho, sem texto antes dele
- Use 1 emoji no gancho, nenhum no resto (exceto o 👇 do CTA)
- NÃO use saudações como "Olá", "Oi", "Pessoal"
- NÃO use asteriscos ou formatação markdown
- NÃO adicione nada além do formato acima

Título do post: ${post.titulo ?? "Sem título"}
Prévia: ${(post.conteudo ?? "").slice(0, 500)}`;

  try {
    const aiRes = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-lite",
          messages: [
            {
              role: "system",
              content:
                "Você gera mensagens curtas de convite para grupos de WhatsApp sobre posts de uma comunidade de loterias.",
            },
            { role: "user", content: prompt },
          ],
        }),
      }
    );

    if (!aiRes.ok) {
      console.error(
        `[group-blast] AI gateway error: ${aiRes.status}`,
        await aiRes.text()
      );
      return null;
    }

    const aiData = await aiRes.json();
    const content = aiData?.choices?.[0]?.message?.content?.trim();
    return content || null;
  } catch (err: any) {
    console.error("[group-blast] AI generation error:", err.message);
    return null;
  }
}
