import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getEngine, type Concurso, type CicloHistorico } from "../_shared/guide-post/index.ts";
import { getPersona } from "../_shared/guide-post/personas.ts";
import { getConfig } from "../_shared/guide-post/lottery-configs.ts";
import { chamarIAComRetry } from "../_shared/guide-post/ai-runner.ts";
import { montarRodapeProximoConcurso } from "../_shared/guide-post/glossario.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  let tipoPost = "geral";
  let loteria = "lotofacil";

  try {
    const body = await req.json().catch(() => ({}));
    tipoPost = body.tipo_post || "geral";
    loteria = body.loteria || "lotofacil";
    console.log(`[generate-guide-post] tipo=${tipoPost} loteria=${loteria}`);

    // Resolver engine + persona + config (lança erro se loteria desconhecida)
    const config = getConfig(loteria);
    const persona = getPersona(loteria);
    const engine = getEngine(loteria);

    if (!engine.tiposSuportados().includes(tipoPost)) {
      return new Response(
        JSON.stringify({
          error: `Tipo "${tipoPost}" não suportado para loteria=${loteria}`,
          tipos_suportados: engine.tiposSuportados(),
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 1. Lock de duplicação por (persona, tipo, dia BRT)
    const agora = new Date();
    const inicioDiaBRT = new Date(agora);
    inicioDiaBRT.setUTCHours(3, 0, 0, 0); // 00h BRT = 03h UTC
    if (agora.getTime() < inicioDiaBRT.getTime()) {
      inicioDiaBRT.setUTCDate(inicioDiaBRT.getUTCDate() - 1);
    }

    const { data: jaPostou } = await supabaseAdmin
      .from("postagens")
      .select("id, created_at")
      .eq("user_id", persona.perfil_id)
      .eq("tipo", tipoPost)
      .eq("loteria_tag", config.loteria_tag)
      .gte("created_at", inicioDiaBRT.toISOString())
      .limit(1)
      .maybeSingle();

    if (jaPostou) {
      console.log(`[generate-guide-post] ⏭️ Já postou tipo=${tipoPost} loteria=${loteria} hoje (post ${jaPostou.id})`);
      return new Response(
        JSON.stringify({ skipped: true, reason: "duplicate_today", postId: jaPostou.id }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 2. Buscar últimos N concursos + (paralelo) histórico completo de ciclos quando for analise_ciclo
    const [resResp, ciclosResp] = await Promise.all([
      supabaseAdmin
        .from("resultados_loterias")
        .select("concurso_id:concurso, dezenas, data_sorteio, ciclo_numero, dezenas_faltantes_ciclo, qtd_pares, qtd_impares, qtd_repetidas, qtd_primos, qtd_moldura")
        .eq("loteria", config.loteria)
        .order("concurso", { ascending: false })
        .limit(config.periodo_analise),
      tipoPost === "analise_ciclo"
        ? supabaseAdmin
            .from("resultados_loterias")
            .select("ciclo_numero")
            .eq("loteria", config.loteria)
            .not("ciclo_numero", "is", null)
        : Promise.resolve({ data: null, error: null }),
    ]);

    const { data: resultados, error: resErr } = resResp;
    if (resErr || !resultados || resultados.length === 0) {
      throw new Error(`Erro ao buscar resultados: ${resErr?.message || "vazio"}`);
    }

    const concursos = resultados as unknown as Concurso[];
    const ultimoConcurso = concursos[0].concurso_id;

    // Agrupa histórico de ciclos { ciclo_numero -> duracao }
    let historicoCiclos: CicloHistorico[] | undefined;
    if (tipoPost === "analise_ciclo" && ciclosResp.data) {
      const cnt = new Map<number, number>();
      for (const row of ciclosResp.data as Array<{ ciclo_numero: number | null }>) {
        if (row.ciclo_numero == null) continue;
        cnt.set(row.ciclo_numero, (cnt.get(row.ciclo_numero) || 0) + 1);
      }
      historicoCiclos = Array.from(cnt.entries()).map(([ciclo_numero, duracao]) => ({
        ciclo_numero,
        duracao,
      }));
      console.log(`[generate-guide-post] ciclos carregados: ${historicoCiclos.length}`);
    }

    // 3. Calcular fatos determinísticos via engine
    const fatos = engine.montarFatos(tipoPost, concursos, historicoCiclos);

    // 4. Chamar IA com retry
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY não configurada");

    const userPrompt = engine.montarPrompt(tipoPost, fatos, ultimoConcurso);
    const proxConcurso = ultimoConcurso + 1;

    // ===== TÍTULO 100% DETERMINÍSTICO =====
    const titulo = engine.montarTituloDeterministico(tipoPost, proxConcurso);

    // ===== CONTEÚDO: IA + validação anti-alucinação + fallback =====
    let conteudo = "";
    let viaFallback = false;
    let motivoFallback = "";

    const numerosPermitidos = engine.extrairNumerosPermitidos(concursos, proxConcurso, fatos.extras);
    const ia = await chamarIAComRetry(persona.system_prompt, userPrompt, apiKey);

    if (!ia.ok) {
      viaFallback = true;
      motivoFallback = `IA falhou: ${ia.status}`;
      console.warn(`[generate-guide-post] ⚠️ ${motivoFallback}`);
      conteudo = engine.fallbackConteudo(fatos);
    } else {
      const limiteConteudo = engine.limiteConteudo(tipoPost);
      const conteudoIA = engine.sanitizar(ia.content || "").substring(0, limiteConteudo);
      const validacao = engine.validarConteudoNumerico(conteudoIA, numerosPermitidos);

      if (!validacao.ok || conteudoIA.length < 50) {
        viaFallback = true;
        motivoFallback = validacao.motivo || "conteúdo curto";
        console.warn(`[generate-guide-post] ⚠️ Fallback: ${motivoFallback}`);
        conteudo = engine.fallbackConteudo(fatos);
      } else {
        conteudo = conteudoIA;
        // Guardrail: garante que a recomendação direta apareça
        if (!conteudo.includes("Como montar") && !conteudo.includes("montar seu palpite")) {
          conteudo = (conteudo + `\n\n💡 Como montar seu palpite\n${fatos.recomendacaoDireta}\n\nLoteria envolve sorte.`).substring(0, limiteConteudo);
        }
      }

      // Log de uso de IA
      if (ia.usage) {
        const pt = ia.usage.prompt_tokens || 0;
        const ct = ia.usage.completion_tokens || 0;
        const cost = (pt / 1e6) * 0.15 + (ct / 1e6) * 0.6;
        supabaseAdmin.from("ai_usage_logs").insert({
          bot_name: persona.nome,
          edge_function: "generate-guide-post",
          action_type: "post_analitico_comunidade",
          prompt_tokens: pt,
          completion_tokens: ct,
          total_tokens: ia.usage.total_tokens || pt + ct,
          model: "google/gemini-3-flash-preview",
          cost_usd: cost,
          metadata: { tipo_post: tipoPost, loteria, viaFallback, motivoFallback },
        }).then(() => {}).catch(() => {});
      }
    }

    // 4.5. Rodapé universal: dados do próximo concurso (todas as loterias)
    try {
      const { data: prox } = await supabaseAdmin
        .from("proximos_concursos")
        .select("numero_concurso, data_sorteio, premio_estimado")
        .eq("loteria", loteria)
        .maybeSingle();

      if (prox) {
        const rodape = montarRodapeProximoConcurso(
          config.loteria_tag,
          prox.numero_concurso,
          prox.data_sorteio,
          prox.premio_estimado,
        );
        // Anexa sem cortar (limite por engine já foi aplicado; rodapé é informacional)
        if (rodape) conteudo = conteudo + rodape;
      } else {
        console.log(`[generate-guide-post] sem registro em proximos_concursos para ${loteria}`);
      }
    } catch (e) {
      console.warn(`[generate-guide-post] falha ao montar rodapé proximo_concurso:`, e);
    }

    // 5. Inserir post (autor = persona da loteria)
    const { data: novoPost, error: postError } = await supabaseAdmin
      .from("postagens")
      .insert({
        user_id: persona.perfil_id,
        titulo,
        conteudo,
        loteria_tag: config.loteria_tag,
        tipo: tipoPost,
      })
      .select("id")
      .single();

    if (postError) throw new Error(`Erro ao inserir post: ${postError.message}`);

    console.log(`[generate-guide-post] ✅ Post ${novoPost.id} tipo=${tipoPost} loteria=${loteria} fallback=${viaFallback}`);

    return new Response(
      JSON.stringify({
        success: true,
        postId: novoPost.id,
        autor: persona.nome,
        loteria,
        tipo_post: tipoPost,
        titulo,
        viaFallback,
        ultimo_concurso: ultimoConcurso,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("[generate-guide-post] Erro:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Erro desconhecido",
        tipo_post: tipoPost,
        loteria,
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
