import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const MODE_TO_TIPO: Record<string, string> = {
  ciclo: "analise_ciclo",
  movimentacao: "analise_movimentacao",
  pares_impares: "analise_pares_impares",
  repetidas: "analise_repetidas",
  moldura: "analise_moldura",
  resultado: "resultado_oficial",
};

const VALID_MODES = [
  "ciclo",
  "movimentacao",
  "pares_impares",
  "repetidas",
  "moldura",
  "resultado",
  "test",
];

function buildPrompt(
  mode: string,
  ultimo: Record<string, unknown>,
  historico: Record<string, unknown>[]
): string {
  const base =
    "Você é o Palpite Tech, analista estatístico da comunidade Palpite Tech.";

  switch (mode) {
    case "ciclo":
      return `${base} Analise o ciclo atual da Lotofácil com base nos dados abaixo. Explique quais dezenas estão faltando no ciclo, o que isso pode indicar para o próximo concurso. Tom educativo, nunca prometa prêmios. Máximo 500 caracteres. Sem markdown. Dados: último concurso ${ultimo.concurso_id}, ciclo atual: ${ultimo.ciclo_numero}, dezenas faltantes no ciclo: ${JSON.stringify(ultimo.dezenas_faltantes_ciclo)}`;

    case "movimentacao":
      return `${base} Analise a movimentação das dezenas nos últimos 20 concursos da Lotofácil. Destaque dezenas em alta (apareceram muito), em baixa (sumiram) e em equilíbrio. Tom educativo, nunca prometa prêmios. Máximo 500 caracteres. Sem markdown. Dados dos últimos 20 concursos: ${JSON.stringify(historico.map((r) => ({ c: r.concurso_id, d: r.dezenas })))}`;

    case "pares_impares":
      return `${base} Analise o padrão de pares e ímpares nos últimos 20 concursos da Lotofácil. Mostre a tendência atual e o que pode indicar para o próximo sorteio. Tom educativo, nunca prometa prêmios. Máximo 500 caracteres. Sem markdown. Dados: ${JSON.stringify(historico.map((r) => ({ c: r.concurso_id, p: r.qtd_pares, i: r.qtd_impares })))}`;

    case "repetidas":
      return `${base} Analise o padrão de dezenas repetidas (que saíram no concurso anterior) nos últimos 20 concursos da Lotofácil. Mostre a média de repetições e tendência atual. Tom educativo, nunca prometa prêmios. Máximo 500 caracteres. Sem markdown. Dados: ${JSON.stringify(historico.map((r) => ({ c: r.concurso_id, rep: r.qtd_repetidas })))}`;

    case "moldura":
      return `${base} Analise o padrão de dezenas na moldura (bordas do volante) nos últimos 20 concursos da Lotofácil. Mostre a tendência e o que pode orientar a montagem do próximo palpite. Tom educativo, nunca prometa prêmios. Máximo 500 caracteres. Sem markdown. Dados: ${JSON.stringify(historico.map((r) => ({ c: r.concurso_id, mol: r.qtd_moldura })))}`;

    case "resultado":
      return `Você é o Palpite Tech. Publique o resultado oficial do concurso ${ultimo.concurso_id} da Lotofácil e faça uma breve análise dos padrões desse resultado: pares/ímpares, moldura, repetidas e posição no ciclo. Tom informativo e animado, nunca prometa prêmios. Máximo 600 caracteres. Sem markdown. Dados: dezenas: ${JSON.stringify(ultimo.dezenas)}, pares: ${ultimo.qtd_pares}, ímpares: ${ultimo.qtd_impares}, moldura: ${ultimo.qtd_moldura}, repetidas: ${ultimo.qtd_repetidas}, ciclo: ${ultimo.ciclo_numero}`;

    default:
      throw new Error(`Mode não suportado: ${mode}`);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    if (!lovableApiKey) {
      throw new Error("LOVABLE_API_KEY não configurada");
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { mode, test_mode: testTargetMode } = await req.json();

    // For test mode, the actual analysis mode comes from test_mode or defaults
    const isTest = mode === "test";
    const effectiveMode = isTest ? (testTargetMode || "ciclo") : mode;

    if (!VALID_MODES.includes(mode)) {
      return new Response(
        JSON.stringify({ error: `Mode inválido: ${mode}. Válidos: ${VALID_MODES.join(", ")}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!MODE_TO_TIPO[effectiveMode]) {
      return new Response(
        JSON.stringify({ error: `Mode efetivo inválido: ${effectiveMode}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const tipoPost = MODE_TO_TIPO[effectiveMode];

    // 1. Buscar bot Palpite Tech
    const { data: bot, error: botError } = await supabase
      .from("guide_personas")
      .select("id, perfil_id, perfis!inner(nome)")
      .eq("ativo", true)
      .eq("can_create_posts", true)
      .limit(1)
      .single();

    if (botError || !bot) {
      console.error("Bot não encontrado:", botError);
      return new Response(
        JSON.stringify({ error: "Bot Palpite Tech não encontrado ou inativo" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const botPerfilId = bot.perfil_id;
    const botPersonaId = bot.id;
    const botName = (bot as any).perfis?.nome || "Palpite Tech";

    // 2. Deduplicação (exceto test)
    if (!isTest) {
      const todayStart = new Date();
      todayStart.setUTCHours(0, 0, 0, 0);

      const { data: existing } = await supabase
        .from("postagens")
        .select("id")
        .eq("user_id", botPerfilId)
        .eq("tipo", tipoPost)
        .gte("created_at", todayStart.toISOString())
        .limit(1);

      if (existing && existing.length > 0) {
        // Log skip
        await supabase.from("bot_publishing_logs").insert({
          guide_persona_id: botPersonaId,
          bot_name: botName,
          event_type: "skipped",
          reason: `Já postou ${tipoPost} hoje`,
          details: { mode: effectiveMode },
        });

        return new Response(
          JSON.stringify({ skipped: true, reason: `Já postou ${tipoPost} hoje` }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // 3. Buscar último concurso
    const { data: ultimoArr, error: ultimoError } = await supabase
      .from("resultados")
      .select("*")
      .order("concurso_id", { ascending: false })
      .limit(1);

    if (ultimoError || !ultimoArr || ultimoArr.length === 0) {
      throw new Error("Nenhum resultado encontrado");
    }
    const ultimo = ultimoArr[0];

    // 4. Buscar histórico 20 concursos
    const { data: historico, error: histError } = await supabase
      .from("resultados")
      .select(
        "concurso_id, dezenas, qtd_pares, qtd_impares, qtd_moldura, qtd_repetidas, ciclo_numero, dezenas_faltantes_ciclo"
      )
      .order("concurso_id", { ascending: false })
      .limit(20);

    if (histError || !historico) {
      throw new Error("Erro ao buscar histórico");
    }

    // 5. Chamar IA
    const prompt = buildPrompt(effectiveMode, ultimo, historico);

    const aiResponse = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${lovableApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            {
              role: "system",
              content:
                "Você é o Palpite Tech, analista estatístico da comunidade Palpite Tech. Responda de forma direta, sem markdown, sem emojis excessivos. Nunca prometa prêmios.",
            },
            { role: "user", content: prompt },
          ],
        }),
      }
    );

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI error:", aiResponse.status, errText);

      // Log error
      await supabase.from("bot_publishing_logs").insert({
        guide_persona_id: botPersonaId,
        bot_name: botName,
        event_type: "error",
        reason: `AI gateway error: ${aiResponse.status}`,
        details: { mode: effectiveMode, error: errText.substring(0, 500) },
      });

      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      throw new Error(`AI gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const conteudo =
      aiData.choices?.[0]?.message?.content?.trim() || "Erro ao gerar conteúdo";

    // Generate a title based on mode
    const tituloMap: Record<string, string> = {
      ciclo: `Análise de Ciclo - Concurso ${ultimo.concurso_id}`,
      movimentacao: `Movimentação das Dezenas - Concurso ${ultimo.concurso_id}`,
      pares_impares: `Pares e Ímpares - Concurso ${ultimo.concurso_id}`,
      repetidas: `Dezenas Repetidas - Concurso ${ultimo.concurso_id}`,
      moldura: `Análise de Moldura - Concurso ${ultimo.concurso_id}`,
      resultado: `Resultado Oficial - Concurso ${ultimo.concurso_id}`,
    };

    // 6. Inserir post
    const { data: post, error: postError } = await supabase
      .from("postagens")
      .insert({
        user_id: botPerfilId,
        tipo: tipoPost,
        conteudo,
        titulo: tituloMap[effectiveMode] || `Análise - Concurso ${ultimo.concurso_id}`,
        parent_id: null,
        concurso_referencia: ultimo.concurso_id,
        loteria_tag: "Lotofácil",
      })
      .select("id")
      .single();

    if (postError) {
      console.error("Erro ao inserir post:", postError);

      await supabase.from("bot_publishing_logs").insert({
        guide_persona_id: botPersonaId,
        bot_name: botName,
        event_type: "error",
        reason: `Erro ao inserir post: ${postError.message}`,
        details: { mode: effectiveMode, concurso_id: ultimo.concurso_id },
      });

      throw new Error(`Erro ao inserir post: ${postError.message}`);
    }

    // 7. Log success
    await supabase.from("bot_publishing_logs").insert({
      guide_persona_id: botPersonaId,
      bot_name: botName,
      event_type: "post_created",
      reason: `Post ${tipoPost} criado com sucesso`,
      details: {
        mode: effectiveMode,
        concurso_id: ultimo.concurso_id,
        post_id: post.id,
        is_test: isTest,
      },
    });

    // Update ultimo_post_em
    await supabase
      .from("guide_personas")
      .update({ ultimo_post_em: new Date().toISOString() })
      .eq("id", botPersonaId);

    console.log(
      `Post ${tipoPost} criado: ${post.id} (concurso ${ultimo.concurso_id})`
    );

    return new Response(
      JSON.stringify({
        success: true,
        post_id: post.id,
        tipo: tipoPost,
        concurso_id: ultimo.concurso_id,
        is_test: isTest,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Erro na função palpitetech-post:", err);
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : "Erro desconhecido",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
