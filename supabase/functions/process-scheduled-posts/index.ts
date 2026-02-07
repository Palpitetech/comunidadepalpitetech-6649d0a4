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

    console.log(`[process-scheduled-posts] Verificando: ${currentTime}, dia ${currentDay}`);

    // Buscar bots ativos que podem criar posts
    const { data: guides, error: guidesError } = await supabaseAdmin
      .from("guide_personas")
      .select("*, perfis(nome)")
      .eq("ativo", true)
      .eq("can_create_posts", true);

    if (guidesError) throw guidesError;

    if (!guides?.length) {
      console.log("[process-scheduled-posts] ❌ Nenhum bot encontrado com permissões");
      console.log("[process-scheduled-posts] Filtros aplicados: ativo=true, can_create_posts=true");
      return new Response(
        JSON.stringify({ success: true, processed: 0, message: "Nenhum bot ativo com permissão para criar posts" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[process-scheduled-posts] ✅ ${guides.length} bot(s) com permissão encontrado(s)`);

    const processed: string[] = [];
    const errors: string[] = [];

    for (const guide of guides) {
      try {
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

        console.log(`[${guide.perfis?.nome}] ✅ Gerando post (horário: ${matchingTime})`);

        // Gerar post usando a mesma lógica do generate-bot-post
        const { data: resultados } = await supabaseAdmin
          .from("resultados")
          .select("concurso_id, dezenas, data_sorteio")
          .order("concurso_id", { ascending: false })
          .limit(10);

        const contexto = resultados?.length
          ? `Último concurso: ${resultados[0].concurso_id} - Dezenas: [${resultados[0].dezenas.join(", ")}]`
          : "Sem dados recentes disponíveis.";

        const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
        if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY não configurada");

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

CONTEXTO: ${contexto}

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

      } catch (err) {
        const errorMsg = `${guide.perfis?.nome}: ${err instanceof Error ? err.message : "Erro"}`;
        errors.push(errorMsg);
        console.error(`[${guide.perfis?.nome}] Erro:`, err);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: processed.length,
        posts: processed,
        errors: errors.length ? errors : undefined,
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
