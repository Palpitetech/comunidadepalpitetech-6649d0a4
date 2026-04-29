import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { toCanonicalBR, variants as brVariants } from "../_shared/br-phone.ts";

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

// Normaliza para canonical BR (10/11 dígitos sem DDI), removendo "@s.whatsapp.net".
// Retorna string vazia se a entrada não for um número BR válido.
function normalizePhone(raw: string): string {
  const cleaned = String(raw || "").replace(/@.*$/, "");
  return toCanonicalBR(cleaned) ?? "";
}

// Conjunto de variantes BR (com/sem 55, com/sem 9) para casar com qualquer
// formato salvo no banco.
function phoneVariants(raw: string): Set<string> {
  const canonical = normalizePhone(raw);
  if (!canonical) return new Set<string>();
  return new Set(brVariants(canonical));
}

function phonesMatch(a: string, b: string): boolean {
  const av = phoneVariants(a);
  for (const v of phoneVariants(b)) {
    if (av.has(v)) return true;
  }
  return false;
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
): Promise<Array<{ phone: string; admin: string | null; raw?: any }>> {
  const url = `${evoUrl}/group/participants/${instanceName}?groupJid=${encodeURIComponent(groupJid)}`;
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", apikey: evoKey },
  });
  if (!res.ok) {
    throw new Error(`Falha ao listar participantes (${res.status}): ${await res.text()}`);
  }
  const data = await res.json();
  const raw = data.participants || data || [];
  const list = (Array.isArray(raw) ? raw : []).map((p: any) => {
    if (typeof p === "string") {
      return { phone: normalizePhone(p), admin: null, raw: p };
    }
    // Modern WhatsApp returns `id` as LID (e.g. "12345@lid"). Real phone may live in
    // jid / phoneNumber / number / pn / participant fields depending on Evolution version.
    const phoneSource =
      p.jid || p.phoneNumber || p.phone || p.number || p.pn || p.participant || "";
    const idSource = p.id || "";
    // If id looks like a real phone (ends with @s.whatsapp.net or is plain digits >= 10),
    // use it as phone too. LIDs end with @lid and are short numeric.
    const isIdPhone =
      typeof idSource === "string" &&
      (idSource.endsWith("@s.whatsapp.net") ||
        (!idSource.includes("@") && normalizePhone(idSource).length >= 10));
    const phone = normalizePhone(phoneSource) || (isIdPhone ? normalizePhone(idSource) : "");
    return { phone, admin: p.admin ?? null, raw: p };
  });
  return list;
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

  // Try every online instance as probe until one succeeds (any instance NOT in
  // the group will return 403/404 "forbidden", so we must try several).
  const onlineInstances = (instances || []).filter((i: any) => i.status === "online");
  if (onlineInstances.length === 0) {
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
  let probeUsed: string | null = null;
  const probeAttempts: Array<{ instance: string; error: string }> = [];

  for (const candidate of onlineInstances) {
    try {
      const parts = await fetchGroupParticipants(
        evoUrl, evoKey, candidate.evolution_instance_id, groupJid
      );
      if (parts.length > 0) {
        participants = parts;
        probeUsed = candidate.evolution_instance_id;
        console.log(
          `[group-promote-admin] probe ok via ${probeUsed}: total=${parts.length}`
        );
        console.log(
          `[group-promote-admin] sample raw participant:`,
          JSON.stringify((parts[0] as any).raw)
        );
        break;
      }
      probeAttempts.push({ instance: candidate.evolution_instance_id, error: "empty" });
    } catch (e: any) {
      const msg = e?.message || String(e);
      probeAttempts.push({ instance: candidate.evolution_instance_id, error: msg });
      console.log(`[group-promote-admin] probe failed ${candidate.evolution_instance_id}: ${msg}`);
    }
  }

  if (!probeUsed) {
    probeError = `Nenhuma instância online conseguiu listar o grupo. Tentativas: ${probeAttempts
      .map((a) => `${a.instance}(${a.error.slice(0, 60)})`)
      .join("; ")}`;
  }

  const enriched: InstanceState[] = (instances || []).map((i: any) => {
    const found = participants.find((p) => phonesMatch(p.phone, i.phone_number));
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
    probe_used: probeUsed,
    next_in_queue: nextInQueue,
    has_admin_instance: hasAdmin,
    probe_error: probeError,
  };
}

// Round-robin counter (by group) to alternate which admin instance issues commands.
const adminRotation: Map<string, number> = new Map();

async function findAdminInstances(
  supabase: ReturnType<typeof getSupabase>,
  evoUrl: string,
  evoKey: string,
  groupJid: string
) {
  const { data: instances } = await supabase
    .from("whatsapp_instances")
    .select("id, evolution_instance_id, phone_number, status, created_at")
    .eq("status", "online")
    .order("created_at", { ascending: true });

  const admins: any[] = [];
  for (const inst of instances || []) {
    try {
      const parts = await fetchGroupParticipants(evoUrl, evoKey, inst.evolution_instance_id, groupJid);
      const me = parts.find((p) => phonesMatch(p.phone, inst.phone_number));
      if (me && (me.admin === "admin" || me.admin === "superadmin")) {
        admins.push(inst);
      }
    } catch (_) {
      continue;
    }
  }
  return admins;
}

function pickRotatingAdmin(groupJid: string, admins: any[]): any | null {
  if (admins.length === 0) return null;
  const current = adminRotation.get(groupJid) ?? 0;
  const pick = admins[current % admins.length];
  adminRotation.set(groupJid, current + 1);
  return pick;
}

async function callUpdateParticipant(
  evoUrl: string,
  evoKey: string,
  adminInstanceName: string,
  groupJid: string,
  action: "add" | "promote" | "remove" | "demote",
  targetJid: string
) {
  const url = `${evoUrl}/group/updateParticipant/${adminInstanceName}?groupJid=${encodeURIComponent(groupJid)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: evoKey },
    body: JSON.stringify({ groupJid, action, participants: [targetJid] }),
  });
  const txt = await res.text();
  if (!res.ok) {
    throw new Error(`${action} falhou (${res.status}): ${txt}`);
  }
  return txt;
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

  const admins = await findAdminInstances(supabase, evoUrl, evoKey, groupJid);
  const adminInstance = pickRotatingAdmin(groupJid, admins);
  if (!adminInstance) {
    throw new Error(
      "Nenhuma instância online é admin deste grupo. Promova manualmente a primeira instância pelo WhatsApp antes."
    );
  }

  const targetPhone = normalizePhone(target.phone_number);
  const targetJid = `${targetPhone}@s.whatsapp.net`;
  const txt = await callUpdateParticipant(
    evoUrl, evoKey, adminInstance.evolution_instance_id, groupJid, "promote", targetJid
  );

  return {
    promoted_phone: targetPhone,
    promoted_instance: target.name,
    via_instance: adminInstance.evolution_instance_id,
    response: txt,
  };
}

async function addAndPromote(
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

  const admins = await findAdminInstances(supabase, evoUrl, evoKey, groupJid);
  if (admins.length === 0) {
    throw new Error(
      "Nenhuma instância admin disponível para adicionar este contato. Promova manualmente uma instância primeiro."
    );
  }

  const targetPhone = normalizePhone(target.phone_number);
  const targetJid = `${targetPhone}@s.whatsapp.net`;

  // 1) ADD via rotating admin
  const addAdmin = pickRotatingAdmin(groupJid, admins);
  let addResponse: string;
  try {
    addResponse = await callUpdateParticipant(
      evoUrl, evoKey, addAdmin.evolution_instance_id, groupJid, "add", targetJid
    );
  } catch (e: any) {
    throw new Error(`Falha ao adicionar ao grupo: ${e?.message || e}`);
  }

  // 2) Wait for WhatsApp to propagate the add event (~3s)
  await new Promise((r) => setTimeout(r, 3000));

  // 3) PROMOTE via rotating admin (different one when possible)
  const promoteAdmin = pickRotatingAdmin(groupJid, admins);
  let promoteResponse: string | null = null;
  let promoteError: string | null = null;
  try {
    promoteResponse = await callUpdateParticipant(
      evoUrl, evoKey, promoteAdmin.evolution_instance_id, groupJid, "promote", targetJid
    );
  } catch (e: any) {
    promoteError = e?.message || String(e);
  }

  return {
    added_phone: targetPhone,
    added_instance: target.name,
    via_add_instance: addAdmin.evolution_instance_id,
    via_promote_instance: promoteAdmin.evolution_instance_id,
    add_response: addResponse,
    promote_response: promoteResponse,
    promote_error: promoteError,
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

    if (action === "add_and_promote") {
      const targetInstanceId: string = body.instance_id;
      if (!targetInstanceId) {
        return new Response(JSON.stringify({ error: "instance_id obrigatório" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const result = await addAndPromote(supabase, evoUrl, evoKey, groupJid, targetInstanceId);
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
