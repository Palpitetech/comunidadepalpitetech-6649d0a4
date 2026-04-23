import { jsonResponse } from "../whatsapp-utils.ts";
import type { PreparePayload, Slot } from "./types.ts";

/**
 * Converte um horário BRT (hh:mm) em um Date UTC do dia atual.
 * BRT = UTC-3, então a hora UTC = hora BRT + 3.
 */
function brTimeToUtcToday(hh: string, mm: string): Date {
  const now = new Date();
  return new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      parseInt(hh) + 3,
      parseInt(mm),
      0,
      0,
    ),
  );
}

/**
 * Agenda mensagens (`group_blast_logs`) com `instance_id = NULL`.
 * A instância é resolvida no ato do envio (`handleSend`).
 *
 * - `force=true` → agenda em `now + 30s * (slotIdx+1)` e ignora dedup (usado pelo botão "Disparar/Test").
 * - `force=false` (default) → agenda no horário programado e bloqueia duplicações nas últimas 20h.
 */
export async function handlePrepare(
  supabase: any,
  opts: PreparePayload,
): Promise<Response> {
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
    const slots: Slot[] = config.slots ?? [];
    if (slots.length === 0) continue;

    const groupJids: string[] = config.group_jids ?? [];
    if (groupJids.length === 0) continue;

    let updatedSlots = [...slots];

    for (let slotIdx = 0; slotIdx < slots.length; slotIdx++) {
      const slot = slots[slotIdx];
      const times = (slot.schedule_times || []).slice().sort();
      if (times.length === 0) continue;

      const nextIndex =
        ((slot.last_scheduled_index ?? -1) + 1) % times.length;
      const nextTime = times[nextIndex];
      const [hh, mm] = nextTime.split(":");

      for (const groupJid of groupJids) {
        const scheduled = opts.force
          ? new Date(Date.now() + 30_000 * (slotIdx + 1))
          : brTimeToUtcToday(hh, mm);

        // Dedup: pula se já existe agendamento recente (não aplicável em modo force)
        if (!opts.force) {
          const twentyHoursAgo = new Date(
            Date.now() - 20 * 60 * 60 * 1000,
          ).toISOString();

          const { count } = await supabase
            .from("group_blast_logs")
            .select("id", { count: "exact", head: true })
            .eq("config_id", config.id)
            .eq("slot_id", slot.id)
            .eq("group_jid", groupJid)
            .gte("created_at", twentyHoursAgo)
            .neq("status", "failed");

          if ((count ?? 0) > 0) continue;
        }

        // instance_id e evolution_instance_id NUNCA pré-vinculados aqui.
        const { error: insertErr } = await supabase
          .from("group_blast_logs")
          .insert({
            config_id: config.id,
            slot_id: slot.id,
            group_jid: groupJid,
            message_content: "",
            scheduled_for: scheduled.toISOString(),
            status: "pending",
            instance_id: null,
            evolution_instance_id: null,
          });

        if (insertErr) {
          console.error(
            `[prepare] Erro insert log config=${config.id} slot=${slot.id} group=${groupJid}:`,
            insertErr,
          );
          continue;
        }

        prepared++;
      }

      updatedSlots = updatedSlots.map((s) =>
        s.id === slot.id ? { ...s, last_scheduled_index: nextIndex } : s
      );
    }

    await supabase
      .from("group_blast_configs")
      .update({
        slots: updatedSlots,
        updated_at: new Date().toISOString(),
      })
      .eq("id", config.id);
  }

  console.log(`[prepare] Prepared ${prepared} log(s) (force=${!!opts.force})`);
  return jsonResponse({ prepared });
}
