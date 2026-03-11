import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const EVOLUTION_API_URL = Deno.env.get("EVOLUTION_API_URL")!;
const EVOLUTION_API_KEY = Deno.env.get("EVOLUTION_API_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

function getSupabase() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
}

/* ── Helpers ─────────────────────────────────────────── */

function saoPauloNow(): Date {
  const utc = new Date();
  return new Date(utc.getTime() - 3 * 60 * 60 * 1000);
}

function getDayType(date: Date): string {
  const dow = date.getUTCDay();
  if (dow === 0) return "sunday";
  if (dow === 6) return "saturday";
  return "weekday";
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/* ── getCurrentWindow ────────────────────────────────── */

async function getCurrentWindow(supabase: ReturnType<typeof createClient>) {
  const now = saoPauloNow();
  const hour = now.getUTCHours();
  const dayType = getDayType(now);

  const { data, error } = await supabase
    .from("warming_schedule")
    .select("*")
    .eq("day_type", dayType)
    .eq("is_active", true)
    .lte("hour_start", hour)
    .gt("hour_end", hour);

  if (error || !data?.length) return null;
  return data[0];
}

/* ── buildSequentialPairs ─────────────────────────────── */

function buildSequentialPairs(instances: any[]): [any, any][] {
  const pairs: [any, any][] = [];
  for (let i = 0; i + 1 < instances.length; i += 2) {
    const a = instances[i];
    const b = instances[i + 1];

    if (
      a.id === b.id ||
      a.phone_number === b.phone_number ||
      a.evolution_instance_id === b.evolution_instance_id
    ) {
      console.error(
        `[warming] BLOCKED self-pair: ${a.name} (${a.id}) ↔ ${b.name} (${b.id})`
      );
      continue;
    }

    pairs.push([a, b]);
  }
  return pairs;
}

function pairKey(a: any, b: any): string {
  return [a.id, b.id].sort().join("|");
}

/* ── generateWarmingMessages ─────────────────────────── */

async function generateWarmingMessages(
  theme: string,
  nameA: string,
  nameB: string,
  count: number
): Promise<{ remetente: string; texto: string }[]> {
  const res = await fetch(
    "https://ai.gateway.lovable.dev/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          {
            role: "system",
            content:
              "Você é um gerador de conversas de WhatsApp entre amigos brasileiros. Retorne APENAS JSON válido, sem texto antes ou depois, sem markdown.",
          },
          {
            role: "user",
            content: `Você vai criar UMA ÚNICA conversa de WhatsApp entre dois amigos: ${nameA} (A) e ${nameB} (B).

As mensagens devem se RESPONDER umas às outras, como uma troca real. B responde o que A disse. A replica o que B disse. É um diálogo, não monólogos.

Tema da conversa: ${theme}

Retorne APENAS este JSON (sem markdown, sem explicação):
{
  "mensagens": [
    { "remetente": "A", "texto": "mensagem de A" },
    { "remetente": "B", "texto": "resposta de B" },
    { "remetente": "A", "texto": "réplica de A" },
    { "remetente": "B", "texto": "encerramento de B" }
  ]
}

REGRAS:
- Exatamente ${count} mensagens
- A primeira mensagem DEVE ser de A
- Cada mensagem responde a anterior
- NÃO repita o mesmo remetente duas vezes seguidas (alterne A, B, A, B...)
- Linguagem informal brasileira, máximo 2 frases por mensagem
- No máximo 1 emoji por mensagem
- Nunca mencione endereços completos`,
          },
        ],
      }),
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`AI gateway error ${res.status}: ${errText.slice(0, 200)}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content ?? "";

  const objMatch = content.match(/\{[\s\S]*"mensagens"[\s\S]*\}/);
  let msgs: { remetente: string; texto: string }[];

  if (objMatch) {
    const parsed = JSON.parse(objMatch[0]);
    msgs = parsed.mensagens;
  } else {
    const arrMatch = content.match(/\[[\s\S]*\]/);
    if (!arrMatch) throw new Error("AI não retornou JSON válido");
    msgs = JSON.parse(arrMatch[0]);
  }

  if (!Array.isArray(msgs) || msgs.length < 2) {
    throw new Error("Roteiro inválido: menos de 2 mensagens");
  }

  if (msgs[0].remetente !== "A") {
    throw new Error("Roteiro inválido: deve começar com A");
  }

  for (let i = 1; i < msgs.length; i++) {
    if (msgs[i].remetente === msgs[i - 1].remetente) {
      throw new Error(
        `Roteiro inválido: mesmo remetente consecutivo na posição ${i}`
      );
    }
  }

  return msgs;
}

/* ══════════════════════════════════════════════════════
   ACTION: prepare
   Generates scripts and schedules messages in DB.
   Returns immediately.
   ══════════════════════════════════════════════════════ */

async function actionPrepare(force = false) {
  const supabase = getSupabase();

  let window: any = null;

  if (!force) {
    window = await getCurrentWindow(supabase);
    if (!window) {
      return { skipped: "no active window" };
    }
  } else {
    window = {
      window_name: "manual_test",
      min_messages: 2,
      max_messages: 4,
      theme: "conversa casual entre amigos sobre o dia a dia",
    };
  }

  // Get online instances ordered by last_message_at ASC
  const { data: instances } = await supabase
    .from("whatsapp_instances")
    .select("*")
    .eq("status", "online")
    .order("last_message_at", { ascending: true, nullsFirst: true });

  if (!instances || instances.length < 2) {
    return { skipped: "less than 2 online instances" };
  }

  const pairs = buildSequentialPairs(instances);

  if (pairs.length === 0) {
    return { skipped: "no valid pairs could be formed" };
  }

  let pendingPairs: [any, any][];

  if (force) {
    pendingPairs = pairs;
  } else {
    // Check which pairs already talked today in this window
    const now = saoPauloNow();
    const todayStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
    );
    const todayStartUtc = new Date(
      todayStart.getTime() + 3 * 60 * 60 * 1000
    ).toISOString();

    const { data: todayLogs } = await supabase
      .from("warming_logs")
      .select("from_instance_id, to_instance_id")
      .eq("window_name", window.window_name)
      .gte("sent_at", todayStartUtc);

    const donePairs = new Set<string>();
    if (todayLogs) {
      for (const log of todayLogs) {
        donePairs.add(
          [log.from_instance_id, log.to_instance_id].sort().join("|")
        );
      }
    }

    pendingPairs = pairs.filter(
      ([a, b]) => !donePairs.has(pairKey(a, b))
    );
  }

  if (pendingPairs.length === 0) {
    return { skipped: "all pairs already warmed today in this window" };
  }

  // Log odd-instance-out info
  if (instances.length % 2 !== 0) {
    const leftOut = instances[instances.length - 1];
    console.log(
      `[warming] Odd count (${instances.length}): ${leftOut.name} left out this round`
    );
  }

  // In force mode, only prepare the first pair
  const pairsToRun = force ? [pendingPairs[0]] : pendingPairs;

  let totalScheduled = 0;
  const sessionIds: string[] = [];

  // Calculate base time for first pair — stagger pairs by delay
  let pairBaseTime = new Date();

  for (let pIdx = 0; pIdx < pairsToRun.length; pIdx++) {
    const [instA, instB] = pairsToRun[pIdx];
    const sessionId = crypto.randomUUID();
    sessionIds.push(sessionId);

    try {
      const count = randomInt(
        window.min_messages ?? 2,
        window.max_messages ?? 4
      );

      const messages = await generateWarmingMessages(
        window.theme,
        instA.friendly_name || instA.name,
        instB.friendly_name || instB.name,
        count
      );

      // Calculate scheduled_for for each message
      const rows: any[] = [];
      let prevTime = new Date(pairBaseTime.getTime() + randomInt(5_000, 15_000));

      for (let i = 0; i < messages.length; i++) {
        const msg = messages[i];
        const isA = msg.remetente === "A";
        const fromInstance = isA ? instA : instB;
        const toInstance = isA ? instB : instA;

        if (i > 0) {
          const gap = force
            ? randomInt(30_000, 60_000)
            : randomInt(60_000, 120_000);
          prevTime = new Date(prevTime.getTime() + gap);
        }

        rows.push({
          from_instance_id: fromInstance.id,
          to_instance_id: toInstance.id,
          from_evolution_id: fromInstance.evolution_instance_id,
          to_phone_number: toInstance.phone_number,
          message_content: msg.texto,
          scheduled_for: prevTime.toISOString(),
          status: "pending",
          window_name: window.window_name,
          pair_session_id: sessionId,
        });
      }

      const { error: insertErr } = await supabase
        .from("warming_scheduled_messages")
        .insert(rows);

      if (insertErr) {
        console.error(`Insert error for pair ${instA.name} ↔ ${instB.name}: ${insertErr.message}`);
        continue;
      }

      totalScheduled += messages.length;
      console.log(
        `[prepare] Pair ${instA.name} ↔ ${instB.name}: ${messages.length} messages scheduled`
      );

      // Stagger next pair start after last message of this pair
      const lastMsgTime = prevTime;
      const pairGap = force
        ? randomInt(30_000, 60_000)
        : randomInt(180_000, 300_000);
      pairBaseTime = new Date(lastMsgTime.getTime() + pairGap);

    } catch (err: any) {
      console.error(
        `[prepare] Pair ${instA.name} ↔ ${instB.name} error: ${err.message}`
      );
    }
  }

  return {
    action: "prepare",
    scheduled: totalScheduled,
    pairs: pairsToRun.length,
    session_ids: sessionIds,
    window_name: window.window_name,
    forced: force,
  };
}

/* ══════════════════════════════════════════════════════
   ACTION: send
   Picks up pending scheduled messages and sends them.
   Called by pg_cron every minute.
   ══════════════════════════════════════════════════════ */

async function actionSend() {
  const supabase = getSupabase();

  // Fetch pending messages whose scheduled_for has passed
  const { data: messages, error } = await supabase
    .from("warming_scheduled_messages")
    .select("*")
    .eq("status", "pending")
    .lte("scheduled_for", new Date().toISOString())
    .order("scheduled_for", { ascending: true })
    .limit(5);

  if (error) {
    console.error("[send] Query error:", error.message);
    return { error: error.message };
  }

  if (!messages || messages.length === 0) {
    return { sent: 0 };
  }

  let sent = 0;

  for (const msg of messages) {
    try {
      const url = `${EVOLUTION_API_URL}/message/sendText/${msg.from_evolution_id}`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: EVOLUTION_API_KEY,
        },
        body: JSON.stringify({
          number: msg.to_phone_number,
          text: msg.message_content,
        }),
      });

      if (res.ok) {
        // Update status to sent
        await supabase
          .from("warming_scheduled_messages")
          .update({ status: "sent", sent_at: new Date().toISOString() })
          .eq("id", msg.id);

        // Insert into warming_logs
        await supabase.from("warming_logs").insert({
          from_instance_id: msg.from_instance_id,
          to_instance_id: msg.to_instance_id,
          message_content: msg.message_content,
          window_name: msg.window_name,
          sent_at: new Date().toISOString(),
        });

        // Update last_message_at for the sender instance
        await supabase
          .from("whatsapp_instances")
          .update({ last_message_at: new Date().toISOString() })
          .eq("id", msg.from_instance_id);

        sent++;
        console.log(`[send] Sent message ${msg.id} via ${msg.from_evolution_id}`);
      } else {
        const errText = await res.text();
        const errorMsg = `${res.status}: ${errText.slice(0, 200)}`;
        console.error(`[send] Error for message ${msg.id}: ${errorMsg}`);

        await supabase
          .from("warming_scheduled_messages")
          .update({ status: "failed", error_message: errorMsg })
          .eq("id", msg.id);
      }
    } catch (err: any) {
      console.error(`[send] Exception for message ${msg.id}: ${err.message}`);

      await supabase
        .from("warming_scheduled_messages")
        .update({ status: "failed", error_message: err.message })
        .eq("id", msg.id);
    }
  }

  return { action: "send", sent, processed: messages.length };
}

/* ── Handler ─────────────────────────────────────────── */

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let action = "prepare";
    let force = false;

    try {
      const body = await req.json();
      action = body?.action || "prepare";
      force = body?.force === true;
    } catch {
      // No body or invalid JSON — default to prepare (cron behavior)
    }

    let result: any;

    if (action === "send") {
      result = await actionSend();
    } else {
      result = await actionPrepare(force);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("warming-run error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
