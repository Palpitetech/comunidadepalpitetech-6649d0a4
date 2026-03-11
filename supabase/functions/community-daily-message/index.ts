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

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const EVOLUTION_API_URL = Deno.env.get("EVOLUTION_API_URL");
  const EVOLUTION_API_KEY = Deno.env.get("EVOLUTION_API_KEY");
  const COMMUNITY_GROUP_JID = Deno.env.get("COMMUNITY_GROUP_JID");
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  const COMMUNITY_BASE_URL = Deno.env.get("COMMUNITY_BASE_URL");

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  let bodyParams: any = {};
  try { bodyParams = await req.json(); } catch { /* empty body is fine */ }

  const action = bodyParams?.action || "prepare";

  try {
    if (action === "test") {
      return await handleTest(supabase, { EVOLUTION_API_URL, EVOLUTION_API_KEY, COMMUNITY_GROUP_JID, LOVABLE_API_KEY, COMMUNITY_BASE_URL });
    }
    if (action === "send") {
      return await handleSend(supabase, { EVOLUTION_API_URL, EVOLUTION_API_KEY, COMMUNITY_GROUP_JID });
    }
    // default: prepare
    return await handlePrepare(supabase, { LOVABLE_API_KEY, COMMUNITY_BASE_URL });
  } catch (err: any) {
    console.error("community-daily-message error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// ─── PREPARE: generate message, pick instance, schedule ───────────────

async function handlePrepare(
  supabase: any,
  env: { LOVABLE_API_KEY?: string; COMMUNITY_BASE_URL?: string },
) {
  if (!env.LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY não configurado");

  // Dedup: already scheduled/sent today?
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);

  const { data: existing } = await supabase
    .from("community_group_logs")
    .select("id")
    .gte("sent_at", todayStart.toISOString())
    .in("status", ["scheduled", "sent"])
    .limit(1);

  if (existing && existing.length > 0) {
    return jsonRes({ message: "Já existe mensagem agendada/enviada hoje" });
  }

  // Also check by scheduled_for date
  const { data: existingScheduled } = await supabase
    .from("community_group_logs")
    .select("id")
    .gte("scheduled_for", todayStart.toISOString())
    .in("status", ["scheduled", "sent"])
    .limit(1);

  if (existingScheduled && existingScheduled.length > 0) {
    return jsonRes({ message: "Já existe mensagem agendada/enviada hoje" });
  }

  const post = await findLatestPost(supabase);
  if (!post) {
    return jsonRes({ error: "Nenhum post encontrado" }, 404);
  }

  const mensagem = await generateMessage(post, env.LOVABLE_API_KEY, env.COMMUNITY_BASE_URL);

  // Pick instance
  const { data: instance } = await supabase
    .from("whatsapp_instances")
    .select("id, evolution_instance_id")
    .eq("status", "online")
    .order("last_message_at", { ascending: true, nullsFirst: true })
    .limit(1)
    .single();

  if (!instance) throw new Error("Nenhuma instância online disponível");

  // Random time between 12:00–14:00 UTC (09:00–11:00 BRT)
  const now = new Date();
  const scheduledFor = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 12, 0, 0)
  );
  const randomMinutes = Math.floor(Math.random() * 121); // 0–120
  scheduledFor.setUTCMinutes(scheduledFor.getUTCMinutes() + randomMinutes);

  // If scheduled time is in the past (e.g. function called late), send within next 10 min
  if (scheduledFor <= now) {
    scheduledFor.setTime(now.getTime() + Math.floor(Math.random() * 10) * 60 * 1000);
  }

  await supabase.from("community_group_logs").insert({
    post_id: post.id,
    instance_id: instance.id,
    instance_evolution_id: instance.evolution_instance_id,
    message_generated: mensagem,
    status: "scheduled",
    scheduled_for: scheduledFor.toISOString(),
    sent_at: now.toISOString(), // creation timestamp for dedup
  });

  console.log(`Mensagem agendada para ${scheduledFor.toISOString()} (${randomMinutes}min de offset)`);

  return jsonRes({
    success: true,
    action: "prepared",
    scheduled_for: scheduledFor.toISOString(),
    post_id: post.id,
    instance_id: instance.id,
  });
}

// ─── SEND: dispatch scheduled messages ────────────────────────────────

async function handleSend(
  supabase: any,
  env: { EVOLUTION_API_URL?: string; EVOLUTION_API_KEY?: string; COMMUNITY_GROUP_JID?: string },
) {
  if (!env.EVOLUTION_API_URL || !env.EVOLUTION_API_KEY) throw new Error("Evolution API não configurada");
  if (!env.COMMUNITY_GROUP_JID) throw new Error("COMMUNITY_GROUP_JID não configurado");

  const { data: pending } = await supabase
    .from("community_group_logs")
    .select("id, message_generated, instance_id, instance_evolution_id")
    .eq("status", "scheduled")
    .lte("scheduled_for", new Date().toISOString())
    .order("scheduled_for", { ascending: true })
    .limit(1)
    .single();

  if (!pending) {
    return jsonRes({ message: "Nenhuma mensagem pendente para envio" });
  }

  try {
    const sendRes = await fetch(
      `${env.EVOLUTION_API_URL}/message/sendText/${pending.instance_evolution_id}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: env.EVOLUTION_API_KEY },
        body: JSON.stringify({
          number: env.COMMUNITY_GROUP_JID,
          text: pending.message_generated,
        }),
      },
    );

    if (!sendRes.ok) {
      const errBody = await sendRes.text();
      console.error("Evolution send error:", sendRes.status, errBody);

      await supabase
        .from("community_group_logs")
        .update({ status: "failed", message_sent: `Erro ${sendRes.status}: ${errBody}` })
        .eq("id", pending.id);

      throw new Error(`Erro ao enviar mensagem: ${sendRes.status}`);
    }

    // Mark as sent
    await supabase
      .from("community_group_logs")
      .update({
        status: "sent",
        message_sent: pending.message_generated,
        sent_at: new Date().toISOString(),
      })
      .eq("id", pending.id);

    // Update instance last_message_at
    if (pending.instance_id) {
      await supabase
        .from("whatsapp_instances")
        .update({ last_message_at: new Date().toISOString() })
        .eq("id", pending.instance_id);
    }

    console.log(`Mensagem enviada com sucesso (log id: ${pending.id})`);

    return jsonRes({ success: true, action: "sent", log_id: pending.id });
  } catch (err: any) {
    console.error("Send error:", err);
    throw err;
  }
}

// ─── TEST: prepare + send immediately ─────────────────────────────────

async function handleTest(
  supabase: any,
  env: { EVOLUTION_API_URL?: string; EVOLUTION_API_KEY?: string; COMMUNITY_GROUP_JID?: string; LOVABLE_API_KEY?: string; COMMUNITY_BASE_URL?: string },
) {
  if (!env.LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY não configurado");
  if (!env.EVOLUTION_API_URL || !env.EVOLUTION_API_KEY) throw new Error("Evolution API não configurada");
  if (!env.COMMUNITY_GROUP_JID) throw new Error("COMMUNITY_GROUP_JID não configurado");

  const post = await findLatestPost(supabase);
  if (!post) return jsonRes({ error: "Nenhum post encontrado" }, 404);

  const mensagem = await generateMessage(post, env.LOVABLE_API_KEY, env.COMMUNITY_BASE_URL);

  const { data: instance } = await supabase
    .from("whatsapp_instances")
    .select("id, evolution_instance_id")
    .eq("status", "online")
    .order("last_message_at", { ascending: true, nullsFirst: true })
    .limit(1)
    .single();

  if (!instance) throw new Error("Nenhuma instância online disponível");

  // Send immediately
  const sendRes = await fetch(
    `${env.EVOLUTION_API_URL}/message/sendText/${instance.evolution_instance_id}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: env.EVOLUTION_API_KEY },
      body: JSON.stringify({ number: env.COMMUNITY_GROUP_JID, text: mensagem }),
    },
  );

  if (!sendRes.ok) {
    const errBody = await sendRes.text();
    throw new Error(`Erro ao enviar: ${sendRes.status} - ${errBody}`);
  }

  // Log
  await supabase.from("community_group_logs").insert({
    post_id: post.id,
    instance_id: instance.id,
    instance_evolution_id: instance.evolution_instance_id,
    message_generated: mensagem,
    message_sent: mensagem,
    status: "sent",
  });

  await supabase
    .from("whatsapp_instances")
    .update({ last_message_at: new Date().toISOString() })
    .eq("id", instance.id);

  return jsonRes({ success: true, action: "test_sent", post_id: post.id });
}

// ─── Helpers ──────────────────────────────────────────────────────────

async function findLatestPost(supabase: any) {
  const today = new Date().toISOString().slice(0, 10);

  let { data: post } = await supabase
    .from("postagens")
    .select("id, titulo, conteudo, tipo, created_at")
    .neq("tipo", "comentario")
    .is("parent_id", null)
    .gte("created_at", `${today}T00:00:00Z`)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!post) {
    const { data: fallback } = await supabase
      .from("postagens")
      .select("id, titulo, conteudo, tipo, created_at")
      .neq("tipo", "comentario")
      .is("parent_id", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();
    post = fallback;
  }

  if (!post) {
    const { data: fallbackAny } = await supabase
      .from("postagens")
      .select("id, titulo, conteudo, tipo, created_at")
      .is("parent_id", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();
    post = fallbackAny;
  }

  return post;
}

async function generateMessage(post: any, apiKey: string, baseUrl?: string) {
  const horaAtual = new Date().toLocaleTimeString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    minute: "2-digit",
  });

  const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        {
          role: "system",
          content: `Você é um assistente de uma comunidade de apostas em loterias.
Com base no post abaixo, crie uma mensagem curta para um grupo de WhatsApp. A mensagem deve:
- Iniciar com uma saudação temporal natural (considere o horário atual: ${horaAtual})
- Fazer um breve resumo do post em 2-3 frases
- Encerrar com uma chamada para comentar no post, sem incluir o link (o link será adicionado automaticamente)
- Tom informal e animado
- Máximo 5 linhas no total
- NÃO use markdown, apenas texto puro com emojis`,
        },
        {
          role: "user",
          content: `Título do post: ${post.titulo || "(sem título)"}\nConteúdo: ${post.conteudo}`,
        },
      ],
    }),
  });

  if (!aiResponse.ok) {
    const errText = await aiResponse.text();
    console.error("AI error:", aiResponse.status, errText);
    throw new Error(`AI gateway error: ${aiResponse.status}`);
  }

  const aiData = await aiResponse.json();
  const mensagemIa = aiData.choices?.[0]?.message?.content?.trim();

  if (!mensagemIa) throw new Error("IA não retornou mensagem");

  // Concatenar link do post ao final
  if (baseUrl) {
    const linkPost = `${baseUrl.replace(/\/+$/, "").replace(/^https?:\/\//, "")}/comunidade/post/${post.id}`;
    return `${mensagemIa}\n\n${linkPost}`;
  }

  return mensagemIa;
}

function jsonRes(body: any, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      "Content-Type": "application/json",
    },
  });
}
