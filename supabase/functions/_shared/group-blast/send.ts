import { jsonResponse } from "../whatsapp-utils.ts";
import { generateAIMessage } from "./ai-message.ts";
import { generatePalpiteMessage } from "./palpite-message.ts";
import {
  getBlastLotteryConfig,
  type BlastLoteria,
} from "./lottery-config.ts";
import type { PalpiteSettingsByLoteria, Slot } from "./types.ts";

interface ConfigData {
  slots: Slot[];
  /** Legacy — usado como fallback Lotofácil */
  include_palpites: boolean;
  /** Legacy — usado como fallback Lotofácil */
  vip_group_link: string | null;
  /** Novo: configuração por loteria */
  palpite_settings?: PalpiteSettingsByLoteria | null;
}

interface ResolvedMessage {
  content: string | null;
  source: string;
}

function resolvePalpiteSettings(
  configData: ConfigData | null,
  loteria: BlastLoteria,
): { include_palpites: boolean; vip_group_link: string | null } {
  const perLot = configData?.palpite_settings?.[loteria];
  if (perLot && typeof perLot.include_palpites === "boolean") {
    return {
      include_palpites: perLot.include_palpites,
      vip_group_link: perLot.vip_group_link ?? null,
    };
  }
  // Fallback legacy: aplica somente para Lotofácil (configs antigas)
  if (loteria === "lotofacil") {
    return {
      include_palpites: configData?.include_palpites ?? true,
      vip_group_link: configData?.vip_group_link ?? null,
    };
  }
  // Sem config para esta loteria → defaults seguros
  return { include_palpites: true, vip_group_link: null };
}

/**
 * Decide qual mensagem enviar para um log com base no slot/config.
 * Para slot tipo "palpite" e a geração falhar, faz fallback para IA da mesma loteria.
 */
export async function resolveMessageContent(
  supabase: any,
  log: any,
  slot: Slot | undefined,
  configData: ConfigData | null,
  apiKey: string,
  baseUrl: string,
): Promise<ResolvedMessage> {
  if (slot?.message_type === "manual" && slot?.message_content?.trim()) {
    return { content: slot.message_content.trim(), source: "manual" };
  }

  const loteria: BlastLoteria = (slot?.loteria as BlastLoteria) ?? "lotofacil";
  const lotCfg = getBlastLotteryConfig(loteria);

  if (slot?.message_type === "palpite") {
    const { include_palpites, vip_group_link } = resolvePalpiteSettings(
      configData,
      loteria,
    );
    const content = await generatePalpiteMessage(
      supabase,
      apiKey,
      baseUrl,
      { loteria, includePalpites: include_palpites, vipGroupLink: vip_group_link },
    );
    if (content && content.trim()) {
      return { content, source: `palpite:${loteria}` };
    }

    console.warn(
      `[send] Palpite (${loteria}) falhou para log ${log.id}, fallback para IA do último post`,
    );
    const latestPost = await fetchLatestPost(supabase, lotCfg.loteriaTag);
    if (!latestPost) return { content: null, source: `palpite:${loteria}→no_post` };
    const aiContent = await generateAIMessage(
      supabase,
      apiKey,
      baseUrl,
      latestPost,
      loteria,
    );
    return { content: aiContent, source: `palpite:${loteria}→ai_fallback` };
  }

  // Default: IA do último post da loteria
  const latestPost = await fetchLatestPost(supabase, lotCfg.loteriaTag);
  if (!latestPost) return { content: null, source: `ai:${loteria}→no_post` };
  const content = await generateAIMessage(
    supabase,
    apiKey,
    baseUrl,
    latestPost,
    loteria,
  );
  return { content, source: `ai:${loteria}` };
}

async function fetchLatestPost(supabase: any, loteriaTag?: string) {
  let query = supabase
    .from("postagens")
    .select("id, slug, titulo, conteudo, tipo")
    .neq("tipo", "comentario")
    .eq("status", "publicado")
    .order("created_at", { ascending: false })
    .limit(1);
  if (loteriaTag) query = query.eq("loteria_tag", loteriaTag);
  const { data } = await query.maybeSingle();
  return data;
}


interface SendAttempt {
  ok: boolean;
  error?: string;
  status?: number | string;
}

// ============================================================
// Funções pequenas e testáveis
// ============================================================

async function fetchPendingLogs(supabase: any) {
  const { data, error } = await supabase
    .from("group_blast_logs")
    .select("*")
    .eq("status", "pending")
    .lte("scheduled_for", new Date().toISOString())
    .order("scheduled_for", { ascending: true })
    .limit(5);
  if (error) throw error;
  return data || [];
}

export async function selectInstancesForGroup(supabase: any, groupJid: string) {
  return await supabase.rpc("select_best_instances", {
    p_limit: 5,
    p_group_jid: groupJid,
  });
}

/**
 * Tenta entregar uma mensagem por uma instância:
 * 1) Confere connectionState (skip se != "open")
 * 2) Envia sendText
 * 3) Em qualquer falha, marca cooldown via last_message_at
 */
export async function dispatchToEvolution(
  supabase: any,
  instance: any,
  evolutionUrl: string,
  evolutionKey: string,
  log: any,
  messageContent: string,
): Promise<SendAttempt> {
  const evoName = instance.evolution_instance_id;

  // 1) Sanity-check do connectionState (best-effort)
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
  } catch (stateErr: any) {
    console.warn(
      `[send] state-check falhou para ${evoName}: ${stateErr.message}`,
    );
  }

  // 2) sendText
  try {
    const res = await fetch(
      `${evolutionUrl}/message/sendText/${evoName}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: evolutionKey },
        body: JSON.stringify({
          number: log.group_jid,
          text: messageContent,
          linkPreview: false,
        }),
      },
    );

    const body = await res.json().catch(() => null);

    if (!res.ok || !body?.key?.id) {
      const reason = body?.message ?? body?.error ?? `HTTP ${res.status}`;
      await supabase
        .from("whatsapp_instances")
        .update({ last_message_at: new Date().toISOString() })
        .eq("id", instance.instance_id);
      return {
        ok: false,
        status: res.status,
        error: String(reason).slice(0, 200),
      };
    }

    return { ok: true };
  } catch (sendErr: any) {
    const errMsg = sendErr?.message ?? String(sendErr);
    await supabase
      .from("whatsapp_instances")
      .update({ last_message_at: new Date().toISOString() })
      .eq("id", instance.instance_id);
    return { ok: false, status: "exc", error: errMsg };
  }
}

async function markLogSuccess(
  supabase: any,
  log: any,
  instance: any,
  messageContent: string,
  tried: string[],
) {
  await supabase
    .from("group_blast_logs")
    .update({
      status: "sent",
      sent_at: new Date().toISOString(),
      message_content: messageContent,
      instance_id: instance.instance_id,
      evolution_instance_id: instance.evolution_instance_id,
      error_message: tried.length > 1 ? `tried: [${tried.join(", ")}]` : null,
    })
    .eq("id", log.id);

  await supabase.rpc("register_instance_usage", {
    p_instance_id: instance.instance_id,
  });
}

async function markLogFailed(
  supabase: any,
  log: any,
  reason: string,
  messageContent?: string | null,
) {
  const update: any = {
    status: "failed",
    error_message: reason,
    last_error_at: new Date().toISOString(),
    retry_count: (log.retry_count ?? 0),
  };
  // Persiste content se já foi resolvido para o retry não recalcular IA
  if (messageContent && messageContent.trim().length > 0) {
    update.message_content = messageContent;
  }
  await supabase
    .from("group_blast_logs")
    .update(update)
    .eq("id", log.id);
}

// ============================================================
// Orquestrador principal
// ============================================================

export async function handleSend(
  supabase: any,
  evolutionUrl: string,
  evolutionKey: string,
): Promise<Response> {
  const logs = await fetchPendingLogs(supabase);

  if (logs.length === 0) {
    console.log(`[send] boot: 0 pendentes`);
    return jsonResponse({ sent: 0, failed: 0, message: "Nenhum pendente" });
  }

  const apiKey = Deno.env.get("LOVABLE_API_KEY") ?? "";
  const baseUrl = Deno.env.get("COMMUNITY_BASE_URL") ?? "";

  console.log(
    `[send] boot: ${logs.length} pendente(s) — ids=${
      logs.map((l: any) => l.id).join(",")
    }`,
  );

  let sent = 0;
  let failed = 0;
  let skippedCooldown = 0;

  for (const log of logs) {
    // 1) Resolver mensagem (1x por log)
    const { data: configData } = await supabase
      .from("group_blast_configs")
      .select("slots, include_palpites, vip_group_link")
      .eq("id", log.config_id)
      .maybeSingle();

    const slots: Slot[] = configData?.slots ?? [];
    const slot = slots.find((s: Slot) => s.id === log.slot_id);

    const { content: messageContent, source } = await resolveMessageContent(
      supabase,
      log,
      slot,
      configData,
      apiKey,
      baseUrl,
    );

    if (!messageContent || messageContent.trim().length === 0) {
      const reason = `Mensagem vazia (slot.message_type=${
        slot?.message_type ?? "n/a"
      }, source=${source}, value=${messageContent === null ? "null" : "empty"})`;
      console.error(`[send] ${reason} — log ${log.id}`);
      await markLogFailed(supabase, log, reason);
      failed++;
      continue;
    }

    // 2) Resolver candidatas
    const { data: candidates, error: candErr } = await selectInstancesForGroup(
      supabase,
      log.group_jid,
    );

    const isExpired =
      new Date(log.scheduled_for).getTime() < Date.now() - 10 * 60 * 1000;

    if (candErr) {
      const reason = `Erro ao buscar instâncias: ${candErr.message}`;
      console.error(`[send] log=${log.id} ${reason}`);
      await markLogFailed(supabase, log, reason, messageContent);
      failed++;
      continue;
    }

    if (!candidates || candidates.length === 0) {
      if (isExpired) {
        const reason = "Nenhuma instância disponível (expirado, >10min)";
        console.error(`[send] log=${log.id} ${reason}`);
        await markLogFailed(supabase, log, reason, messageContent);
        failed++;
      } else {
        // mantém pending — próximo ciclo do cron tenta de novo
        skippedCooldown++;
        console.log(
          `[send] log=${log.id} sem instância — mantém pending (dentro da janela de 10min)`,
        );
      }
      continue;
    }

    // 3) Loop de fallback ao vivo
    const tried: string[] = [];
    let delivered = false;
    let lastError = "";

    for (let c = 0; c < candidates.length; c++) {
      const instance = candidates[c];
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
        console.warn(`[send] log=${log.id} attempt=${c + 1} ${tag}`);
        continue;
      }

      tried.push(`${evoName}→ok`);
      console.log(`[send] log=${log.id} attempt=${c + 1} ${evoName} → sent ok`);
      await markLogSuccess(supabase, log, instance, messageContent, tried);
      sent++;
      delivered = true;
      break;
    }

    if (!delivered) {
      const finalReason = `Todas as ${candidates.length} instâncias falharam. tried: [${
        tried.join(", ")
      }] | lastError=${lastError}`;
      console.error(`[send] log=${log.id} ${finalReason}`);
      await markLogFailed(supabase, log, finalReason, messageContent);
      failed++;
    }
  }

  // Stuck-message warning
  const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
  const { count: stuckCount } = await supabase
    .from("group_blast_logs")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending")
    .lt("scheduled_for", thirtyMinAgo);

  if (stuckCount && stuckCount > 0) {
    console.warn(
      `[send] ⚠️ ${stuckCount} mensagem(s) presa(s) há mais de 30 min`,
    );
  }

  console.log(
    `[send] result: sent=${sent} failed=${failed} skipped=${skippedCooldown} stuck=${
      stuckCount ?? 0
    }`,
  );
  return jsonResponse({
    sent,
    failed,
    skipped_cooldown: skippedCooldown,
    stuck_messages: stuckCount ?? 0,
  });
}
