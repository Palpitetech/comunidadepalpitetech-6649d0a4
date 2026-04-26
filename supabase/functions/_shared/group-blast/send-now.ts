import { jsonResponse } from "../whatsapp-utils.ts";
import type { Slot } from "./types.ts";

/**
 * Dispara um slot manualmente: insere logs com `scheduled_for = now + 5s`.
 * O `handleSend` (cron) entrega cada log resolvendo a instância no ato.
 */
export async function handleSendNow(
  supabase: any,
  config_id?: string,
  slot_id?: string,
): Promise<Response> {
  if (!config_id || !slot_id) {
    return jsonResponse({ error: "config_id e slot_id obrigatórios" }, 400);
  }

  const { data: config, error: cfgErr } = await supabase
    .from("group_blast_configs")
    .select("*")
    .eq("id", config_id)
    .single();

  if (cfgErr || !config) {
    return jsonResponse({ error: "Config não encontrada" }, 404);
  }

  const slots: Slot[] = config.slots ?? [];
  const slot = slots.find((s: Slot) => s.id === slot_id);
  if (!slot) return jsonResponse({ error: "Slot não encontrado" }, 404);

  const groupJids: string[] = config.group_jids ?? [];
  if (groupJids.length === 0) {
    return jsonResponse({ error: "Nenhum grupo configurado" }, 400);
  }

  const scheduledFor = new Date(Date.now() + 5_000).toISOString();
  const insertedLogs: string[] = [];

  for (const groupJid of groupJids) {
    const { data: log, error: logError } = await supabase
      .from("group_blast_logs")
      .insert({
        config_id: config.id,
        slot_id: slot.id,
        group_jid: groupJid,
        scheduled_for: scheduledFor,
        status: "pending",
        message_content: "",
        instance_id: null,
        evolution_instance_id: null,
      })
      .select()
      .single();

    if (logError) {
      console.error(
        `[send-now] Erro insert log group=${groupJid}:`,
        logError.message,
      );
      continue;
    }
    insertedLogs.push(log.id);
  }

  if (insertedLogs.length === 0 && groupJids.length > 0) {
    return jsonResponse(
      {
        error: "Nenhum log inserido — verifique RLS ou conexão com Postgres",
      },
      500,
    );
  }

  return jsonResponse({
    success: true,
    log_ids: insertedLogs,
    groups_count: groupJids.length,
    scheduled_for: scheduledFor,
    message: `Disparo agendado para ${groupJids.length} grupo(s) em 5 segundos`,
  });
}
