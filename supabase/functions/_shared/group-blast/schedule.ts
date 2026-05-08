// =============================================================================
// Agendador de Disparo em Grupo.
// Unifica antigos `prepare.ts` (cron diário) e `send-now.ts` (botão manual).
//
// Diferença crucial vs versão antiga: a mensagem é RESOLVIDA AGORA,
// antes do insert. Logs com mensagem vazia já entram como `failed` com
// motivo claro — nunca enchemos a fila de pending sem conteúdo.
// =============================================================================

import { jsonResponse } from "../whatsapp-utils.ts";
import type { PreparePayload, Slot } from "./types.ts";

/**
 * Converte um horário BRT (hh:mm) em Date UTC para hoje (em BRT).
 * Se o horário calculado já passou, agenda para amanhã.
 *
 * IMPORTANTE: usa o "dia do relógio BRT", não o dia UTC. Isso é crítico
 * na janela 21:00-23:59 BRT (= 00:00-02:59 UTC do dia seguinte): se
 * usássemos getUTCDate(), o "dia base" seria o de amanhã BRT, fazendo
 * o agendamento sair 24h depois do esperado.
 *
 * Brasil não observa horário de verão desde 2019, então UTC-3 fixo.
 */
function brTimeToScheduledUtc(hh: string, mm: string): Date {
  const now = new Date();
  // "Agora" projetado no fuso BRT (UTC-3): usamos componentes UTC desse
  // ponto deslocado para extrair o dia/mês/ano do calendário BRT atual.
  const nowBrt = new Date(now.getTime() - 3 * 60 * 60 * 1000);
  const brtY = nowBrt.getUTCFullYear();
  const brtM = nowBrt.getUTCMonth();
  const brtD = nowBrt.getUTCDate();

  // Slot BRT (hh:mm) do dia BRT atual → UTC: somamos +3h ao hh.
  // Date.UTC normaliza overflow (hora 26 vira "dia+1, 02h"), então slots
  // noturnos como 23:30 BRT viram corretamente "dia+1, 02:30 UTC".
  let scheduled = new Date(
    Date.UTC(brtY, brtM, brtD, parseInt(hh) + 3, parseInt(mm), 0, 0),
  );
  if (scheduled.getTime() <= now.getTime()) {
    scheduled = new Date(scheduled.getTime() + 24 * 60 * 60 * 1000);
  }
  return scheduled;
}

interface InsertResult {
  prepared: number;
  skippedDedup: number;
  failedResolution: number;
  errors: string[];
}

/**
 * Agenda um único log SEM resolver mensagem. O conteúdo é montado pelo
 * dispatcher segundos antes do envio (sempre fresco, lendo o último
 * resultado do DB no momento). Isso garante que mensagens enviadas tarde
 * nunca carreguem o resultado anterior já desatualizado.
 */
async function scheduleOne(
  supabase: any,
  config: any,
  slot: Slot,
  groupJid: string,
  scheduledFor: Date,
  force: boolean,
): Promise<{ status: "prepared" | "skipped" | "failed"; error?: string }> {
  // Dedup (skip em modo force)
  if (!force) {
    const twentyHoursAgo = new Date(Date.now() - 20 * 60 * 60 * 1000)
      .toISOString();
    const { count } = await supabase
      .from("group_blast_logs")
      .select("id", { count: "exact", head: true })
      .eq("config_id", config.id)
      .eq("slot_id", slot.id)
      .eq("group_jid", groupJid)
      .gte("created_at", twentyHoursAgo)
      .neq("status", "failed")
      .not("message_source", "is", null);
    if ((count ?? 0) > 0) return { status: "skipped" };
  }

  const insertPayload: any = {
    config_id: config.id,
    slot_id: slot.id,
    group_jid: groupJid,
    scheduled_for: scheduledFor.toISOString(),
    instance_id: null,
    evolution_instance_id: null,
    status: "pending",
    message_content: "",
    message_source: "deferred",
  };

  const { error } = await supabase
    .from("group_blast_logs")
    .insert(insertPayload);

  if (error) return { status: "failed", error: error.message };
  return { status: "prepared" };
}

/**
 * `action=prepare`: percorre configs ativas (ou uma específica) e agenda
 * cada slot no próximo horário programado. Em `force=true`, agenda em
 * `now + 30s * (slotIdx+1)` para teste imediato e ignora dedup.
 */
export async function handlePrepare(
  supabase: any,
  opts: PreparePayload,
): Promise<Response> {

  let q = supabase.from("group_blast_configs").select("*");
  q = opts.config_id ? q.eq("id", opts.config_id) : q.eq("is_active", true);

  const { data: configs, error: cfgErr } = await q;
  if (cfgErr) throw cfgErr;

  const totals: InsertResult = {
    prepared: 0,
    skippedDedup: 0,
    failedResolution: 0,
    errors: [],
  };

  console.log(
    `[schedule] prepare start: configs=${configs?.length ?? 0} force=${!!opts.force}`,
  );

  for (const config of configs || []) {
    const slots: Slot[] = config.slots ?? [];
    const groupJids: string[] = config.group_jids ?? [];
    if (slots.length === 0 || groupJids.length === 0) continue;

    let preparedForConfig = 0;
    let skippedForConfig = 0;
    let failedForConfig = 0;
    const errorsForConfig: string[] = [];
    const updatedSlots = [...slots];

    for (let slotIdx = 0; slotIdx < slots.length; slotIdx++) {
      const slot = slots[slotIdx];
      const times = (slot.schedule_times || []).slice().sort();
      if (times.length === 0) continue;

      const nextIndex = ((slot.last_scheduled_index ?? -1) + 1) % times.length;
      const [hh, mm] = times[nextIndex].split(":");

      for (const groupJid of groupJids) {
        const scheduledFor = opts.force
          ? new Date(Date.now() + 30_000 * (slotIdx + 1))
          : brTimeToScheduledUtc(hh, mm);

        const r = await scheduleOne(
          supabase,
          config,
          slot,
          groupJid,
          scheduledFor,
          !!opts.force,
        );

        if (r.status === "prepared") {
          preparedForConfig++;
          totals.prepared++;
        } else if (r.status === "skipped") {
          skippedForConfig++;
          totals.skippedDedup++;
        } else {
          failedForConfig++;
          totals.failedResolution++;
          if (r.error) {
            errorsForConfig.push(
              `slot=${slot.id} group=${groupJid}: ${r.error}`,
            );
            totals.errors.push(`${config.name}: ${r.error}`);
          }
        }
      }

      const idx = updatedSlots.findIndex((s) => s.id === slot.id);
      if (idx >= 0) updatedSlots[idx] = { ...slot, last_scheduled_index: nextIndex };
    }

    await supabase
      .from("group_blast_configs")
      .update({ slots: updatedSlots, updated_at: new Date().toISOString() })
      .eq("id", config.id);

    try {
      await supabase.from("group_blast_prepare_runs").insert({
        config_id: config.id,
        slots_scheduled: preparedForConfig,
        slots_resolved: preparedForConfig,
        slots_failed_resolution: failedForConfig,
        skipped_dedup: skippedForConfig,
        error_message: errorsForConfig.length > 0
          ? errorsForConfig.join(" | ").slice(0, 1000)
          : null,
        ran_at: new Date().toISOString(),
      });
    } catch (auditErr: any) {
      console.warn(`[schedule] audit insert falhou: ${auditErr?.message}`);
    }
  }

  console.log(
    `[schedule] prepare done: prepared=${totals.prepared} skipped=${totals.skippedDedup} failed_resolution=${totals.failedResolution}`,
  );
  return jsonResponse({
    prepared: totals.prepared,
    skipped_dedup: totals.skippedDedup,
    failed_resolution: totals.failedResolution,
    errors: totals.errors,
  });
}

/**
 * `action=send_now`: dispara um slot específico em ~5s.
 * Ignora dedup (force=true).
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
  if (cfgErr || !config) return jsonResponse({ error: "Config não encontrada" }, 404);

  const slots: Slot[] = config.slots ?? [];
  const slot = slots.find((s) => s.id === slot_id);
  if (!slot) return jsonResponse({ error: "Slot não encontrado" }, 404);

  const groupJids: string[] = config.group_jids ?? [];
  if (groupJids.length === 0) {
    return jsonResponse({ error: "Nenhum grupo configurado" }, 400);
  }

  const scheduledFor = new Date(Date.now() + 5_000);
  const results: { group: string; status: string; error?: string }[] = [];

  for (const groupJid of groupJids) {
    const r = await scheduleOne(
      supabase,
      config,
      slot,
      groupJid,
      scheduledFor,
      true,
    );
    results.push({ group: groupJid, status: r.status, error: r.error });
  }

  const prepared = results.filter((r) => r.status === "prepared").length;
  return jsonResponse({
    success: prepared > 0,
    prepared,
    failed: results.filter((r) => r.status === "failed").length,
    groups_count: groupJids.length,
    scheduled_for: scheduledFor.toISOString(),
    results,
  });
}
