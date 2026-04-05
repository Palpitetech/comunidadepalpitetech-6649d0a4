import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BotSchedule {
  horarios: string[];
  dias: number[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Horário atual no fuso de Brasília (UTC-3)
    const now = new Date();
    const brasiliaOffset = -3 * 60;
    const utcOffset = now.getTimezoneOffset();
    const brasiliaTime = new Date(now.getTime() + (utcOffset + brasiliaOffset) * 60 * 1000);
    
    const currentHour = brasiliaTime.getHours().toString().padStart(2, "0");
    const currentMinute = brasiliaTime.getMinutes().toString().padStart(2, "0");
    const currentTime = `${currentHour}:${currentMinute}`;
    const currentDay = brasiliaTime.getDay(); // 0=Dom, 1=Seg...

    // Janela de 14 horas para verificar se o Autor de Resultados postou
    // Isso cobre: resultado às 23h → posts válidos até 13h do dia seguinte
    const windowHours = 14;
    const windowStart = new Date(brasiliaTime.getTime() - (windowHours * 60 * 60 * 1000));
    const windowStartISO = new Date(windowStart.getTime() - (brasiliaOffset * 60 * 1000)).toISOString();

    console.log(`[process-scheduled-posts] Verificando: ${currentTime}, dia ${currentDay}`);

    // 1. Verificar se o Autor de Resultados já postou hoje
    const { data: resultAuthor } = await supabaseAdmin
      .from("guide_personas")
      .select("perfil_id, perfis(nome)")
      .eq("is_result_author", true)
      .eq("ativo", true)
      .single();

    let resultAuthorPostedToday = false;
    
    if (resultAuthor) {
      const { data: recentResultPost } = await supabaseAdmin
        .from("postagens")
        .select("id, created_at")
        .eq("user_id", resultAuthor.perfil_id)
        .gte("created_at", windowStartISO)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      
      resultAuthorPostedToday = !!recentResultPost;
      console.log(`[process-scheduled-posts] Autor de Resultados (${(resultAuthor.perfis as any)?.nome}) postou nas últimas ${windowHours}h: ${resultAuthorPostedToday}`);
    } else {
      // Se não há autor de resultados configurado, liberar todos
      resultAuthorPostedToday = true;
      console.log("[process-scheduled-posts] Nenhum Autor de Resultados configurado, liberando todos");
    }

    // 2. Buscar bots ativos que podem criar posts
    const { data: guides, error: guidesError } = await supabaseAdmin
      .from("guide_personas")
      .select("*, perfis(nome)")
      .eq("ativo", true)
      .eq("can_create_posts", true);

    if (guidesError) throw guidesError;

    if (!guides?.length) {
      console.log("[process-scheduled-posts] ❌ Nenhum bot encontrado com permissões");
      return new Response(
        JSON.stringify({ success: true, processed: 0, message: "Nenhum bot ativo com permissão para criar posts" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[process-scheduled-posts] ✅ ${guides.length} bot(s) com permissão encontrado(s)`);

    const processed: string[] = [];
    const skipped: string[] = [];
    const errors: string[] = [];

    for (const guide of guides) {
      try {
        // REGRA: Autor de Resultados NÃO usa schedule (é triggado pelo sync-lotofacil)
        if (guide.is_result_author) {
          console.log(`[${guide.perfis?.nome}] É Autor de Resultados, ignora schedule (usa sync-lotofacil)`);
          skipped.push(`${guide.perfis?.nome}: Autor de Resultados (sync-lotofacil)`);
          
          // Log skip
          await supabaseAdmin
            .from("bot_publishing_logs")
            .insert({
              guide_persona_id: guide.id,
              bot_name: guide.perfis?.nome,
              event_type: "skipped",
              reason: "Result author uses sync-lotofacil instead",
              details: { is_result_author: true }
            });
          continue;
        }

        // REGRA: Autor de Vendas do Sistema (is_system_sales_author) NÃO depende do resultado
        // Ele pode publicar a qualquer momento (ex: 18h)
        if (guide.is_system_sales_author) {
          console.log(`[${guide.perfis?.nome}] É Autor de Vendas do Sistema, publica independente do resultado`);
          // Continua para processar normalmente
        } else if (!resultAuthorPostedToday) {
          // Demais autores só postam se o Autor de Resultados já postou
          console.log(`[${guide.perfis?.nome}] Aguardando Autor de Resultados postar primeiro`);
          skipped.push(`${guide.perfis?.nome}: Aguardando resultado do dia`);
          
          // Log skip
          await supabaseAdmin
            .from("bot_publishing_logs")
            .insert({
              guide_persona_id: guide.id,
              bot_name: guide.perfis?.nome,
              event_type: "skipped",
              reason: "Waiting for result author to post",
              details: { resultAuthorPostedToday: false }
            });
          continue;
        }

        const schedule = guide.post_schedule as BotSchedule | null;
        
        if (!schedule?.horarios?.length || !schedule?.dias?.length) {
          console.log(`[${guide.perfis?.nome}] Sem agenda configurada, pulando`);
          continue;
        }

        // Verificar se hoje é um dia válido
        if (!schedule.dias.includes(currentDay)) {
          console.log(`[${guide.perfis?.nome}] Dia ${currentDay} não está na agenda`);
          continue;
        }

        // Verificar se algum horário bate (com margem de 1 minuto)
        const matchingTime = schedule.horarios.find((h) => {
          const [schedHour, schedMinute] = h.split(":");
          const schedTimeMinutes = parseInt(schedHour) * 60 + parseInt(schedMinute);
          const currentTimeMinutes = parseInt(currentHour) * 60 + parseInt(currentMinute);
          return Math.abs(schedTimeMinutes - currentTimeMinutes) <= 1;
        });

        if (!matchingTime) {
          console.log(`[${guide.perfis?.nome}] Horário ${currentTime} não bate com agenda`);
          continue;
        }

        // DEDUPLICAÇÃO: Verificar se já postou nos últimos 30 minutos
        const thirtyMinAgo = new Date(now.getTime() - 30 * 60 * 1000).toISOString();
        const { data: recentPost } = await supabaseAdmin
          .from("postagens")
          .select("id, created_at")
          .eq("user_id", guide.perfil_id)
          .gte("created_at", thirtyMinAgo)
          .limit(1)
          .single();

        if (recentPost) {
          console.log(`[${guide.perfis?.nome}] ⚠️ Já postou nos últimos 30min (${recentPost.id}), pulando duplicata`);
          skipped.push(`${guide.perfis?.nome}: Já postou recentemente`);
          continue;
        }

        console.log(`[${guide.perfis?.nome}] ✅ Gerando post (horário: ${matchingTime})`);

        // Determinar tipo de post baseado no papel do bot
        let tipoPost = "geral";
        if (guide.is_strategy_author) {
          tipoPost = "estrategia";
        } else if (guide.is_sales_author) {
          tipoPost = "vendas";
        } else if (guide.is_system_sales_author) {
          tipoPost = "vendas_sistema";
        }

        // Buscar últimos resultados para contexto
        const { data: resultados } = await supabaseAdmin
          .from("resultados_loterias")
.eq("loteria", "lotofacil")
.select("concurso_id:concurso, dezenas, data_sorteio")
          .order("concurso", { ascending: false })
          .limit(10);

        const contexto = resultados?.length
          ? `Último concurso: ${resultados[0].concurso_id} - Dezenas: [${resultados[0].dezenas.join(", ")}]`
          : "Sem dados recentes disponíveis.";

        const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
        if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY não configurada");

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

        const instrucoesTipo = getInstrucoesTipo(tipoPost);

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

TIPO: ${tipoPost}
${instrucoesTipo}

INSTRUÇÕES:
- Máximo ${guide.max_chars_post || 400} caracteres no conteúdo
- Título: máximo 60 caracteres
- NUNCA prometa resultados
- Convide à discussão

Responda APENAS no formato JSON:
{"titulo": "seu título", "conteudo": "seu conteúdo"}`
              }
            ]
          }),
        });

        if (!aiResponse.ok) throw new Error(`Erro na API de IA: ${aiResponse.status}`);

        const aiData = await aiResponse.json();
        const content = aiData.choices?.[0]?.message?.content;
        
        let parsed;
        try {
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          parsed = JSON.parse(jsonMatch?.[0] || content);
        } catch {
          throw new Error("Formato de resposta inválido da IA");
        }

        // Criar post
        const { data: newPost, error: postError } = await supabaseAdmin
          .from("postagens")
          .insert({
            user_id: guide.perfil_id,
            titulo: parsed.titulo?.substring(0, 100),
            conteudo: parsed.conteudo?.substring(0, 1000),
            loteria_tag: "Lotofácil",
            tipo: tipoPost,
          })
          .select("id")
          .single();

        if (postError) throw postError;

        // Atualizar estatísticas
        await supabaseAdmin
          .from("guide_personas")
          .update({ 
            ultimo_post_em: new Date().toISOString(),
            total_posts: (guide.total_posts || 0) + 1
          })
          .eq("id", guide.id);

        processed.push(`${guide.perfis?.nome}: post ${newPost.id}`);
        console.log(`[${guide.perfis?.nome}] Post criado: ${newPost.id}`);

        // Log success
        await supabaseAdmin
          .from("bot_publishing_logs")
          .insert({
            guide_persona_id: guide.id,
            bot_name: guide.perfis?.nome,
            event_type: "success",
            reason: "Scheduled post created successfully",
            details: { post_id: newPost.id, scheduled_time: matchingTime }
          });

      } catch (err) {
        const errorMsg = `${guide.perfis?.nome}: ${err instanceof Error ? err.message : "Erro"}`;
        errors.push(errorMsg);
        console.error(`[${guide.perfis?.nome}] Erro:`, err);
        
        // Log error
        await supabaseAdmin
          .from("bot_publishing_logs")
          .insert({
            guide_persona_id: guide.id,
            bot_name: guide.perfis?.nome,
            event_type: "error",
            reason: err instanceof Error ? err.message : "Unknown error",
            details: { error: String(err) }
          });
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: processed.length,
        posts: processed,
        skipped: skipped.length ? skipped : undefined,
        errors: errors.length ? errors : undefined,
        resultAuthorPostedToday,
        checkedAt: currentTime,
        day: currentDay
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[process-scheduled-posts] Erro geral:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});