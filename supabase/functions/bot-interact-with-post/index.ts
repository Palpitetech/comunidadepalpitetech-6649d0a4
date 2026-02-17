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
    const { post_id } = await req.json();
    if (!post_id) {
      return new Response(
        JSON.stringify({ error: "post_id obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1. Buscar dados do post
    const { data: post, error: postError } = await supabaseAdmin
      .from("postagens")
      .select("id, user_id, titulo, conteudo, loteria_tag")
      .eq("id", post_id)
      .single();

    if (postError || !post) {
      console.log(`Post ${post_id} não encontrado`);
      return new Response(
        JSON.stringify({ skipped: true, reason: "post_not_found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Buscar bots elegíveis (can_comment_on_posts = true, ativos)
    const { data: guides, error: guidesError } = await supabaseAdmin
      .from("guide_personas")
      .select("id, perfil_id, system_prompt, especialidade, cargo, chat_tags, max_comments_per_post, can_respond_to_bot_posts, ai_model, perfis(nome)")
      .eq("ativo", true)
      .eq("can_comment_on_posts", true);

    if (guidesError || !guides?.length) {
      console.log("Nenhum bot elegível para comentar");
      return new Response(
        JSON.stringify({ skipped: true, reason: "no_eligible_bots" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Verificar se o post é de um bot
    const { data: postAuthorProfile } = await supabaseAdmin
      .from("perfis")
      .select("is_bot")
      .eq("id", post.user_id)
      .single();

    const postIsFromBot = postAuthorProfile?.is_bot === true;

    // Filtrar bots: não comentar no próprio post, e respeitar can_respond_to_bot_posts
    const eligibleGuides = guides.filter((g) => {
      // Não comentar no próprio post
      if (g.perfil_id === post.user_id) return false;
      // Se o post é de bot, verificar permissão
      if (postIsFromBot && !g.can_respond_to_bot_posts) return false;
      return true;
    });

    if (eligibleGuides.length === 0) {
      console.log("Nenhum bot elegível após filtros");
      return new Response(
        JSON.stringify({ skipped: true, reason: "no_eligible_after_filter" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. Definir quantas interações (1 a 3, aleatório)
    const targetInteractions = Math.min(
      Math.floor(Math.random() * 3) + 1,
      eligibleGuides.length
    );

    // Atualizar target no post
    await supabaseAdmin
      .from("postagens")
      .update({ bot_interactions_target: targetInteractions })
      .eq("id", post_id);

    // 5. Selecionar bots aleatoriamente (shuffle e pegar N)
    const shuffled = [...eligibleGuides].sort(() => Math.random() - 0.5);
    const selectedGuides = shuffled.slice(0, targetInteractions);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY não configurada");

    let successCount = 0;

    for (const guide of selectedGuides) {
      try {
        // Verificar duplicidade
        const { data: existing } = await supabaseAdmin
          .from("bot_post_interactions")
          .select("id")
          .eq("post_id", post_id)
          .eq("bot_perfil_id", guide.perfil_id)
          .limit(1);

        if (existing && existing.length > 0) {
          console.log(`Bot ${(guide.perfis as any)?.nome} já interagiu com post ${post_id}`);
          continue;
        }

        // Registrar interação como "processing"
        const { data: interaction } = await supabaseAdmin
          .from("bot_post_interactions")
          .insert({
            post_id,
            bot_perfil_id: guide.perfil_id,
            status: "processing",
          })
          .select("id")
          .single();

        // Gerar comentário via IA
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
                content: `Você está na comunidade Palpite Tech. Comente no post abaixo como membro da comunidade.

POST:
Título: "${post.titulo || ""}"
Conteúdo: "${post.conteudo}"

INSTRUÇÕES:
- Comente de forma natural, como um membro engajado
- Máximo 250 caracteres
- Pode concordar, complementar ou fazer uma observação relevante
- Use sua especialidade em ${guide.especialidade}
- NUNCA mencione que é IA/bot
- Pode usar emoji ocasionalmente
- Seja autêntico e breve

Responda APENAS com o texto do comentário (sem JSON, sem aspas).`,
              },
            ],
          }),
        });

        if (!aiResponse.ok) {
          throw new Error(`AI API error: ${aiResponse.status}`);
        }

        const aiData = await aiResponse.json();
        const comentario = aiData.choices?.[0]?.message?.content?.trim();

        if (!comentario) throw new Error("Resposta da IA vazia");

        // Inserir comentário
        const { data: comment, error: commentError } = await supabaseAdmin
          .from("post_comments")
          .insert({
            post_id,
            user_id: guide.perfil_id,
            conteudo: comentario.substring(0, 500),
          })
          .select("id")
          .single();

        if (commentError) throw commentError;

        // Atualizar interação como "done"
        await supabaseAdmin
          .from("bot_post_interactions")
          .update({
            status: "done",
            comment_id: comment.id,
          })
          .eq("id", interaction?.id);

        successCount++;
        console.log(`✅ ${(guide.perfis as any)?.nome} comentou no post ${post_id}`);

        // Delay entre comentários (2-5s) para parecer natural
        if (selectedGuides.indexOf(guide) < selectedGuides.length - 1) {
          await new Promise((r) => setTimeout(r, 2000 + Math.random() * 3000));
        }
      } catch (err) {
        console.error(`❌ Erro bot ${(guide.perfis as any)?.nome}:`, err);

        // Registrar erro na interação
        await supabaseAdmin
          .from("bot_post_interactions")
          .update({
            status: "error",
            error: err instanceof Error ? err.message : String(err),
          })
          .eq("post_id", post_id)
          .eq("bot_perfil_id", guide.perfil_id);
      }
    }

    // Atualizar contador de interações feitas
    await supabaseAdmin
      .from("postagens")
      .update({ 
        bot_interactions_done: successCount,
        bot_interactions_last_at: new Date().toISOString(),
      })
      .eq("id", post_id);

    console.log(`Post ${post_id}: ${successCount}/${targetInteractions} interações concluídas`);

    return new Response(
      JSON.stringify({
        success: true,
        post_id,
        target: targetInteractions,
        done: successCount,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Erro em bot-interact-with-post:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
