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
  return (raw || "").replace(/@.*$/, "").replace(/\D/g, "");
}

// Admin = currently has admin/superadmin role on the WhatsApp group
type ParticipantStatus = "admin" | "superadmin" | "member" | "not_in_group";

interface InstanceState {
  id: string;
  name: string;
  evolution_instance_id: string;
  phone_number: string;
  status: string;
  created_at: string;
  group_status: ParticipantStatus;
}

async function fetchGroupParticipants(
  evoUrl: string,
  evoKey: string,
  instanceName: string,
  groupJid: string
): Promise<Array<{ phone: string; admin: string | null }>> {
  const url = `${evoUrl}/group/participants/${instanceName}?groupJid=${encodeURIComponent(groupJid)}`;
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", apikey: evoKey },
  });
  if (!res.ok) {
    throw new Error(`Falha ao listar participantes (${res.status}): ${await res.text()}`);
  }
  const data = await res.json();
  const raw = data.participants || data || [];
  return (Array.isArray(raw) ? raw : []).map((p: any) => {
    const id = typeof p === "string" ? p : p.id || p.jid || p.number || "";
    const admin = typeof p === "string" ? null : (p.admin ?? null);
    return { phone: normalizePhone(id), admin };
  });
}

async function listForGroup(
  supabase: ReturnType<typeof getSupabase>,
  evoUrl: string,
  evoKey: string,
  groupJid: string
) {
  const { data: instances, error } = await supabase
    .from("whatsapp_instances")
    .select("id, name, evolution_instance_id, phone_number, status, created_at")
    .order("created_at", { ascending: true });

  if (error) throw error;

  // Pick first online instance as the probe to query the group
  const probe = (instances || []).find((i: any) => i.status === "online");
  if (!probe) {
    return {
      instances: (instances || []).map((i: any) => ({
        ...i,
        group_status: "not_in_group" as ParticipantStatus,
      })),
      probe_used: null,
      next_in_queue: null,
      has_admin_instance: false,
    };
  }

  let participants: Array<{ phone: string; admin: string | null }> = [];
  let probeError: string | null = null;
  try {
    participants = await fetchGroupParticipants(evoUrl, evoKey, probe.evolution_instance_id, groupJid);
  } catch (e: any) {
    probeError = e?.message || String(e);
  }

  const enriched: InstanceState[] = (instances || []).map((i: any) => {
    const myPhone = normalizePhone(i.phone_number);
    const found = participants.find((p) => p.phone === myPhone || p.phone.endsWith(myPhone));
    let group_status: ParticipantStatus = "not_in_group";
    if (found) {
      if (found.admin === "superadmin") group_status = "superadmin";
      else if (found.admin === "admin") group_status = "admin";
      else group_status = "member";
    }
    return { ...i, group_status };
  });

  const hasAdmin = enriched.some((i) => i.group_status === "admin" || i.group_status === "superadmin");

  // Next-in-queue = first 'member' instance (online), in created_at order
  const nextInQueue =
    enriched.find((i) => i.group_status === "member" && i.status === "online")?.id || null;

  return {
    instances: enriched,
    probe_used: probe.evolution_instance_id,
    next_in_queue: nextInQueue,
    has_admin_instance: hasAdmin,
    probe_error: probeError,
  };
}

async function promote(
  supabase: ReturnType<typeof getSupabase>,
  evoUrl: string,
  evoKey: string,
  groupJid: string,
  targetInstanceId: string
) {
  const { data: target, error: tErr } = await supabase
    .from("whatsapp_instances")
    .select("id, name, phone_number")
    .eq("id", targetInstanceId)
    .single();
  if (tErr || !target) throw new Error("Instância alvo não encontrada");

  // Find an admin instance to issue the promote command
  const { data: instances } = await supabase
    .from("whatsapp_instances")
    .select("id, evolution_instance_id, phone_number, status, created_at")
    .eq("status", "online")
    .order("created_at", { ascending: true });

  let adminInstance: any = null;
  for (const inst of instances || []) {
    try {
      const parts = await fetchGroupParticipants(evoUrl, evoKey, inst.evolution_instance_id, groupJid);
      const myPhone = normalizePhone(inst.phone_number);
      const me = parts.find((p) => p.phone === myPhone || p.phone.endsWith(myPhone));
      if (me && (me.admin === "admin" || me.admin === "superadmin")) {
        adminInstance = inst;
        break;
      }
    } catch (_) {
      continue;
    }
  }

  if (!adminInstance) {
    throw new Error(
      "Nenhuma instância online é admin deste grupo. Promova manualmente a primeira instância pelo WhatsApp antes."
    );
  }

  const targetPhone = normalizePhone(target.phone_number);
  const targetJid = `${targetPhone}@s.whatsapp.net`;

  const url = `${evoUrl}/group/updateParticipant/${adminInstance.evolution_instance_id}?groupJid=${encodeURIComponent(groupJid)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: evoKey },
    body: JSON.stringify({
      groupJid,
      action: "promote",
      participants: [targetJid],
    }),
  });

  const txt = await res.text();
  if (!res.ok) {
    throw new Error(`Promoção falhou (${res.status}): ${txt}`);
  }

  return {
    promoted_phone: targetPhone,
    promoted_instance: target.name,
    via_instance: adminInstance.evolution_instance_id,
    response: txt,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const action: string = body.action || "list";
    const groupJid: string = body.group_jid;

    if (!groupJid) {
      return new Response(JSON.stringify({ error: "group_jid é obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const evoUrl = Deno.env.get("EVOLUTION_API_URL");
    const evoKey = Deno.env.get("EVOLUTION_API_KEY");
    if (!evoUrl || !evoKey) {
      throw new Error("EVOLUTION_API_URL/KEY não configurados");
    }

    const supabase = getSupabase();

    if (action === "list") {
      const result = await listForGroup(supabase, evoUrl, evoKey, groupJid);
      return new Response(JSON.stringify({ ok: true, ...result }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "promote") {
      const targetInstanceId: string = body.instance_id;
      if (!targetInstanceId) {
        return new Response(JSON.stringify({ error: "instance_id obrigatório" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const result = await promote(supabase, evoUrl, evoKey, groupJid, targetInstanceId);
      return new Response(JSON.stringify({ ok: true, ...result }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "action inválida" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("group-promote-admin error", err);
    return new Response(JSON.stringify({ error: err?.message || String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
