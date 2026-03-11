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
): Promise<{ sender: string; text: string }[]> {
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
            content: `Você é ${nameA} conversando com seu amigo ${nameB} no WhatsApp.
Tema: ${theme}.
Gere exatamente ${count} mensagens alternando os remetentes.
Regras: informal, linguagem brasileira, máximo 2 frases por mensagem,
no máximo 1 emoji por mensagem, nunca mencione endereços completos.
Formato JSON: [{"sender":"A","text":"..."},{"sender":"B","text":"..."}]`,
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

  // Extract JSON from response (handle possible markdown wrapping)
  const jsonMatch = content.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error("AI não retornou JSON válido");

  return JSON.parse(jsonMatch[0]);
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
    const isA = msg.sender === "A";
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
          text: msg.text,
        }),
      });

      if (res.ok) {
        sent++;
        await supabase.from("warming_logs").insert({
          from_instance_id: fromInstance.id,
          to_instance_id: toInstance.id,
          message_content: msg.text,
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

async function runWarmingWindow() {
  const supabase = getSupabase();

  const window = await getCurrentWindow(supabase);
  if (!window) {
    return { skipped: "no active window" };
  }

  // Get online instances
  const { data: instances } = await supabase
    .from("whatsapp_instances")
    .select("*")
    .eq("status", "online")
    .order("id");

  if (!instances || instances.length < 2) {
    return { skipped: "less than 2 online instances" };
  }

  const pairs = generatePairs(instances);

  // Check which pairs already talked today in this window
  const now = saoPauloNow();
  const todayStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );
  // Convert back to UTC for DB query
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

  const pendingPairs = pairs.filter(
    ([a, b]) => !donePairs.has(pairKey(a, b))
  );

  if (pendingPairs.length === 0) {
    return { skipped: "all pairs already warmed today in this window" };
  }

  // Run pairs sequentially with 3+ min gap between starts
  let scheduled = 0;

  for (let i = 0; i < pendingPairs.length; i++) {
    const [instA, instB] = pendingPairs[i];

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

    // 3+ min gap between pair starts (skip after last)
    if (i < pendingPairs.length - 1) {
      await delay(randomInt(180_000, 300_000));
    }
  }

  return { scheduled, window_name: window.window_name };
}

/* ── Handler ─────────────────────────────────────────── */

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const result = await runWarmingWindow();
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
