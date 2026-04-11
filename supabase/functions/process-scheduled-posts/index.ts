import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BotSchedule {
  horarios: string[];
  dias: number[];
  tipo_por_horario?: Record<string, string>;
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

    // Obter corpo da requisição para verificar overrides de teste
    const body = await req.json().catch(() => ({}));
    const testTime = body.testTime; // Ex: "14:00"
    const testDay = body.testDay !== undefined ? body.testDay : null; // Ex: 1 (Segunda)

    // Horário atual no fuso de Brasília (UTC-3)
    const now = new Date();
    const brasiliaOffset = -3 * 60;
    const utcOffset = now.getTimezoneOffset();
    const brasiliaTime = new Date(now.getTime() + (utcOffset + brasiliaOffset) * 60 * 1000);
    
    const currentHour = brasiliaTime.getHours().toString().padStart(2, "0");
    const currentMinute = brasiliaTime.getMinutes().toString().padStart(2, "0");
    
    let currentTime = `${currentHour}:${currentMinute}`;
    let currentDay = brasiliaTime.getDay(); // 0=Dom, 1=Seg...

    if (testTime) {
      currentTime = testTime;
      console.log(`[process-scheduled-posts] 🧪 MODO TESTE: Simulando horário ${currentTime}`);
    }
    if (testDay !== null) {
      currentDay = testDay;
      console.log(`[process-scheduled-posts] 🧪 MODO TESTE: Simulando dia ${currentDay}`);
    }

    const [simulatedHour, simulatedMinute] = currentTime.split(":");


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
        // REGRA: Autor de Resultados também pode ter schedule (ex: análises diárias)
        // O post de "resultado_oficial" é triggado pelo sync-lotofacil, 
        // mas as análises agendadas (Ciclo, Moldura, etc.) devem ser processadas aqui.
        if (guide.is_result_author) {
          console.log(`[${guide.perfis?.nome}] É Autor de Resultados, verificando agenda para análises diárias`);
        }

        // REGRA: Autor de Vendas do Sistema ou Autor de Resultados NÃO dependem de outro post do autor
        // Eles podem publicar em seus horários agendados normalmente.
        if (guide.is_system_sales_author || guide.is_result_author) {
          console.log(`[${guide.perfis?.nome}] Publica independente de outros posts do autor`);
          // Continua para processar normalmente
        } else if (!resultAuthorPostedToday) {
          // Demais autores só postam se o Autor de Resultados já postou (ex: resultado oficial)
          console.log(`[${guide.perfis?.nome}] Aguardando Autor de Resultados postar primeiro`);
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
          const schedTotalMinutes = parseInt(schedHour) * 60 + parseInt(schedMinute);
          const currentTotalMinutes = parseInt(simulatedHour) * 60 + parseInt(simulatedMinute);
          
          // Se for modo teste, buscamos o horário exato. Senão, margem de 1min.
          if (testTime) {
            return h === currentTime;
          }
          return Math.abs(schedTotalMinutes - currentTotalMinutes) <= 1;
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

        console.log(`[${guide.perfis?.nome}] ✅ Gerando post via generate-guide-post (horário: ${matchingTime})`);

        // Determinar tipo de post pelo mapeamento de horário ou pelo papel do bot
        let tipoPost = "geral";
        if (schedule.tipo_por_horario && schedule.tipo_por_horario[matchingTime]) {
          tipoPost = schedule.tipo_por_horario[matchingTime];
        } else if (guide.is_strategy_author) {
          tipoPost = "estrategia";
        } else if (guide.is_sales_author) {
          tipoPost = "vendas";
        } else if (guide.is_system_sales_author) {
          tipoPost = "vendas_sistema";
        }

        // Chamar generate-guide-post internamente
        const generateUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/generate-guide-post`;
        const generateResponse = await fetch(generateUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          },
          body: JSON.stringify({ tipo_post: tipoPost, guide_persona_id: guide.id }),
        });

        if (!generateResponse.ok) {
          const errBody = await generateResponse.text();
          throw new Error(`generate-guide-post retornou ${generateResponse.status}: ${errBody}`);
        }

        const generateData = await generateResponse.json();
        const postId = generateData.postId || generateData.id || "unknown";

        processed.push(`${guide.perfis?.nome}: post ${postId} (${tipoPost})`);
        console.log(`[${guide.perfis?.nome}] Post criado via generate-guide-post: ${postId} tipo=${tipoPost}`);

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