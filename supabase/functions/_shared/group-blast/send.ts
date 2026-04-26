import { jsonResponse } from "../whatsapp-utils.ts";
import { generateAIMessage } from "./ai-message.ts";
import { generatePalpiteMessage } from "./palpite-message.ts";
import type { Slot } from "./types.ts";

interface ConfigData {
  slots: Slot[];
  include_palpites: boolean;
  vip_group_link: string | null;
}

interface ResolvedMessage {
  content: string | null;
  source: string;
}

/**
 * Decide qual mensagem enviar para um log com base no slot/config.
 * Para slot tipo "palpite" e a geração falhar, faz fallback para IA.
 */
async function resolveMessageContent(
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

  if (slot?.message_type === "palpite") {
    const includePalpites = configData?.include_palpites ?? true;
    const vipGroupLink = configData?.vip_group_link || null;
    const content = await generatePalpiteMessage(
      supabase,
      apiKey,
      baseUrl,
      includePalpites,
      vipGroupLink,
    );
    if (content && content.trim()) {
      return { content, source: "palpite" };
    }

    console.warn(
      `[send] Palpite falhou para log ${log.id}, fallback para IA do último post`,
    );
    const latestPost = await fetchLatestPost(supabase);
    if (!latestPost) return { content: null, source: "palpite→no_post" };
    const aiContent = await generateAIMessage(supabase, apiKey, baseUrl, latestPost);
    return { content: aiContent, source: "palpite→ai_fallback" };
  }

  // Default: IA do último post
  const latestPost = await fetchLatestPost(supabase);
  if (!latestPost) return { content: null, source: "ai→no_post" };
  const content = await generateAIMessage(supabase, apiKey, baseUrl, latestPost);
  return { content, source: "ai" };
}

async function fetchLatestPost(supabase: any) {
  const { data } = await supabase
    .from("postagens")
    .select("id, slug, titulo, conteudo, tipo")
    .neq("tipo", "comentario")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}

interface SendAttempt {
  ok: boolean;
  error?: string;
  status?: number | string;
}

/**
 * Tenta entregar uma mensagem por uma instância:
 * 1) Confere connectionState (skip se != "open")
 * 2) Envia sendText
 * 3) Em qualquer falha, marca cooldown via last_message_at
 */
async function attemptSendThroughInstance(
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
    // Não bloqueia
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

    // Sucesso real exige HTTP 2xx + body com key.id (messageId da Evolution)
    if (!res.ok || !body?.key?.id) {
      const reason =
        body?.message ?? body?.error ?? `HTTP ${res.status}`;
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

/**
 * Loop principal de envio (chamado pelo cron).
 * - Pega até 5 logs pendentes
 * - Resolve mensagem UMA vez por log (independente de instância)
 * - Tenta até 5 instâncias diferentes via select_best_instances + fallback ao vivo
 * - Telemetria detalhada em error_message via tried[]
 */
export async function handleSend(
  supabase: any,
  evolutionUrl: string,
  evolutionKey: string,
): Promise<Response> {
  const { data: logs, error: logsErr } = await supabase
    .from("group_blast_logs")
    .select("*")
    .eq("status", "pending")
    .lte("scheduled_for", new Date().toISOString())
    .order("scheduled_for", { ascending: true })
    .limit(5);

  if (logsErr) throw logsErr;
  if (!logs || logs.length === 0) {
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
    // 1) Resolver mensagem (1x por log, independente da instância)
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
      await supabase
        .from("group_blast_logs")
        .update({ status: "failed", error_message: reason })
        .eq("id", log.id);
      failed++;
      continue;
    }

    // 2) Resolver candidatas no ato (filtradas por pertencimento ao grupo)
    const { data: candidates, error: candErr } = await supabase.rpc(
      "select_best_instances",
      { p_limit: 5, p_group_jid: log.group_jid },
    );

    if (candErr || !candidates || candidates.length === 0) {
      const reason = candErr
        ? `Erro ao buscar instâncias: ${candErr.message}`
        : "Nenhuma instância disponível para este grupo";
      console.error(`[send] log=${log.id} ${reason}`);
      await supabase
        .from("group_blast_logs")
        .update({ status: "failed", error_message: reason })
        .eq("id", log.id);
      failed++;
      continue;
    }

    // 3) Loop de fallback ao vivo
    const tried: string[] = [];
    let delivered = false;
    let lastError = "";

    for (let c = 0; c < candidates.length; c++) {
      const instance = candidates[c];
      const evoName = instance.evolution_instance_id;
      const attempt = await attemptSendThroughInstance(
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

      // Sucesso
      tried.push(`${evoName}→ok`);
      console.log(`[send] log=${log.id} attempt=${c + 1} ${evoName} → sent ok`);

      await supabase
        .from("group_blast_logs")
        .update({
          status: "sent",
          sent_at: new Date().toISOString(),
          message_content: messageContent,
          instance_id: instance.instance_id,
          evolution_instance_id: evoName,
          error_message: tried.length > 1 ? `tried: [${tried.join(", ")}]` : null,
        })
        .eq("id", log.id);

      await supabase.rpc("register_instance_usage", {
        p_instance_id: instance.instance_id,
      });

      sent++;
      delivered = true;
      break;
    }

    if (!delivered) {
      const finalReason = `Todas as ${candidates.length} instâncias falharam. tried: [${
        tried.join(", ")
      }] | lastError=${lastError}`;
      console.error(`[send] log=${log.id} ${finalReason}`);
      await supabase
        .from("group_blast_logs")
        .update({ status: "failed", error_message: finalReason })
        .eq("id", log.id);
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
