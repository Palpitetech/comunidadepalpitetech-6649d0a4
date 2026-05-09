// Gera a descrição do YouTube de uma aula da Mega Especial 30 Anos.
// Recebe lista de slides (titulo + resumoDados) e devolve texto formatado.
// Salva no banco para reuso (1 geração por aula).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SlideInput {
  titulo: string;
  resumoDados: string; // texto curto descrevendo os números/fatos do slide
}

interface Body {
  aula_id: string;
  aula_titulo: string;
  slides: SlideInput[];
  force?: boolean; // ignora cache do banco
}

const HEADER_FIXO = `Entre no grupo Sala Secreta e participe dos bolões para Mega Especial 30 anos.
https://www.palpitetech.com.br/g/90chnh2i

---`;

function buildPrompt(aulaTitulo: string, slides: SlideInput[]): string {
  const lista = slides
    .map((s, i) => `Slide ${i + 1} — Título: "${s.titulo}"\nDados reais: ${s.resumoDados}`)
    .join("\n\n");

  return `Você é redator de descrições para YouTube de uma aula técnica sobre Mega-Sena.

REGRAS RÍGIDAS:
- Para CADA slide abaixo, escreva 1 parágrafo curto (máx 35 palavras) com resumo direto, claro e baseado APENAS nos dados reais informados.
- NÃO invente números, percentuais ou dezenas que não estejam nos dados.
- NÃO use as palavras "IA", "Inteligência Artificial", "gerado por IA", "predição", "garantia".
- Use termos como "análise técnica", "estatística", "frequência observada".
- NÃO faça promessas de ganho. Conteúdo educativo 18+.
- Saída em PORTUGUÊS DO BRASIL.

FORMATO DE SAÍDA EXATO (sem nenhum texto extra antes ou depois):
<TITULO_SLIDE_1>

<RESUMO_SLIDE_1>

<TITULO_SLIDE_2>

<RESUMO_SLIDE_2>

(...assim por diante para todos os slides)

AULA: ${aulaTitulo}

SLIDES:
${lista}

Escreva agora a saída no formato exato.`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY ausente" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validação JWT manual + checagem admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supaUser = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData } = await supaUser.auth.getUser();
    const userId = userData?.user?.id;
    if (!userId) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supaService = createClient(supabaseUrl, serviceKey);
    const { data: roleRow } = await supaService
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) {
      return new Response(JSON.stringify({ error: "forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json()) as Body;
    if (!body?.aula_id || !Array.isArray(body.slides) || body.slides.length === 0) {
      return new Response(JSON.stringify({ error: "payload inválido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Cache: se já existe e não pediu force, retorna do banco
    if (!body.force) {
      const { data: existing } = await supaService
        .from("mega30_aula_descricoes")
        .select("descricao_youtube, generated_at")
        .eq("aula_id", body.aula_id)
        .maybeSingle();
      if (existing?.descricao_youtube) {
        return new Response(
          JSON.stringify({ descricao: existing.descricao_youtube, cached: true, generated_at: existing.generated_at }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    const prompt = buildPrompt(body.aula_titulo, body.slides);
    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "Responda apenas o texto solicitado, sem cabeçalhos extras." },
          { role: "user", content: prompt },
        ],
        temperature: 0.6,
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
    const corpo: string = (json?.choices?.[0]?.message?.content ?? "").trim();
    const descricao = `${HEADER_FIXO}\n\n${corpo}`;

    await supaService.from("mega30_aula_descricoes").upsert({
      aula_id: body.aula_id,
      slides: body.slides,
      descricao_youtube: descricao,
      generated_by: userId,
      generated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    return new Response(JSON.stringify({ descricao, cached: false }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: "server_error", detail: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
