import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// =============================================================================
// CONSTANTES LOTOFÁCIL - ÚNICA VERDADE (replicadas do frontend)
// =============================================================================

const MOLDURA_LOTOFACIL = [1, 2, 3, 4, 5, 6, 10, 11, 15, 16, 20, 21, 22, 23, 24, 25];
const PRIMOS_LOTOFACIL = [2, 3, 5, 7, 11, 13, 17, 19, 23];
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

// Cria o post de resultado oficial diretamente pela Ana (sem depender de outra edge function)
async function criarPostResultadoOficialAna(params: {
  supabase: any;
  concurso: number;
  dezenas: number[];
  indicadores: { qtd_pares: number; qtd_impares: number; qtd_moldura: number; qtd_primos: number; qtd_repetidas: number };
  cicloInfo: { ciclo_numero: number; dezenas_faltantes_ciclo: number[] };
  acumulou: boolean;
}): Promise<void> {
  const { supabase, concurso, dezenas, indicadores, cicloInfo, acumulou } = params;

  console.log(`[ANA-POST] Criando post de resultado para concurso ${concurso}`);

  try {
    // 1. Buscar perfil_id da Ana (is_result_author)
    const { data: ana, error: anaError } = await supabase
      .from("guide_personas")
      .select("id, perfil_id, system_prompt, max_chars_post, ai_model, total_posts")
      .eq("is_result_author", true)
      .eq("ativo", true)
      .eq("can_create_posts", true)
      .single();

    if (anaError || !ana) {
      console.error(`[ANA-POST] ❌ Bot Ana não encontrado ou inativo`);
      return;
    }

    // 2. Montar contexto do resultado
    const dezenasFormatadas = dezenas.map(d => d.toString().padStart(2, "0")).join(" - ");
    const faltantes = cicloInfo.dezenas_faltantes_ciclo.map(d => d.toString().padStart(2, "0")).join(", ");

    const contextoResultado = `RESULTADO OFICIAL CONCURSO ${concurso}:
Dezenas: **${dezenasFormatadas}**
Pares: ${indicadores.qtd_pares} | Ímpares: ${indicadores.qtd_impares}
Moldura: ${indicadores.qtd_moldura} | Primos: ${indicadores.qtd_primos}
Repetidas: ${indicadores.qtd_repetidas}
Ciclo: ${cicloInfo.ciclo_numero} | Faltantes: [${faltantes}]${cicloInfo.dezenas_faltantes_ciclo.length <= 3 ? " ⚡ Quase fechando!" : ""}
${acumulou ? "💰 ACUMULOU!" : ""}`;

    // 3. Gerar post via IA
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("[ANA-POST] ❌ LOVABLE_API_KEY não configurada");
      return;
    }

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: ana.ai_model || "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: ana.system_prompt },
          {
            role: "user",
            content: `Crie um post de PLANTÃO anunciando o resultado oficial da Lotofácil.

${contextoResultado}

INSTRUÇÕES:
- Título chamativo com emoji 🚨 (máximo 60 caracteres)
- Destaque as dezenas sorteadas
- Raio-X rápido (pares/ímpares, moldura, primos, repetidas, ciclo)
- Máximo ${ana.max_chars_post || 600} caracteres no conteúdo
- Finalize convidando à discussão

Responda APENAS no formato JSON:
{"titulo": "seu título", "conteudo": "seu conteúdo"}`
          }
        ]
      }),
    });

    if (!aiResponse.ok) {
      console.error(`[ANA-POST] ❌ Erro na IA: ${aiResponse.status}`);
      return;
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content;

    let parsed;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch?.[0] || content);
    } catch {
      console.error("[ANA-POST] ❌ Formato de resposta inválido da IA");
      return;
    }

    // 4. Criar post na comunidade
    const { data: newPost, error: postError } = await supabase
      .from("postagens")
      .insert({
        user_id: ana.perfil_id,
        titulo: parsed.titulo?.substring(0, 100),
        conteudo: parsed.conteudo?.substring(0, 1000),
        loteria_tag: "Lotofácil",
        tipo: "resultado_oficial",
        concurso_referencia: concurso,
      })
      .select("id")
      .single();

    if (postError) {
      console.error(`[ANA-POST] ❌ Erro ao criar post:`, postError.message);
      return;
    }

    // 5. Atualizar estatísticas da Ana
    await supabase
      .from("guide_personas")
      .update({
        ultimo_post_em: new Date().toISOString(),
        total_posts: (ana.total_posts || 0) + 1
      })
      .eq("id", ana.id);

    // 6. Log de sucesso
    await supabase
      .from("bot_publishing_logs")
      .insert({
        guide_persona_id: ana.id,
        bot_name: "Ana",
        event_type: "success",
        reason: "Result post created directly by sync",
        details: { post_id: newPost.id, concurso }
      });

    console.log(`[ANA-POST] ✅ Post criado com sucesso: ${newPost.id}`);
  } catch (err) {
    console.error(`[ANA-POST] ❌ Erro geral:`, err);
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
  return {
    qtd_pares: dezenas.filter(d => d % 2 === 0).length,
    qtd_impares: dezenas.filter(d => d % 2 !== 0).length,
    qtd_moldura: dezenas.filter(d => MOLDURA_LOTOFACIL.includes(d)).length,
    qtd_primos: dezenas.filter(d => PRIMOS_LOTOFACIL.includes(d)).length,
    qtd_repetidas: dezenasAnteriores 
      ? dezenas.filter(d => dezenasAnteriores.includes(d)).length 
      : 0
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

    // Buscar último concurso salvo
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

        // Verificar se já existe (IDEMPOTÊNCIA)
        const { data: existente } = await supabase
          .from('resultados')
          .select('id')
          .eq('concurso_id', concurso.numero)
          .single();

        if (existente) {
          // LOG DE AUDITORIA: Concurso já existente
          console.log(`[AUDIT] Ignorado: Concurso ${concurso.numero} já existente`);
          resultados.existentes++;
          
          const { data: dadosExistente } = await supabase
            .from('resultados')
            .select('dezenas, dezenas_faltantes_ciclo, ciclo_numero')
            .eq('concurso_id', concurso.numero)
            .single();
          
          if (dadosExistente) {
            dezenasAnteriores = dadosExistente.dezenas;
            dezenasAnterioresFaltantes = dadosExistente.dezenas_faltantes_ciclo;
            cicloAtual = dadosExistente.ciclo_numero;
          }
          continue;
        }

        const indicadores = calcularIndicadores(concurso.dezenas, dezenasAnteriores);
        const cicloInfo = calcularCiclo(concurso.dezenas, dezenasAnterioresFaltantes, cicloAtual);

        // Extrair premiação se disponível
        const raw = concurso.raw;
        let premiacao_json: Array<{ faixa: string; ganhadores: number; valor: number }> = [];
        let locais_ganhadores: Array<{ cidade: string; uf: string; ganhadores: number }> = [];
        let acumulou = false;
        let valor_estimado_proximo: number | null = null;
        let valor_acumulado_especial: number | null = null;
        let local_sorteio: string | null = null;

        // Tentar extrair premiação
        if (Array.isArray(raw.premiacoes)) {
          premiacao_json = (raw.premiacoes as Array<Record<string, unknown>>).map(p => ({
            faixa: `${p.acertos || p.faixa || ''} acertos`,
            ganhadores: Number(p.vencedores || p.ganhadores || 0),
            valor: parseFloat(String(p.premio || p.valor || 0))
          }));
        } else if (Array.isArray(raw.listaRateioPremio)) {
          premiacao_json = (raw.listaRateioPremio as Array<Record<string, unknown>>).map(p => ({
            faixa: `${p.descricaoFaixa || p.faixa || ''} acertos`,
            ganhadores: Number(p.numeroDeGanhadores || 0),
            valor: parseFloat(String(p.valorPremio || 0))
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

        const registro = {
          concurso_id: concurso.numero,
          data_sorteio: concurso.data,
          dezenas: concurso.dezenas,
          ...indicadores,
          ...cicloInfo,
          acumulou,
          valor_estimado_proximo,
          valor_acumulado_especial,
          premiacao_json,
          locais_ganhadores,
          local_sorteio
        };

        const { error: insertError } = await supabase
          .from('resultados')
          .insert(registro);

        if (insertError) {
          throw new Error(insertError.message);
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

          // Cria post da Ana diretamente (sem depender de outra edge function)
          try {
            await criarPostResultadoOficialAna({
              supabase,
              concurso: concurso.numero,
              dezenas: concurso.dezenas,
              indicadores,
              cicloInfo,
              acumulou,
            });
          } catch (anaErr) {
            const msg = anaErr instanceof Error ? anaErr.message : String(anaErr);
            console.error(`[ANA-POST] Falha ao criar post: ${msg}`);
          }

          // Palpite Tech: post de resultado oficial
          try {
            await fetch(
              Deno.env.get('SUPABASE_URL') + '/functions/v1/palpitetech-post',
              {
                method: 'POST',
                headers: {
                  'Authorization': 'Bearer ' + Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({ mode: 'resultado' })
              }
            );
            console.log(`[PALPITETECH] Post de resultado disparado para concurso ${concurso.numero}`);
          } catch (ptErr) {
            const msg = ptErr instanceof Error ? ptErr.message : String(ptErr);
            console.error(`[PALPITETECH] Falha ao disparar post: ${msg}`);
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
