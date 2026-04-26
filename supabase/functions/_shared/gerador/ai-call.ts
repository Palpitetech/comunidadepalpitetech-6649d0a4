// =============================================================================
// Wrapper único para chamadas à Lovable AI Gateway com:
//   - timeout configurável
//   - log em ai_usage_logs (não bloqueia)
//   - estimativa de custo
// =============================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RATES: Record<string, { input: number; output: number }> = {
  "openai/gpt-5.2": { input: 2.0, output: 8.0 },
  "openai/gpt-5": { input: 5.0, output: 15.0 },
  "openai/gpt-5-mini": { input: 0.5, output: 2.0 },
  "google/gemini-3-flash-preview": { input: 0.15, output: 0.6 },
  "google/gemini-2.5-flash": { input: 0.1, output: 0.4 },
  "google/gemini-2.5-flash-lite": { input: 0.05, output: 0.2 },
  "google/gemini-2.5-pro": { input: 1.25, output: 5.0 },
};

export function estimateCost(
  usage: { prompt_tokens?: number; completion_tokens?: number } | undefined | null,
  model: string,
): number {
  if (!usage) return 0;
  const rate = RATES[model] || { input: 0.15, output: 0.6 };
  return (
    ((usage.prompt_tokens || 0) / 1e6) * rate.input
    + ((usage.completion_tokens || 0) / 1e6) * rate.output
  );
}

export interface LogIaParams {
  supabaseAdmin: any;
  userId: string | null;
  edgeFunction: string;
  actionType: string;
  model: string;
  usage: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number } | undefined | null;
  metadata?: Record<string, unknown>;
}

/** Loga uso de IA sem bloquear (fire-and-forget). */
export function logUsoIa(params: LogIaParams): void {
  const { supabaseAdmin, userId, edgeFunction, actionType, model, usage, metadata } = params;
  if (!usage) return;

  Promise.resolve(
    supabaseAdmin
      .from("ai_usage_logs")
      .insert({
        user_id: userId,
        edge_function: edgeFunction,
        action_type: actionType,
        prompt_tokens: usage.prompt_tokens || 0,
        completion_tokens: usage.completion_tokens || 0,
        total_tokens: usage.total_tokens || 0,
        model,
        cost_usd: estimateCost(usage, model),
        metadata: metadata || {},
      })
  ).catch((e: unknown) => console.error("[ai-call] erro ao logar uso:", e));
}

export interface CallAiOptions {
  apiKey: string;
  model?: string;
  messages: Array<{ role: string; content: string }>;
  tools?: unknown[];
  toolChoice?: unknown;
  maxTokens?: number;
  timeoutMs?: number;
}

export interface CallAiResult {
  ok: boolean;
  status: number;
  data?: any;
  errorText?: string;
}

/** Chamada bruta ao gateway com timeout. NÃO faz log — chame logUsoIa() depois com result.data?.usage. */
export async function callAiGateway(opts: CallAiOptions): Promise<CallAiResult> {
  const {
    apiKey,
    model = "google/gemini-3-flash-preview",
    messages,
    tools,
    toolChoice,
    maxTokens,
    timeoutMs = 30000,
  } = opts;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const body: Record<string, unknown> = { model, messages };
    if (tools) body.tools = tools;
    if (toolChoice) body.tool_choice = toolChoice;
    if (maxTokens) body.max_tokens = maxTokens;

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    clearTimeout(timeout);

    if (!resp.ok) {
      const errorText = await resp.text().catch(() => "");
      return { ok: false, status: resp.status, errorText };
    }
    const data = await resp.json();
    return { ok: true, status: resp.status, data };
  } catch (err) {
    clearTimeout(timeout);
    return {
      ok: false,
      status: 0,
      errorText: err instanceof Error ? err.message : "abort/network",
    };
  }
}
