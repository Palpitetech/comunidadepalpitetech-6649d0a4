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

  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY") ?? "";
  const BASE_URL = Deno.env.get("COMMUNITY_BASE_URL") ?? "";

  let sent = 0;
  let failed = 0;
  let skippedCooldown = 0;

  for (let i = 0; i < logs.length; i++) {
    const log = logs[i];

    // Use centralized function to pick best available instance
    const { data: bestInstance, error: biErr } = await supabase.rpc("select_best_instance");
    if (biErr || !bestInstance || bestInstance.length === 0) {
      console.warn(`[group-blast] Nenhuma instância disponível (cooldown/limite) para log ${log.id}, adiando`);
      skippedCooldown++;
      continue;
    }
    const instance = bestInstance[0];

    try {
      const { data: configData } = await supabase
        .from("group_blast_configs")
        .select("slots, include_palpites, vip_group_link")
        .eq("id", log.config_id)
        .maybeSingle();

      const slots: Slot[] = configData?.slots ?? [];
      const slot = slots.find((s: Slot) => s.id === log.slot_id);

      let messageContent: string | null = null;

      if (slot?.message_type === "manual" && slot?.message_content?.trim()) {
        messageContent = slot.message_content.trim();
      } else if (slot?.message_type === "palpite") {
        const includePalpites = configData?.include_palpites ?? true;
        const vipGroupLink = configData?.vip_group_link || null;
        messageContent = await generatePalpiteMessage(supabase, LOVABLE_API_KEY, BASE_URL, includePalpites, vipGroupLink);
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
          instance_id: instance.instance_id,
          evolution_instance_id: instance.evolution_instance_id,
        })
        .eq("id", log.id);

      // Centralized usage registration (updates last_message_at + messages_sent_today)
      await supabase.rpc("register_instance_usage", { p_instance_id: instance.instance_id });

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

  return jsonResponse({ sent, failed, skipped_cooldown: skippedCooldown });
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

// ─── PALPITE LOTOFÁCIL GENERATION (RICH — same level as Gerador) ───
const MOLDURA_LF = [1, 2, 3, 4, 5, 6, 10, 11, 15, 16, 20, 21, 22, 23, 24, 25];
const PRIMOS_LF = [2, 3, 5, 7, 11, 13, 17, 19, 23];
const PERIODO_ANALISE = 5;

async function generatePalpiteMessage(
  supabase: any,
  apiKey: string,
  baseUrl: string,
  includePalpites: boolean = true,
  vipGroupLink: string | null = null
): Promise<string | null> {
  if (!apiKey) {
    console.error("[group-blast] LOVABLE_API_KEY não configurada");
    return null;
  }

  // Fetch last N results with ALL statistical fields (same as Gerador)
  const { data: resultados, error: resErr } = await supabase
    .from("resultados_loterias")
    .select("concurso_id:concurso, data_sorteio, dezenas, qtd_pares, qtd_impares, qtd_moldura, qtd_primos, qtd_repetidas, ciclo_numero, dezenas_faltantes_ciclo")
    .eq("loteria", "lotofacil")
    .order("concurso", { ascending: false })
    .limit(PERIODO_ANALISE);

  if (resErr || !resultados || resultados.length === 0) {
    console.error("[group-blast] Erro ao buscar resultados:", resErr?.message);
    return null;
  }

  // Calculate frequencies (same as Gerador)
  const freq: Record<number, number> = {};
  for (let d = 1; d <= 25; d++) freq[d] = 0;
  for (const r of resultados) {
    for (const d of r.dezenas) freq[d]++;
  }

  const dezenasMaisFrequentes = Object.entries(freq)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, 10)
    .map(([d]) => parseInt(d));

  const dezenasMenosFrequentes = Object.entries(freq)
    .sort(([, a], [, b]) => (a as number) - (b as number))
    .slice(0, 10)
    .map(([d]) => parseInt(d));

  const ultimoResultado = resultados[0];
  const dezenasFaltantesCiclo = ultimoResultado.dezenas_faltantes_ciclo || [];

  // Calculate averages (same as Gerador)
  const mediaPares = resultados.reduce((acc: number, r: any) => acc + (r.qtd_pares || 0), 0) / resultados.length;
  const mediaMoldura = resultados.reduce((acc: number, r: any) => acc + (r.qtd_moldura || 0), 0) / resultados.length;
  const mediaPrimos = resultados.reduce((acc: number, r: any) => acc + (r.qtd_primos || 0), 0) / resultados.length;
  const mediaRepetidas = resultados.reduce((acc: number, r: any) => acc + (r.qtd_repetidas || 0), 0) / resultados.length;

  const concursoMin = resultados[resultados.length - 1].concurso_id;
  const concursoMax = resultados[0].concurso_id;
  const pad = (d: number) => d.toString().padStart(2, "0");

  // Build rich statistical context (same as Gerador)
  const contextoEstatistico = `
ANÁLISE DOS ÚLTIMOS ${PERIODO_ANALISE} CONCURSOS DA LOTOFÁCIL:

ÚLTIMO RESULTADO (Concurso ${ultimoResultado.concurso_id}):
- Dezenas sorteadas: ${ultimoResultado.dezenas.map(pad).join(", ")}
- Pares: ${ultimoResultado.qtd_pares} | Ímpares: ${ultimoResultado.qtd_impares}
- Moldura: ${ultimoResultado.qtd_moldura} | Primos: ${ultimoResultado.qtd_primos}
- Ciclo atual: ${ultimoResultado.ciclo_numero}
- Dezenas faltantes no ciclo: ${dezenasFaltantesCiclo.length > 0 ? dezenasFaltantesCiclo.map(pad).join(", ") : "Nenhuma (ciclo completo)"}

FREQUÊNCIAS NOS ÚLTIMOS ${PERIODO_ANALISE} JOGOS:
- Dezenas mais sorteadas: ${dezenasMaisFrequentes.map(d => `${pad(d)} (${freq[d]}x)`).join(", ")}
- Dezenas menos sorteadas: ${dezenasMenosFrequentes.map(d => `${pad(d)} (${freq[d]}x)`).join(", ")}

MÉDIAS HISTÓRICAS (${PERIODO_ANALISE} concursos):
- Média de pares por jogo: ${mediaPares.toFixed(1)}
- Média de dezenas na moldura: ${mediaMoldura.toFixed(1)}
- Média de números primos: ${mediaPrimos.toFixed(1)}
- Média de dezenas repetidas: ${mediaRepetidas.toFixed(1)}

DEFINIÇÕES:
- Moldura: dezenas nas bordas do volante [01-06, 10, 11, 15, 16, 20-25]
- Primos: [02, 03, 05, 07, 11, 13, 17, 19, 23]
- Pares: dezenas divisíveis por 2
- Repetidas: dezenas que saíram no concurso anterior
`;

  const systemPrompt = `Você é um especialista em análise estatística da Lotofácil.

REGRAS OBRIGATÓRIAS:
1. Cada jogo DEVE ter EXATAMENTE 15 dezenas únicas de 01 a 25
2. Diversifique as estratégias entre os jogos
3. Considere o equilíbrio histórico nas suas escolhas
4. Inclua pelo menos algumas dezenas faltantes do ciclo quando disponíveis
5. NUNCA prometa vitória - loteria é probabilidade
6. Seja didático e acessível na explicação

Você deve usar a função generate_palpites para retornar os jogos estruturados.`;

  const userPrompt = `${contextoEstatistico}
Com base nesta análise, gere 15 jogos de Lotofácil com EXATAMENTE 15 dezenas cada.

Para cada jogo, utilize uma abordagem diferente:
- Jogo 1-3: Foco nas dezenas quentes (mais frequentes)
- Jogo 4-6: Equilíbrio entre quentes e frias
- Jogo 7-9: Foco nas dezenas faltantes do ciclo
- Jogo 10-15: Combinações estratégicas variadas

Explique brevemente a estratégia geral utilizada, citando dados específicos dos concursos analisados.`;

  try {
    // Use tool calling (same as Gerador) for structured output
    const aiRes = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "generate_palpites",
                description: "Gera palpites estruturados para a Lotofácil com explicação detalhada da estratégia",
                parameters: {
                  type: "object",
                  properties: {
                    jogos: {
                      type: "array",
                      description: "Lista de 15 jogos gerados, cada um com exatamente 15 dezenas",
                      items: {
                        type: "object",
                        properties: {
                          dezenas: {
                            type: "array",
                            description: "Array com exatamente 15 dezenas únicas de 1 a 25",
                            items: { type: "integer", minimum: 1, maximum: 25 },
                          },
                        },
                        required: ["dezenas"],
                      },
                    },
                    estrategia: {
                      type: "object",
                      description: "Detalhes estruturados da estratégia utilizada",
                      properties: {
                        ferramentas: {
                          type: "array",
                          description: "Lista de ferramentas/metodologias utilizadas (ex: Análise de Frequência, Ciclos, Padrões Históricos)",
                          items: { type: "string" },
                        },
                        dezenas_fixas: {
                          type: "array",
                          description: "Dezenas que foram priorizadas na geração e o motivo",
                          items: {
                            type: "object",
                            properties: {
                              dezenas: { type: "array", items: { type: "integer" } },
                              motivo: { type: "string" },
                            },
                          },
                        },
                        dezenas_evitadas: {
                          type: "array",
                          description: "Dezenas que foram evitadas e o motivo",
                          items: {
                            type: "object",
                            properties: {
                              dezenas: { type: "array", items: { type: "integer" } },
                              motivo: { type: "string" },
                            },
                          },
                        },
                        filtros_aplicados: {
                          type: "array",
                          description: "Filtros de padrões aplicados (ex: equilíbrio par/ímpar, distribuição na moldura)",
                          items: {
                            type: "object",
                            properties: {
                              filtro: { type: "string" },
                              valor_alvo: { type: "string" },
                              motivo: { type: "string" },
                            },
                          },
                        },
                        conclusao: {
                          type: "string",
                          description: "Resumo final da estratégia em 2-3 frases",
                        },
                      },
                      required: ["ferramentas", "filtros_aplicados", "conclusao"],
                    },
                  },
                  required: ["jogos", "estrategia"],
                },
              },
            },
          ],
          tool_choice: { type: "function", function: { name: "generate_palpites" } },
        }),
      }
    );

    if (!aiRes.ok) {
      console.error(`[group-blast] AI palpite error: ${aiRes.status}`, await aiRes.text());
      return null;
    }

    const aiData = await aiRes.json();
    const toolCall = aiData?.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      console.error("[group-blast] AI returned no tool call");
      return null;
    }

    const palpitesData = JSON.parse(toolCall.function.arguments);
    const estrategia = palpitesData.estrategia;

    // Validate games
    const jogosValidos: string[] = [];
    for (const jogo of palpitesData.jogos || []) {
      const dezenas = (jogo.dezenas || [])
        .map((d: number) => Math.round(d))
        .filter((d: number) => d >= 1 && d <= 25);
      const unique = [...new Set(dezenas)];
      if (unique.length >= 15) {
        jogosValidos.push(
          unique.slice(0, 15).sort((a: number, b: number) => a - b).map((d: number) => pad(d)).join("-")
        );
      }
    }

    if (jogosValidos.length < 10) {
      console.error(`[group-blast] IA retornou apenas ${jogosValidos.length} jogos válidos`);
      return null;
    }

    // ─── Format rich WhatsApp message ───
    const linkUrl = `${baseUrl}/lotofacil`;
    let msg = `🎰 *Palpites Lotofácil — Concurso ${concursoMax + 1}*\n\n`;
    msg += `📊 *Análise baseada nos concursos ${concursoMin} a ${concursoMax}*\n\n`;

    // Ferramentas
    if (estrategia?.ferramentas?.length > 0) {
      msg += `🔧 *Ferramentas utilizadas:*\n`;
      for (const f of estrategia.ferramentas) {
        msg += `  • ${f}\n`;
      }
      msg += `\n`;
    }

    // Dezenas Priorizadas
    if (estrategia?.dezenas_fixas?.length > 0) {
      msg += `✅ *Dezenas Priorizadas:*\n`;
      for (const item of estrategia.dezenas_fixas) {
        const nums = (item.dezenas || []).map(pad).join(", ");
        msg += `  • ${nums} — ${item.motivo}\n`;
      }
      msg += `\n`;
    }

    // Dezenas Evitadas
    if (estrategia?.dezenas_evitadas?.length > 0) {
      msg += `❌ *Dezenas Evitadas:*\n`;
      for (const item of estrategia.dezenas_evitadas) {
        const nums = (item.dezenas || []).map(pad).join(", ");
        msg += `  • ${nums} — ${item.motivo}\n`;
      }
      msg += `\n`;
    }

    // Filtros Aplicados
    if (estrategia?.filtros_aplicados?.length > 0) {
      msg += `🎯 *Filtros Aplicados:*\n`;
      for (const f of estrategia.filtros_aplicados) {
        msg += `  • ${f.filtro}${f.valor_alvo ? ` → ${f.valor_alvo}` : ""}\n`;
        if (f.motivo) msg += `    ${f.motivo}\n`;
      }
      msg += `\n`;
    }

    // Conclusão
    if (estrategia?.conclusao) {
      msg += `💡 *Conclusão:*\n${estrategia.conclusao}\n\n`;
    }

    if (includePalpites) {
      // Modo COM palpites: lista os jogos
      for (let i = 0; i < jogosValidos.length; i++) {
        msg += `🎯 Jogo ${String(i + 1).padStart(2, "0")}: ${jogosValidos[i]}\n`;
      }
      msg += `\nBoa sorte! 🍀\nMais análises na comunidade 👇\n${linkUrl}?utm=grupo`;
    } else {
      // Modo SEM palpites: CTA para grupo VIP
      msg += `━━━━━━━━━━━━━━━━━━━━\n`;
      msg += `🎯 *QUER RECEBER OS PALPITES?*\n\n`;
      msg += `Os 15 jogos baseados nessa estratégia são enviados diariamente no *Grupo VIP*.\n\n`;
      if (vipGroupLink) {
        msg += `👉 *Entre agora:* ${vipGroupLink}\n`;
      } else {
        msg += `👉 Fale com a gente para entrar no Grupo VIP!\n`;
      }
      msg += `━━━━━━━━━━━━━━━━━━━━\n`;
      msg += `\nMais análises na comunidade 👇\n${linkUrl}?utm=grupo`;
    }

    return msg;
  } catch (err: any) {
    console.error("[group-blast] Palpite generation error:", err.message);
    return null;
  }
}
