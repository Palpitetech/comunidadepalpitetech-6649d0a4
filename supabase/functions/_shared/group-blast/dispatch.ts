// =============================================================================
// Dispatcher de Disparo em Grupo.
// Unifica antigos `send.ts` (loop cron) e `retry.ts` (reenvio manual).
//
// Premissa nova: o `prepare`/`send_now` já gravou message_content no log.
// Aqui só pegamos pending com conteúdo válido e entregamos via Evolution.
// =============================================================================

import { jsonResponse } from "../whatsapp-utils.ts";
import { resolveMessage } from "./resolver.ts";
import type { Slot } from "./types.ts";

interface SendAttempt {
  ok: boolean;
  error?: string;
  status?: number | string;
}

// ---------- helpers internos ----------

async function selectInstancesForGroup(supabase: any, groupJid: string) {
  return await supabase.rpc("select_best_instances", {
    p_limit: 5,
    p_group_jid: groupJid,
  });
}

/**
 * Tenta entregar uma mensagem por uma instância:
 * 1) connectionState (best-effort) — se ≠ "open", marca offline e desiste
 * 2) sendText
 * 3) Em qualquer falha, atualiza last_message_at (cooldown)
 */
async function dispatchToEvolution(
  supabase: any,
  instance: any,
  evolutionUrl: string,
  evolutionKey: string,
  groupJid: string,
  messageContent: string,
): Promise<SendAttempt> {
  const evoName = instance.evolution_instance_id;

  try {
    const stateRes = await fetch(
      `${evolutionUrl}/instance/connectionState/${evoName}`,
      { method: "GET", headers: { apikey: evolutionKey } },
    );
    if (stateRes.ok) {
      const stateJson = await stateRes.json().catch(() => null);
      const state = stateJson?.instance?.state || stateJson?.state;
      if (state && state !== "open") {
        await supabase
          .from("whatsapp_instances")
          .update({ status: "offline" })
          .eq("id", instance.instance_id);
        return { ok: false, status: `state:${state}` };
      }
    }
  } catch (e: any) {
    console.warn(`[dispatch] state-check falhou ${evoName}: ${e.message}`);
  }

  try {
    const res = await fetch(`${evolutionUrl}/message/sendText/${evoName}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: evolutionKey },
      body: JSON.stringify({
        number: groupJid,
        text: messageContent,
        linkPreview: false,
      }),
    });

    const body = await res.json().catch(() => null);
    if (!res.ok || !body?.key?.id) {
      const reason = body?.message ?? body?.error ?? `HTTP ${res.status}`;
      await supabase
        .from("whatsapp_instances")
        .update({ last_message_at: new Date().toISOString() })
        .eq("id", instance.instance_id);
      return { ok: false, status: res.status, error: String(reason).slice(0, 200) };
    }
    return { ok: true };
  } catch (e: any) {
    await supabase
      .from("whatsapp_instances")
      .update({ last_message_at: new Date().toISOString() })
      .eq("id", instance.instance_id);
    return { ok: false, status: "exc", error: e?.message ?? String(e) };
  }
}

async function markSent(
  supabase: any,
  logId: string,
  instance: any,
  tried: string[],
  retryCount?: number,
) {
  const update: any = {
    status: "sent",
    sent_at: new Date().toISOString(),
    instance_id: instance.instance_id,
    evolution_instance_id: instance.evolution_instance_id,
    error_message: tried.length > 1 ? `tried: [${tried.join(", ")}]` : null,
  };
  if (typeof retryCount === "number") update.retry_count = retryCount;

  await supabase.from("group_blast_logs").update(update).eq("id", logId);
  await supabase.rpc("register_instance_usage", {
    p_instance_id: instance.instance_id,
  });
}

async function markFailed(
  supabase: any,
  logId: string,
  reason: string,
  retryCount?: number,
  messageContent?: string,
) {
  const update: any = {
    status: "failed",
    error_message: reason,
    last_error_at: new Date().toISOString(),
  };
  if (typeof retryCount === "number") update.retry_count = retryCount;
  if (messageContent && messageContent.trim()) update.message_content = messageContent;
  await supabase.from("group_blast_logs").update(update).eq("id", logId);
}

/**
 * Tenta entregar um log por uma lista de candidatas em sequência.
 * Retorna se foi entregue + lista de tentativas.
 */
async function deliverViaCandidates(
  supabase: any,
  candidates: any[],
  evolutionUrl: string,
  evolutionKey: string,
  groupJid: string,
  messageContent: string,
): Promise<{ delivered: boolean; via?: any; tried: string[]; lastError: string }> {
  const tried: string[] = [];
  let lastError = "";
  for (let i = 0; i < candidates.length; i++) {
    const inst = candidates[i];
    const evoName = inst.evolution_instance_id;
    const att = await dispatchToEvolution(
      supabase,
      inst,
      evolutionUrl,
      evolutionKey,
      groupJid,
      messageContent,
    );
    if (att.ok) {
      tried.push(`${evoName}→ok`);
      return { delivered: true, via: inst, tried, lastError };
    }
    tried.push(att.status ? `${evoName}→${att.status}` : `${evoName}→err`);
    lastError = att.error ?? lastError;
  }
  return { delivered: false, tried, lastError };
}

// ---------- handlers públicos ----------

/**
 * `action=send`: loop do cron. Pega até 5 logs prontos e entrega.
 */
export async function handleSend(
  supabase: any,
  evolutionUrl: string,
  evolutionKey: string,
): Promise<Response> {
  const { data: logs, error } = await supabase
    .from("group_blast_logs")
    .select("*")
    .eq("status", "pending")
    .lte("scheduled_for", new Date().toISOString())
    .order("scheduled_for", { ascending: true })
    .limit(5);

  if (error) throw error;

  if (!logs || logs.length === 0) {
    console.log(`[dispatch] send: 0 prontos`);
    return jsonResponse({ sent: 0, failed: 0, message: "Nenhum pendente" });
  }

  console.log(`[dispatch] send: ${logs.length} pronto(s) — ids=${logs.map((l: any) => l.id).join(",")}`);

  const apiKey = Deno.env.get("LOVABLE_API_KEY") ?? "";
  const baseUrl = Deno.env.get("COMMUNITY_BASE_URL") ?? "";

  let sent = 0;
  let failed = 0;
  let pendingNoInstance = 0;

  // Janela de carência: se a resolução falhar (ex.: sorteio acabou e o
  // resultado ainda não sincronizou), mantemos o log `pending` por até
  // GRACE_MINUTES e o cron tenta de novo. Depois disso, marca `failed`.
  const GRACE_MINUTES = 60;

  for (const log of logs) {
    // SEMPRE reresolve a mensagem no momento do envio para garantir que
    // o "Último Resultado" reflita o concurso mais novo no DB.
    const { data: cfg } = await supabase
      .from("group_blast_configs")
      .select("slots, palpite_settings")
      .eq("id", log.config_id)
      .maybeSingle();
    const slot = (cfg?.slots ?? []).find((s: any) => s.id === log.slot_id);
    const r = await resolveMessage(supabase, slot, cfg, apiKey, baseUrl);

    if (!r.content) {
      const ageMs = Date.now() - new Date(log.scheduled_for).getTime();
      if (ageMs < GRACE_MINUTES * 60 * 1000) {
        console.log(
          `[dispatch] log=${log.id} resolução pendente (source=${r.source}) — mantém pending (carência ${Math.round(ageMs / 60000)}min/${GRACE_MINUTES}min)`,
        );
        continue;
      }
      await markFailed(
        supabase,
        log.id,
        `Resolução falhou após carência ${GRACE_MINUTES}min (source=${r.source})`,
      );
      failed++;
      continue;
    }

    log.message_content = r.content;
    await supabase
      .from("group_blast_logs")
      .update({ message_content: r.content, message_source: r.source })
      .eq("id", log.id);

    console.log(`[dispatch] log=${log.id} resolved at send time (source=${r.source})`);

    const { data: candidates, error: candErr } = await selectInstancesForGroup(
      supabase,
      log.group_jid,
    );

    const isExpired =
      new Date(log.scheduled_for).getTime() < Date.now() - 10 * 60 * 1000;

    if (candErr) {
      await markFailed(supabase, log.id, `Erro instâncias: ${candErr.message}`);
      failed++;
      continue;
    }
    if (!candidates || candidates.length === 0) {
      if (isExpired) {
        await markFailed(supabase, log.id, "Nenhuma instância (expirado >10min)");
        failed++;
      } else {
        pendingNoInstance++;
        console.log(`[dispatch] log=${log.id} sem instância — mantém pending`);
      }
      continue;
    }

    const r = await deliverViaCandidates(
      supabase,
      candidates,
      evolutionUrl,
      evolutionKey,
      log.group_jid,
      log.message_content,
    );

    if (r.delivered && r.via) {
      await markSent(supabase, log.id, r.via, r.tried);
      sent++;
    } else {
      await markFailed(
        supabase,
        log.id,
        `Todas as ${candidates.length} instâncias falharam. tried: [${r.tried.join(", ")}] | lastError=${r.lastError}`,
      );
      failed++;
    }
  }

  console.log(`[dispatch] send done: sent=${sent} failed=${failed} no_instance=${pendingNoInstance}`);
  return jsonResponse({
    sent,
    failed,
    skipped_no_instance: pendingNoInstance,
  });
}

/**
 * `action=retry`: reenvio manual de um log `failed`.
 * Reusa message_content; se vazio, regenera via resolver (1x).
 */
export async function handleRetry(
  supabase: any,
  evolutionUrl: string,
  evolutionKey: string,
  logId: string,
): Promise<Response> {
  if (!logId) return jsonResponse({ error: "log_id obrigatório" }, 400);

  const { data: log, error: logErr } = await supabase
    .from("group_blast_logs")
    .select("*")
    .eq("id", logId)
    .maybeSingle();

  if (logErr) return jsonResponse({ error: `Erro: ${logErr.message}` }, 500);
  if (!log) return jsonResponse({ error: "Log não encontrado" }, 404);
  if (log.status !== "failed") {
    return jsonResponse({ error: `Status atual: ${log.status}` }, 400);
  }

  console.log(`[dispatch] retry log=${logId}`);

  const newRetryCount = (log.retry_count ?? 0) + 1;
  const apiKey = Deno.env.get("LOVABLE_API_KEY") ?? "";
  const baseUrl = Deno.env.get("COMMUNITY_BASE_URL") ?? "";

  // 1) Resolve mensagem (reusa se já tiver)
  let messageContent = log.message_content?.trim() ? log.message_content : null;
  let messageSource = log.message_source ?? "reused";

  if (!messageContent) {
    const { data: configData } = await supabase
      .from("group_blast_configs")
      .select("slots, palpite_settings")
      .eq("id", log.config_id)
      .maybeSingle();
    const slots: Slot[] = configData?.slots ?? [];
    const slot = slots.find((s) => s.id === log.slot_id);
    const r = await resolveMessage(supabase, slot, configData, apiKey, baseUrl);
    messageContent = r.content;
    messageSource = r.source;
    if (messageContent) {
      await supabase
        .from("group_blast_logs")
        .update({ message_content: messageContent, message_source: messageSource })
        .eq("id", logId);
    }
  }

  if (!messageContent) {
    await markFailed(
      supabase,
      logId,
      `Retry: mensagem vazia (source=${messageSource})`,
      newRetryCount,
    );
    return jsonResponse({ ok: false, error: "Mensagem vazia" }, 200);
  }

  // 2) Candidatas: instância original primeiro, depois melhores
  const candidates: any[] = [];
  const seen = new Set<string>();

  if (log.instance_id) {
    const { data: orig } = await supabase
      .from("whatsapp_instances")
      .select("id, evolution_instance_id")
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
    await markFailed(
      supabase,
      logId,
      `Retry: erro instâncias: ${bestErr.message}`,
      newRetryCount,
      messageContent,
    );
    return jsonResponse({ ok: false, error: bestErr.message }, 200);
  }
  for (const c of best || []) {
    if (!seen.has(c.instance_id)) {
      candidates.push(c);
      seen.add(c.instance_id);
    }
  }

  if (candidates.length === 0) {
    await markFailed(
      supabase,
      logId,
      "Retry: nenhuma instância disponível",
      newRetryCount,
      messageContent,
    );
    return jsonResponse({ ok: false, error: "Sem instâncias" }, 200);
  }

  const r = await deliverViaCandidates(
    supabase,
    candidates,
    evolutionUrl,
    evolutionKey,
    log.group_jid,
    messageContent,
  );

  if (r.delivered && r.via) {
    await markSent(supabase, logId, r.via, r.tried, newRetryCount);
    return jsonResponse({
      ok: true,
      sent_via: r.via.evolution_instance_id,
      tried: r.tried,
      retry_count: newRetryCount,
    });
  }

  const reason = `Retry: todas falharam. tried: [${r.tried.join(", ")}] | lastError=${r.lastError}`;
  await markFailed(supabase, logId, reason, newRetryCount, messageContent);
  return jsonResponse({ ok: false, error: reason, tried: r.tried, retry_count: newRetryCount }, 200);
}
