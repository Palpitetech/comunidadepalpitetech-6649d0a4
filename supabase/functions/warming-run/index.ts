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
  // America/Sao_Paulo = UTC-3
  return new Date(utc.getTime() - 3 * 60 * 60 * 1000);
}

function getDayType(date: Date): string {
  const dow = date.getUTCDay(); // already shifted to SP
  if (dow === 0) return "sunday";
  if (dow === 6) return "saturday";
  return "weekday";
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
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

/**
 * Forms sequential pairs from instances ordered by last_message_at ASC.
 * Instances that waited longest get paired first.
 * With odd count, the last instance is left out but will be
 * prioritized next round (oldest last_message_at).
 */
function buildSequentialPairs(instances: any[]): [any, any][] {
  const pairs: [any, any][] = [];
  for (let i = 0; i + 1 < instances.length; i += 2) {
    const a = instances[i];
    const b = instances[i + 1];

    // Safety: never pair an instance with itself
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

  // Extract JSON object or array from response
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

  // Validate: first message must be from A
  if (msgs[0].remetente !== "A") {
    throw new Error("Roteiro inválido: deve começar com A");
  }

  // Validate: no consecutive same sender
  for (let i = 1; i < msgs.length; i++) {
    if (msgs[i].remetente === msgs[i - 1].remetente) {
      throw new Error(
        `Roteiro inválido: mesmo remetente consecutivo na posição ${i}`
      );
    }
  }

  return msgs;
}

/* ── runWarmingPair ───────────────────────────────────── */

async function runWarmingPair(
  supabase: ReturnType<typeof createClient>,
  instanceA: any,
  instanceB: any,
  window: any
): Promise<number> {
  const count = randomInt(
    window.min_messages ?? 2,
    window.max_messages ?? 4
  );

  const messages = await generateWarmingMessages(
    window.theme,
    instanceA.friendly_name || instanceA.name,
    instanceB.friendly_name || instanceB.name,
    count
  );

  let sent = 0;

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    const isA = msg.remetente === "A";
    const fromInstance = isA ? instanceA : instanceB;
    const toInstance = isA ? instanceB : instanceA;

    try {
      const url = `${EVOLUTION_API_URL}/message/sendText/${fromInstance.evolution_instance_id}`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: EVOLUTION_API_KEY,
        },
        body: JSON.stringify({
          number: toInstance.phone_number,
          text: msg.texto,
        }),
      });

      if (res.ok) {
        sent++;
        await supabase.from("warming_logs").insert({
          from_instance_id: fromInstance.id,
          to_instance_id: toInstance.id,
          message_content: msg.texto,
          window_name: window.window_name,
          sent_at: new Date().toISOString(),
        });
      } else {
        const errText = await res.text();
        console.error(
          `Warming send error ${fromInstance.name} → ${toInstance.name}: ${res.status} ${errText.slice(0, 200)}`
        );
      }
    } catch (err: any) {
      console.error(`Warming send exception: ${err.message}`);
    }

    // Delay 45-120s between messages (skip after last)
    if (i < messages.length - 1) {
      await delay(randomInt(45_000, 120_000));
    }
  }

  return sent;
}

/* ── runWarmingWindow ────────────────────────────────── */

async function runWarmingWindow(force = false) {
  const supabase = getSupabase();

  let window: any = null;

  if (!force) {
    window = await getCurrentWindow(supabase);
    if (!window) {
      return { skipped: "no active window" };
    }
  } else {
    // In force mode, use a synthetic window config
    window = {
      window_name: "manual_test",
      min_messages: 2,
      max_messages: 4,
      theme: "conversa casual entre amigos sobre o dia a dia",
    };
  }

  // Get online instances ordered by last_message_at ASC (who waited longest first)
  const { data: instances } = await supabase
    .from("whatsapp_instances")
    .select("*")
    .eq("status", "online")
    .order("last_message_at", { ascending: true, nullsFirst: true });

  if (!instances || instances.length < 2) {
    return { skipped: "less than 2 online instances" };
  }

  // Build sequential pairs from sorted list
  const pairs = buildSequentialPairs(instances);

  if (pairs.length === 0) {
    return { skipped: "no valid pairs could be formed" };
  }

  let pendingPairs: [any, any][];

  if (force) {
    // In force mode, skip "already talked today" check — use all pairs
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
      `[warming] Odd count (${instances.length}): ${leftOut.name} left out this round (will be prioritized next)`
    );
  }

  // In force mode, only run the first pair for a quick test
  const pairsToRun = force ? [pendingPairs[0]] : pendingPairs;

  let scheduled = 0;

  for (let i = 0; i < pairsToRun.length; i++) {
    const [instA, instB] = pairsToRun[i];

    try {
      const sent = await runWarmingPair(supabase, instA, instB, window);
      scheduled++;
      console.log(
        `Warming pair ${instA.name} ↔ ${instB.name}: ${sent} messages sent`
      );
    } catch (err: any) {
      console.error(
        `Warming pair ${instA.name} ↔ ${instB.name} error: ${err.message}`
      );
    }

    // 3+ min gap between pair starts (skip after last, skip in force mode)
    if (!force && i < pairsToRun.length - 1) {
      await delay(randomInt(180_000, 300_000));
    }
  }

  return { scheduled, window_name: window.window_name, forced: force };
}

/* ── Handler ─────────────────────────────────────────── */

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let force = false;
    try {
      const body = await req.json();
      force = body?.force === true;
    } catch {
      // No body or invalid JSON — default force=false (cron behavior)
    }

    const result = await runWarmingWindow(force);
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
