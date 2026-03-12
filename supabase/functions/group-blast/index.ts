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

  const EVOLUTION_API_URL = Deno.env.get("EVOLUTION_API_URL");
  const EVOLUTION_API_KEY = Deno.env.get("EVOLUTION_API_KEY");
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const { action, force, config_id } = await req.json();

    if (action === "prepare") {
      return await handlePrepare(supabase, { force, config_id });
    } else if (action === "send") {
      return await handleSend(supabase, EVOLUTION_API_URL!, EVOLUTION_API_KEY!);
    } else {
      return new Response(
        JSON.stringify({ error: `Ação desconhecida: ${action}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (err: any) {
    console.error("group-blast error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

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
    const times: string[] = (config.schedule_times || []).slice().sort();
    if (times.length === 0) continue;

    const total = config.messages_per_day ?? 1;
    let currentIndex = config.last_scheduled_index;
    let prepared_for_config = 0;

    for (let n = 0; n < total; n++) {
      const nextIndex = (currentIndex + 1) % times.length;
      const nextTime = times[nextIndex]; // e.g. "14:30:00"

      const [hh, mm] = nextTime.split(":");
      const now = new Date();
      let scheduled = new Date(
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

      if (opts.force) {
        // Each test message 30s apart
        scheduled = new Date(Date.now() + 30_000 + (n * 30_000));
      } else {
        // Check how many already scheduled today
        const todayStr = now.toISOString().split("T")[0];
        const { count } = await supabase
          .from("group_blast_logs")
          .select("id", { count: "exact", head: true })
          .eq("config_id", config.id)
          .gte("scheduled_for", `${todayStr}T00:00:00Z`)
          .lt("scheduled_for", `${todayStr}T23:59:59Z`)
          .neq("status", "failed");

        if ((count ?? 0) >= total) break;
      }

      // Insert log
      const { error: insertErr } = await supabase
        .from("group_blast_logs")
        .insert({
          config_id: config.id,
          group_jid: config.group_jid,
          message_content: config.message_content,
          scheduled_for: scheduled.toISOString(),
          status: "pending",
        });

      if (insertErr) {
        console.error(`Error inserting log for config ${config.id}:`, insertErr);
        continue;
      }

      currentIndex = nextIndex;
      prepared_for_config++;
    }

    // Update index after all messages for this config
    await supabase
      .from("group_blast_configs")
      .update({
        last_scheduled_index: currentIndex,
        updated_at: new Date().toISOString(),
      })
      .eq("id", config.id);

    prepared += prepared_for_config;
  }

  return new Response(
    JSON.stringify({ prepared }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

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
    return new Response(
      JSON.stringify({ sent: 0, failed: 0, message: "Nenhum pendente" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
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
    return new Response(
      JSON.stringify({ skipped: "sem instâncias online" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  let sent = 0;
  let failed = 0;

  for (let i = 0; i < logs.length; i++) {
    const log = logs[i];
    const instance = instances[i % instances.length];

    try {
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
            text: log.message_content,
            linkPreview: false,
          }),
        }
      );

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData?.message || errData?.error || `HTTP ${res.status}`);
      }

      // Mark as sent
      await supabase
        .from("group_blast_logs")
        .update({
          status: "sent",
          sent_at: new Date().toISOString(),
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

  return new Response(
    JSON.stringify({ sent, failed }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
