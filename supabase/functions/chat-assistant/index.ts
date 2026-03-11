import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function estimateCost(usage: { prompt_tokens?: number; completion_tokens?: number }, model: string): number {
  const rates: Record<string, { input: number; output: number }> = {
    "google/gemini-3-flash-preview": { input: 0.15, output: 0.60 },
    "google/gemini-2.5-flash": { input: 0.15, output: 0.60 },
  };
  const rate = rates[model] || { input: 0.15, output: 0.60 };
  return ((usage.prompt_tokens || 0) / 1e6) * rate.input + ((usage.completion_tokens || 0) / 1e6) * rate.output;
}

type ChatTopicId =
  | "boloes"
  | "estrategias"
  | "estrategias_duplasena"
  | "conhecer_planos";

const TOPIC_TO_FEATURE: Record<ChatTopicId, string> = {
  boloes: "chat_boloes",
  estrategias: "chat_duvidas_ferramentas",
  estrategias_duplasena: "chat_duvidas_ferramentas",
  conhecer_planos: "chat_acesso_ferramentas",
};

const TOPIC_TO_BOT_TAG: Record<ChatTopicId, string> = {
  boloes: "chat_boloes",
  estrategias: "chat_duvidas_ferramentas",
  estrategias_duplasena: "chat_duplasena",
  conhecer_planos: "chat_upsell",
};

function isTopicId(value: unknown): value is ChatTopicId {
  return (
    value === "boloes" ||
    value === "estrategias" ||
    value === "estrategias_duplasena" ||
    value === "conhecer_planos"
  );
}

function pickFirstName(nome: string | null | undefined): string | null {
  const n = (nome || "").trim();
  if (!n) return null;
  return n.split(/\s+/)[0] || null;
}

function formatSaoPauloDay(d: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(d);

  const get = (type: string) => parts.find((p) => p.type === type)?.value;
  const y = get("year");
  const m = get("month");
  const day = get("day");
  if (!y || !m || !day) return d.toISOString().slice(0, 10);
  return `${y}-${m}-${day}`;
}

function hasFeature(features: any, key: string): boolean {
  if (!features || typeof features !== "object") return false;
  const v = (features as Record<string, unknown>)[key];
  return v === true;
}

function pickWeightedRandom<T extends { chat_priority?: number | null }>(items: T[]): T {
  // Peso mínimo 1 para não zerar bots com prioridade 0.
  const weights = items.map((i) => Math.max(1, Math.floor(Number(i.chat_priority ?? 0)) + 1));
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let idx = 0; idx < items.length; idx++) {
    r -= weights[idx];
    if (r <= 0) return items[idx];
  }
  return items[items.length - 1];
}

type BotRow = {
  id: string;
  system_prompt: string;
  ai_model: string | null;
  chat_priority: number | null;
};

function upsellMessage(args: { firstName?: string | null; topic: ChatTopicId }): string {
  const name = args.firstName ? `, ${args.firstName}` : "";
  const topicLabel: Record<ChatTopicId, string> = {
    boloes: "bolões",
    estrategias: "estratégias e ferramentas",
    estrategias_duplasena: "estratégias da Dupla Sena",
    conhecer_planos: "planos",
  };

  return (
    `Entendi{name}! 👋\n\n` +
    `Esse tema de ${topicLabel[args.topic]} está disponível em planos que liberam o Chat. ` +
    `Se você quiser, me diga qual seu objetivo (ex.: "quero melhorar meus palpites", "quero entender os bolões") ` +
    `e eu te explico exatamente qual plano faz mais sentido — sem enrolação.\n\n` +
    `Enquanto isso, se preferir: abra “Planos” no seu perfil para liberar agora.`
  ).replace("{name}", name);
}

function limitReachedMessage(args: { firstName?: string | null; limit: number }): string {
  const name = args.firstName ? `, ${args.firstName}` : "";
  const lim = Math.max(0, Math.trunc(args.limit));
  return (
    `Chegamos no seu limite de hoje{name}.\n\n` +
    `No seu plano, o tema “Estatísticas” permite até ${lim} mensagem(ns) por dia para manter o custo do atendimento sob controle. ` +
    `Amanhã o limite zera automaticamente.\n\n` +
    `Se você quiser, eu também posso te orientar sobre como aumentar esse limite via upgrade.`
  ).replace("{name}", name);
}

function buildSystemPrompt(args: {
  botSystemPrompt: string;
  botName?: string | null;
  topic: ChatTopicId;
  userFirstName?: string | null;
}): string {
  const nameHint = args.userFirstName ? `O usuário se chama ${args.userFirstName}.` : "";
  const topicHint: Record<ChatTopicId, string> = {
    boloes: "Bolões",
    estrategias: "Estratégias e Ferramentas",
    estrategias_duplasena: "Estratégias da Dupla Sena",
    conhecer_planos: "Conhecer os Planos",
  };

  return `${args.botSystemPrompt}

REGRAS GERAIS (obrigatórias):
- Responda sempre em PT-BR.
- Seja humano, direto e acolhedor (sem soar robótico).
- Nunca mencione que você é IA/bot/modelo.
- Se fizer sentido, chame o usuário pelo primeiro nome.
- Foque no tema atual: ${topicHint[args.topic]}.
${nameHint}`.trim();
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const lovableKey = Deno.env.get("LOVABLE_API_KEY") ?? "";

    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      return new Response(JSON.stringify({ error: "Server misconfigured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authHeader = req.headers.get("authorization") || "";
    const userClient = createClient(supabaseUrl, anonKey, {
      auth: { persistSession: false },
      global: { headers: authHeader ? { Authorization: authHeader } : {} },
    });
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    const body = await req.json().catch(() => ({} as any));
    const { topic, conversation_id, message } = body ?? {};

    if (!isTopicId(topic)) {
      return new Response(JSON.stringify({ error: "Topic inválido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const trimmed = typeof message === "string" ? message.trim() : "";
    if (!trimmed) {
      return new Response(JSON.stringify({ error: "Mensagem vazia" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.startsWith("Bearer ") ? authHeader.replace("Bearer ", "") : "";
    const { data: authData, error: authError } = await userClient.auth.getUser(token);
    if (authError || !authData.user?.id) {
      return new Response(JSON.stringify({ error: "Usuário não autenticado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = authData.user.id;

    // 1) Perfil + plano (para permissão e limite)
    const { data: perfil, error: perfilError } = await userClient
      .from("perfis")
      .select("id, nome, plan_id, custom_features")
      .eq("id", userId)
      .single();

    if (perfilError || !perfil) {
      return new Response(JSON.stringify({ error: "Perfil não encontrado" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: plan, error: planError } = await userClient
      .from("plans")
      .select("id, name, features, checkout_link, chat_estatisticas_max_msgs_per_day")
      .eq("id", perfil.plan_id)
      .maybeSingle();

    // plano pode ser null (usuário sem plano): trata como sem features
    if (planError) {
      console.error("Erro ao buscar plano:", planError.message);
    }

    const features = (perfil.custom_features ?? plan?.features ?? {}) as any;
    const requiredFeature = TOPIC_TO_FEATURE[topic];
    const allowedByFeature = hasFeature(features, requiredFeature);

    // 2) Criar/validar conversa
    let convId: string | null = typeof conversation_id === "string" ? conversation_id : null;
    if (convId) {
      const { data: existingConv, error: convCheckError } = await userClient
        .from("chat_conversations")
        .select("id, user_id, topic")
        .eq("id", convId)
        .maybeSingle();

      if (convCheckError || !existingConv || existingConv.user_id !== userId) {
        convId = null;
      }
    }

    if (!convId) {
      const { data: createdConv, error: createConvError } = await userClient
        .from("chat_conversations")
        .insert({ user_id: userId, topic })
        .select("id")
        .single();

      if (createConvError || !createdConv?.id) {
        throw createConvError ?? new Error("Falha ao criar conversa");
      }
      convId = createdConv.id;
    } else {
      // garantir que o topic da conversa bate com o solicitado (caso usuário troque no front)
      await userClient.from("chat_conversations").update({ topic }).eq("id", convId);
    }

    const firstName = pickFirstName(perfil.nome);

    // 3) Persistir mensagem do usuário
    const { error: insertUserMsgError } = await userClient.from("chat_messages").insert({
      user_id: userId,
      conversation_id: convId,
      role: "user",
      content: trimmed,
    });
    if (insertUserMsgError) throw insertUserMsgError;

    // 4) Se não tiver permissão, responder com upsell (sem IA para economizar)
    const allowed = allowedByFeature;

    if (!allowed) {
      const reply = upsellMessage({ firstName, topic });
      const { error: insertAssistantError } = await userClient.from("chat_messages").insert({
        user_id: userId,
        conversation_id: convId,
        role: "assistant",
        content: reply,
        bot_persona_id: null,
      });
      if (insertAssistantError) throw insertAssistantError;

      return new Response(JSON.stringify({ conversation_id: convId, remaining_today: null }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 5) Limite diário removido (sem mais tema de estatísticas com limite)
    let remainingToday: number | null = null;

    // 6) Seleção do bot por tag
    const tag = TOPIC_TO_BOT_TAG[topic];
    const { data: bots, error: botsError } = await userClient
      .from("guide_personas")
      .select("id, system_prompt, ai_model, chat_priority")
      .eq("ativo", true)
      .eq("chat_enabled", true)
      .contains("chat_tags", [tag]);

    if (botsError) {
      console.error("Erro ao buscar bots:", botsError.message);
    }

    const botList = (bots ?? []) as BotRow[];

    // fallback: se não houver bot com a tag do tema, tenta um bot com tag genérica de upsell
    let chosenBot: BotRow | null = botList.length ? pickWeightedRandom(botList) : null;
    if (!chosenBot) {
      const { data: fallbackBots } = await userClient
        .from("guide_personas")
        .select("id, system_prompt, ai_model, chat_priority")
        .eq("ativo", true)
        .eq("chat_enabled", true)
        .contains("chat_tags", ["chat_upsell"]);
      const fb = (fallbackBots ?? []) as BotRow[];
      if (fb.length) chosenBot = pickWeightedRandom(fb);
    }

    if (!chosenBot?.system_prompt) {
      // último fallback: responder sem IA
      const reply =
        "Consigo te ajudar por aqui, mas estou sem um especialista configurado para esse tema agora. " +
        "Tenta novamente em instantes.";
      await userClient.from("chat_messages").insert({
        user_id: userId,
        conversation_id: convId,
        role: "assistant",
        content: reply,
        bot_persona_id: null,
      });

      return new Response(JSON.stringify({ conversation_id: convId, remaining_today: remainingToday }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 7) Montar histórico (últimas N mensagens)
    const { data: history, error: historyError } = await userClient
      .from("chat_messages")
      .select("role, content")
      .eq("conversation_id", convId)
      .order("created_at", { ascending: true })
      .limit(30);

    if (historyError) console.error("Erro ao carregar histórico:", historyError.message);

    // 7b) Enriquecer contexto com dados reais do banco
    let contextBlock = "";

    if (topic === "estrategias") {
      const { data: resultados } = await userClient
        .from("resultados")
        .select("concurso_id, data_sorteio, dezenas, qtd_pares, qtd_impares, qtd_moldura, qtd_repetidas, ciclo_numero, dezenas_faltantes_ciclo")
        .order("concurso_id", { ascending: false })
        .limit(10);

      if (resultados?.length) {
        const lines = resultados.map((r: any) =>
          `Concurso ${r.concurso_id} — ${r.data_sorteio}\n` +
          `  Dezenas: ${(r.dezenas || []).join(", ")}\n` +
          `  Pares: ${r.qtd_pares} | Ímpares: ${r.qtd_impares} | Moldura: ${r.qtd_moldura} | Repetidas: ${r.qtd_repetidas}\n` +
          `  Ciclo: ${r.ciclo_numero ?? "N/A"} | Faltantes no ciclo: ${(r.dezenas_faltantes_ciclo || []).join(", ") || "nenhuma"}`
        ).join("\n\n");
        contextBlock = `\n\nDADOS REAIS DOS ÚLTIMOS 10 CONCURSOS DA LOTOFÁCIL:\n${lines}`;
      }
    } else if (topic === "estrategias_duplasena") {
      const { data: resultados } = await userClient
        .from("resultados_duplasena" as any)
        .select("concurso_id, data_sorteio, dezenas_sorteio1, dezenas_sorteio2, qtd_pares_s1, qtd_impares_s1, qtd_moldura_s1, qtd_repetidas_s1, qtd_pares_s2, qtd_impares_s2, qtd_moldura_s2, qtd_repetidas_s2")
        .order("concurso_id", { ascending: false })
        .limit(10);

      if (resultados?.length) {
        const lines = (resultados as any[]).map((r: any) =>
          `Concurso ${r.concurso_id} — ${r.data_sorteio}\n` +
          `  Sorteio 1: ${(r.dezenas_sorteio1 || []).join(", ")} | Pares: ${r.qtd_pares_s1} | Ímpares: ${r.qtd_impares_s1} | Moldura: ${r.qtd_moldura_s1} | Repetidas: ${r.qtd_repetidas_s1}\n` +
          `  Sorteio 2: ${(r.dezenas_sorteio2 || []).join(", ")} | Pares: ${r.qtd_pares_s2} | Ímpares: ${r.qtd_impares_s2} | Moldura: ${r.qtd_moldura_s2} | Repetidas: ${r.qtd_repetidas_s2}`
        ).join("\n\n");
        contextBlock = `\n\nDADOS REAIS DOS ÚLTIMOS 10 CONCURSOS DA DUPLA SENA:\n${lines}`;
      }
    } else if (topic === "conhecer_planos") {
      const { data: planos } = await userClient
        .from("plans")
        .select("name, description, price, features")
        .eq("is_active", true)
        .order("price", { ascending: true });

      if (planos?.length) {
        const lines = planos.map((p: any) =>
          `- ${p.name}: R$${Number(p.price).toFixed(2)} — ${p.description || "Sem descrição"}`
        ).join("\n");
        contextBlock = `\n\nPLANOS DISPONÍVEIS ATUALMENTE:\n${lines}`;
      }
    }

    const systemPrompt = buildSystemPrompt({
      botSystemPrompt: chosenBot.system_prompt + contextBlock,
      topic,
      userFirstName: firstName,
    });

    const messages = [
      { role: "system", content: systemPrompt },
      ...((history ?? []) as Array<{ role: string; content: string }>).map((m) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.content,
      })),
    ];

    // 8) Chamar Lovable AI
    if (!lovableKey) throw new Error("LOVABLE_API_KEY não configurada");

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: chosenBot.ai_model || "google/gemini-3-flash-preview",
        messages,
      }),
    });

    if (!aiResp.ok) {
      const t = await aiResp.text();
      const status = aiResp.status;

      if (status === 429) {
        return new Response(JSON.stringify({ error: "Limite de uso atingido. Tente novamente em instantes." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes para o Chat. Tente novamente mais tarde." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.error("AI gateway error:", status, t);
      return new Response(JSON.stringify({ error: "Erro ao gerar resposta" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResp.json();
    const reply = (aiData?.choices?.[0]?.message?.content as string | undefined)?.trim() || "";
    const usage = aiData?.usage;

    // Log de uso de IA
    if (usage) {
      const model = chosenBot.ai_model || "google/gemini-3-flash-preview";
      adminClient.from("ai_usage_logs").insert({
        bot_persona_id: chosenBot.id,
        bot_name: null,
        user_id: userId,
        edge_function: "chat-assistant",
        action_type: "chat",
        prompt_tokens: usage.prompt_tokens || 0,
        completion_tokens: usage.completion_tokens || 0,
        total_tokens: usage.total_tokens || 0,
        model,
        cost_usd: estimateCost(usage, model),
        metadata: { topic },
      }).then(() => {}).catch(e => console.error("Erro log:", e));
    }

    if (!reply) {
      return new Response(JSON.stringify({ error: "Resposta vazia" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 9) Persistir resposta do assistente
    const { error: insertAssistantError } = await userClient.from("chat_messages").insert({
      user_id: userId,
      conversation_id: convId,
      role: "assistant",
      content: reply,
      bot_persona_id: chosenBot.id,
    });
    if (insertAssistantError) throw insertAssistantError;

    return new Response(JSON.stringify({ conversation_id: convId, remaining_today: remainingToday }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("chat-assistant error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
