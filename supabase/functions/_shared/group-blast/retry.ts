import { jsonResponse } from "../whatsapp-utils.ts";
import {
  dispatchToEvolution,
  resolveMessageContent,
  selectInstancesForGroup,
} from "./send.ts";
import type { Slot } from "./types.ts";

/**
 * Reenvio manual e isolado de um log `failed`.
 *
 * - NÃO mexe em horário, slot, dedup, ou índice de rotação.
 * - Tenta a `instance_id` original primeiro (se ainda disponível);
 *   se falhar, percorre `select_best_instances` para o `group_jid`.
 * - Sempre incrementa `retry_count`.
 */
export async function handleRetry(
  supabase: any,
  evolutionUrl: string,
  evolutionKey: string,
  logId: string,
): Promise<Response> {
  if (!logId) {
    return jsonResponse({ error: "log_id obrigatório" }, 400);
  }

  // 1) Carrega log
  const { data: log, error: logErr } = await supabase
    .from("group_blast_logs")
    .select("*")
    .eq("id", logId)
    .maybeSingle();

  if (logErr) {
    return jsonResponse({ error: `Erro ao buscar log: ${logErr.message}` }, 500);
  }
  if (!log) {
    return jsonResponse({ error: "Log não encontrado" }, 404);
  }
  if (log.status !== "failed") {
    return jsonResponse(
      { error: `Log não está em failed (status atual: ${log.status})` },
      400,
    );
  }

  console.log(`[retry] start log=${logId} group=${log.group_jid}`);

  const apiKey = Deno.env.get("LOVABLE_API_KEY") ?? "";
  const baseUrl = Deno.env.get("COMMUNITY_BASE_URL") ?? "";
  const newRetryCount = (log.retry_count ?? 0) + 1;

  // 2) Resolver mensagem (reusa se já existir)
  let messageContent = log.message_content?.trim() ? log.message_content : null;
  let messageSource = "reused";

  if (!messageContent) {
    const { data: configData } = await supabase
      .from("group_blast_configs")
      .select("slots, include_palpites, vip_group_link")
      .eq("id", log.config_id)
      .maybeSingle();

    const slots: Slot[] = configData?.slots ?? [];
    const slot = slots.find((s: Slot) => s.id === log.slot_id);

    const resolved = await resolveMessageContent(
      supabase,
      log,
      slot,
      configData,
      apiKey,
      baseUrl,
    );
    messageContent = resolved.content;
    messageSource = resolved.source;
  }

  if (!messageContent || messageContent.trim().length === 0) {
    const reason = `Retry: mensagem vazia (source=${messageSource})`;
    await supabase
      .from("group_blast_logs")
      .update({
        error_message: reason,
        retry_count: newRetryCount,
        last_error_at: new Date().toISOString(),
      })
      .eq("id", logId);
    return jsonResponse({ ok: false, error: reason }, 200);
  }

  // 3) Monta lista de candidatas: instância original primeiro, depois melhores
  const candidates: any[] = [];
  const seen = new Set<string>();

  if (log.instance_id) {
    const { data: orig } = await supabase
      .from("whatsapp_instances")
      .select("id, evolution_instance_id, status")
      .eq("id", log.instance_id)
      .maybeSingle();
    if (orig?.evolution_instance_id) {
      candidates.push({
        instance_id: orig.id,
        evolution_instance_id: orig.evolution_instance_id,
      });
      seen.add(orig.id);
    }
  }

  const { data: best, error: bestErr } = await selectInstancesForGroup(
    supabase,
    log.group_jid,
  );

  if (bestErr) {
    const reason = `Retry: erro ao buscar instâncias: ${bestErr.message}`;
    await supabase
      .from("group_blast_logs")
      .update({
        error_message: reason,
        retry_count: newRetryCount,
        last_error_at: new Date().toISOString(),
        message_content: messageContent,
      })
      .eq("id", logId);
    return jsonResponse({ ok: false, error: reason }, 200);
  }

  for (const c of best || []) {
    if (!seen.has(c.instance_id)) {
      candidates.push(c);
      seen.add(c.instance_id);
    }
  }

  if (candidates.length === 0) {
    const reason = "Retry: nenhuma instância disponível";
    await supabase
      .from("group_blast_logs")
      .update({
        error_message: reason,
        retry_count: newRetryCount,
        last_error_at: new Date().toISOString(),
        message_content: messageContent,
      })
      .eq("id", logId);
    return jsonResponse({ ok: false, error: reason }, 200);
  }

  // 4) Loop de envio
  const tried: string[] = [];
  let lastError = "";

  for (let i = 0; i < candidates.length; i++) {
    const instance = candidates[i];
    const evoName = instance.evolution_instance_id;
    const attempt = await dispatchToEvolution(
      supabase,
      instance,
      evolutionUrl,
      evolutionKey,
      log,
      messageContent,
    );

    if (!attempt.ok) {
      const tag = attempt.status ? `${evoName}→${attempt.status}` : `${evoName}→err`;
      tried.push(tag);
      lastError = attempt.error ?? lastError;
      console.warn(`[retry] log=${logId} attempt=${i + 1} ${tag}`);
      continue;
    }

    tried.push(`${evoName}→ok`);
    await supabase
      .from("group_blast_logs")
      .update({
        status: "sent",
        sent_at: new Date().toISOString(),
        message_content: messageContent,
        instance_id: instance.instance_id,
        evolution_instance_id: evoName,
        retry_count: newRetryCount,
        error_message: `retry ok — tried: [${tried.join(", ")}]`,
      })
      .eq("id", logId);

    await supabase.rpc("register_instance_usage", {
      p_instance_id: instance.instance_id,
    });

    console.log(`[retry] log=${logId} sucesso via ${evoName}`);
    return jsonResponse({ ok: true, sent_via: evoName, tried, retry_count: newRetryCount });
  }

  // Falhou em todas
  const finalReason = `Retry: todas as ${candidates.length} falharam. tried: [${
    tried.join(", ")
  }] | lastError=${lastError}`;
  await supabase
    .from("group_blast_logs")
    .update({
      error_message: finalReason,
      retry_count: newRetryCount,
      last_error_at: new Date().toISOString(),
      message_content: messageContent,
    })
    .eq("id", logId);

  console.error(`[retry] log=${logId} ${finalReason}`);
  return jsonResponse({ ok: false, error: finalReason, tried, retry_count: newRetryCount }, 200);
}
