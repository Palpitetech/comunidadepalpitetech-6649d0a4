import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function getSupabase() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
}

function normalizePhone(raw: string): string {
  let digits = raw.replace(/@.*$/, "").replace(/\D/g, "");
  if (digits.startsWith("55") && (digits.length === 12 || digits.length === 13)) {
    digits = digits.substring(2);
  }
  return digits;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { config_id } = await req.json();

    if (!config_id) {
      return new Response(
        JSON.stringify({ error: "config_id é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = getSupabase();
    const EVOLUTION_API_URL = Deno.env.get("EVOLUTION_API_URL")!;
    const EVOLUTION_API_KEY = Deno.env.get("EVOLUTION_API_KEY")!;

    // Fetch config
    const { data: config, error: configError } = await supabase
      .from("group_blast_configs")
      .select("id, name, group_jids, member_tag")
      .eq("id", config_id)
      .single();

    if (configError || !config) {
      return new Response(
        JSON.stringify({ error: "Configuração não encontrada" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!config.member_tag) {
      return new Response(
        JSON.stringify({ error: "Configuração sem member_tag definida" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get an online instance to fetch participants
    const { data: instances } = await supabase
      .from("whatsapp_instances")
      .select("evolution_instance_id")
      .eq("status", "online")
      .limit(1);

    if (!instances || instances.length === 0) {
      return new Response(
        JSON.stringify({ error: "Nenhuma instância online disponível" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const instanceName = instances[0].evolution_instance_id;
    const tag = config.member_tag;
    let totalUpdated = 0;
    let totalNotFound = 0;

    // For each group JID, fetch participants and apply tag
    for (const groupJid of config.group_jids) {
      try {
        const res = await fetch(
          `${EVOLUTION_API_URL}/group/participants/${instanceName}?groupJid=${encodeURIComponent(groupJid)}`,
          {
            headers: {
              "Content-Type": "application/json",
              apikey: EVOLUTION_API_KEY,
            },
          }
        );

        if (!res.ok) {
          console.error(`Failed to fetch participants for ${groupJid}: HTTP ${res.status}`);
          continue;
        }

        const data = await res.json();
        // Evolution returns participants in different formats
        const participants: string[] = [];
        const rawParticipants = data.participants || data || [];

        if (Array.isArray(rawParticipants)) {
          for (const p of rawParticipants) {
            const id = typeof p === "string" ? p : p.id || p.jid || p.number || "";
            if (id) participants.push(id);
          }
        }

        console.log(`[sync-group-members] Group ${groupJid}: ${participants.length} participants`);

        for (const participant of participants) {
          const phone = normalizePhone(participant);
          if (!phone) continue;

          const { data: perfil } = await supabase
            .from("perfis")
            .select("id, tags")
            .or(`celular.eq.${phone},whatsapp.eq.${phone}`)
            .limit(1)
            .single();

          if (!perfil) {
            totalNotFound++;
            continue;
          }

          const currentTags: string[] = perfil.tags || [];
          if (currentTags.includes(tag)) continue; // already has the tag

          const { error: updateError } = await supabase
            .from("perfis")
            .update({ tags: [...currentTags, tag] })
            .eq("id", perfil.id);

          if (!updateError) {
            totalUpdated++;
          } else {
            console.error(`Error updating tags for ${perfil.id}:`, updateError);
          }
        }
      } catch (err: any) {
        console.error(`Error processing group ${groupJid}:`, err.message);
      }
    }

    const result = {
      config_id,
      tag,
      groups: config.group_jids.length,
      updated: totalUpdated,
      notFound: totalNotFound,
    };

    console.log("[sync-group-members] Result:", JSON.stringify(result));

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("[sync-group-members] Error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
