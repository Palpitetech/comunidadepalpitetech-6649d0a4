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

  if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY) {
    return new Response(JSON.stringify({ error: "Evolution API não configurada" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!COMMUNITY_GROUP_JID) {
    return new Response(JSON.stringify({ error: "COMMUNITY_GROUP_JID não configurado" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!LOVABLE_API_KEY) {
    return new Response(JSON.stringify({ error: "LOVABLE_API_KEY não configurado" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  let bodyParams: any = {};
  try { bodyParams = await req.json(); } catch { /* empty body is fine */ }
  const skipDelay = bodyParams?.skip_delay === true;
  const skipDedup = bodyParams?.skip_dedup === true;

  try {
    // 1. Check if already sent today
    if (!skipDedup) {
      const todayStart = new Date();
      todayStart.setUTCHours(0, 0, 0, 0);

      const { data: existingLog } = await supabase
        .from("community_group_logs")
        .select("id")
        .gte("sent_at", todayStart.toISOString())
        .limit(1);

      if (existingLog && existingLog.length > 0) {
        return new Response(JSON.stringify({ message: "Mensagem já enviada hoje" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // 2. Find the most recent non-comment post
    const today = new Date().toISOString().slice(0, 10);

    // Try non-comment posts first, then fall back to any main post
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
      const { data: fallbackTyped } = await supabase
        .from("postagens")
        .select("id, titulo, conteudo, tipo, created_at")
        .neq("tipo", "comentario")
        .is("parent_id", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      post = fallbackTyped;
    }

    // If still no post, use any main post (including tipo=comentario)
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

    if (!post) {
      return new Response(JSON.stringify({ error: "Nenhum post encontrado" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. Generate message via Lovable AI
    const horaAtual = new Date().toLocaleTimeString("pt-BR", {
      timeZone: "America/Sao_Paulo",
      hour: "2-digit",
      minute: "2-digit",
    });

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
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
- Encerrar chamando o grupo para interagir na comunidade
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
    const mensagem = aiData.choices?.[0]?.message?.content?.trim();

    if (!mensagem) {
      throw new Error("IA não retornou mensagem");
    }

    // 4. Select available instance (round robin by last_message_at)
    const { data: instance } = await supabase
      .from("whatsapp_instances")
      .select("id, evolution_instance_id")
      .eq("status", "online")
      .order("last_message_at", { ascending: true, nullsFirst: true })
      .limit(1)
      .single();

    if (!instance) {
      throw new Error("Nenhuma instância online disponível");
    }

    // 5. Random delay 0-120 minutes (skip if testing)
    let delayMinutes = 0;
    if (!skipDelay) {
      delayMinutes = Math.floor(Math.random() * 121);
      const delayMs = delayMinutes * 60 * 1000;
      if (delayMs > 0) {
        console.log(`Aguardando ${delayMinutes} minutos antes de enviar...`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }

    // 6. Send message via Evolution API
    const sendRes = await fetch(
      `${EVOLUTION_API_URL}/message/sendText/${instance.evolution_instance_id}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: EVOLUTION_API_KEY,
        },
        body: JSON.stringify({
          number: COMMUNITY_GROUP_JID,
          text: mensagem,
        }),
      }
    );

    if (!sendRes.ok) {
      const errBody = await sendRes.text();
      console.error("Evolution send error:", sendRes.status, errBody);
      throw new Error(`Erro ao enviar mensagem: ${sendRes.status}`);
    }

    // 7. Log the sent message
    await supabase.from("community_group_logs").insert({
      post_id: post.id,
      instance_id: instance.id,
      message_sent: mensagem,
    });

    // Update instance last_message_at
    await supabase
      .from("whatsapp_instances")
      .update({ last_message_at: new Date().toISOString() })
      .eq("id", instance.id);

    console.log(`Mensagem enviada com sucesso após ${delayMinutes}min de delay`);

    return new Response(
      JSON.stringify({
        success: true,
        delay_minutes: delayMinutes,
        post_id: post.id,
        instance_id: instance.id,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("community-daily-message error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
