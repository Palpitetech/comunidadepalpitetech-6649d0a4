import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// =============================================================================
// CONSTANTES LOTOFÁCIL - ÚNICA VERDADE (replicadas do frontend)
// =============================================================================

const MOLDURA_LOTOFACIL = [1, 2, 3, 4, 5, 6, 10, 11, 15, 16, 20, 21, 22, 23, 24, 25];
const PRIMOS_LOTOFACIL = [2, 3, 5, 7, 11, 13, 17, 19, 23];
const FIBONACCI_LOTOFACIL = [1, 2, 3, 5, 8, 13, 21];
const TOTAL_DEZENAS = 25;

// =============================================================================
// CORS HEADERS
// =============================================================================

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// =============================================================================
// NOTIFICAÇÕES (resultado novo)
// =============================================================================

function shouldNotifyResultadoNovo(url: URL): boolean {
  const notify = url.searchParams.get('notify');
  if (notify === 'false') return false;

  // Evita notificar em cargas históricas (ultimosN, N > 1)
  const quantidade = url.searchParams.get('quantidade');
  if (quantidade) {
    const n = Number(quantidade);
    if (!Number.isNaN(n) && n > 1) return false;
  }
  return true;
}

async function dispararPushResultadoNovo(params: {
  supabaseUrl: string;
  authBearer: string;
  webhookSecret: string | undefined;
  concurso: number;
  loteria: string;
}) {
  const { supabaseUrl, authBearer, webhookSecret, concurso, loteria } = params;
  if (!webhookSecret) return;

  try {
    const fnUrl = `${supabaseUrl}/functions/v1/send-push`;
    const res = await fetch(fnUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authBearer}`,
        'x-webhook-secret': webhookSecret,
      },
      body: JSON.stringify({
        tipo: 'resultado_novo',
        titulo: `Resultado ${loteria}`,
        mensagem: `Concurso ${concurso} disponível! Confira agora.`,
        loteria,
        concurso_id: concurso,
      }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      console.error(`[PUSH] Falha: ${res.status} ${text}`);
    } else {
      console.log(`[PUSH] ✅ Push enviado para ${loteria} concurso ${concurso}`);
    }
  } catch (e) {
    console.error(`[PUSH] Erro:`, e);
  }
}

async function dispararNotificacaoResultadoNovo(params: {
  supabaseUrl: string;
  authBearer: string;
  webhookSecret: string | undefined;
  concurso: number;
}) {
  const { supabaseUrl, authBearer, webhookSecret, concurso } = params;

  if (!webhookSecret) {
    console.warn('[NOTIFY] NOTIFICATIONS_WEBHOOK_SECRET não configurado; pulando disparo.');
    return;
  }

  const fnUrl = `${supabaseUrl}/functions/v1/send-notifications`;
  const body = {
    titulo: 'Resultado Lotofácil',
    mensagem: `Resultado da Lotofácil Concurso ${concurso} disponível! Confira as dezenas e as dezenas faltantes do ciclo no nosso app.`,
    tipo_disparo: 'resultado_novo',
    concurso_id: concurso,
  };

  const res = await fetch(fnUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // JWT (anon) para satisfazer validação padrão (se existir) + rastreabilidade
      Authorization: `Bearer ${authBearer}`,
      'x-webhook-secret': webhookSecret,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Falha ao chamar send-notifications: ${res.status} ${text}`);
  }
}

// Cria o post de resultado oficial (Augusto Angelis como autor único)
const AUGUSTO_PERFIL_ID = "41b58d48-2ef1-4bf7-a536-ed8a49607fa9";
const AUGUSTO_NOME = "Augusto Angelis";
const SYSTEM_PROMPT_RESULTADO = `Você é Augusto Angelis, especialista em Lotofácil da equipe Palpite Tech.
Tom acolhedor e direto, em primeira pessoa. Nunca mencione IA, bot, modelo, GPT ou Gemini.
Anuncie resultados oficiais com energia, didática e respeito ao jogador.`;

// Validador anti-alucinação: garante que o conteúdo da IA não inventou números.
// Retorna true se o texto contém apenas números permitidos.
function validarNumerosResultado(
  texto: string,
  permitido: { concurso: number; dezenas: number[]; indicadores: Record<string, number>; cicloNumero: number; faltantesCount: number }
): { ok: boolean; motivo?: string } {
  // Lista branca: concurso + ciclo + indicadores + faltantes count + dezenas (1-25, formato livre)
  const numerosPermitidos = new Set<number>([
    permitido.concurso,
    permitido.cicloNumero,
    permitido.faltantesCount,
    ...Object.values(permitido.indicadores),
  ]);

  // Números de 3-5 dígitos (concurso/ciclo): TODOS devem estar na whitelist
  const matches3plus = texto.match(/\b\d{3,5}\b/g) || [];
  for (const m of matches3plus) {
    const n = parseInt(m, 10);
    if (!numerosPermitidos.has(n)) {
      return { ok: false, motivo: `Número não permitido encontrado: ${n}` };
    }
  }

  // Concurso DEVE aparecer pelo menos uma vez
  if (!texto.includes(String(permitido.concurso))) {
    return { ok: false, motivo: `Número do concurso ${permitido.concurso} ausente` };
  }

  // Dezenas de 1-2 dígitos: validar que toda dezena "01-25" citada esteja entre as oficiais
  // (regex captura padrões tipo "01", "02"... evitando capturar "1" solto que pode ser contagem)
  const dezenasOficiais = new Set(permitido.dezenas);
  const dezenasMatches = texto.match(/\b(0[1-9]|1[0-9]|2[0-5])\b/g) || [];
  for (const dStr of dezenasMatches) {
    const d = parseInt(dStr, 10);
    // Permite indicadores (que podem coincidir 01-25) — só rejeita se aparecer formatado como dezena (com zero à esquerda) e não estiver entre as oficiais E não for indicador
    if (dStr.startsWith("0") && !dezenasOficiais.has(d)) {
      return { ok: false, motivo: `Dezena ${dStr} citada não é oficial` };
    }
  }

  return { ok: true };
}

// Fallback determinístico: monta o conteúdo do post sem IA
function montarConteudoFallbackResultado(
  concurso: number,
  dezenas: number[],
  indicadores: { qtd_pares: number; qtd_impares: number; qtd_moldura: number; qtd_primos: number; qtd_repetidas: number },
  cicloInfo: { ciclo_numero: number; dezenas_faltantes_ciclo: number[] },
  acumulou: boolean
): string {
  const dezenasFmt = dezenas.map(d => d.toString().padStart(2, "0")).join(" - ");
  const faltantesFmt = cicloInfo.dezenas_faltantes_ciclo.map(d => d.toString().padStart(2, "0")).join(", ");
  const cicloLinha = cicloInfo.dezenas_faltantes_ciclo.length === 0
    ? `Ciclo **fechado**! Novo ciclo começa agora.`
    : `Faltam **${cicloInfo.dezenas_faltantes_ciclo.length}** dezenas: [${faltantesFmt}]${cicloInfo.dezenas_faltantes_ciclo.length <= 3 ? " ⚡ Quase fechando!" : ""}`;
  const acumLinha = acumulou ? `\n💰 **ACUMULOU!** Vamos juntos no próximo.\n` : "";

  return `🚨 Saiu o resultado da Lotofácil!
${acumLinha}
🎯 Dezenas sorteadas
**${dezenasFmt}**

📊 Raio-X
• Pares: **${indicadores.qtd_pares}** | Ímpares: **${indicadores.qtd_impares}**
• Moldura: **${indicadores.qtd_moldura}** dezenas
• Primos: **${indicadores.qtd_primos}**
• Repetidas: **${indicadores.qtd_repetidas}** do concurso anterior

🔄 Ciclo
${cicloLinha}

💬 E aí, acertou quantas? Conta pra gente nos comentários!`.substring(0, 1000);
}

// Recalcula e atualiza o footer "Próximo concurso" no post 'resultado_oficial'
// MAIS RECENTE da Lotofácil. Idempotente.
async function refreshFooterProximoConcursoLoto(supabase: any): Promise<void> {
  try {
    const { data: prox } = await supabase
      .from("proximos_concursos")
      .select("numero_concurso, data_sorteio, premio_estimado")
      .eq("loteria", "lotofacil")
      .maybeSingle();
    if (!prox) return;

    const partes: string[] = [];
    if (prox.numero_concurso) partes.push(`Concurso ${prox.numero_concurso}`);
    if (prox.data_sorteio) {
      const [y, m, d] = String(prox.data_sorteio).split("-");
      if (y && m && d) partes.push(`📅 ${d}/${m}/${y}`);
    }
    if (prox.premio_estimado) {
      const num = Number(prox.premio_estimado);
      if (num && !Number.isNaN(num) && num > 0) {
        const formatado = num.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
        partes.push(`💰 Prêmio estimado: **${formatado}**`);
      }
    }
    if (partes.length === 0) return;
    const footer = `---\n🎯 **Próximo concurso** — ${partes.join(" • ")}`;

    const { data: post } = await supabase
      .from("postagens")
      .select("id, conteudo")
      .eq("tipo", "resultado_oficial")
      .eq("loteria_tag", "Lotofácil")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!post) return;

    const FOOTER_RE = /\n*---\n🎯 \*\*Próximo concurso\*\*[\s\S]*$/;
    const base = String(post.conteudo || "").replace(FOOTER_RE, "").trimEnd();
    const novoConteudo = `${base}\n\n${footer}`.substring(0, 1000);
    if (novoConteudo === post.conteudo) return;

    const { error } = await supabase
      .from("postagens")
      .update({ conteudo: novoConteudo })
      .eq("id", post.id);
    if (error) console.warn("[LOTO-FOOTER-REFRESH] Erro update:", error.message);
    else console.log(`[LOTO-FOOTER-REFRESH] ✅ Footer atualizado em post ${post.id}`);
  } catch (e) {
    console.warn("[LOTO-FOOTER-REFRESH] Erro:", e);
  }
}

async function criarPostResultadoOficial(params: {
  supabase: any;
  concurso: number;
  dezenas: number[];
  indicadores: { qtd_pares: number; qtd_impares: number; qtd_moldura: number; qtd_primos: number; qtd_repetidas: number };
  cicloInfo: { ciclo_numero: number; dezenas_faltantes_ciclo: number[] };
  acumulou: boolean;
}): Promise<void> {
  const { supabase, concurso, dezenas, indicadores, cicloInfo, acumulou } = params;

  console.log(`[RESULT-POST] Criando post de resultado para concurso ${concurso}`);

  // ===== TÍTULO 100% DETERMINÍSTICO (impossível alucinar) =====
  const titulo = `🚨 Resultado Lotofácil — Concurso ${concurso}`;

  // ===== CONTEÚDO: tenta IA, valida; se falhar usa fallback =====
  let conteudo = "";
  let viaFallback = false;
  let motivoFallback = "";

  try {
    const dezenasFormatadas = dezenas.map(d => d.toString().padStart(2, "0")).join(" - ");
    const faltantes = cicloInfo.dezenas_faltantes_ciclo.map(d => d.toString().padStart(2, "0")).join(", ");

    const contextoResultado = `RESULTADO OFICIAL CONCURSO ${concurso}:
Dezenas: **${dezenasFormatadas}**
Pares: ${indicadores.qtd_pares} | Ímpares: ${indicadores.qtd_impares}
Moldura: ${indicadores.qtd_moldura} | Primos: ${indicadores.qtd_primos}
Repetidas: ${indicadores.qtd_repetidas}
Ciclo: ${cicloInfo.ciclo_numero} | Faltantes: [${faltantes}]${cicloInfo.dezenas_faltantes_ciclo.length <= 3 ? " ⚡ Quase fechando!" : ""}
${acumulou ? "💰 ACUMULOU!" : ""}`;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY ausente");
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
          { role: "system", content: SYSTEM_PROMPT_RESULTADO },
          {
            role: "user",
            content: `Crie APENAS o CONTEÚDO de um post anunciando o resultado da Lotofácil.

${contextoResultado}

REGRAS CRÍTICAS:
- Use SOMENTE os números fornecidos acima. NÃO invente nem altere nenhum dígito.
- Não escreva o número do concurso de forma errada (deve ser exatamente ${concurso}).
- Use as 15 dezenas exatamente como listadas: ${dezenasFormatadas}
- Máximo 800 caracteres.

ESTRUTURA OBRIGATÓRIA:
🚨 Abertura curta com energia
🎯 Dezenas sorteadas (em **negrito**)
📊 Raio-X com bullets (Pares/Ímpares, Moldura, Primos, Repetidas)
🔄 Ciclo (status atual)
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
        edge_function: "sync-lotofacil",
        action_type: "plantao_resultado_oficial",
        prompt_tokens: pt,
        completion_tokens: ct,
        total_tokens: usage.total_tokens || (pt + ct),
        model: "google/gemini-3-flash-preview",
        cost_usd: cost,
        metadata: { concurso },
      }).then(() => {}).catch((e: any) => console.error("[RESULT-POST] Erro log IA:", e));
    }

    // Validação anti-alucinação
    const validacao = validarNumerosResultado(conteudoIA, {
      concurso,
      dezenas,
      indicadores: indicadores as unknown as Record<string, number>,
      cicloNumero: cicloInfo.ciclo_numero,
      faltantesCount: cicloInfo.dezenas_faltantes_ciclo.length,
    });

    if (!validacao.ok || conteudoIA.length < 50) {
      throw new Error(`Validação falhou: ${validacao.motivo || "conteúdo muito curto"}`);
    }

    conteudo = conteudoIA.substring(0, 1000);
  } catch (err) {
    viaFallback = true;
    motivoFallback = err instanceof Error ? err.message : String(err);
    console.warn(`[RESULT-POST] ⚠️ Usando fallback determinístico: ${motivoFallback}`);
    conteudo = montarConteudoFallbackResultado(concurso, dezenas, indicadores, cicloInfo, acumulou);
  }

  // ===== Footer determinístico: próximo concurso (data + prêmio estimado) =====
  try {
    const { data: prox } = await supabase
      .from("proximos_concursos")
      .select("numero_concurso, data_sorteio, premio_estimado")
      .eq("loteria", "lotofacil")
      .maybeSingle();
    if (prox && (prox.data_sorteio || prox.premio_estimado)) {
      const partes: string[] = [];
      if (prox.numero_concurso) partes.push(`Concurso ${prox.numero_concurso}`);
      if (prox.data_sorteio) {
        const [y, m, d] = String(prox.data_sorteio).split("-");
        if (y && m && d) partes.push(`📅 ${d}/${m}/${y}`);
      }
      if (prox.premio_estimado) {
        const num = Number(prox.premio_estimado);
        if (num && !Number.isNaN(num) && num > 0) {
          const formatado = num.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
          partes.push(`💰 Prêmio estimado: **${formatado}**`);
        }
      }
      if (partes.length > 0) {
        const footer = `---\n🎯 **Próximo concurso** — ${partes.join(" • ")}`;
        if ((conteudo.length + footer.length + 2) <= 1000) {
          conteudo = `${conteudo}\n\n${footer}`;
        }
      }
    }
  } catch (e) {
    console.warn("[RESULT-POST] Erro ao buscar próximo concurso:", e);
  }

  // Criar post na comunidade (autor único = Augusto)
  try {
    const { data: newPost, error: postError } = await supabase
      .from("postagens")
      .insert({
        user_id: AUGUSTO_PERFIL_ID,
        titulo: titulo.substring(0, 100),
        conteudo: conteudo.substring(0, 1000),
        loteria_tag: "Lotofácil",
        tipo: "resultado_oficial",
        concurso_referencia: concurso,
        metadata: { concurso, indicadores, ciclo: cicloInfo, dezenas, viaFallback, motivoFallback }
      })
      .select("id")
      .single();

    if (postError) {
      console.error(`[RESULT-POST] ❌ Erro ao criar post:`, postError.message);
      return;
    }

    console.log(`[RESULT-POST] ✅ Post ${newPost.id} criado (fallback=${viaFallback})`);
  } catch (err) {
    console.error(`[RESULT-POST] ❌ Erro ao inserir:`, err);
  }
}

// =============================================================================
// NOTIFICAÇÕES (comunidade via fila)
// =============================================================================

const COMMUNITY_TARGET_UTC_HOUR = 19; // ~16h BRT (UTC-3)

function shouldEnqueueComunicadoComunidade(nowUtc: Date): boolean {
  return nowUtc.getUTCHours() >= COMMUNITY_TARGET_UTC_HOUR;
}

function formatUtcDateYYYYMMDD(nowUtc: Date): string {
  const yyyy = String(nowUtc.getUTCFullYear());
  const mm = String(nowUtc.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(nowUtc.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

async function enfileirarNotificacaoComunidade(params: {
  supabase: any;
  chaveDedup: string;
  payload: Record<string, unknown>;
}) {
  const { supabase, chaveDedup, payload } = params;

  const { error } = await (supabase as any)
    .from('notificacoes_pendentes' as any)
    .upsert(
      {
        tipo: 'comunidade',
        payload,
        chave_dedup: chaveDedup,
        processado: false,
      } as any,
      {
        onConflict: 'chave_dedup',
        ignoreDuplicates: true,
      } as any
    );

  if (error) throw new Error(error.message);
}

async function processarFilaComunidade(params: {
  supabase: any;
  supabaseUrl: string;
  authBearer: string;
  webhookSecret: string | undefined;
}) {
  const { supabase, supabaseUrl, authBearer, webhookSecret } = params;

  if (!webhookSecret) {
    console.warn('[COMUNIDADE] NOTIFICATIONS_WEBHOOK_SECRET não configurado; fila não será processada.');
    return;
  }

  const { data: pendentes, error } = await (supabase as any)
    .from('notificacoes_pendentes' as any)
    .select('id,payload')
    .eq('tipo', 'comunidade')
    .eq('processado', false)
    .order('created_at', { ascending: true })
    .limit(5);

  if (error) throw new Error(error.message);
  if (!pendentes || pendentes.length === 0) return;

  for (const item of pendentes as Array<{ id: string; payload: any }>) {
    try {
      const fnUrl = `${supabaseUrl}/functions/v1/send-notifications`;
      const body = item.payload ?? {};

      const res = await fetch(fnUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authBearer}`,
          'x-webhook-secret': webhookSecret,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`send-notifications ${res.status}: ${text}`);
      }

      const { error: updErr } = await (supabase as any)
        .from('notificacoes_pendentes' as any)
        .update(
          {
            processado: true,
            processado_em: new Date().toISOString(),
            erro: null,
          } as any
        )
        .eq('id', item.id);

      if (updErr) throw new Error(updErr.message);

      console.log(`[COMUNIDADE] Notificação processada (id=${item.id}).`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(`[COMUNIDADE] Falha ao processar (id=${item.id}): ${msg}`);

      await (supabase as any)
        .from('notificacoes_pendentes' as any)
        .update({ erro: msg } as any)
        .eq('id', item.id);
      // Não interrompe o sync por falha de notificação
    }
  }
}

// =============================================================================
// SISTEMA DE RETRY COM RESILIÊNCIA
// =============================================================================

async function fetchWithRetry(
  apiUrl: string,
  maxAttempts: number = 3,
  delayMs: number = 900000 // 15 minutos em produção
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`[RETRY] Tentativa ${attempt}/${maxAttempts}...`);
      const response = await fetch(apiUrl);

      if (response.ok) {
        console.log(`[RETRY] Sucesso na tentativa ${attempt}`);
        return response;
      }

      // Se a API retornou erro HTTP, lançar exceção
      throw new Error(`API retornou status ${response.status}`);
    } catch (error) {
      lastError = error as Error;
      console.error(`[RETRY] Tentativa ${attempt} falhou: ${lastError.message}`);

      if (attempt < maxAttempts) {
        // Em ambiente de desenvolvimento, usar delay menor (5 segundos)
        const actualDelay = delayMs > 60000 ? 5000 : delayMs; // Se > 1min, usar 5s para teste
        console.log(`[RETRY] Aguardando ${actualDelay / 1000}s para nova tentativa...`);
        await new Promise(resolve => setTimeout(resolve, actualDelay));
      }
    }
  }

  throw new Error(`Todas as ${maxAttempts} tentativas falharam. Último erro: ${lastError?.message}`);
}

// =============================================================================
// FUNÇÕES DE CÁLCULO
// =============================================================================

function calcularIndicadores(dezenas: number[], dezenasAnteriores?: number[]) {
  const sorted = [...dezenas].sort((a, b) => a - b);
  let seqCount = 0;
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === sorted[i - 1] + 1) seqCount++;
  }
  return {
    qtd_pares: dezenas.filter(d => d % 2 === 0).length,
    qtd_impares: dezenas.filter(d => d % 2 !== 0).length,
    qtd_moldura: dezenas.filter(d => MOLDURA_LOTOFACIL.includes(d)).length,
    qtd_primos: dezenas.filter(d => PRIMOS_LOTOFACIL.includes(d)).length,
    qtd_fibonacci: dezenas.filter(d => FIBONACCI_LOTOFACIL.includes(d)).length,
    qtd_repetidas: dezenasAnteriores 
      ? dezenas.filter(d => dezenasAnteriores.includes(d)).length 
      : 0,
    soma: dezenas.reduce((a, b) => a + b, 0),
    sequencias: seqCount,
  };
}

function calcularCiclo(
  dezenas: number[], 
  dezenasAnterioresFaltantes: number[] | null,
  cicloAnterior: number | null
): { ciclo_numero: number; dezenas_faltantes_ciclo: number[] } {
  
  // Se não houver ciclo anterior, inicia ciclo 1
  if (!dezenasAnterioresFaltantes || dezenasAnterioresFaltantes.length === 0) {
    const faltantes = Array.from({ length: TOTAL_DEZENAS }, (_, i) => i + 1)
      .filter(d => !dezenas.includes(d));
    
    const novoCiclo = (cicloAnterior || 0) + 1;
    console.log(`[CICLO] Iniciando ciclo ${novoCiclo} - ${faltantes.length} dezenas faltantes`);
    
    return { ciclo_numero: novoCiclo, dezenas_faltantes_ciclo: faltantes };
  }
  
  // Remove as dezenas sorteadas das faltantes
  const novasFaltantes = dezenasAnterioresFaltantes.filter(d => !dezenas.includes(d));
  
  // Se zerou, ciclo fechou
  if (novasFaltantes.length === 0) {
    console.log(`[CICLO] Ciclo ${cicloAnterior} FECHADO!`);
    const faltantes = Array.from({ length: TOTAL_DEZENAS }, (_, i) => i + 1)
      .filter(d => !dezenas.includes(d));
    return { ciclo_numero: (cicloAnterior || 0) + 1, dezenas_faltantes_ciclo: faltantes };
  }
  
  return { ciclo_numero: cicloAnterior || 1, dezenas_faltantes_ciclo: novasFaltantes };
}

function parseData(dataStr: string | undefined): string {
  if (!dataStr) {
    return new Date().toISOString().split('T')[0];
  }
  // DD/MM/YYYY -> YYYY-MM-DD
  if (dataStr.includes('/')) {
    const parts = dataStr.split('/');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
  }
  // YYYY-MM-DD já está ok
  if (dataStr.match(/^\d{4}-\d{2}-\d{2}/)) {
    return dataStr.split('T')[0];
  }
  return dataStr;
}

// Extrair dezenas de diferentes formatos da API
function extrairDezenas(concurso: Record<string, unknown>): number[] {
  // Formato 1: array de strings ["01", "02", ...]
  if (Array.isArray(concurso.dezenas)) {
    return concurso.dezenas.map((d: string | number) => 
      typeof d === 'string' ? parseInt(d, 10) : d
    ).sort((a: number, b: number) => a - b);
  }
  
  // Formato 2: campos individuais numero_1, numero_2, etc
  const dezenas: number[] = [];
  for (let i = 1; i <= 15; i++) {
    const key = `numero_${i}`;
    if (concurso[key] !== undefined) {
      dezenas.push(Number(concurso[key]));
    }
  }
  if (dezenas.length > 0) {
    return dezenas.sort((a, b) => a - b);
  }
  
  // Formato 3: listaDezenas como string separada por vírgula ou array
  if (concurso.listaDezenas) {
    if (Array.isArray(concurso.listaDezenas)) {
      return (concurso.listaDezenas as (string | number)[]).map((d) => 
        typeof d === 'string' ? parseInt(d, 10) : d
      ).sort((a: number, b: number) => a - b);
    }
    if (typeof concurso.listaDezenas === 'string') {
      return concurso.listaDezenas.split(/[,\s-]+/).map((d: string) => parseInt(d.trim(), 10)).filter((n: number) => !isNaN(n)).sort((a: number, b: number) => a - b);
    }
  }
  
  return [];
}

// Extrair número do concurso
function extrairNumeroConcurso(concurso: Record<string, unknown>): number | null {
  if (typeof concurso.concurso === 'number') return concurso.concurso;
  if (typeof concurso.concurso === 'string') return parseInt(concurso.concurso, 10);
  if (typeof concurso.numero === 'number') return concurso.numero;
  if (typeof concurso.numero === 'string') return parseInt(concurso.numero, 10);
  if (typeof concurso.numero_concurso === 'number') return concurso.numero_concurso;
  if (typeof concurso.numero_concurso === 'string') return parseInt(concurso.numero_concurso, 10);
  return null;
}

// Extrair data do concurso
function extrairData(concurso: Record<string, unknown>): string {
  // Campos possíveis onde a data pode estar
  const campos = [
    'data', 
    'data_sorteio', 
    'dataApuracao', 
    'dataSorteio',
    'data_concurso',
    'dataResultado',
    'dataDoSorteio',
    'dataConcurso'
  ];
  
  for (const campo of campos) {
    const valor = concurso[campo];
    
    if (valor) {
      // String no formato de data
      if (typeof valor === 'string' && valor.length > 0) {
        const parsed = parseData(valor);
        if (parsed !== new Date().toISOString().split('T')[0]) {
          return parsed;
        }
        // Se parseData retornou data de hoje, pode ser válido - verificar se não é fallback
        if (valor.includes('/') || valor.includes('-')) {
          return parsed;
        }
      }
      // Número (timestamp)
      if (typeof valor === 'number') {
        return new Date(valor).toISOString().split('T')[0];
      }
    }
  }
  
  // Log para debug se não encontrar a data
  console.warn(`[WARN] Data não encontrada. Campos disponíveis: ${Object.keys(concurso).join(', ')}`);
  console.warn(`[WARN] Valores dos campos: data=${concurso.data}, dataApuracao=${concurso.dataApuracao}, dataSorteio=${concurso.dataSorteio}`);
  
  return new Date().toISOString().split('T')[0];
}

// =============================================================================
// HANDLER PRINCIPAL
// =============================================================================

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const apiToken = Deno.env.get('LOTOFACIL_API_TOKEN');
    const notificationsWebhookSecret = Deno.env.get('NOTIFICATIONS_WEBHOOK_SECRET');

    if (!apiToken) {
      throw new Error('LOTOFACIL_API_TOKEN não configurado');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const url = new URL(req.url);
    
    // NOVO: Parâmetro 'quantidade' para definir quantos concursos buscar
    const quantidade = url.searchParams.get('quantidade');
    const concursoEspecifico = url.searchParams.get('concurso');
    const debug = url.searchParams.get('debug') === 'true';
    const forceUpdate = url.searchParams.get('force') === 'true';
    const forcePost = url.searchParams.get('force_post') === 'true';

    let apiUrl: string;
    let modoOperacao: string;
    
    if (concursoEspecifico) {
      // Modo 1: Concurso específico
      apiUrl = `https://apiloterias.com.br/app/v2/resultado?loteria=lotofacil&token=${apiToken}&concurso=${concursoEspecifico}`;
      modoOperacao = `Concurso específico: ${concursoEspecifico}`;
    } else if (quantidade) {
      // Modo 2: Carga de histórico (ex: quantidade=100)
      apiUrl = `https://apiloterias.com.br/app/v2/resultado?loteria=lotofacil&token=${apiToken}&concurso=ultimos${quantidade}`;
      modoOperacao = `Carga de histórico: últimos ${quantidade}`;
    } else {
      // Modo 3 (PADRÃO): Atualização diária - apenas último concurso
      apiUrl = `https://apiloterias.com.br/app/v2/resultado?loteria=lotofacil&token=${apiToken}&concurso=ultimos1`;
      modoOperacao = 'Atualização diária: ultimos1';
    }

    console.log(`[SYNC] ========================================`);
    console.log(`[SYNC] Iniciando sincronização`);
    console.log(`[SYNC] Modo: ${modoOperacao}`);
    console.log(`[SYNC] ========================================`);

    // Comunidade (automático via sync): enfileira e processa 1x/dia após ~16h BRT
    try {
      const nowUtc = new Date();
      if (shouldEnqueueComunicadoComunidade(nowUtc)) {
        const dia = formatUtcDateYYYYMMDD(nowUtc);
        const chaveDedup = `comunidade:${dia}`;
        const payload = {
          titulo: 'Comunidade Lotofácil',
          mensagem: 'Acompanhe nossa comunidade! Veja análises, palpites e novidades no app.',
          tipo_disparo: 'comunidade',
        };

        await enfileirarNotificacaoComunidade({ supabase, chaveDedup, payload });
        await processarFilaComunidade({
          supabase,
          supabaseUrl,
          authBearer: supabaseAnonKey,
          webhookSecret: notificationsWebhookSecret,
        });
      } else {
        console.log('[COMUNIDADE] Ainda fora da janela (~16h BRT); não enfileirado.');
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(`[COMUNIDADE] Erro no fluxo de fila: ${msg}`);
      // Não interrompe o sync por falha de comunidade
    }

    // Usar sistema de retry para buscar da API
    const apiResponse = await fetchWithRetry(apiUrl);
    const apiData = await apiResponse.json();
    
    // Log de debug para ver estrutura da API
    if (debug) {
      console.log(`[DEBUG] Estrutura da resposta:`, JSON.stringify(apiData).substring(0, 500));
    }
    
    // Normalizar para array
    let rawConcursos: Record<string, unknown>[];
    if (Array.isArray(apiData)) {
      rawConcursos = apiData;
    } else if (apiData && typeof apiData === 'object') {
      rawConcursos = [apiData];
    } else {
      throw new Error('Formato de resposta da API não reconhecido');
    }
    
    console.log(`[SYNC] ${rawConcursos.length} registros recebidos da API`);
    
    // Log do primeiro concurso para debug
    if (rawConcursos.length > 0 && debug) {
      console.log(`[DEBUG] Primeiro registro:`, JSON.stringify(rawConcursos[0]));
    }

    // Processar e filtrar concursos válidos
    const concursosProcessados: Array<{
      numero: number;
      data: string;
      dezenas: number[];
      raw: Record<string, unknown>;
    }> = [];

    for (const raw of rawConcursos) {
      const numero = extrairNumeroConcurso(raw);
      const dezenas = extrairDezenas(raw);
      
      if (numero && dezenas.length === 15) {
        concursosProcessados.push({
          numero,
          data: extrairData(raw),
          dezenas,
          raw
        });
      } else {
        console.log(`[WARN] Concurso inválido: numero=${numero}, dezenas=${dezenas.length}`);
      }
    }

    console.log(`[SYNC] ${concursosProcessados.length} concursos válidos para processar`);

    // Ordenar do mais antigo para o mais novo
    concursosProcessados.sort((a, b) => a.numero - b.numero);

    // Buscar último concurso salvo na tabela principal Lotofácil
    const { data: ultimoSalvo } = await supabase
      .from('resultados')
        .select('concurso_id, dezenas, dezenas_faltantes_ciclo, ciclo_numero')
      .order('concurso_id', { ascending: false })
      .limit(1)
      .single();

    let dezenasAnteriores: number[] | undefined = ultimoSalvo?.dezenas;
    let dezenasAnterioresFaltantes: number[] | null = ultimoSalvo?.dezenas_faltantes_ciclo || null;
    let cicloAtual: number | null = ultimoSalvo?.ciclo_numero || null;

    const resultados = {
      novos: 0,
      existentes: 0,
      erros: [] as Array<{ concurso: number; erro: string }>
    };

    for (let i = 0; i < concursosProcessados.length; i++) {
      const concurso = concursosProcessados[i];
      
      try {
        console.log(`[SYNC] Processando concurso ${concurso.numero} (${i + 1}/${concursosProcessados.length})`);

        // Verificar se já existe (IDEMPOTÊNCIA) — tabela unificada
        const { data: existente } = await supabase
          .from('resultados_loterias')
            .select('id')
            .eq('loteria', 'lotofacil')
          .eq('concurso', concurso.numero)
          .single();

        if (existente && !forceUpdate) {
          // LOG DE AUDITORIA: Concurso já existente
          console.log(`[AUDIT] Ignorado: Concurso ${concurso.numero} já existente`);
          resultados.existentes++;
          
          const { data: dadosExistente } = await supabase
            .from('resultados_loterias')
              .select('dezenas, dezenas_faltantes_ciclo, ciclo_numero, qtd_pares, qtd_impares, qtd_moldura, qtd_primos, qtd_repetidas, acumulou')
              .eq('loteria', 'lotofacil')
            .eq('concurso', concurso.numero)
            .single();
          
          if (dadosExistente) {
            dezenasAnteriores = dadosExistente.dezenas;
            dezenasAnterioresFaltantes = dadosExistente.dezenas_faltantes_ciclo;
            cicloAtual = dadosExistente.ciclo_numero;

            // force_post: criar post de resultado se ainda não existe
            if (forcePost) {
              const { data: existingPost } = await supabase
                .from('postagens')
                .select('id')
                .eq('tipo', 'resultado_oficial')
                .eq('concurso_referencia', concurso.numero)
                .eq('loteria_tag', 'Lotofácil')
                .maybeSingle();
              if (!existingPost) {
                console.log(`[FORCE-POST] Criando post para concurso ${concurso.numero}`);
                await criarPostResultadoOficial({
                  supabase,
                  concurso: concurso.numero,
                  dezenas: dadosExistente.dezenas,
                  indicadores: {
                    qtd_pares: dadosExistente.qtd_pares ?? 0,
                    qtd_impares: dadosExistente.qtd_impares ?? 0,
                    qtd_moldura: dadosExistente.qtd_moldura ?? 0,
                    qtd_primos: dadosExistente.qtd_primos ?? 0,
                    qtd_repetidas: dadosExistente.qtd_repetidas ?? 0,
                  },
                  cicloInfo: {
                    ciclo_numero: dadosExistente.ciclo_numero ?? 0,
                    dezenas_faltantes_ciclo: dadosExistente.dezenas_faltantes_ciclo ?? [],
                  },
                  acumulou: dadosExistente.acumulou ?? false,
                });
              } else {
                console.log(`[FORCE-POST] Post já existe para concurso ${concurso.numero}`);
              }
            }
          }
          continue;
        }
        
        if (existente && forceUpdate) {
          console.log(`[AUDIT] Force update: Concurso ${concurso.numero}`);
        }

        const indicadores = calcularIndicadores(concurso.dezenas, dezenasAnteriores);
        const cicloInfo = calcularCiclo(concurso.dezenas, dezenasAnterioresFaltantes, cicloAtual);

        // Extrair premiação se disponível
        const raw = concurso.raw;
        let premiacao_json: Array<{ faixa: string; descricao?: string; ganhadores: number; valorPremio: number }> = [];
        let locais_ganhadores: Array<{ cidade: string; uf: string; ganhadores: number }> = [];
        let acumulou = false;
        let valor_estimado_proximo: number | null = null;
        let valor_acumulado_especial: number | null = null;
        let local_sorteio: string | null = null;

        // Tentar extrair premiação (formato APILoterias: raw.premiacao)
        if (Array.isArray(raw.premiacao)) {
          premiacao_json = (raw.premiacao as Array<Record<string, unknown>>).map(p => ({
            faixa: String(p.faixa ?? ''),
            descricao: String(p.descricao || `${p.faixa} acertos`),
            ganhadores: Number(p.numero_ganhadores ?? p.ganhadores ?? 0),
            valorPremio: parseFloat(String(p.valor_premio ?? p.valor ?? p.valorPremio ?? 0))
          }));
        } else if (Array.isArray(raw.premiacoes)) {
          premiacao_json = (raw.premiacoes as Array<Record<string, unknown>>).map(p => ({
            faixa: `${p.acertos || p.faixa || ''} acertos`,
            ganhadores: Number(p.vencedores || p.ganhadores || 0),
            valorPremio: parseFloat(String(p.premio || p.valor || 0))
          }));
        } else if (Array.isArray(raw.listaRateioPremio)) {
          premiacao_json = (raw.listaRateioPremio as Array<Record<string, unknown>>).map(p => ({
            faixa: `${p.descricaoFaixa || p.faixa || ''} acertos`,
            ganhadores: Number(p.numeroDeGanhadores || 0),
            valorPremio: parseFloat(String(p.valorPremio || 0))
          }));
        }

        // Tentar extrair locais ganhadores
        if (Array.isArray(raw.estadosPremiados)) {
          locais_ganhadores = (raw.estadosPremiados as Array<Record<string, unknown>>).map(e => ({
            cidade: String(e.cidade || ''),
            uf: String(e.uf || ''),
            ganhadores: Number(e.vencedores || 0)
          }));
        } else if (Array.isArray(raw.listaMunicipioUFGanhadores)) {
          locais_ganhadores = (raw.listaMunicipioUFGanhadores as Array<Record<string, unknown>>).map(e => ({
            cidade: String(e.municipio || e.cidade || ''),
            uf: String(e.uf || ''),
            ganhadores: Number(e.ganhadores || 1)
          }));
        }

        // Outros campos
        if (typeof raw.acumulou === 'boolean') acumulou = raw.acumulou;
        if (typeof raw.acumulado === 'boolean') acumulou = raw.acumulado;
        if (raw.proximoValor) valor_estimado_proximo = Number(raw.proximoValor);
        if (raw.valorEstimadoProximoConcurso) valor_estimado_proximo = Number(raw.valorEstimadoProximoConcurso);
        if (raw.valorAcumuladoEspecial) valor_acumulado_especial = Number(raw.valorAcumuladoEspecial);
        if (raw.local) local_sorteio = String(raw.local);
        if (raw.localSorteio) local_sorteio = String(raw.localSorteio);

        // Gravar na tabela unificada
        // Gravar na tabela principal Lotofácil (SaaS)
        const registroLotofacil = {
          concurso_id: concurso.numero,
          data_sorteio: concurso.data,
          dezenas: concurso.dezenas,
          acumulou,
          valor_estimado_proximo,
          valor_acumulado_especial,
          premiacao_json,
          locais_ganhadores,
          local_sorteio,
          ...indicadores,
          ...cicloInfo,
        };

        const { error: insertError } = await supabase
          .from('resultados')
          .upsert(registroLotofacil, { onConflict: 'concurso_id' });

        if (insertError) {
          throw new Error(`Erro na tabela resultados: ${insertError.message}`);
        }

        // Gravar também na tabela unificada (manter compatibilidade)
        const registroUnificado = {
          loteria: 'lotofacil',
          concurso: concurso.numero,
          ...registroLotofacil,
          concurso_id: undefined // Remover campo que não existe na unificada
        };
        delete registroUnificado.concurso_id;

        const { error: insertUnificadoError } = await supabase
          .from('resultados_loterias')
          .upsert(registroUnificado, { onConflict: 'loteria,concurso' });

        if (insertUnificadoError) {
          console.warn(`[WARN] Erro na tabela resultados_loterias: ${insertUnificadoError.message}`);
        }

        // LOG DE AUDITORIA: Concurso adicionado com sucesso
        console.log(`[AUDIT] Sucesso: Concurso ${concurso.numero} adicionado`);
        console.log(`        P:${indicadores.qtd_pares} I:${indicadores.qtd_impares} M:${indicadores.qtd_moldura} Pr:${indicadores.qtd_primos} R:${indicadores.qtd_repetidas}`);
        console.log(`        Ciclo ${cicloInfo.ciclo_numero} | Faltantes: ${cicloInfo.dezenas_faltantes_ciclo.length}`);

        // Disparo de notificação (apenas quando não for carga histórica)
        if (shouldNotifyResultadoNovo(url)) {
          try {
            await dispararNotificacaoResultadoNovo({
              supabaseUrl,
              authBearer: supabaseAnonKey,
              webhookSecret: notificationsWebhookSecret,
              concurso: concurso.numero,
            });
            console.log(`[NOTIFY] send-notifications acionada para concurso ${concurso.numero}`);
          } catch (notifyErr) {
            const msg = notifyErr instanceof Error ? notifyErr.message : String(notifyErr);
            console.error(`[NOTIFY] Falha ao disparar notificação: ${msg}`);
            // Não interrompe sincronização por falha de notificação
          }

          // Push notification via OneSignal
          await dispararPushResultadoNovo({
            supabaseUrl,
            authBearer: supabaseAnonKey,
            webhookSecret: notificationsWebhookSecret,
            concurso: concurso.numero,
            loteria: 'Lotofácil',
          });

          // Palpite Tech: post de resultado oficial na comunidade
          try {
            await criarPostResultadoOficial({
              supabase,
              concurso: concurso.numero,
              dezenas: concurso.dezenas,
              indicadores,
              cicloInfo,
              acumulou
            });
            console.log(`[PALPITETECH] Post de resultado criado para concurso ${concurso.numero}`);
          } catch (ptErr) {
            const msg = ptErr instanceof Error ? ptErr.message : String(ptErr);
            console.error(`[PALPITETECH] Falha ao criar post: ${msg}`);
          }
        } else {
          console.log('[NOTIFY] Disparo desativado (carga histórica ou notify=false).');
        }

        resultados.novos++;

        dezenasAnteriores = concurso.dezenas;
        dezenasAnterioresFaltantes = cicloInfo.dezenas_faltantes_ciclo;
        cicloAtual = cicloInfo.ciclo_numero;

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
        console.error(`[ERRO] Concurso ${concurso.numero}: ${errorMessage}`);
        resultados.erros.push({ concurso: concurso.numero, erro: errorMessage });
      }
    }

    const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log(`[SYNC] ========================================`);
    console.log(`[SYNC] Sincronização concluída em ${elapsedTime}s`);
    console.log(`[SYNC] Modo: ${modoOperacao}`);
    console.log(`[SYNC] Novos: ${resultados.novos} | Existentes: ${resultados.existentes} | Erros: ${resultados.erros.length}`);
    console.log(`[SYNC] ========================================`);

    // Fire and forget: atualizar próximos concursos
    const syncProximosSecret = Deno.env.get('NOTIFICATIONS_WEBHOOK_SECRET');
    if (syncProximosSecret) {
      fetch(
        `${supabaseUrl}/functions/v1/sync-proximos-concursos?secret=${syncProximosSecret}`,
        { method: 'POST' }
      ).catch(err => console.error('[sync-lotofacil] Erro ao atualizar proximos:', err));
    }

    // Fire and forget: pré-gerar rascunhos do dia (assíncrono, sem await)
    if (resultados.novos > 0) {
      fetch(`${supabaseUrl}/functions/v1/precompute-daily-posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        },
        body: JSON.stringify({ loteria: 'lotofacil' }),
      }).catch(err => console.error('[sync-lotofacil] Erro ao pré-gerar posts:', err));
    }

    return new Response(
      JSON.stringify({ 
        sucesso: true, 
        modo: modoOperacao,
        tempo_execucao: `${elapsedTime}s`,
        ...resultados 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2);
    
    console.error(`[ERRO FATAL] ${errorMessage}`);
    console.error(`[SYNC] Falha após ${elapsedTime}s`);
    
    return new Response(
      JSON.stringify({ 
        sucesso: false, 
        erro: errorMessage,
        tempo_execucao: `${elapsedTime}s`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
