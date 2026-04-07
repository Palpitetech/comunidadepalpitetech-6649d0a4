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

/**
 * Normalizes a phone number to match the format stored in perfis.celular
 * Evolution sends numbers like "5511999887755@s.whatsapp.net"
 */
function normalizePhone(raw: string): string {
  // Remove @s.whatsapp.net suffix and any non-digit chars
  let digits = raw.replace(/@.*$/, "").replace(/\D/g, "");
  // Remove country code 55 if present (Brazilian numbers)
  if (digits.startsWith("55") && (digits.length === 12 || digits.length === 13)) {
    digits = digits.substring(2);
  }
  return digits;
}

Deno.serve(async (req) => {
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
    const payload = await req.json();

    // Evolution API sends different event formats depending on version
    // Common shapes:
    // { event: "group-participants.upsert", data: { ... } }
    // { event: "GROUP_PARTICIPANTS_UPDATE", data: { ... } }
    const eventType = payload.event || "";
    const data = payload.data || payload;

    // Determine action: add or remove
    let action: "add" | "remove" | null = null;

    if (
      eventType.includes("upsert") ||
      eventType.includes("ADD") ||
      data.action === "add"
    ) {
      action = "add";
    } else if (
      eventType.includes("delete") ||
      eventType.includes("REMOVE") ||
      data.action === "remove"
    ) {
      action = "remove";
    }

    if (!action) {
      // Not a participant add/remove event, ignore
      return new Response(JSON.stringify({ ignored: true, event: eventType }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Extract group JID and participant numbers
    const groupJid = data.groupJid || data.id || data.chatId || "";
    const participants: string[] = data.participants || [];

    if (!groupJid || participants.length === 0) {
      return new Response(
        JSON.stringify({ error: "Missing groupJid or participants" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabase = getSupabase();

    // Find which group_blast_configs contain this group JID and have a member_tag
    const { data: configs, error: configError } = await supabase
      .from("group_blast_configs")
      .select("id, member_tag, group_jids")
      .not("member_tag", "is", null);

    if (configError) {
      console.error("Error fetching configs:", configError);
      return new Response(
        JSON.stringify({ error: "DB error" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Filter configs that contain this group JID
    const matchingConfigs = (configs || []).filter(
      (c: any) =>
        c.member_tag &&
        Array.isArray(c.group_jids) &&
        c.group_jids.includes(groupJid)
    );

    if (matchingConfigs.length === 0) {
      return new Response(
        JSON.stringify({ ignored: true, reason: "no matching config with member_tag" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Collect unique tags from matching configs
    const tags = [...new Set(matchingConfigs.map((c: any) => c.member_tag as string))];

    let updated = 0;
    let notFound = 0;

    for (const participant of participants) {
      const phone = normalizePhone(participant);
      if (!phone) continue;

      // Find user by celular or whatsapp
      const { data: perfil } = await supabase
        .from("perfis")
        .select("id, tags")
        .or(`celular.eq.${phone},whatsapp.eq.${phone}`)
        .limit(1)
        .single();

      if (!perfil) {
        notFound++;
        continue;
      }

      const currentTags: string[] = perfil.tags || [];
      let newTags: string[];

      if (action === "add") {
        // Add tags that aren't already present
        const tagsToAdd = tags.filter((t) => !currentTags.includes(t));
        if (tagsToAdd.length === 0) continue;
        newTags = [...currentTags, ...tagsToAdd];
      } else {
        // Remove tags
        const tagsToRemove = new Set(tags);
        newTags = currentTags.filter((t) => !tagsToRemove.has(t));
        if (newTags.length === currentTags.length) continue; // nothing changed
      }

      const { error: updateError } = await supabase
        .from("perfis")
        .update({ tags: newTags })
        .eq("id", perfil.id);

      if (updateError) {
        console.error(`Error updating tags for ${perfil.id}:`, updateError);
      } else {
        updated++;
      }
    }

    const result = {
      action,
      groupJid,
      tags,
      participants: participants.length,
      updated,
      notFound,
    };

    console.log("[group-member-webhook]", JSON.stringify(result));

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("[group-member-webhook] Error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
