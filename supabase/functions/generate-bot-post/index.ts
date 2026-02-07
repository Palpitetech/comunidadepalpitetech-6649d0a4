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
    const { guide_id, tipo_post = "geral", contexto_extra = "" } = await req.json();

    if (!guide_id) {
      throw new Error("guide_id é obrigatório");
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1. Buscar guide_persona
    const { data: guide, error: guideError } = await supabaseAdmin
      .from("guide_personas")
      .select("*, perfis(nome)")
      .eq("id", guide_id)
      .single();

    if (guideError || !guide) {
      console.log(`[generate-bot-post] ❌ Bot ${guide_id} não encontrado`);
      throw new Error("Bot não encontrado");
    }

    // Validação de permissões com logging detalhado
    if (!guide.ativo) {
      console.log(`[generate-bot-post] ❌ Bot ${guide.perfis?.nome || guide_id} rejeitado: ativo=false`);
      throw new Error("Bot não está ativo");
    }

    if (!guide.can_create_posts) {
      console.log(`[generate-bot-post] ❌ Bot ${guide.perfis?.nome || guide_id} rejeitado: can_create_posts=false`);
      throw new Error("Bot não pode criar posts (can_create_posts=false)");
    }

    console.log(`[generate-bot-post] ✅ Bot aceito: ${guide.perfis?.nome || guide_id}`);
    console.log(`[generate-bot-post] Permissões: ativo=${guide.ativo}, can_create_posts=${guide.can_create_posts}`);

    // 2. Buscar últimos resultados
    const { data: resultados } = await supabaseAdmin
      .from("resultados")
      .select("concurso_id, dezenas, data_sorteio")
      .order("concurso_id", { ascending: false })
      .limit(10);

    const contexto = resultados?.length
      ? `Último concurso: ${resultados[0].concurso_id} - Dezenas: [${resultados[0].dezenas.join(", ")}]`
      : "Sem dados recentes disponíveis.";

    // Gerar instruções específicas por tipo de post
    const getInstrucoesTipo = (tipo: string): string => {
      switch (tipo) {
        case "estrategia":
          return `OBJETIVO: Ensinar UMA técnica de análise para a comunidade.

ESTRUTURA DO POST:
1. Título da técnica (chamativo, ex: "🎯 Técnica: Equilíbrio Pares/Ímpares")
2. Explicação simples de como funciona
3. Exemplo prático usando dados reais: ${contexto}
4. Convite para o usuário tentar por conta própria

TÉCNICAS DISPONÍVEIS (escolha UMA):
- Análise de dezenas quentes/frias
- Ciclo de dezenas
- Equilíbrio pares/ímpares
- Duplas e trios frequentes
- Moldura do volante
- Sequências e saltos

IMPORTANTE: NÃO dê palpites prontos, apenas ensine a técnica.`;

        case "palpite_gratis":
          return `OBJETIVO: Compartilhar UM palpite grátis para a comunidade.

ESTRUTURA DO POST:
1. Título chamativo (ex: "🎁 Palpite Grátis do Dia")
2. Gere EXATAMENTE 15 dezenas únicas de 01 a 25 em ordem crescente
3. Breve explicação da estratégia usada (1-2 frases)
4. OBRIGATÓRIO incluir: "⚠️ Loteria é sorte, jogue com responsabilidade!"

REGRAS:
- Formato das dezenas: separadas por vírgula (01, 02, 03...)
- Use os dados estatísticos para embasar: ${contexto}
- Apenas 1 jogo por post (não abuse)
- Seja criativo na explicação da estratégia`;

        default:
          return `Crie um post engajante sobre análise da Lotofácil.
Contexto atual: ${contexto}`;
      }
    };

    // 3. Gerar post via IA
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY não configurada");

    const instrucoesTipo = getInstrucoesTipo(tipo_post);

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: guide.ai_model || "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: guide.system_prompt },
          {
            role: "user",
            content: `Crie um post para a comunidade Palpite Tech.

TIPO: ${tipo_post}
${instrucoesTipo}
${contexto_extra ? `CONTEXTO ADICIONAL: ${contexto_extra}` : ""}

LIMITES:
- Máximo ${guide.max_chars_post || 400} caracteres no conteúdo
- Título: máximo 60 caracteres
- NUNCA prometa resultados garantidos
- Convide à discussão

Responda APENAS no formato JSON:
{"titulo": "seu título", "conteudo": "seu conteúdo"}`
          }
        ]
      }),
    });

    if (!aiResponse.ok) throw new Error("Erro na API de IA");

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content;
    
    let parsed;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch?.[0] || content);
    } catch {
      throw new Error("Formato de resposta inválido");
    }

    // 4. Criar post
    const { data: newPost, error: postError } = await supabaseAdmin
      .from("postagens")
      .insert({
        user_id: guide.perfil_id,
        titulo: parsed.titulo?.substring(0, 100),
        conteudo: parsed.conteudo?.substring(0, 1000),
        loteria_tag: "Lotofácil",
      })
      .select("id")
      .single();

    if (postError) throw postError;

    // 5. Atualizar estatísticas
    await supabaseAdmin
      .from("guide_personas")
      .update({ 
        ultimo_post_em: new Date().toISOString(),
        total_posts: (guide.total_posts || 0) + 1
      })
      .eq("id", guide_id);

    return new Response(
      JSON.stringify({ success: true, post_id: newPost.id, titulo: parsed.titulo }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Erro:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
