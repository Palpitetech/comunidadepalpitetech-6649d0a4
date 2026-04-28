import type { PostForAI } from "./types.ts";
import { getBlastLotteryConfig, type BlastLoteria } from "./lottery-config.ts";

// ─── Mapa de emojis temáticos por tipo de post (gancho) ─────────
const HOOK_EMOJI_MAP: Record<string, string> = {
  analise: "🔍",
  analise_pos_sorteio: "🔍",
  palpite: "🎯",
  palpites: "🎯",
  estatistica: "📊",
  estatisticas: "📊",
  quentes: "🔥",
  frias: "❄️",
  alerta: "👀",
  cenario: "🎲",
  cenarios: "🎲",
  desaceleracao: "📉",
  ressaca: "💥",
  metodologia: "🛠️",
  como_calculamos: "🧮",
};

function pickHookEmoji(tipo: string | null): string {
  if (!tipo) return "🔍";
  return HOOK_EMOJI_MAP[tipo.toLowerCase().trim()] ?? "🔍";
}

function validateAIMessage(
  text: string,
  expectedLink: string,
): { ok: boolean; reason?: string } {
  if (!text) return { ok: false, reason: "empty" };
  if (text.includes("*")) return { ok: false, reason: "markdown_asterisk" };
  if (!text.includes("•")) return { ok: false, reason: "no_bullet" };
  if (text.length < 200) return { ok: false, reason: "too_short" };
  if (text.length > 900) return { ok: false, reason: "too_long" };

  const lines = text.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);
  const lastLine = lines[lines.length - 1] ?? "";
  if (!lastLine.includes("utm_campaign=blast_post")) {
    return { ok: false, reason: "missing_utm" };
  }
  if (!lastLine.startsWith("http")) return { ok: false, reason: "link_not_last" };
  if (!text.includes(expectedLink.split("?")[0])) {
    return { ok: false, reason: "wrong_link_base" };
  }
  return { ok: true };
}

/**
 * Gera mensagem estruturada de WhatsApp a partir de um post da comunidade.
 * Formato: gancho + bullets escaneáveis + insight + CTA + link rastreado.
 * Retorna `null` se a IA falhar ou a saída não passar na validação.
 */
export async function generateAIMessage(
  supabase: any,
  apiKey: string,
  baseUrl: string,
  post: PostForAI,
  loteria: BlastLoteria = "lotofacil",
): Promise<string | null> {
  if (!apiKey) return null;

  const lotCfg = getBlastLotteryConfig(loteria);
  const postPath = post.slug || post.id;
  const trackedLink =
    `${baseUrl}${lotCfg.hubPath}/comunidade/post/${postPath}?utm_source=whatsapp&utm_medium=group&utm_campaign=blast_post&utm_content=${
      encodeURIComponent(postPath)
    }`;
  const hookEmoji = pickHookEmoji(post.tipo);
  const conteudoPreview = (post.conteudo ?? "").slice(0, 1500);
  const numBullets = conteudoPreview.length >= 600 ? 3 : 2;

  const systemPrompt =
    `Você cria mensagens de WhatsApp que VENDEM um post de uma comunidade de loterias — não que resumem.
Tom: especialista experiente, direto, com leitura prática. Sem clichê de marketing, sem entusiasmo forçado, sem saudações.
Você fala com quem joga há tempo: vai direto no dado, no padrão, no benefício.`;

  const userPrompt =
    `Gere uma mensagem para WhatsApp seguindo EXATAMENTE este formato (preserve quebras de linha em branco):

${hookEmoji} [GANCHO — 1 linha forte que prende atenção, baseada no dado mais interessante do post]

📌 O que tem no post:
• [Bullet 1 — descoberta/dado concreto extraído do conteúdo]
• [Bullet 2 — segundo ponto chave concreto]${
      numBullets >= 3 ? "\n• [Bullet 3 — terceiro ponto, sempre concreto]" : ""
    }

💡 [INSIGHT — 1 frase começando com verbo (Aproveite/Combine/Use/Observe) amarrando os bullets a um benefício prático para o próximo concurso]

Vamos comentar lá na comunidade 👇
${trackedLink}

REGRAS OBRIGATÓRIAS:
- Use exatamente ${numBullets} bullets, nem mais nem menos.
- Cada bullet ≤ 80 caracteres, com dado concreto extraído do post (número, percentual, dezena, padrão).
- O emoji do gancho é EXATAMENTE "${hookEmoji}" — não troque.
- Os emojis 📌, 💡 e 👇 são FIXOS nas posições mostradas.
- Nenhum outro emoji em lugar algum.
- A penúltima linha deve ser EXATAMENTE: "Vamos comentar lá na comunidade 👇"
- A última linha deve ser EXATAMENTE o link, sem nada antes ou depois, sem modificar UTMs.
- PROIBIDO: clichês ("imperdível", "incrível", "não perca", "confira", "imperdível"), saudações ("Olá", "Oi", "Pessoal"), markdown, asteriscos (* ou **), aspas dramáticas.
- Linguagem: português brasileiro, técnica mas acessível. Sem frases vazias.

DADOS DO POST:
Tipo: ${post.tipo ?? "geral"}
Título: ${post.titulo ?? "Sem título"}
Conteúdo: ${conteudoPreview}`;

  const model = "google/gemini-3-flash-preview";

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
          model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
        }),
      },
    );

    if (!aiRes.ok) {
      console.error(
        `[ai-message] AI error: ${aiRes.status}`,
        await aiRes.text(),
      );
      return null;
    }

    const aiData = await aiRes.json();
    const usage = aiData?.usage;
    if (usage) {
      const pt = usage.prompt_tokens || 0;
      const ct = usage.completion_tokens || 0;
      supabase
        .from("ai_usage_logs")
        .insert({
          edge_function: "group-blast-ai-message",
          action_type: "msg_post_para_grupo_whatsapp",
          prompt_tokens: pt,
          completion_tokens: ct,
          total_tokens: usage.total_tokens || (pt + ct),
          model,
          cost_usd: 0,
          metadata: {
            post_id: post.id,
            post_tipo: post.tipo,
            num_bullets: numBullets,
          },
        })
        .then(() => {})
        .catch((e: any) => console.error("[ai-message] Erro log IA:", e));
    }

    const raw = aiData?.choices?.[0]?.message?.content?.trim() || "";
    if (!raw) return null;

    // Limpeza defensiva: remove markdown leve remanescente
    const cleaned = raw.replace(/\*\*/g, "").replace(/\*/g, "").trim();

    const validation = validateAIMessage(cleaned, trackedLink);
    if (!validation.ok) {
      console.warn(
        `[ai-message] AI message rejected: ${validation.reason}`,
        { post_id: post.id, preview: cleaned.slice(0, 200) },
      );
      return null;
    }

    return cleaned;
  } catch (err: any) {
    console.error("[ai-message] AI generation error:", err.message);
    return null;
  }
}
