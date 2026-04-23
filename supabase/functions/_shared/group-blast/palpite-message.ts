const PERIODO_ANALISE = 5;
const pad = (d: number) => d.toString().padStart(2, "0");

/**
 * Gera mensagem rica de palpites Lotofácil baseada em análise estatística
 * dos últimos N concursos. Usa tool calling para garantir saída estruturada.
 *
 * - `includePalpites=true` → lista os 15 jogos no final.
 * - `includePalpites=false` → CTA para grupo VIP no lugar dos jogos.
 */
export async function generatePalpiteMessage(
  supabase: any,
  apiKey: string,
  baseUrl: string,
  includePalpites = true,
  vipGroupLink: string | null = null,
): Promise<string | null> {
  if (!apiKey) return null;

  const { data: resultados, error: resErr } = await supabase
    .from("resultados_loterias")
    .select(
      "concurso_id:concurso, data_sorteio, dezenas, qtd_pares, qtd_impares, qtd_moldura, qtd_primos, qtd_repetidas, ciclo_numero, dezenas_faltantes_ciclo",
    )
    .eq("loteria", "lotofacil")
    .order("concurso", { ascending: false })
    .limit(PERIODO_ANALISE);

  if (resErr || !resultados || resultados.length === 0) {
    console.error(
      "[palpite-message] Erro ao buscar resultados:",
      resErr?.message,
    );
    return null;
  }

  // Frequências
  const freq: Record<number, number> = {};
  for (let d = 1; d <= 25; d++) freq[d] = 0;
  for (const r of resultados) for (const d of r.dezenas) freq[d]++;

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

  const mediaPares =
    resultados.reduce((acc: number, r: any) => acc + (r.qtd_pares || 0), 0) /
    resultados.length;
  const mediaMoldura =
    resultados.reduce((acc: number, r: any) => acc + (r.qtd_moldura || 0), 0) /
    resultados.length;
  const mediaPrimos =
    resultados.reduce((acc: number, r: any) => acc + (r.qtd_primos || 0), 0) /
    resultados.length;
  const mediaRepetidas =
    resultados.reduce((acc: number, r: any) => acc + (r.qtd_repetidas || 0), 0) /
    resultados.length;

  const concursoMin = resultados[resultados.length - 1].concurso_id;
  const concursoMax = resultados[0].concurso_id;

  const contextoEstatistico = `
ANÁLISE DOS ÚLTIMOS ${PERIODO_ANALISE} CONCURSOS DA LOTOFÁCIL:

ÚLTIMO RESULTADO (Concurso ${ultimoResultado.concurso_id}):
- Dezenas sorteadas: ${ultimoResultado.dezenas.map(pad).join(", ")}
- Pares: ${ultimoResultado.qtd_pares} | Ímpares: ${ultimoResultado.qtd_impares}
- Moldura: ${ultimoResultado.qtd_moldura} | Primos: ${ultimoResultado.qtd_primos}
- Ciclo atual: ${ultimoResultado.ciclo_numero}
- Dezenas faltantes no ciclo: ${
    dezenasFaltantesCiclo.length > 0
      ? dezenasFaltantesCiclo.map(pad).join(", ")
      : "Nenhuma (ciclo completo)"
  }

FREQUÊNCIAS NOS ÚLTIMOS ${PERIODO_ANALISE} JOGOS:
- Dezenas mais sorteadas: ${
    dezenasMaisFrequentes.map((d) => `${pad(d)} (${freq[d]}x)`).join(", ")
  }
- Dezenas menos sorteadas: ${
    dezenasMenosFrequentes.map((d) => `${pad(d)} (${freq[d]}x)`).join(", ")
  }

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

  const systemPrompt =
    `Você é um especialista em análise estatística da Lotofácil.

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
          tools: [
            {
              type: "function",
              function: {
                name: "generate_palpites",
                description:
                  "Gera palpites estruturados para a Lotofácil com explicação detalhada da estratégia",
                parameters: {
                  type: "object",
                  properties: {
                    jogos: {
                      type: "array",
                      description: "Lista de 15 jogos gerados",
                      items: {
                        type: "object",
                        properties: {
                          dezenas: {
                            type: "array",
                            items: { type: "integer", minimum: 1, maximum: 25 },
                          },
                        },
                        required: ["dezenas"],
                      },
                    },
                    estrategia: {
                      type: "object",
                      properties: {
                        ferramentas: {
                          type: "array",
                          items: { type: "string" },
                        },
                        dezenas_fixas: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              dezenas: {
                                type: "array",
                                items: { type: "integer" },
                              },
                              motivo: { type: "string" },
                            },
                          },
                        },
                        dezenas_evitadas: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              dezenas: {
                                type: "array",
                                items: { type: "integer" },
                              },
                              motivo: { type: "string" },
                            },
                          },
                        },
                        filtros_aplicados: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              filtro: { type: "string" },
                              valor_alvo: { type: "string" },
                              motivo: { type: "string" },
                            },
                          },
                        },
                        conclusao: { type: "string" },
                      },
                      required: ["ferramentas", "filtros_aplicados", "conclusao"],
                    },
                  },
                  required: ["jogos", "estrategia"],
                },
              },
            },
          ],
          tool_choice: {
            type: "function",
            function: { name: "generate_palpites" },
          },
        }),
      },
    );

    if (!aiRes.ok) {
      console.error(
        `[palpite-message] AI error: ${aiRes.status}`,
        await aiRes.text(),
      );
      return null;
    }

    const aiData = await aiRes.json();
    const usage = aiData?.usage;
    if (usage) {
      const pt = usage.prompt_tokens || 0;
      const ct = usage.completion_tokens || 0;
      const cost = (pt / 1e6) * 0.15 + (ct / 1e6) * 0.60;
      supabase
        .from("ai_usage_logs")
        .insert({
          edge_function: "group-blast-palpite",
          action_type: "palpite_para_grupo_whatsapp",
          prompt_tokens: pt,
          completion_tokens: ct,
          total_tokens: usage.total_tokens || (pt + ct),
          model,
          cost_usd: cost,
          metadata: {},
        })
        .then(() => {})
        .catch((e: any) => console.error("[palpite-message] Erro log IA:", e));
    }

    const toolCall = aiData?.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) return null;

    const palpitesData = JSON.parse(toolCall.function.arguments);
    const estrategia = palpitesData.estrategia;

    const jogosValidos: string[] = [];
    for (const jogo of palpitesData.jogos || []) {
      const dezenas = (jogo.dezenas || [])
        .map((d: number) => Math.round(d))
        .filter((d: number) => d >= 1 && d <= 25);
      const unique = [...new Set(dezenas)];
      if (unique.length >= 15) {
        jogosValidos.push(
          unique
            .slice(0, 15)
            .sort((a: number, b: number) => a - b)
            .map((d: number) => pad(d))
            .join("-"),
        );
      }
    }

    if (jogosValidos.length < 10) {
      console.error(
        `[palpite-message] IA retornou apenas ${jogosValidos.length} jogos válidos`,
      );
      return null;
    }

    return formatPalpiteMessage({
      baseUrl,
      includePalpites,
      vipGroupLink,
      ultimoResultado,
      concursoMin,
      concursoMax,
      estrategia,
      jogosValidos,
    });
  } catch (err: any) {
    console.error("[palpite-message] Generation error:", err.message);
    return null;
  }
}

interface FormatArgs {
  baseUrl: string;
  includePalpites: boolean;
  vipGroupLink: string | null;
  ultimoResultado: any;
  concursoMin: number;
  concursoMax: number;
  estrategia: any;
  jogosValidos: string[];
}

function formatPalpiteMessage(a: FormatArgs): string {
  const trackedPalpiteLink =
    `${a.baseUrl}/lotofacil?utm_source=whatsapp&utm_medium=group&utm_campaign=blast_palpite&utm_content=lotofacil`;
  const trackedVipLink =
    `${a.baseUrl}/lotofacil?utm_source=whatsapp&utm_medium=group&utm_campaign=blast_vip&utm_content=lotofacil`;

  let msg = `🎰 *Palpites Lotofácil — Concurso ${a.concursoMax + 1}*\n\n`;
  msg += `📢 *Último Resultado (Concurso ${a.ultimoResultado.concurso_id}):*\n`;
  msg += `${
    a.ultimoResultado.dezenas
      .sort((x: number, y: number) => x - y)
      .map(pad)
      .join(" - ")
  }\n\n`;
  msg += `📊 *Análise baseada nos concursos ${a.concursoMin} a ${a.concursoMax}*\n\n`;

  const e = a.estrategia;
  if (e?.ferramentas?.length > 0) {
    msg += `🔧 *Ferramentas utilizadas:*\n`;
    for (const f of e.ferramentas) msg += `  • ${f}\n`;
    msg += `\n`;
  }

  if (e?.dezenas_fixas?.length > 0) {
    msg += `✅ *Dezenas Priorizadas:*\n`;
    for (const item of e.dezenas_fixas) {
      msg += `  • ${(item.dezenas || []).map(pad).join(", ")} — ${item.motivo}\n`;
    }
    msg += `\n`;
  }

  if (e?.dezenas_evitadas?.length > 0) {
    msg += `❌ *Dezenas Evitadas:*\n`;
    for (const item of e.dezenas_evitadas) {
      msg += `  • ${(item.dezenas || []).map(pad).join(", ")} — ${item.motivo}\n`;
    }
    msg += `\n`;
  }

  if (e?.filtros_aplicados?.length > 0) {
    msg += `🎯 *Filtros Aplicados:*\n`;
    for (const f of e.filtros_aplicados) {
      msg += `  • ${f.filtro}${f.valor_alvo ? ` → ${f.valor_alvo}` : ""}\n`;
      if (f.motivo) msg += `    ${f.motivo}\n`;
    }
    msg += `\n`;
  }

  if (e?.conclusao) {
    msg += `💡 *Conclusão:*\n${e.conclusao}\n\n`;
  }

  if (a.includePalpites) {
    for (let i = 0; i < a.jogosValidos.length; i++) {
      msg += `🎯 Jogo ${String(i + 1).padStart(2, "0")}: ${a.jogosValidos[i]}\n`;
    }
    msg += `\nBoa sorte! 🍀\nMais análises na comunidade 👇\n${trackedPalpiteLink}`;
  } else {
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `🎯 *QUER RECEBER OS PALPITES?*\n\n`;
    msg += `Os 15 jogos baseados nessa estratégia são enviados diariamente no *Grupo VIP*.\n\n`;
    msg += a.vipGroupLink
      ? `👉 *Entre agora:* ${a.vipGroupLink}\n`
      : `👉 Fale com a gente para entrar no Grupo VIP!\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `\nMais análises na comunidade 👇\n${trackedVipLink}`;
  }

  return msg;
}
