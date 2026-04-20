// Edge Function: generate-message-variants
// Gera N variações de mensagem WhatsApp via Lovable AI, mantendo variáveis {{...}} preservadas
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

const MODEL = "google/gemini-3-flash-preview";
const MAX_LEN = 2000;

function extractVariables(text: string): string[] {
  const matches = text.match(/\{\{[^}]+\}\}/g) ?? [];
  return [...new Set(matches)];
}

function hasAllVariables(variant: string, required: string[]): boolean {
  return required.every((v) => variant.includes(v));
}

const SYSTEM_PROMPT = `Voce e um especialista em copywriting para WhatsApp transacional brasileiro.
Sua tarefa e gerar variacoes de uma mensagem original, mantendo o mesmo significado e CTA.

REGRAS OBRIGATORIAS:
- Tom amigavel, direto ao ponto, claro
- SEM acentos (use "voce" ao inves de "voce", "nao" ao inves de "nao", "ate" ao inves de "ate")
- Pontuacao final ocasional (nem sempre coloque ponto final)
- Inserir 1-2 leves erros de digitacao humanos comuns (ex: "vc", "tbm", "agr", "obg", "pra", "ta")
- PRESERVAR EXATAMENTE todas as variaveis no formato {{variavel}} (ex: {{nome}}, {{produto}}, {{telefone}}, {{email}}, {{link_grupo_vip}}, {{plano_nome}})
- Manter o mesmo significado e CTA da mensagem original
- Variar abertura, ordem das frases e fechamento entre as variacoes
- NUNCA mudar links, numeros ou dados tecnicos
- Tamanho similar ao original (mais ou menos 20%)
- Cada variacao deve ser DIFERENTE das outras
- Nao use markdown, apenas texto puro
- Use emojis com moderacao (1-2 por mensagem no maximo, e nao em todas)`;

const tools = [
  {
    type: "function",
    function: {
      name: "return_variants",
      description: "Retorna a lista de variacoes geradas",
      parameters: {
        type: "object",
        properties: {
          variants: {
            type: "array",
            description: "Array com N variacoes da mensagem original",
            items: { type: "string" },
          },
        },
        required: ["variants"],
        additionalProperties: false,
      },
    },
  },
];

async function callAI(mainContent: string, count: number): Promise<string[]> {
  const userPrompt = `Mensagem original:
"""
${mainContent}
"""

Gere exatamente ${count} variacoes seguindo todas as regras. Retorne usando a funcao return_variants.`;

  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      tools,
      tool_choice: { type: "function", function: { name: "return_variants" } },
    }),
  });

  if (resp.status === 429) {
    throw new Error("RATE_LIMIT");
  }
  if (resp.status === 402) {
    throw new Error("PAYMENT_REQUIRED");
  }
  if (!resp.ok) {
    const t = await resp.text();
    console.error("AI gateway error:", resp.status, t);
    throw new Error("AI_ERROR");
  }

  const data = await resp.json();
  const toolCall = data?.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall?.function?.arguments) {
    throw new Error("AI_NO_TOOL_CALL");
  }
  const args = JSON.parse(toolCall.function.arguments);
  const variants: string[] = Array.isArray(args.variants) ? args.variants : [];

  // Log usage
  try {
    const usage = data.usage ?? {};
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    await supabaseAdmin.from("ai_usage_logs").insert({
      edge_function: "generate-message-variants",
      action_type: "generate_variants",
      model: MODEL,
      prompt_tokens: usage.prompt_tokens ?? 0,
      completion_tokens: usage.completion_tokens ?? 0,
      total_tokens: usage.total_tokens ?? 0,
      cost_usd: 0,
      metadata: { count, requested: count, returned: variants.length },
    });
  } catch (e) {
    console.warn("usage log failed:", e);
  }

  return variants;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Auth: requires admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autenticado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Não autenticado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: roleCheck } = await supabaseAdmin.rpc("has_role", {
      _user_id: userData.user.id,
      _role: "admin",
    });
    if (!roleCheck) {
      return new Response(JSON.stringify({ error: "Apenas administradores podem gerar variações" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const main_content: string = (body.main_content ?? "").toString().trim();
    const count: number = Math.min(Math.max(Number(body.count) || 9, 1), 9);

    if (!main_content) {
      return new Response(JSON.stringify({ error: "main_content é obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const required = extractVariables(main_content);
    let variants = await callAI(main_content, count);

    // Validate: every variant must preserve all original variables
    let valid = variants
      .map((v) => (v ?? "").toString().trim().slice(0, MAX_LEN))
      .filter((v) => v.length > 0 && hasAllVariables(v, required));

    // Single retry if not enough valid variants
    if (valid.length < count) {
      const missing = count - valid.length;
      try {
        const retry = await callAI(main_content, missing);
        const more = retry
          .map((v) => (v ?? "").toString().trim().slice(0, MAX_LEN))
          .filter((v) => v.length > 0 && hasAllVariables(v, required));
        valid = [...valid, ...more];
      } catch (e) {
        console.warn("retry failed:", e);
      }
    }

    valid = valid.slice(0, count);

    return new Response(JSON.stringify({ variants: valid }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    const msg = err?.message ?? "unknown";
    console.error("generate-message-variants error:", msg);
    if (msg === "RATE_LIMIT") {
      return new Response(
        JSON.stringify({ error: "Muitas requisições. Tente novamente em alguns segundos." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (msg === "PAYMENT_REQUIRED") {
      return new Response(
        JSON.stringify({ error: "Créditos de IA esgotados. Adicione créditos em Settings > Workspace > Usage." }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    return new Response(JSON.stringify({ error: "Erro ao gerar variações" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
