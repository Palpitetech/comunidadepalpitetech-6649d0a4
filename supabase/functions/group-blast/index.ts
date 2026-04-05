import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface Slot {
  id: string;
  schedule_times: string[];
  last_scheduled_index: number;
  message_type?: "ai" | "manual" | "palpite";
  message_content?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const EVOLUTION_API_URL = Deno.env.get("EVOLUTION_API_URL");
  const EVOLUTION_API_KEY = Deno.env.get("EVOLUTION_API_KEY");
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const { action, force, config_id, slot_id } = await req.json();

    if (action === "prepare") {
      return await handlePrepare(supabase, { force, config_id });
    } else if (action === "send") {
      return await handleSend(supabase, EVOLUTION_API_URL!, EVOLUTION_API_KEY!);
    } else if (action === "send_now") {
      return await handleSendNow(supabase, config_id, slot_id);
    } else {
      return jsonResponse({ error: `Ação desconhecida: ${action}` }, 400);
    }
  } catch (err: any) {
    console.error("group-blast error:", err);
    return jsonResponse({ error: err.message }, 500);
  }
});

function jsonResponse(body: any, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ─── PREPARE ─────────────────────────────────────────────
async function handlePrepare(
  supabase: any,
  opts: { force?: boolean; config_id?: string }
) {
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
      const now = new Date();

      for (const groupJid of groupJids) {
        let scheduled: Date;

        if (opts.force) {
          scheduled = new Date(Date.now() + 30_000 * (slotIdx + 1));
        } else {
          scheduled = new Date(
            Date.UTC(
              now.getUTCFullYear(),
              now.getUTCMonth(),
              now.getUTCDate(),
              parseInt(hh) + 3, // BRT → UTC
              parseInt(mm),
              0,
              0
            )
          );

          // Check if already scheduled today (by created_at)
          const todayStartUTC = new Date();
          todayStartUTC.setUTCHours(0, 0, 0, 0);
          const todayEndUTC = new Date();
          todayEndUTC.setUTCHours(23, 59, 59, 999);

          const { count } = await supabase
            .from("group_blast_logs")
            .select("id", { count: "exact", head: true })
            .eq("config_id", config.id)
            .eq("slot_id", slot.id)
            .eq("group_jid", groupJid)
            .gte("created_at", todayStartUTC.toISOString())
            .lt("created_at", todayEndUTC.toISOString())
            .neq("status", "failed");

          if ((count ?? 0) > 0) continue; // already scheduled today for this group
        }

        const { error: insertErr } = await supabase
          .from("group_blast_logs")
          .insert({
            config_id: config.id,
            slot_id: slot.id,
            group_jid: groupJid,
            message_content: "",
            scheduled_for: scheduled.toISOString(),
            status: "pending",
          });

        if (insertErr) {
          console.error(
            `Error inserting log for config ${config.id} slot ${slot.id} group ${groupJid}:`,
            insertErr
          );
          continue;
        }

        prepared++;
      }

      // Update last_scheduled_index for this slot
      updatedSlots = updatedSlots.map((s) =>
        s.id === slot.id ? { ...s, last_scheduled_index: nextIndex } : s
      );
    }

    // Persist updated slot indices
    await supabase
      .from("group_blast_configs")
      .update({
        slots: updatedSlots,
        updated_at: new Date().toISOString(),
      })
      .eq("id", config.id);
  }

  return jsonResponse({ prepared });
}

// ─── SEND ────────────────────────────────────────────────
async function handleSend(
  supabase: any,
  evolutionUrl: string,
  evolutionKey: string
) {
  const { data: logs, error: logsErr } = await supabase
    .from("group_blast_logs")
    .select("*")
    .eq("status", "pending")
    .lte("scheduled_for", new Date().toISOString())
    .order("scheduled_for", { ascending: true })
    .limit(5);

  if (logsErr) throw logsErr;
  if (!logs || logs.length === 0) {
    return jsonResponse({ sent: 0, failed: 0, message: "Nenhum pendente" });
  }

  const { data: instances, error: instErr } = await supabase
    .from("whatsapp_instances")
    .select("id, evolution_instance_id, last_message_at")
    .eq("status", "online")
    .order("last_message_at", { ascending: true, nullsFirst: true });

  if (instErr) throw instErr;
  if (!instances || instances.length === 0) {
    console.warn("group-blast send: sem instâncias online");
    return jsonResponse({ skipped: "sem instâncias online" });
  }

  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY") ?? "";
  const BASE_URL = Deno.env.get("COMMUNITY_BASE_URL") ?? "";

  let sent = 0;
  let failed = 0;

  for (let i = 0; i < logs.length; i++) {
    const log = logs[i];
    const instance = instances[i % instances.length];

    try {
      const { data: configData } = await supabase
        .from("group_blast_configs")
        .select("slots")
        .eq("id", log.config_id)
        .maybeSingle();

      const slots: Slot[] = configData?.slots ?? [];
      const slot = slots.find((s: Slot) => s.id === log.slot_id);

      let messageContent: string | null = null;

      if (slot?.message_type === "manual" && slot?.message_content?.trim()) {
        messageContent = slot.message_content.trim();
      } else if (slot?.message_type === "palpite") {
        messageContent = await generatePalpiteMessage(supabase, LOVABLE_API_KEY, BASE_URL);
      } else {
        const { data: latestPost } = await supabase
          .from("postagens")
          .select("id, slug, titulo, conteudo, tipo")
          .neq("tipo", "comentario")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (latestPost) {
          messageContent = await generateAIMessage(
            LOVABLE_API_KEY,
            BASE_URL,
            latestPost
          );
        }

        if (!messageContent) {
          console.warn(
            `[group-blast] Sem post ou IA falhou para log ${log.id}, skip`
          );
          continue;
        }
      }

      if (!messageContent) {
        continue;
      }

      const res = await fetch(
        `${evolutionUrl}/message/sendText/${instance.evolution_instance_id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: evolutionKey,
          },
          body: JSON.stringify({
            number: log.group_jid,
            text: messageContent,
            linkPreview: false,
          }),
        }
      );

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(
          errData?.message || errData?.error || `HTTP ${res.status}`
        );
      }

      await supabase
        .from("group_blast_logs")
        .update({
          status: "sent",
          sent_at: new Date().toISOString(),
          message_content: messageContent,
          instance_id: instance.id,
          evolution_instance_id: instance.evolution_instance_id,
        })
        .eq("id", log.id);

      await supabase
        .from("whatsapp_instances")
        .update({ last_message_at: new Date().toISOString() })
        .eq("id", instance.id);

      sent++;
    } catch (err: any) {
      console.error(`Failed to send log ${log.id}:`, err.message);
      await supabase
        .from("group_blast_logs")
        .update({
          status: "failed",
          error_message: err.message,
        })
        .eq("id", log.id);
      failed++;
    }
  }

  return jsonResponse({ sent, failed });
}

// ─── AI MESSAGE GENERATION ──────────────────────────────
async function generateAIMessage(
  apiKey: string,
  baseUrl: string,
  post: { id: string; slug?: string | null; titulo: string | null; conteudo: string; tipo: string | null }
): Promise<string | null> {
  if (!apiKey) {
    console.error("[group-blast] LOVABLE_API_KEY não configurada");
    return null;
  }

  const postPath = post.slug || post.id;

  const prompt = `Você é assistente de uma comunidade de loterias.
Crie uma mensagem para WhatsApp seguindo EXATAMENTE este formato:

[GANCHO — 1 linha impactante sobre o post]

[RESUMO — máximo 2 linhas diretas sobre o conteúdo do post]

Vamos interagir lá na comunidade, deixe seu comentário lá 👇
${baseUrl}/comunidade/post/${postPath}?utm=grupo

Regras obrigatórias:
- Gancho: 1 linha curta e impactante, desperta curiosidade, sem revelar tudo
- Resumo: máximo 2 linhas, direto ao ponto
- A penúltima linha SEMPRE deve ser exatamente: "Vamos interagir lá na comunidade, deixe seu comentário lá 👇"
- O link SEMPRE na última linha sozinho, sem texto antes dele
- Use 1 emoji no gancho, nenhum no resto (exceto o 👇 do CTA)
- NÃO use saudações como "Olá", "Oi", "Pessoal"
- NÃO use asteriscos ou formatação markdown
- NÃO adicione nada além do formato acima

Título do post: ${post.titulo ?? "Sem título"}
Prévia: ${(post.conteudo ?? "").slice(0, 500)}`;

  try {
    const aiRes = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-lite",
          messages: [
            {
              role: "system",
              content:
                "Você gera mensagens curtas de convite para grupos de WhatsApp sobre posts de uma comunidade de loterias.",
            },
            { role: "user", content: prompt },
          ],
        }),
      }
    );

    if (!aiRes.ok) {
      console.error(
        `[group-blast] AI gateway error: ${aiRes.status}`,
        await aiRes.text()
      );
      return null;
    }

    const aiData = await aiRes.json();
    const content = aiData?.choices?.[0]?.message?.content?.trim();
    return content || null;
  } catch (err: any) {
    console.error("[group-blast] AI generation error:", err.message);
    return null;
  }
}

// ─── SEND NOW (manual per-slot) ─────────────────────────
async function handleSendNow(
  supabase: any,
  config_id?: string,
  slot_id?: string
) {
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

  if (!slot) {
    return jsonResponse({ error: "Slot não encontrado" }, 404);
  }

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
      })
      .select()
      .single();

    if (logError) {
      console.error(`Error inserting send_now log for group ${groupJid}:`, logError.message);
      continue;
    }
    insertedLogs.push(log.id);
  }

  return jsonResponse({
    success: true,
    log_ids: insertedLogs,
    groups_count: groupJids.length,
    scheduled_for: scheduledFor,
    message: `Disparo agendado para ${groupJids.length} grupo(s) em 5 segundos`,
  });
}

// ─── PALPITE LOTOFÁCIL GENERATION ───────────────────────
const MOLDURA_LF = [1, 2, 3, 4, 5, 6, 10, 11, 15, 16, 20, 21, 22, 23, 24, 25];
const PRIMOS_LF = [2, 3, 5, 7, 11, 13, 17, 19, 23];

async function generatePalpiteMessage(
  supabase: any,
  apiKey: string,
  baseUrl: string
): Promise<string | null> {
  if (!apiKey) {
    console.error("[group-blast] LOVABLE_API_KEY não configurada");
    return null;
  }

  // Fetch last 5 results (same source as Gerador)
  const { data: resultados, error: resErr } = await supabase
    .from("resultados_loterias")
.eq("loteria", "lotofacil")
.select("concurso_id:concurso, data_sorteio, dezenas")
    .order("concurso", { ascending: false })
    .limit(5);

  if (resErr || !resultados || resultados.length === 0) {
    console.error("[group-blast] Erro ao buscar resultados:", resErr?.message);
    return null;
  }

  // Calculate stats
  const freq: Record<number, number> = {};
  for (let d = 1; d <= 25; d++) freq[d] = 0;
  for (const r of resultados) {
    for (const d of r.dezenas) freq[d]++;
  }

  const quentes = Object.entries(freq)
    .filter(([, v]) => v >= 3)
    .map(([k]) => Number(k))
    .sort((a, b) => a - b);
  const frias = Object.entries(freq)
    .filter(([, v]) => v <= 1)
    .map(([k]) => Number(k))
    .sort((a, b) => a - b);

  const avgPares = resultados.reduce((s: number, r: any) => s + r.dezenas.filter((d: number) => d % 2 === 0).length, 0) / resultados.length;
  const avgMoldura = resultados.reduce((s: number, r: any) => s + r.dezenas.filter((d: number) => MOLDURA_LF.includes(d)).length, 0) / resultados.length;
  const avgPrimos = resultados.reduce((s: number, r: any) => s + r.dezenas.filter((d: number) => PRIMOS_LF.includes(d)).length, 0) / resultados.length;

  const concursoMin = resultados[resultados.length - 1].concurso_id;
  const concursoMax = resultados[0].concurso_id;

  const statsText = `Últimos 5 concursos (${concursoMin} a ${concursoMax}):
- Dezenas quentes (≥3 aparições): ${quentes.join(", ") || "nenhuma"}
- Dezenas frias (≤1 aparição): ${frias.join(", ") || "nenhuma"}  
- Média pares: ${avgPares.toFixed(1)} | Média moldura: ${avgMoldura.toFixed(1)} | Média primos: ${avgPrimos.toFixed(1)}
- Resultados: ${resultados.map((r: any) => `C${r.concurso_id}: [${r.dezenas.sort((a: number, b: number) => a - b).join(",")}]`).join(" | ")}`;

  const prompt = `Você é um especialista em Lotofácil.
Baseado na análise estatística dos 5 últimos concursos, gere EXATAMENTE 15 jogos de 15 dezenas cada (1 a 25).

${statsText}

Regras obrigatórias para os jogos:
- Cada jogo deve ter EXATAMENTE 15 dezenas únicas de 1 a 25
- Priorize dezenas quentes mas distribua frias para equilíbrio
- Mantenha entre 7-8 pares por jogo
- Mantenha entre 9-11 dezenas de moldura por jogo
- Todos os 15 jogos devem ser diferentes entre si
- Ordene as dezenas de cada jogo em ordem crescente
- Formate cada dezena com 2 dígitos (01, 02, ... 25)

Responda EXATAMENTE neste formato (sem explicação extra):
ESTRATEGIA: [resumo de 2 linhas da estratégia usada, mencionando os concursos analisados]
JOGO01: 01-02-03-04-05-06-07-08-09-10-11-12-13-14-15
JOGO02: ...
...
JOGO15: ...`;

  try {
    const aiRes = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "system",
              content: "Você gera palpites de Lotofácil com base em análise estatística. Siga o formato pedido rigorosamente.",
            },
            { role: "user", content: prompt },
          ],
        }),
      }
    );

    if (!aiRes.ok) {
      console.error(`[group-blast] AI palpite error: ${aiRes.status}`, await aiRes.text());
      return null;
    }

    const aiData = await aiRes.json();
    const rawContent = aiData?.choices?.[0]?.message?.content?.trim();
    if (!rawContent) return null;

    // Parse response
    const lines = rawContent.split("\n").map((l: string) => l.trim()).filter((l: string) => l);
    
    let estrategia = "";
    const jogos: string[] = [];

    for (const line of lines) {
      if (line.toUpperCase().startsWith("ESTRATEGIA:") || line.toUpperCase().startsWith("ESTRATÉGIA:")) {
        estrategia = line.replace(/^ESTRAT[EÉ]GIA:\s*/i, "").trim();
      } else if (/^JOGO\d{1,2}:/i.test(line)) {
        const nums = line.replace(/^JOGO\d{1,2}:\s*/i, "").trim();
        // Validate: must have 15 numbers
        const dezenas = nums.split(/[-,\s]+/).map(Number).filter(n => n >= 1 && n <= 25);
        const unique = [...new Set(dezenas)];
        if (unique.length === 15) {
          jogos.push(unique.sort((a, b) => a - b).map(d => String(d).padStart(2, "0")).join("-"));
        }
      }
    }

    if (jogos.length < 10) {
      console.error(`[group-blast] IA retornou apenas ${jogos.length} jogos válidos`);
      return null;
    }

    // Format WhatsApp message
    const linkUrl = `${baseUrl}/lotofacil`;
    let msg = `🎰 *Palpites Lotofácil — Concurso ${concursoMax + 1}*\n\n`;
    msg += `📊 *Estratégia baseada nos 5 últimos concursos (${concursoMin} a ${concursoMax}):*\n`;
    msg += `${estrategia || `Análise de frequência: quentes [${quentes.join(",")}], frias [${frias.join(",")}]`}\n\n`;

    for (let i = 0; i < jogos.length; i++) {
      msg += `🎯 Jogo ${String(i + 1).padStart(2, "0")}: ${jogos[i]}\n`;
    }

    msg += `\nBoa sorte! 🍀\nMais análises na comunidade 👇\n${linkUrl}?utm=grupo`;

    return msg;
  } catch (err: any) {
    console.error("[group-blast] Palpite generation error:", err.message);
    return null;
  }
}
