import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getEngine, type Concurso, type CicloHistorico } from "../_shared/guide-post/index.ts";
import { getPersona } from "../_shared/guide-post/personas.ts";
import { getConfig } from "../_shared/guide-post/lottery-configs.ts";
import { chamarIAComRetry } from "../_shared/guide-post/ai-runner.ts";
import { montarRodapeProximoConcurso } from "../_shared/guide-post/glossario.ts";
import { getProximoConcursoReal } from "../_shared/proximo-concurso-helper.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// =============================================================================
// Cache em memória do próximo concurso por loteria.
// =============================================================================
type ProxConcursoCache = {
  numero_concurso: string | null;
  data_sorteio: string | null;
  premio_estimado: number | null;
  cachedAt: number;
};
const PROX_CACHE_TTL_MS = 10 * 60 * 1000;
const proxConcursoCache = new Map<string, ProxConcursoCache>();

async function getProximoConcursoCached(
  supabaseAdmin: any,
  loteria: string,
): Promise<ProxConcursoCache | null> {
  const now = Date.now();
  const hit = proxConcursoCache.get(loteria);
  if (hit && now - hit.cachedAt < PROX_CACHE_TTL_MS) return hit;
  const { data, error } = await supabaseAdmin
    .from("proximos_concursos")
    .select("numero_concurso, data_sorteio, premio_estimado")
    .eq("loteria", loteria)
    .maybeSingle();
  if (error || !data) return null;
  const entry: ProxConcursoCache = {
    numero_concurso: data.numero_concurso ?? null,
    data_sorteio: data.data_sorteio ?? null,
    premio_estimado: data.premio_estimado ?? null,
    cachedAt: now,
  };
  proxConcursoCache.set(loteria, entry);
  return entry;
}

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
    // Pré-geração: status='rascunho' + publicar_em
    const statusPedido: "rascunho" | "publicado" = body.status === "rascunho" ? "rascunho" : "publicado";
    const publicarEm: string | null = body.publicar_em || null;
    const force: boolean = !!body.force;

    console.log(`[generate-guide-post] tipo=${tipoPost} loteria=${loteria} status=${statusPedido}`);

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

    // 1. Lock idempotente: bloqueia se já existe RASCUNHO ou PUBLICADO do mesmo dia BRT
    if (!force) {
      const agora = new Date();
      const inicioDiaBRT = new Date(agora);
      inicioDiaBRT.setUTCHours(3, 0, 0, 0);
      if (agora.getTime() < inicioDiaBRT.getTime()) {
        inicioDiaBRT.setUTCDate(inicioDiaBRT.getUTCDate() - 1);
      }

      const { data: jaPostou } = await supabaseAdmin
        .from("postagens")
        .select("id, status")
        .eq("user_id", persona.perfil_id)
        .eq("tipo", tipoPost)
        .eq("loteria_tag", config.loteria_tag)
        .gte("created_at", inicioDiaBRT.toISOString())
        .limit(1)
        .maybeSingle();

      if (jaPostou) {
        console.log(`[generate-guide-post] ⏭️ Já existe (status=${jaPostou.status}) tipo=${tipoPost} loteria=${loteria}`);
        return new Response(
          JSON.stringify({ skipped: true, reason: "duplicate_today", postId: jaPostou.id, status: jaPostou.status }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    // 2. Buscar concursos + ciclos
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
    }

    // 3. Fatos determinísticos
    const fatos = engine.montarFatos(tipoPost, concursos, historicoCiclos);

    // 4. IA
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY não configurada");

    const userPrompt = engine.montarPrompt(tipoPost, fatos, ultimoConcurso);
    const proxConcurso = ultimoConcurso + 1;
    const titulo = engine.montarTituloDeterministico(tipoPost, proxConcurso);

    let conteudo = "";
    let viaFallback = false;
    let motivoFallback = "";

    const numerosPermitidos = engine.extrairNumerosPermitidos(concursos, proxConcurso, fatos.extras);
    const ia = await chamarIAComRetry(persona.system_prompt, userPrompt, apiKey);

    if (!ia.ok) {
      viaFallback = true;
      motivoFallback = `IA falhou: ${ia.status}`;
      conteudo = engine.fallbackConteudo(fatos);
    } else {
      const limiteConteudo = engine.limiteConteudo(tipoPost);
      const conteudoIA = engine.sanitizar(ia.content || "").substring(0, limiteConteudo);
      const validacao = engine.validarConteudoNumerico(conteudoIA, numerosPermitidos);

      if (!validacao.ok || conteudoIA.length < 50) {
        viaFallback = true;
        motivoFallback = validacao.motivo || "conteúdo curto";
        conteudo = engine.fallbackConteudo(fatos);
      } else {
        conteudo = conteudoIA;
        if (!conteudo.includes("Como montar") && !conteudo.includes("montar seu palpite")) {
          conteudo = (conteudo + `\n\n💡 Como montar seu palpite\n${fatos.recomendacaoDireta}\n\nLoteria envolve sorte.`).substring(0, limiteConteudo);
        }
      }

      if (ia.usage) {
        const pt = ia.usage.prompt_tokens || 0;
        const ct = ia.usage.completion_tokens || 0;
        const cost = (pt / 1e6) * 0.15 + (ct / 1e6) * 0.6;
        Promise.resolve(
          supabaseAdmin.from("ai_usage_logs").insert({
            bot_name: persona.nome,
            edge_function: "generate-guide-post",
            action_type: "post_analitico_comunidade",
            prompt_tokens: pt,
            completion_tokens: ct,
            total_tokens: ia.usage.total_tokens || pt + ct,
            model: "google/gemini-3-flash-preview",
            cost_usd: cost,
            metadata: { tipo_post: tipoPost, loteria, viaFallback, motivoFallback, status: statusPedido },
          })
        ).catch(() => {});
      }
    }

    // Rodapé universal
    try {
      const prox = await getProximoConcursoCached(supabaseAdmin, loteria);
      if (prox) {
        const rodape = montarRodapeProximoConcurso(
          config.loteria_tag,
          prox.numero_concurso,
          prox.data_sorteio,
          prox.premio_estimado,
        );
        if (rodape) conteudo = conteudo + rodape;
      }
    } catch (e) {
      console.warn(`[generate-guide-post] falha rodapé:`, e);
    }

    // Snapshot serializável dos fatos (chave para gerador-from-estudo)
    let baseGeracao = null as ReturnType<NonNullable<typeof engine.extrairBaseGeracao>> | null;
    try {
      if (typeof engine.extrairBaseGeracao === "function") {
        baseGeracao = engine.extrairBaseGeracao(tipoPost, concursos, historicoCiclos);
      }
    } catch (e) {
      console.warn(`[generate-guide-post] falha extrairBaseGeracao:`, e);
    }

    const fatosSnapshot = {
      loteria,
      loteria_tag: config.loteria_tag,
      tipo_post: tipoPost,
      ultimo_concurso: ultimoConcurso,
      proximo_concurso: proxConcurso,
      resumo: fatos.resumo,
      recomendacao_direta: fatos.recomendacaoDireta,
      extras: fatos.extras || {},
      numeros_permitidos: Array.from(numerosPermitidos),
      base_geracao: baseGeracao,
    };

    // 5. Inserir post
    const { data: novoPost, error: postError } = await supabaseAdmin
      .from("postagens")
      .insert({
        user_id: persona.perfil_id,
        titulo,
        conteudo,
        loteria_tag: config.loteria_tag,
        tipo: tipoPost,
        tema_estudo: tipoPost,
        status: statusPedido,
        publicar_em: publicarEm,
        fatos_snapshot: fatosSnapshot,
      })
      .select("id")
      .single();

    if (postError) throw new Error(`Erro ao inserir post: ${postError.message}`);

    console.log(`[generate-guide-post] ✅ Post ${novoPost.id} status=${statusPedido} tipo=${tipoPost}`);

    return new Response(
      JSON.stringify({
        success: true,
        postId: novoPost.id,
        status: statusPedido,
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
