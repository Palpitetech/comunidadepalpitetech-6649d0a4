// =============================================================================
// Parser de "pedido especial" do usuário (texto livre) → ajustes em BaseGeracao.
// Usa IA com timeout curto e fallback silencioso.
// =============================================================================

import type { BaseGeracao } from "../guide-post/types.ts";
import { callAiGateway, logUsoIa } from "./ai-call.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export interface PedidoAjustes {
  /** Dezenas extras a excluir derivadas do texto (ex: "sem o 13"). */
  extraExcluir: number[];
  /** Dezenas extras para apoio (ex: "quero o 7 e o 17"). */
  extraApoio: number[];
  /** Texto resumido humano para mostrar no card. */
  resumo: string;
}

const VAZIO: PedidoAjustes = { extraExcluir: [], extraApoio: [], resumo: "" };

export interface ParsePedidoParams {
  texto: string;
  totalDezenas: number;
  loteriaLabel: string;
  supabaseAdmin?: ReturnType<typeof createClient>;
  userId?: string | null;
  edgeFunction?: string;
}

/**
 * Tenta interpretar o texto livre. Se IA falhar/timeout/sem chave, retorna VAZIO.
 * Nunca lança — o pedido especial sempre é considerado opcional.
 */
export async function parsePedidoEspecial(p: ParsePedidoParams): Promise<PedidoAjustes> {
  const texto = (p.texto || "").trim();
  if (!texto) return VAZIO;

  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) return { ...VAZIO, resumo: texto.slice(0, 80) };

  const prompt = `Interprete o pedido do usuário sobre dezenas da ${p.loteriaLabel} (1..${p.totalDezenas}).
Pedido: "${texto}"

Retorne APENAS via tool_call quais dezenas:
- extraExcluir: dezenas que o usuário NÃO quer (ex: "sem o 13" → [13]).
- extraApoio: dezenas que o usuário gostaria de ver com mais frequência (ex: "quero o 7" → [7]).
- resumo: 1 frase curta (≤60 chars) descrevendo o pedido.

Se não houver dezenas específicas, retorne arrays vazios e use o próprio texto como resumo.`;

  const model = "google/gemini-2.5-flash-lite";

  const result = await callAiGateway({
    apiKey,
    model,
    messages: [{ role: "user", content: prompt }],
    timeoutMs: 3000,
    tools: [{
      type: "function",
      function: {
        name: "ajustar_palpites",
        description: "Aplica ajustes ao gerador a partir do pedido livre.",
        parameters: {
          type: "object",
          properties: {
            extraExcluir: {
              type: "array",
              items: { type: "integer", minimum: 1, maximum: p.totalDezenas },
            },
            extraApoio: {
              type: "array",
              items: { type: "integer", minimum: 1, maximum: p.totalDezenas },
            },
            resumo: { type: "string" },
          },
          required: ["extraExcluir", "extraApoio", "resumo"],
        },
      },
    }],
    toolChoice: { type: "function", function: { name: "ajustar_palpites" } },
  });

  if (!result.ok || !result.data) {
    return { ...VAZIO, resumo: texto.slice(0, 80) };
  }

  if (p.supabaseAdmin && p.edgeFunction) {
    logUsoIa({
      supabaseAdmin: p.supabaseAdmin,
      userId: p.userId ?? null,
      edgeFunction: p.edgeFunction,
      actionType: "parse_pedido_especial",
      model,
      usage: result.data.usage,
      metadata: { loteria: p.loteriaLabel, len: texto.length },
    });
  }

  try {
    const args = result.data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!args) return { ...VAZIO, resumo: texto.slice(0, 80) };
    const parsed = JSON.parse(args);
    const extraExcluir = Array.isArray(parsed.extraExcluir)
      ? parsed.extraExcluir
        .map((x: unknown) => Math.round(Number(x)))
        .filter((d: number) => d >= 1 && d <= p.totalDezenas)
        .slice(0, 10)
      : [];
    const extraApoio = Array.isArray(parsed.extraApoio)
      ? parsed.extraApoio
        .map((x: unknown) => Math.round(Number(x)))
        .filter((d: number) => d >= 1 && d <= p.totalDezenas && !extraExcluir.includes(d))
        .slice(0, 10)
      : [];
    const resumo = typeof parsed.resumo === "string" && parsed.resumo.length > 0
      ? parsed.resumo.slice(0, 80)
      : texto.slice(0, 80);
    return { extraExcluir, extraApoio, resumo };
  } catch {
    return { ...VAZIO, resumo: texto.slice(0, 80) };
  }
}

/** Aplica os ajustes do parser à BaseGeracao mantendo prioridade de fixar. */
export function aplicarAjustesPedido(base: BaseGeracao, ajustes: PedidoAjustes): BaseGeracao {
  if (ajustes.extraExcluir.length === 0 && ajustes.extraApoio.length === 0) return base;

  const fixarSet = new Set(base.fixar);
  // extraExcluir: ignora dezenas que o estudo fixou
  const novoExcluir = Array.from(new Set([
    ...base.excluir,
    ...ajustes.extraExcluir.filter((d) => !fixarSet.has(d)),
  ]));
  const exclSet = new Set(novoExcluir);

  // extraApoio: adiciona ao apoio (se não estiver excluído nem fixado)
  const novoApoio = Array.from(new Set([
    ...base.apoio,
    ...ajustes.extraApoio.filter((d) => !exclSet.has(d) && !fixarSet.has(d)),
  ]));

  return { ...base, excluir: novoExcluir, apoio: novoApoio };
}
