import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PRIMOS_MEGASENA = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59];
const MOLDURA_MEGASENA = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
  11, 21, 31, 41,
  20, 30, 40, 50,
  51, 52, 53, 54, 55, 56, 57, 58, 59, 60
];
const FIBONACCI_MEGASENA = [1, 2, 3, 5, 8, 13, 21, 34, 55];

function isPar(n: number): boolean { return n % 2 === 0; }
function isPrimo(n: number): boolean { return PRIMOS_MEGASENA.includes(n); }
function isMoldura(n: number): boolean { return MOLDURA_MEGASENA.includes(n); }

function calcularIndicadores(dezenas: number[], dezenasAnteriores?: number[]) {
  const pares = dezenas.filter(isPar).length;
  const sorted = [...dezenas].sort((a, b) => a - b);
  let seqCount = 0;
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === sorted[i - 1] + 1) seqCount++;
  }
  return {
    qtd_pares: pares,
    qtd_impares: 6 - pares,
    qtd_primos: dezenas.filter(isPrimo).length,
    qtd_moldura: dezenas.filter(isMoldura).length,
    qtd_fibonacci: dezenas.filter(d => FIBONACCI_MEGASENA.includes(d)).length,
    qtd_repetidas: dezenasAnteriores ? dezenas.filter(d => dezenasAnteriores.includes(d)).length : 0,
    soma: dezenas.reduce((a, b) => a + b, 0),
    sequencias: seqCount,
  };
}

function converterDataBR(dataBR: string): string {
  const partes = dataBR.split("/");
  if (partes.length === 3) return `${partes[2]}-${partes[1]}-${partes[0]}`;
  return dataBR;
}

function extrairNumeroConcurso(r: any): number {
  if (typeof r.concurso === 'number') return r.concurso;
  if (typeof r.concurso === 'string') return parseInt(r.concurso, 10);
  if (typeof r.numero === 'number') return r.numero;
  if (typeof r.numero === 'string') return parseInt(r.numero, 10);
  if (typeof r.numero_concurso === 'number') return r.numero_concurso;
  if (typeof r.numero_concurso === 'string') return parseInt(r.numero_concurso, 10);
  return 0;
}

function extrairData(r: any): string {
  const campos = ['data', 'data_sorteio', 'dataApuracao', 'dataSorteio', 'data_concurso', 'dataConcurso'];
  for (const campo of campos) {
    if (r[campo] && typeof r[campo] === 'string') return converterDataBR(r[campo]);
  }
  return new Date().toISOString().split('T')[0];
}

const LOTERIA = "megasena";
const TABLE = "resultados_loterias";

// =============================================================================
// POST DE RESULTADO OFICIAL — MEGA-SENA (espelho do sync-lotofacil)
// =============================================================================

const AUGUSTO_PERFIL_ID = "41b58d48-2ef1-4bf7-a536-ed8a49607fa9";
const AUGUSTO_NOME = "Augusto Angelis";
const SYSTEM_PROMPT_RESULTADO_MEGA = `Você é Augusto Angelis, especialista em Mega-Sena da equipe Palpite Tech.
Tom acolhedor e direto, em primeira pessoa. Nunca mencione IA, bot, modelo, GPT ou Gemini.
Anuncie resultados oficiais com energia, didática e respeito ao jogador.`;

type IndicadoresMega = ReturnType<typeof calcularIndicadores>;

function validarNumerosResultadoMega(
  texto: string,
  permitido: { concurso: number; dezenas: number[]; indicadores: IndicadoresMega }
): { ok: boolean; motivo?: string } {
  const numerosPermitidos = new Set<number>([
    permitido.concurso,
    ...Object.values(permitido.indicadores),
  ]);

  // Números de 3+ dígitos (concurso/soma): TODOS devem estar na whitelist
  const matches3plus = texto.match(/\b\d{3,6}\b/g) || [];
  for (const m of matches3plus) {
    const n = parseInt(m, 10);
    if (!numerosPermitidos.has(n)) {
      return { ok: false, motivo: `Número não permitido encontrado: ${n}` };
    }
  }

  if (!texto.includes(String(permitido.concurso))) {
    return { ok: false, motivo: `Número do concurso ${permitido.concurso} ausente` };
  }

  // Dezenas zero-padded (01-60) devem estar entre as oficiais
  const dezenasOficiais = new Set(permitido.dezenas);
  const dezenasMatches = texto.match(/\b(0[1-9]|[1-5][0-9]|60)\b/g) || [];
  for (const dStr of dezenasMatches) {
    const d = parseInt(dStr, 10);
    if (dStr.startsWith("0") && !dezenasOficiais.has(d)) {
      return { ok: false, motivo: `Dezena ${dStr} citada não é oficial` };
    }
  }

  return { ok: true };
}

function montarConteudoFallbackResultadoMega(
  concurso: number,
  dezenas: number[],
  indicadores: IndicadoresMega,
  acumulou: boolean
): string {
  const dezenasFmt = dezenas.map(d => d.toString().padStart(2, "0")).join(" - ");
  const acumLinha = acumulou ? `\n💰 **ACUMULOU!** Vamos juntos no próximo.\n` : "";

  return `🚨 Saiu o resultado da Mega-Sena!
${acumLinha}
🎯 Dezenas sorteadas
**${dezenasFmt}**

📊 Raio-X
• Pares: **${indicadores.qtd_pares}** | Ímpares: **${indicadores.qtd_impares}**
• Moldura: **${indicadores.qtd_moldura}** dezenas
• Primos: **${indicadores.qtd_primos}** | Fibonacci: **${indicadores.qtd_fibonacci}**
• Repetidas: **${indicadores.qtd_repetidas}** do concurso anterior
• Soma: **${indicadores.soma}** | Sequências: **${indicadores.sequencias}**

💬 E aí, acertou quantas? Conta pra gente nos comentários!`.substring(0, 1000);
}

async function criarPostResultadoOficialMega(params: {
  supabase: any;
  concurso: number;
  dezenas: number[];
  indicadores: IndicadoresMega;
  acumulou: boolean;
}): Promise<void> {
  const { supabase, concurso, dezenas, indicadores, acumulou } = params;

  // Idempotência
  try {
    const { data: existingPost } = await supabase
      .from('postagens')
      .select('id')
      .eq('tipo', 'resultado_oficial')
      .eq('loteria_tag', 'Mega-Sena')
      .eq('titulo', `🚨 Resultado Mega-Sena — Concurso ${concurso}`)
      .maybeSingle();
    if (existingPost) {
      console.log(`[MEGA-RESULT-POST] Post já existe para concurso ${concurso}`);
      return;
    }
  } catch (e) {
    console.warn('[MEGA-RESULT-POST] Erro checando duplicidade:', e);
  }

  console.log(`[MEGA-RESULT-POST] Criando post de resultado para concurso ${concurso}`);

  const titulo = `🚨 Resultado Mega-Sena — Concurso ${concurso}`;
  let conteudo = "";
  let viaFallback = false;
  let motivoFallback = "";

  try {
    const dezenasFormatadas = dezenas.map(d => d.toString().padStart(2, "0")).join(" - ");
    const contextoResultado = `RESULTADO OFICIAL CONCURSO ${concurso}:
Dezenas: **${dezenasFormatadas}**
Pares: ${indicadores.qtd_pares} | Ímpares: ${indicadores.qtd_impares}
Moldura: ${indicadores.qtd_moldura} | Primos: ${indicadores.qtd_primos} | Fibonacci: ${indicadores.qtd_fibonacci}
Repetidas: ${indicadores.qtd_repetidas} | Soma: ${indicadores.soma} | Sequências: ${indicadores.sequencias}
${acumulou ? "💰 ACUMULOU!" : ""}`;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY ausente");

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT_RESULTADO_MEGA },
          {
            role: "user",
            content: `Crie APENAS o CONTEÚDO de um post anunciando o resultado da Mega-Sena.

${contextoResultado}

REGRAS CRÍTICAS:
- Use SOMENTE os números fornecidos acima. NÃO invente nem altere nenhum dígito.
- Não escreva o número do concurso de forma errada (deve ser exatamente ${concurso}).
- Use as 6 dezenas exatamente como listadas: ${dezenasFormatadas}
- Máximo 800 caracteres.

ESTRUTURA OBRIGATÓRIA:
🚨 Abertura curta com energia
🎯 Dezenas sorteadas (em **negrito**)
📊 Raio-X com bullets (Pares/Ímpares, Moldura, Primos, Repetidas)
${acumulou ? "💰 Linha sobre o acúmulo" : ""}
💬 Fechamento convidando à discussão

Responda APENAS o conteúdo (sem título, sem JSON), texto puro com emojis e markdown.`
          }
        ]
      }),
    });

    if (!aiResponse.ok) {
      throw new Error(`IA status ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const conteudoIA = (aiData.choices?.[0]?.message?.content || "").trim();
    const usage = aiData.usage;

    if (usage) {
      const pt = usage.prompt_tokens || 0;
      const ct = usage.completion_tokens || 0;
      const cost = (pt / 1e6) * 0.15 + (ct / 1e6) * 0.60;
      supabase.from("ai_usage_logs").insert({
        bot_name: AUGUSTO_NOME,
        edge_function: "sync-megasena",
        action_type: "plantao_resultado_oficial",
        prompt_tokens: pt,
        completion_tokens: ct,
        total_tokens: usage.total_tokens || (pt + ct),
        model: "google/gemini-3-flash-preview",
        cost_usd: cost,
        metadata: { concurso },
      }).then(() => {}).catch((e: any) => console.error("[MEGA-RESULT-POST] Erro log IA:", e));
    }

    const validacao = validarNumerosResultadoMega(conteudoIA, {
      concurso,
      dezenas,
      indicadores,
    });

    if (!validacao.ok || conteudoIA.length < 50) {
      throw new Error(`Validação falhou: ${validacao.motivo || "conteúdo muito curto"}`);
    }

    conteudo = conteudoIA.substring(0, 1000);
  } catch (err) {
    viaFallback = true;
    motivoFallback = err instanceof Error ? err.message : String(err);
    console.warn(`[MEGA-RESULT-POST] ⚠️ Usando fallback determinístico: ${motivoFallback}`);
    conteudo = montarConteudoFallbackResultadoMega(concurso, dezenas, indicadores, acumulou);
  }

  try {
    const { data: newPost, error: postError } = await supabase
      .from("postagens")
      .insert({
        user_id: AUGUSTO_PERFIL_ID,
        titulo: titulo.substring(0, 100),
        conteudo: conteudo.substring(0, 1000),
        loteria_tag: "Mega-Sena",
        tipo: "resultado_oficial",
        // concurso_referencia omitido: FK aponta para 'resultados' (Lotofácil legacy)
        metadata: { concurso, indicadores, dezenas, viaFallback, motivoFallback }
      })
      .select("id")
      .single();

    if (postError) {
      console.error(`[MEGA-RESULT-POST] ❌ Erro ao criar post:`, postError.message);
      return;
    }

    console.log(`[MEGA-RESULT-POST] ✅ Post ${newPost.id} criado (fallback=${viaFallback})`);
  } catch (err) {
    console.error(`[MEGA-RESULT-POST] ❌ Erro ao inserir:`, err);
  }
}

function parseApiResponse(raw: any): any {
  return Array.isArray(raw) ? raw[0] : raw;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const API_TOKEN = Deno.env.get("LOTOFACIL_API_TOKEN");
    if (!API_TOKEN) throw new Error("LOTOFACIL_API_TOKEN não configurado");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Query params (suporta ?force_post=true)
    const url = new URL(req.url);
    const forcePostParam = url.searchParams.get('force_post') === 'true';

    let fromLatest = false;
    let limit = 50;
    let concursoEspecifico: number | null = null;
    let forcePost = forcePostParam;
    try {
      const body = await req.json();
      fromLatest = body.from_latest === true;
      limit = body.limit || 50;
      concursoEspecifico = body.concurso || null;
      if (body.force_post === true) forcePost = true;
    } catch { /* defaults */ }

    function buildRegistro(resultado: any, dezenas: number[], indicadores: ReturnType<typeof calcularIndicadores>) {
      return {
        loteria: LOTERIA,
        concurso: extrairNumeroConcurso(resultado),
        data_sorteio: extrairData(resultado),
        dezenas,
        acumulou: resultado.acumulou ?? false,
        valor_acumulado: resultado.valor_acumulado || null,
        valor_estimado_proximo: resultado.valor_estimado_proximo || null,
        local_sorteio: resultado.local_sorteio || null,
        premiacao_json: resultado.premiacao || [],
        locais_ganhadores: resultado.ganhadores || [],
        ...indicadores,
      };
    }

    // ========== FORCE POST: gera post para o último concurso já no banco ==========
    if (forcePost && !concursoEspecifico && !fromLatest) {
      const { data: ultimo } = await supabase
        .from(TABLE)
        .select("concurso, dezenas, qtd_pares, qtd_impares, qtd_primos, qtd_moldura, qtd_fibonacci, qtd_repetidas, soma, sequencias, acumulou")
        .eq("loteria", LOTERIA)
        .order("concurso", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (ultimo) {
        await criarPostResultadoOficialMega({
          supabase,
          concurso: ultimo.concurso,
          dezenas: ultimo.dezenas,
          indicadores: {
            qtd_pares: ultimo.qtd_pares ?? 0,
            qtd_impares: ultimo.qtd_impares ?? 0,
            qtd_primos: ultimo.qtd_primos ?? 0,
            qtd_moldura: ultimo.qtd_moldura ?? 0,
            qtd_fibonacci: ultimo.qtd_fibonacci ?? 0,
            qtd_repetidas: ultimo.qtd_repetidas ?? 0,
            soma: ultimo.soma ?? 0,
            sequencias: ultimo.sequencias ?? 0,
          },
          acumulou: ultimo.acumulou ?? false,
        });

        return new Response(
          JSON.stringify({ message: "Post forçado executado", concurso: ultimo.concurso }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ message: "Nenhum concurso encontrado para force_post" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── SYNC NORMAL ────────────────────────────────────────────
    const latestUrl = `https://apiloterias.com.br/app/v2/resultado?loteria=megasena&token=${API_TOKEN}&concurso=ultimos1`;
    console.log("Buscando último concurso da API...");
    const apiResponse = await fetch(latestUrl);
    if (!apiResponse.ok) throw new Error(`Erro ao buscar API: ${apiResponse.status}`);
    const ultimoResultado = parseApiResponse(await apiResponse.json());
    const ultimoConcursoAPI = extrairNumeroConcurso(ultimoResultado);
    console.log("API response keys:", Object.keys(ultimoResultado).join(", "));
    console.log("Último concurso API:", ultimoConcursoAPI);

    // Concurso específico
    if (concursoEspecifico) {
      const concursoUrl = `https://apiloterias.com.br/app/v2/resultado?loteria=megasena&token=${API_TOKEN}&concurso=${concursoEspecifico}`;
      const res = await fetch(concursoUrl);
      if (!res.ok) throw new Error(`Erro ao buscar concurso ${concursoEspecifico}: ${res.status}`);
      const resultado = parseApiResponse(await res.json());
      const dezenas = resultado.dezenas.map((d: string) => parseInt(d, 10)).sort((a: number, b: number) => a - b);

      const { data: anterior } = await supabase
        .from(TABLE).select("dezenas")
        .eq("loteria", LOTERIA).eq("concurso", concursoEspecifico - 1)
        .maybeSingle();

      const indicadores = calcularIndicadores(dezenas, anterior?.dezenas || []);
      const reg = buildRegistro(resultado, dezenas, indicadores);

      const { error } = await supabase.from(TABLE).upsert(reg, { onConflict: "loteria,concurso" });
      if (error) throw new Error(`Erro ao inserir: ${error.message}`);

      // Se forcePost, criar também o post
      if (forcePost) {
        await criarPostResultadoOficialMega({
          supabase,
          concurso: concursoEspecifico,
          dezenas,
          indicadores,
          acumulou: resultado.acumulou ?? false,
        });
      }

      return new Response(
        JSON.stringify({ message: "Concurso sincronizado", concurso: concursoEspecifico }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Definir quais concursos buscar
    let concursosParaBuscar: number[] = [];

    if (fromLatest) {
      for (let i = ultimoConcursoAPI; i > ultimoConcursoAPI - limit && i > 0; i--) {
        const { data: existe } = await supabase
          .from(TABLE).select("concurso")
          .eq("loteria", LOTERIA).eq("concurso", i)
          .maybeSingle();
        if (!existe) concursosParaBuscar.push(i);
      }
      concursosParaBuscar = concursosParaBuscar.sort((a, b) => a - b);
    } else {
      const { data: ultimoLocal } = await supabase
        .from(TABLE).select("concurso")
        .eq("loteria", LOTERIA)
        .order("concurso", { ascending: false })
        .limit(1).maybeSingle();

      const ultimoConcursoLocal = ultimoLocal?.concurso || 0;
      console.log("Último concurso local:", ultimoConcursoLocal);

      if (ultimoConcursoAPI <= ultimoConcursoLocal) {
        return new Response(
          JSON.stringify({ message: "Já está atualizado", ultimo_concurso: ultimoConcursoLocal }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      for (let i = ultimoConcursoLocal + 1; i <= ultimoConcursoAPI; i++) {
        concursosParaBuscar.push(i);
        if (concursosParaBuscar.length >= limit) break;
      }
    }

    if (concursosParaBuscar.length === 0) {
      return new Response(
        JSON.stringify({ message: "Já está atualizado", ultimo_concurso: ultimoConcursoAPI }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Buscando ${concursosParaBuscar.length} concursos...`);

    // Histórico para calcular repetidas
    const { data: historico } = await supabase
      .from(TABLE).select("concurso, dezenas")
      .eq("loteria", LOTERIA)
      .order("concurso", { ascending: false }).limit(5);

    const historicoMap = new Map<number, number[]>();
    historico?.forEach(h => historicoMap.set(h.concurso, h.dezenas));

    const resultadosParaInserir: any[] = [];

    for (const concursoId of concursosParaBuscar) {
      try {
        let resultado;
        if (concursoId === ultimoConcursoAPI) {
          resultado = ultimoResultado;
        } else {
          const concursoUrl = `https://apiloterias.com.br/app/v2/resultado?loteria=megasena&token=${API_TOKEN}&concurso=${concursoId}`;
          const res = await fetch(concursoUrl);
          if (!res.ok) { console.error(`Erro ao buscar concurso ${concursoId}: ${res.status}`); continue; }
          resultado = parseApiResponse(await res.json());
        }

        const dezenas = resultado.dezenas.map((d: string) => parseInt(d, 10)).sort((a: number, b: number) => a - b);
        const dezenasAnteriores = historicoMap.get(concursoId - 1) || [];
        const indicadores = calcularIndicadores(dezenas, dezenasAnteriores);
        resultadosParaInserir.push(buildRegistro(resultado, dezenas, indicadores));
        historicoMap.set(concursoId, dezenas);
        await new Promise(resolve => setTimeout(resolve, 300));
      } catch (err) {
        console.error(`Erro ao buscar concurso ${concursoId}:`, err);
      }
    }

    if (resultadosParaInserir.length > 0) {
      const { error } = await supabase
        .from(TABLE).upsert(resultadosParaInserir, { onConflict: "loteria,concurso" });
      if (error) throw new Error(`Erro ao inserir: ${error.message}`);
    }

    const ultimoConcursoInserido = resultadosParaInserir.length > 0
      ? resultadosParaInserir[resultadosParaInserir.length - 1]?.concurso
      : ultimoConcursoAPI;

    // ===== POST DE RESULTADO OFICIAL (apenas para o concurso mais novo, evita flood) =====
    if (resultadosParaInserir.length > 0 && resultadosParaInserir.length <= 2) {
      const ultimoReg = resultadosParaInserir[resultadosParaInserir.length - 1];
      try {
        await criarPostResultadoOficialMega({
          supabase,
          concurso: ultimoReg.concurso,
          dezenas: ultimoReg.dezenas,
          indicadores: {
            qtd_pares: ultimoReg.qtd_pares,
            qtd_impares: ultimoReg.qtd_impares,
            qtd_primos: ultimoReg.qtd_primos,
            qtd_moldura: ultimoReg.qtd_moldura,
            qtd_fibonacci: ultimoReg.qtd_fibonacci,
            qtd_repetidas: ultimoReg.qtd_repetidas,
            soma: ultimoReg.soma,
            sequencias: ultimoReg.sequencias,
          },
          acumulou: ultimoReg.acumulou ?? false,
        });
      } catch (e) {
        console.error('[sync-megasena] Erro ao criar post de resultado:', e);
      }
    }

    // Push notification
    if (resultadosParaInserir.length === 1) {
      const webhookSecret = Deno.env.get('NOTIFICATIONS_WEBHOOK_SECRET');
      const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
      if (webhookSecret && supabaseAnonKey) {
        try {
          const fnUrl = `${supabaseUrl}/functions/v1/send-push`;
          const res = await fetch(fnUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${supabaseAnonKey}`, 'x-webhook-secret': webhookSecret },
            body: JSON.stringify({
              tipo: 'resultado_novo',
              titulo: 'Resultado Mega Sena',
              mensagem: `Concurso ${ultimoConcursoInserido} disponível! Confira agora.`,
              loteria: 'megasena',
              concurso_id: ultimoConcursoInserido,
            }),
          });
          if (res.ok) console.log(`[PUSH] ✅ Push enviado para Mega Sena concurso ${ultimoConcursoInserido}`);
          else { const text = await res.text().catch(() => ''); console.error(`[PUSH] Falha: ${res.status} ${text}`); }
        } catch (e) { console.error('[PUSH] Erro:', e); }
      }
    }

    // Fire and forget: sync próximos concursos
    const syncProximosSecret = Deno.env.get('NOTIFICATIONS_WEBHOOK_SECRET');
    if (syncProximosSecret) {
      fetch(`${supabaseUrl}/functions/v1/sync-proximos-concursos?secret=${syncProximosSecret}`, { method: 'POST' })
        .catch(err => console.error('[sync-megasena] Erro ao atualizar proximos:', err));
    }

    // Fire and forget: pré-gerar rascunhos do dia
    if (resultadosParaInserir.length > 0) {
      fetch(`${supabaseUrl}/functions/v1/precompute-daily-posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        },
        body: JSON.stringify({ loteria: 'megasena' }),
      }).catch(err => console.error('[sync-megasena] Erro ao pré-gerar posts:', err));
    }

    return new Response(
      JSON.stringify({ message: "Sincronização concluída", api: "apiloterias.com.br", inseridos: resultadosParaInserir.length, ultimo_concurso: ultimoConcursoInserido }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Erro na sincronização:", error);
    return new Response(
      JSON.stringify({ error: error?.message ?? String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
