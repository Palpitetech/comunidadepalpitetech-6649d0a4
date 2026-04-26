import { jsonResponse } from "../whatsapp-utils.ts";
import type { PreparePayload, Slot } from "./types.ts";

/**
 * Converte um horário BRT (hh:mm) em um Date UTC.
 * BRT = UTC-3, então a hora UTC = hora BRT + 3.
 *
 * IMPORTANTE: Se o horário calculado para hoje já está no passado
 * (ex.: prepare roda 04:00 BRT e o nextTime é 23:30 BRT do dia anterior),
 * agenda automaticamente para o próximo dia. Isso evita logs com
 * `scheduled_for` retroativo que disparariam imediatamente.
 */
function brTimeToScheduledUtc(hh: string, mm: string): Date {
  const now = new Date();
  let scheduled = new Date(
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
  // Se já passou, agenda para o dia seguinte
  if (scheduled.getTime() <= now.getTime()) {
    scheduled = new Date(scheduled.getTime() + 24 * 60 * 60 * 1000);
  }
  return scheduled;
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
  let skippedDedup = 0;
  const errors: string[] = [];

  console.log(
    `[prepare] start: configs=${configs?.length ?? 0} force=${!!opts.force}`,
  );

  for (const config of configs || []) {
    const slots: Slot[] = config.slots ?? [];
    if (slots.length === 0) continue;

    const groupJids: string[] = config.group_jids ?? [];
    if (groupJids.length === 0) continue;

    let updatedSlots = [...slots];
    let preparedForConfig = 0;
    let skippedDedupForConfig = 0;
    const errorsForConfig: string[] = [];

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
          : brTimeToScheduledUtc(hh, mm);

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

          if ((count ?? 0) > 0) {
            skippedDedup++;
            console.log(
              `[prepare] dedup skip config=${config.name} slot=${slot.id} group=${groupJid}`,
            );
            continue;
          }
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
          const msg = `config=${config.name} slot=${slot.id} group=${groupJid}: ${insertErr.message}`;
          errors.push(msg);
          console.error(`[prepare] insert error ${msg}`);
          continue;
        }

        prepared++;
        console.log(
          `[prepare] inserted config=${config.name} slot=${slot.id} group=${groupJid} scheduled=${scheduled.toISOString()}`,
        );
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

  console.log(
    `[prepare] done: prepared=${prepared} skippedDedup=${skippedDedup} errors=${errors.length} force=${!!opts.force}`,
  );
  return jsonResponse({ prepared, skipped_dedup: skippedDedup, errors });
}
