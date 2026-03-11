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

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function pairKey(a: any, b: any): string {
  return [a.id, b.id].sort().join("|");
}

/* ── getNextPair ─────────────────────────────────────── */

async function getNextPair(
  supabase: ReturnType<typeof createClient>,
  windowName: string
) {
  const { data: instances } = await supabase
    .from("whatsapp_instances")
    .select("*")
    .eq("status", "online")
    .order("id");

  if (!instances || instances.length < 2) {
    throw new Error("Nenhuma dupla disponível");
  }

  const pairs: [any, any][] = [];
  for (let i = 0; i < instances.length; i++) {
    for (let j = i + 1; j < instances.length; j++) {
      pairs.push([instances[i], instances[j]]);
    }
  }

  const { data: rotation } = await supabase
    .from("warming_rotation")
    .select("*")
    .eq("window_name", windowName)
    .single();

  const lastPairKey = rotation?.last_pair ?? "";

  if (!rotation) {
    await supabase
      .from("warming_rotation")
      .insert({ window_name: windowName, last_pair: "" });
  }

  const pairKeys = pairs.map(([a, b]) => pairKey(a, b));
  let idx = pairKeys.indexOf(lastPairKey);
  idx = (idx + 1) % pairs.length;

  const chosen = pairs[idx];

  await supabase
    .from("warming_rotation")
    .update({
      last_pair: pairKeys[idx],
      last_used_at: new Date().toISOString(),
    })
    .eq("window_name", windowName);

  return { instanceA: chosen[0], instanceB: chosen[1] };
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
  const jsonMatch = content.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error("AI não retornou JSON válido");

  return JSON.parse(jsonMatch[0]);
}

/* ── runWarmingPair ───────────────────────────────────── */

async function runWarmingPair(
  supabase: ReturnType<typeof createClient>,
  instanceA: any,
  instanceB: any,
  windowName: string,
  theme: string,
  minMsg: number,
  maxMsg: number
): Promise<number> {
  const count = randomInt(minMsg, maxMsg);

  const messages = await generateWarmingMessages(
    theme,
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
          window_name: windowName,
          sent_at: new Date().toISOString(),
        });
      } else {
        const errText = await res.text();
        console.error(`Send error: ${res.status} ${errText.slice(0, 200)}`);
      }
    } catch (err: any) {
      console.error(`Send exception: ${err.message}`);
    }

    if (i < messages.length - 1) {
      await delay(randomInt(45_000, 120_000));
    }
  }

  return sent;
}

/* ── Handler ─────────────────────────────────────────── */

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = getSupabase();
    const body = await req.json().catch(() => ({}));
    const windowName = body.window_name || "manual";

    // Try to find an active window for theme/config
    let theme = "dia a dia, esportes, comida, séries";
    let minMsg = 2;
    let maxMsg = 4;

    if (body.window_name) {
      const { data: schedule } = await supabase
        .from("warming_schedule")
        .select("*")
        .eq("window_name", body.window_name)
        .eq("is_active", true)
        .limit(1)
        .single();

      if (schedule) {
        theme = schedule.theme || theme;
        minMsg = schedule.min_messages ?? minMsg;
        maxMsg = schedule.max_messages ?? maxMsg;
      }
    }

    const { instanceA, instanceB } = await getNextPair(supabase, windowName);

    const messagesSent = await runWarmingPair(
      supabase,
      instanceA,
      instanceB,
      windowName,
      theme,
      minMsg,
      maxMsg
    );

    return new Response(
      JSON.stringify({
        instanceA: instanceA.friendly_name || instanceA.name,
        instanceB: instanceB.friendly_name || instanceB.name,
        messages_sent: messagesSent,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err: any) {
    console.error("warming-manual error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
