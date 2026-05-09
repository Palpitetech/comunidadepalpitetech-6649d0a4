// supabase/functions/mega30-narrativa/index.ts
//
// Recebe o JSON de um EstudoResultado e devolve narrativa em PT-BR.
// A IA é PROIBIDA de calcular ou citar números fora do JSON recebido.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RankingItem {
  chave: number;
  label: string;
  freq: number;
  posicao: number;
}

interface EstudoResultado {
  estudoId: string;
  agrupamento: "dezena" | "linha" | "coluna" | "quadrante" | "mini";
  periodo: { tipo: string; valor?: number };
  topN: number;
  ranking: RankingItem[];
  meta: { totalConcursos: number; periodoLabel: string; engineVersion: string };
}

function buildPrompt(r: EstudoResultado): string {
  const top5 = r.ranking
    .slice(0, 5)
    .map((it) => `${it.label} (${it.freq}x)`)
    .join(", ");
  return `
Você é um analista técnico de loterias. Escreva 1 parágrafo curto (máximo 60 palavras) em português do Brasil, tom direto e claro, sobre o estudo abaixo.

REGRAS RÍGIDAS:
- Use SOMENTE os números presentes no JSON. NÃO invente percentuais, médias ou outras dezenas.
- NÃO use as palavras "IA", "Inteligência Artificial", "gerado por IA", "predição".
- Use termos como "análise técnica", "estatística", "frequência observada".
- NÃO faça promessas de ganho. Conteúdo educativo sobre 18+.

DADOS:
- Recorte: ${r.meta.periodoLabel}
- Total de concursos analisados: ${r.meta.totalConcursos}
- Agrupamento: ${r.agrupamento}
- Top 5: ${top5}

Escreva o parágrafo agora.
`.trim();
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const resultado = body?.resultado as EstudoResultado | undefined;
    if (!resultado || !Array.isArray(resultado.ranking) || resultado.ranking.length === 0) {
      return new Response(JSON.stringify({ error: "resultado inválido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY ausente" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const prompt = buildPrompt(resultado);

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "Você responde apenas o parágrafo solicitado, sem títulos nem cabeçalhos." },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
      }),
    });

    if (aiRes.status === 429) {
      return new Response(JSON.stringify({ error: "rate_limit" }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (aiRes.status === 402) {
      return new Response(JSON.stringify({ error: "payment_required" }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!aiRes.ok) {
      const txt = await aiRes.text();
      return new Response(JSON.stringify({ error: "ai_error", detail: txt }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const json = await aiRes.json();
    const texto: string = json?.choices?.[0]?.message?.content?.trim() ?? "";

    return new Response(
      JSON.stringify({
        narrativa: texto,
        engineVersion: resultado.meta.engineVersion,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: "server_error", detail: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
