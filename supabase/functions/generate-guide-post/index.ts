import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1. Buscar guia ativo que não postou recentemente
    const { data: guide, error: guideError } = await supabaseAdmin
      .from("guide_personas")
      .select("*, perfis(*)")
      .eq("ativo", true)
      .order("ultimo_post_em", { ascending: true, nullsFirst: true })
      .limit(1)
      .single();

    if (guideError || !guide) {
      console.log("Nenhum guia ativo encontrado:", guideError?.message);
      return new Response(
        JSON.stringify({ message: "Nenhum guia ativo encontrado" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Buscar últimos resultados da Lotofácil
    const { data: resultados, error: resultadosError } = await supabaseAdmin
      .from("resultados")
      .select("concurso_id, dezenas, data_sorteio, qtd_pares, qtd_impares, qtd_repetidas, qtd_primos, qtd_moldura")
      .order("concurso_id", { ascending: false })
      .limit(5);

    if (resultadosError) {
      console.error("Erro ao buscar resultados:", resultadosError.message);
      throw new Error("Erro ao buscar resultados");
    }

    // 3. Formatar contexto para a IA
    const contexto = resultados?.map(r => 
      `Concurso ${r.concurso_id} (${r.data_sorteio}): Dezenas [${r.dezenas?.join(", ")}] | Pares: ${r.qtd_pares}, Ímpares: ${r.qtd_impares}, Repetidas: ${r.qtd_repetidas}, Primos: ${r.qtd_primos}, Moldura: ${r.qtd_moldura}`
    ).join("\n") || "Sem dados disponíveis";

    // 4. Chamar Lovable AI com a personalidade do guia
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY não configurada");
    }

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: guide.system_prompt },
          { 
            role: "user", 
            content: `Crie um post para a comunidade Palpite Tech analisando os últimos resultados da Lotofácil.

Dados dos últimos sorteios:
${contexto}

Instruções importantes:
- Escreva um título curto e chamativo (máximo 60 caracteres)
- Escreva o conteúdo do post (máximo 500 caracteres)
- Fale em primeira pessoa como membro da equipe Palpite Tech
- NUNCA mencione que você é IA, bot ou modelo de linguagem
- Use linguagem natural e humana
- Traga insights úteis para quem vai jogar

Responda APENAS no formato JSON:
{"titulo": "seu título aqui", "conteudo": "seu conteúdo aqui"}`
          }
        ]
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("Erro na API de IA:", aiResponse.status, errorText);
      throw new Error(`Erro na API de IA: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("Resposta da IA vazia");
    }

    // 5. Extrair JSON da resposta (pode vir com markdown)
    let parsed;
    try {
      // Tentar extrair JSON de dentro de blocos de código markdown
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || 
                        content.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]).trim() : content.trim();
      parsed = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error("Erro ao parsear resposta da IA:", content);
      throw new Error("Formato de resposta inválido da IA");
    }

    if (!parsed.titulo || !parsed.conteudo) {
      throw new Error("Resposta da IA incompleta");
    }

    // 6. Criar post na comunidade
    const { error: postError } = await supabaseAdmin.from("postagens").insert({
      user_id: guide.perfil_id,
      titulo: parsed.titulo.substring(0, 100),
      conteudo: parsed.conteudo.substring(0, 1000),
      loteria_tag: "Lotofácil",
    });

    if (postError) {
      console.error("Erro ao criar post:", postError.message);
      throw new Error("Erro ao criar post");
    }

    // 7. Atualizar timestamp do último post do guia
    await supabaseAdmin
      .from("guide_personas")
      .update({ ultimo_post_em: new Date().toISOString() })
      .eq("id", guide.id);

    console.log(`Post criado com sucesso pelo guia: ${guide.perfis?.nome}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        guide: guide.perfis?.nome,
        titulo: parsed.titulo 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Erro na função generate-guide-post:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
