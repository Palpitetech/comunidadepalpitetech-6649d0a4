import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GuideData {
  id: string;
  perfil_id: string;
  system_prompt: string;
  especialidade: string;
  cargo: string;
  can_respond_to_bot_posts: boolean;
  can_reply_own_post_comments: boolean;
  perfis: { nome: string | null } | { nome: string | null }[] | null;
}

// Helper para extrair nome do perfil (pode vir como objeto ou array)
function getGuideName(guide: GuideData): string | null {
  if (!guide.perfis) return null;
  if (Array.isArray(guide.perfis)) {
    return guide.perfis[0]?.nome || null;
  }
  return guide.perfis.nome;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { comment_id, post_id, user_id, conteudo } = await req.json();
    
    if (!comment_id || !post_id || !user_id || !conteudo) {
      return new Response(
        JSON.stringify({ error: "Parâmetros obrigatórios: comment_id, post_id, user_id, conteudo" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    
    // 1. Verificar se o autor do COMENTÁRIO é bot (evitar loop infinito de respostas a comentários)
    const { data: authorProfile } = await supabaseAdmin
      .from("perfis")
      .select("is_bot, nome")
      .eq("id", user_id)
      .single();
    
    if (authorProfile?.is_bot) {
      console.log(`Comentário de bot (${authorProfile.nome}) - ignorando para evitar loop`);
      return new Response(
        JSON.stringify({ skipped: true, reason: "bot_comment_author" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // 2. Verificar se já existe resposta de bot para este comentário (evitar duplicatas)
    const { data: existingReplies } = await supabaseAdmin
      .from("post_comments")
      .select("id, user_id")
      .eq("parent_id", comment_id);
    
    if (existingReplies && existingReplies.length > 0) {
      // Verificar se alguma das respostas é de um bot
      const replyUserIds = existingReplies.map(r => r.user_id);
      const { data: replyProfiles } = await supabaseAdmin
        .from("perfis")
        .select("id, is_bot")
        .in("id", replyUserIds)
        .eq("is_bot", true);
      
      if (replyProfiles && replyProfiles.length > 0) {
        console.log(`Comentário ${comment_id} já tem resposta de bot - ignorando`);
        return new Response(
          JSON.stringify({ skipped: true, reason: "already_replied" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }
    
    // 3. Verificar se o POST original é de um bot
    const { data: postData } = await supabaseAdmin
      .from("postagens")
      .select("user_id, titulo, conteudo")
      .eq("id", post_id)
      .single();
    
    const { data: postAuthorProfile } = await supabaseAdmin
      .from("perfis")
      .select("is_bot")
      .eq("id", postData?.user_id)
      .single();
    
    const postIsFromBot = postAuthorProfile?.is_bot === true;
    const postAuthorId = postData?.user_id;
    
    // 4. Buscar guias ativos - lógica de filtro baseada no tipo de post
    // Cenário A: Post é do próprio bot → usar can_reply_own_post_comments
    // Cenário B: Post é de outro bot → usar can_respond_to_bot_posts  
    // Cenário C: Post é de humano → usar auto_reply_enabled
    
    let guideQuery = supabaseAdmin
      .from("guide_personas")
      .select("id, perfil_id, system_prompt, especialidade, cargo, can_respond_to_bot_posts, can_reply_own_post_comments, auto_reply_enabled, perfis(nome)")
      .eq("ativo", true);
    
    const { data: allGuides, error: guidesError } = await guideQuery;
    
    if (guidesError || !allGuides || allGuides.length === 0) {
      console.log("Nenhum guia ativo encontrado");
      return new Response(
        JSON.stringify({ skipped: true, reason: "no_guides" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Filtrar guias elegíveis baseado no cenário
    let eligibleGuides: GuideData[] = [];
    
    if (postIsFromBot) {
      // O post é de um bot - verificar dois cenários:
      // 1. Se o bot que pode responder é o AUTOR do post → usa can_reply_own_post_comments
      // 2. Se o bot é diferente do autor → usa can_respond_to_bot_posts + auto_reply_enabled
      
      for (const guide of allGuides as GuideData[]) {
        if (guide.perfil_id === postAuthorId) {
          // Este guia é o autor do post - verificar se pode responder seus próprios posts
          if (guide.can_reply_own_post_comments) {
            eligibleGuides.push(guide);
          }
        } else {
          // Outro guia - verificar se pode responder posts de bots E tem auto_reply ativo
          if (guide.can_respond_to_bot_posts && (guide as any).auto_reply_enabled) {
            eligibleGuides.push(guide);
          }
        }
      }
    } else {
      // Post é de humano - usar filtro padrão auto_reply_enabled
      eligibleGuides = (allGuides as any[]).filter(g => g.auto_reply_enabled) as GuideData[];
    }
    
    if (eligibleGuides.length === 0) {
      const reason = postIsFromBot ? "no_guides_for_bot_posts" : "no_guides";
      console.log(postIsFromBot 
        ? "Nenhum guia configurado para responder posts de bots" 
        : "Nenhum guia com auto_reply ativo");
      return new Response(
        JSON.stringify({ skipped: true, reason }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    console.log(`Post é de bot: ${postIsFromBot}. Guias elegíveis: ${eligibleGuides.length}`);
    
    // 3. Sortear 1 guia aleatório
    // Opcional: dar peso maior para especialistas se o comentário tiver palavras-chave
    const comentarioLower = conteudo.toLowerCase();
    let selectedGuide: GuideData;
    
    // Palavras-chave por especialidade
    const keywordWeights: { [key: string]: string[] } = {
      "análise de dados": ["estatística", "dados", "frequência", "porcentagem", "chance"],
      "vivência prática": ["experiência", "sempre", "geralmente", "costumo", "minha estratégia"],
      "educação": ["como funciona", "o que é", "explica", "entender", "ciclo", "moldura"]
    };
    
    // Verificar se há match de palavras-chave
    let matchedGuide: GuideData | null = null;
    for (const guide of eligibleGuides) {
      const keywords = keywordWeights[guide.especialidade.toLowerCase()] || [];
      if (keywords.some(kw => comentarioLower.includes(kw))) {
        // 70% de chance de escolher o especialista relevante
        if (Math.random() < 0.7) {
          matchedGuide = guide;
          break;
        }
      }
    }
    
    selectedGuide = matchedGuide || eligibleGuides[Math.floor(Math.random() * eligibleGuides.length)];
    
    // Verificar se é o autor do post respondendo
    const isOwnPostReply = selectedGuide.perfil_id === postAuthorId;
    
    // Usar dados do post já buscados anteriormente
    const post = postData;
    
    // 5. Gerar resposta personalizada
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
          { role: "system", content: selectedGuide.system_prompt },
          { 
            role: "user", 
            content: `Um usuário da comunidade acabou de comentar. Responda a ele.

CONTEXTO DO POST:
Título: "${post?.titulo || 'Post da comunidade'}"
Conteúdo: "${post?.conteudo || ''}"

COMENTÁRIO DO USUÁRIO:
"${conteudo}"

INSTRUÇÕES:
- Responda de forma curta, simpática e útil
- Se for uma dúvida, tente esclarecer com sua expertise em ${selectedGuide.especialidade}
- Se for uma opinião, agradeça e comente
- Máximo 200 caracteres
- Seja acolhedor, como um colega ajudando
- NUNCA mencione que é IA/bot
- Pode usar emoji ocasionalmente

Responda APENAS com o texto da resposta (sem JSON, sem aspas).`
          }
        ]
      }),
    });
    
    if (!aiResponse.ok) {
      throw new Error(`Erro na API de IA: ${aiResponse.status}`);
    }
    
    const aiData = await aiResponse.json();
    const resposta = aiData.choices?.[0]?.message?.content?.trim();
    
    if (!resposta) {
      throw new Error("Resposta da IA vazia");
    }
    
    // 6. Inserir resposta com parent_id (resposta aninhada)
    const { error: insertError } = await supabaseAdmin.from("post_comments").insert({
      post_id: post_id,
      user_id: selectedGuide.perfil_id,
      conteudo: resposta.substring(0, 500),
      parent_id: comment_id, // Resposta aninhada ao comentário do usuário
    });
    
    if (insertError) {
      throw new Error(`Erro ao inserir resposta: ${insertError.message}`);
    }
    
    const guideName = getGuideName(selectedGuide);
    console.log(`${guideName} respondeu ao comentário ${comment_id}`);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        guide: guideName,
        especialidade: selectedGuide.especialidade,
        parent_comment_id: comment_id,
        resposta_preview: resposta.substring(0, 50) + "..."
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    console.error("Erro em bot-reply-user:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
