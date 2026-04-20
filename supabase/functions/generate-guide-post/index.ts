import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Constantes para cálculos
const TOTAL_DEZENAS = 25;
const DEZENAS_POR_SORTEIO = 15;
const PERIODO_ANALISE = 20;
const LIMIAR_QUENTE = 0.71;
const LIMIAR_FRIO = 0.39;

interface Concurso {
  concurso_id: number;
  dezenas: number[];
  data_sorteio: string;
  ciclo_numero: number | null;
  dezenas_faltantes_ciclo: number[] | null;
  qtd_pares: number;
  qtd_impares: number;
  qtd_repetidas: number;
  qtd_primos: number;
  qtd_moldura: number;
}

// Calcula a frequência de cada dezena nos últimos N concursos
function calcularFrequencias(concursos: Concurso[]): Map<number, number> {
  const frequencias = new Map<number, number>();
  
  for (let i = 1; i <= TOTAL_DEZENAS; i++) {
    frequencias.set(i, 0);
  }
  
  for (const concurso of concursos) {
    for (const dezena of concurso.dezenas) {
      frequencias.set(dezena, (frequencias.get(dezena) || 0) + 1);
    }
  }
  
  return frequencias;
}

// Identifica dezenas quentes e frias
function identificarTemperatura(frequencias: Map<number, number>, totalConcursos: number): {
  quentes: { dezena: number; percentual: number }[];
  frias: { dezena: number; percentual: number }[];
} {
  const quentes: { dezena: number; percentual: number }[] = [];
  const frias: { dezena: number; percentual: number }[] = [];
  
  for (const [dezena, freq] of frequencias) {
    const percentual = freq / totalConcursos;
    
    if (percentual >= LIMIAR_QUENTE) {
      quentes.push({ dezena, percentual });
    } else if (percentual <= LIMIAR_FRIO) {
      frias.push({ dezena, percentual });
    }
  }
  
  quentes.sort((a, b) => b.percentual - a.percentual);
  frias.sort((a, b) => a.percentual - b.percentual);
  
  return { quentes: quentes.slice(0, 5), frias: frias.slice(0, 5) };
}

// Calcula o atraso atual de cada dezena (quantos concursos sem aparecer)
function calcularAtrasos(concursos: Concurso[]): Map<number, number> {
  const atrasos = new Map<number, number>();
  
  for (let i = 1; i <= TOTAL_DEZENAS; i++) {
    atrasos.set(i, 0);
    
    for (let j = 0; j < concursos.length; j++) {
      if (concursos[j].dezenas.includes(i)) {
        atrasos.set(i, j);
        break;
      }
      if (j === concursos.length - 1) {
        atrasos.set(i, concursos.length);
      }
    }
  }
  
  return atrasos;
}

// Calcula as duplas mais frequentes
function calcularTopDuplas(concursos: Concurso[], top: number = 3): { dupla: [number, number]; frequencia: number; percentual: number }[] {
  const duplas = new Map<string, number>();
  
  for (const concurso of concursos) {
    const dezenas = concurso.dezenas.sort((a, b) => a - b);
    
    for (let i = 0; i < dezenas.length; i++) {
      for (let j = i + 1; j < dezenas.length; j++) {
        const chave = `${dezenas[i]}-${dezenas[j]}`;
        duplas.set(chave, (duplas.get(chave) || 0) + 1);
      }
    }
  }
  
  const ordenadas = Array.from(duplas.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, top);
  
  return ordenadas.map(([chave, freq]) => {
    const [d1, d2] = chave.split("-").map(Number);
    return {
      dupla: [d1, d2] as [number, number],
      frequencia: freq,
      percentual: freq / concursos.length
    };
  });
}

// Calcula o trio mais frequente
function calcularTopTrio(concursos: Concurso[]): { trio: [number, number, number]; frequencia: number; percentual: number } | null {
  const trios = new Map<string, number>();
  
  for (const concurso of concursos) {
    const dezenas = concurso.dezenas.sort((a, b) => a - b);
    
    for (let i = 0; i < dezenas.length; i++) {
      for (let j = i + 1; j < dezenas.length; j++) {
        for (let k = j + 1; k < dezenas.length; k++) {
          const chave = `${dezenas[i]}-${dezenas[j]}-${dezenas[k]}`;
          trios.set(chave, (trios.get(chave) || 0) + 1);
        }
      }
    }
  }
  
  const ordenados = Array.from(trios.entries())
    .sort((a, b) => b[1] - a[1]);
  
  if (ordenados.length === 0) return null;
  
  const [chave, freq] = ordenados[0];
  const [d1, d2, d3] = chave.split("-").map(Number);
  
  return {
    trio: [d1, d2, d3] as [number, number, number],
    frequencia: freq,
    percentual: freq / concursos.length
  };
}

// Formata dezena com 2 dígitos
function formatarDezena(d: number): string {
  return d.toString().padStart(2, "0");
}

// Monta o contexto enriquecido para a IA
function montarContextoEnriquecido(concursos: Concurso[]): string {
  if (!concursos || concursos.length === 0) {
    return "Sem dados disponíveis para análise.";
  }

  const ultimo = concursos[0];
  const frequencias = calcularFrequencias(concursos);
  const { quentes, frias } = identificarTemperatura(frequencias, concursos.length);
  const atrasos = calcularAtrasos(concursos);
  const topDuplas = calcularTopDuplas(concursos);
  const topTrio = calcularTopTrio(concursos);

  // Dezenas com maior atraso
  const maioresAtrasos = Array.from(atrasos.entries())
    .filter(([_, atraso]) => atraso >= 5)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  let contexto = `📊 ANÁLISE DOS ÚLTIMOS ${concursos.length} CONCURSOS:

🎯 ÚLTIMO RESULTADO:
Concurso ${ultimo.concurso_id} (${ultimo.data_sorteio})
Dezenas: [${ultimo.dezenas.map(formatarDezena).join(", ")}]
Indicadores: ${ultimo.qtd_pares} pares, ${ultimo.qtd_impares} ímpares, ${ultimo.qtd_moldura} moldura, ${ultimo.qtd_primos} primos, ${ultimo.qtd_repetidas} repetidas

`;

  // Dezenas quentes
  if (quentes.length > 0) {
    contexto += `🔥 DEZENAS QUENTES (aparecendo muito):\n`;
    contexto += quentes.map(q => `${formatarDezena(q.dezena)} (${Math.round(q.percentual * 100)}%)`).join(", ");
    contexto += "\n\n";
  }

  // Dezenas frias
  if (frias.length > 0) {
    contexto += `❄️ DEZENAS FRIAS (aparecendo pouco):\n`;
    contexto += frias.map(f => `${formatarDezena(f.dezena)} (${Math.round(f.percentual * 100)}%)`).join(", ");
    contexto += "\n";
  }

  // Maiores atrasos
  if (maioresAtrasos.length > 0) {
    contexto += `⏳ MAIORES ATRASOS:\n`;
    contexto += maioresAtrasos.map(([d, a]) => `${formatarDezena(d)} (ausente há ${a} sorteios)`).join(", ");
    contexto += "\n\n";
  }

  // Status do ciclo
  if (ultimo.ciclo_numero !== null) {
    contexto += `🔄 STATUS DO CICLO:\n`;
    contexto += `Ciclo atual: ${ultimo.ciclo_numero}\n`;
    
    if (ultimo.dezenas_faltantes_ciclo && ultimo.dezenas_faltantes_ciclo.length > 0) {
      const faltantes = ultimo.dezenas_faltantes_ciclo.map(formatarDezena).join(", ");
      contexto += `Dezenas faltantes: [${faltantes}] (${ultimo.dezenas_faltantes_ciclo.length} restante${ultimo.dezenas_faltantes_ciclo.length > 1 ? "s" : ""})\n`;
      
      if (ultimo.dezenas_faltantes_ciclo.length <= 3) {
        contexto += `⚡ Ciclo quase completo!\n`;
      }
    } else {
      contexto += `✅ Ciclo completo - iniciando novo ciclo\n`;
    }
    contexto += "\n";
  }

  // Duplas mais frequentes
  if (topDuplas.length > 0) {
    contexto += `🤝 DUPLAS MAIS FREQUENTES:\n`;
    topDuplas.forEach((d, i) => {
      contexto += `${i + 1}. ${formatarDezena(d.dupla[0])}-${formatarDezena(d.dupla[1])} → aparecem juntas em ${Math.round(d.percentual * 100)}% dos sorteios\n`;
    });
    contexto += "\n";
  }

  // Trio mais frequente
  if (topTrio) {
    contexto += `🎯 TRIO MAIS FREQUENTE:\n`;
    contexto += `${formatarDezena(topTrio.trio[0])}-${formatarDezena(topTrio.trio[1])}-${formatarDezena(topTrio.trio[2])} → aparece junto em ${Math.round(topTrio.percentual * 100)}% dos sorteios\n`;
  }

  return contexto;
}

// Monta instruções específicas baseadas no tipo de post
function montarInstrucoesTipo(tipoPost: string): string {
  const FORMATO_OBRIGATORIO = `
FORMATO DE SAÍDA OBRIGATÓRIO:
- Use emojis como marcadores de seção (🔥, ❄️, 🎯, 📊, 🔄, ⚡, 🤝, 💡)
- Use **negrito** para destacar dezenas e números importantes
- Separe seções com linha em branco
- Use • para listas de tópicos
- Máximo 800 caracteres no conteúdo
- Estruture em 3-4 seções curtas e objetivas
- Finalize com uma pergunta para engajar a comunidade`;

  if (tipoPost === "analise_ciclo") {
    return `
CONTEXTO DO POST: Análise de CICLO da Lotofácil.
FOCO PRINCIPAL:
- Status atual do ciclo (número e progresso)
- Dezenas que FALTAM para completar o ciclo (destaque em negrito)
- Estimativa de quando o ciclo pode fechar baseado no ritmo atual
- Histórico: quantos concursos os últimos ciclos levaram para fechar
- Estratégia: vale apostar nas faltantes?

SEÇÕES SUGERIDAS:
🔄 Status do Ciclo → número do ciclo + progresso
🎯 Dezenas Faltantes → listar com destaque
💡 Estratégia → orientação sobre o ciclo
${FORMATO_OBRIGATORIO}`;
  }

  if (tipoPost === "analise_movimentacao") {
    return `
CONTEXTO DO POST: Análise de MOVIMENTAÇÃO (Quentes & Frias) da Lotofácil.
FOCO PRINCIPAL:
- Top 5 dezenas QUENTES (mais frequentes) com percentual
- Top 5 dezenas FRIAS (menos frequentes) com percentual
- Dezenas com MAIOR ATRASO (ausentes há mais sorteios)
- Score de timing: dezenas que estão "no ponto" para sair
- Duplas e trios que aparecem juntos com frequência

SEÇÕES SUGERIDAS:
🔥 Dezenas Quentes → top 5 com percentual
❄️ Dezenas Frias → top 5 com percentual
⏳ Maiores Atrasos → dezenas ausentes + quantos sorteios
🤝 Duplas Frequentes → pares que saem juntos
${FORMATO_OBRIGATORIO}`;
  }

  if (tipoPost === "analise_pares_impares") {
    return `
CONTEXTO DO POST: Análise de PARES e ÍMPARES da Lotofácil.
FOCO PRINCIPAL:
- Distribuição par/ímpar nos últimos concursos
- Média histórica vs último resultado
- Tendência: está pendendo para mais pares ou mais ímpares?
- Faixas mais comuns (ex: 7P/8I, 8P/7I)
- Relação com dezenas de moldura

SEÇÕES SUGERIDAS:
📊 Distribuição Atual → pares vs ímpares recentes
🎯 Média Histórica → comparação
💡 Tendência → para onde está indo
${FORMATO_OBRIGATORIO}`;
  }

  if (tipoPost === "analise_repetidas") {
    return `
CONTEXTO DO POST: Análise de DEZENAS REPETIDAS entre concursos da Lotofácil.
FOCO PRINCIPAL:
- Quantas dezenas se repetiram do penúltimo para o último sorteio
- Média de repetidas nos últimos 20 concursos
- Dezenas que têm repetido com mais frequência
- Padrão: em quantos concursos consecutivos uma dezena costuma aparecer
- Estratégia: apostar em repetidas ou evitá-las?

SEÇÕES SUGERIDAS:
🔁 Repetidas Recentes → quais repetiram e quantas
📊 Média Histórica → referência de repetição
💡 Estratégia → orientação sobre repetidas
${FORMATO_OBRIGATORIO}`;
  }

  if (tipoPost === "analise_moldura") {
    return `
CONTEXTO DO POST: Análise de MOLDURA da Lotofácil.
FOCO PRINCIPAL:
- Quantas dezenas da moldura saíram no último sorteio vs miolo
- Dezenas da moldura: [01-06, 10, 11, 15, 16, 20-25] (16 dezenas)
- Dezenas do miolo: [07, 08, 09, 12, 13, 14, 17, 18, 19] (9 dezenas)
- Média histórica de moldura nos últimos concursos
- Duplas frequentes dentro da moldura e dentro do miolo

SEÇÕES SUGERIDAS:
🖼️ Moldura vs Miolo → distribuição atual
📊 Média Histórica → referência
🎯 Destaques → duplas frequentes na moldura
💡 Estratégia → equilíbrio moldura/miolo
${FORMATO_OBRIGATORIO}`;
  }

  if (tipoPost === "estrategia") {
    return `
CONTEXTO DO POST: Análise de ESTRATÉGIA da Lotofácil.
FOCO PRINCIPAL:
- Síntese dos principais sinais (ciclo, quentes/frias, atrasos, duplas)
- Sugestão de COMO MONTAR um jogo equilibrado para o próximo concurso
- Equilíbrio par/ímpar e moldura/miolo recomendado
- Dezenas que vale a pena considerar fixar
- Reforçar que é orientação, não certeza

SEÇÕES SUGERIDAS:
🎯 Leitura do Momento → resumo dos sinais
💡 Como Montar o Jogo → orientação prática
⚖️ Equilíbrio Recomendado → par/ímpar + moldura
🔥 Para Considerar → dezenas em destaque
${FORMATO_OBRIGATORIO}`;
  }

  if (tipoPost === "pos_sorteio") {
    return `
CONTEXTO DO POST: Acabou de sair o resultado do concurso (sorteio das 20h). Este é um post de ANÁLISE PÓS-SORTEIO.
- Comente sobre o que aconteceu no sorteio de hoje
- Analise os indicadores do resultado (pares/ímpares, primos, repetidas, moldura)
- Destaque se alguma tendência se confirmou
- Convide a comunidade a discutir
${FORMATO_OBRIGATORIO}`;
  }

  if (tipoPost === "pre_sorteio") {
    return `
CONTEXTO DO POST: O sorteio será hoje às 20h. Este é um post de ORIENTAÇÃO PRÉ-SORTEIO.
- Compartilhe observações úteis para quem vai jogar hoje
- Mencione tendências e dezenas em destaque
- Comente sobre o status do ciclo
- Deseje boa sorte à comunidade!
${FORMATO_OBRIGATORIO}`;
  }

  return `
CONTEXTO DO POST: Post geral de análise e orientação.
- Compartilhe insights sobre os últimos resultados
- Destaque padrões interessantes
- Convide a comunidade para discutir
${FORMATO_OBRIGATORIO}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Extrair tipo do corpo da requisição
    const body = await req.json().catch(() => ({}));
    const tipoPost = body.tipo_post || "geral";
    const requestedGuideId = body.guide_persona_id;
    
    console.log(`Gerando post do tipo: ${tipoPost}${requestedGuideId ? ` para o guia ${requestedGuideId}` : ""}`);

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1. Buscar guia (se ID fornecido, busca ele; senão, o próximo da fila)
    let query = supabaseAdmin
      .from("guide_personas")
      .select("*, perfis(*)")
      .eq("ativo", true)
      .eq("can_create_posts", true);
    
    if (requestedGuideId) {
      query = query.eq("id", requestedGuideId);
    } else {
      query = query.order("ultimo_post_em", { ascending: true, nullsFirst: true }).limit(1);
    }

    const { data: guide, error: guideError } = await query.single();

    if (guideError || !guide) {
      console.log("[generate-guide-post] ❌ Nenhum guia encontrado com permissão:", guideError?.message);
      console.log("[generate-guide-post] Filtros: ativo=true, can_create_posts=true");
      return new Response(
        JSON.stringify({ message: "Nenhum guia ativo com permissão para criar posts" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 🔒 Trava de segurança: só Palpite Tech (autor de resultados) pode postar na comunidade
    const PALPITE_TECH_ID = "2a827e7d-a3d1-416e-8552-e830dc7e633c";
    if (guide.id !== PALPITE_TECH_ID && !guide.is_result_author) {
      console.warn(`[generate-guide-post] 🚫 Bot não autorizado tentou postar: ${guide.perfis?.nome} (${guide.id})`);
      return new Response(
        JSON.stringify({ error: "Apenas o autor oficial pode criar postagens na comunidade" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Log de aceitação
    console.log(`[generate-guide-post] ✅ Bot selecionado: ${guide.perfis?.nome || guide.id}`);
    console.log(`[generate-guide-post] Permissões: ativo=${guide.ativo}, can_create_posts=${guide.can_create_posts}`);

    // 2. Buscar últimos resultados para análise enriquecida
    const { data: resultados, error: resultadosError } = await supabaseAdmin
      .from("resultados_loterias")
        .select("concurso_id:concurso, dezenas, data_sorteio, ciclo_numero, dezenas_faltantes_ciclo, qtd_pares, qtd_impares, qtd_repetidas, qtd_primos, qtd_moldura")
        .eq("loteria", "lotofacil")
      .order("concurso", { ascending: false })
      .limit(PERIODO_ANALISE);

    if (resultadosError) {
      console.error("Erro ao buscar resultados:", resultadosError.message);
      throw new Error("Erro ao buscar resultados");
    }

    // 3. Montar contexto enriquecido
    const contextoEnriquecido = montarContextoEnriquecido(resultados as Concurso[]);
    
    // 4. Montar instruções específicas do tipo de post
    const instrucoesTipo = montarInstrucoesTipo(tipoPost);

    // 5. Chamar Lovable AI com a personalidade do guia
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY não configurada");
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
          { role: "system", content: guide.system_prompt },
          { 
            role: "user", 
            content: `Crie um post para AJUDAR os usuários da comunidade Palpite Tech.

${instrucoesTipo}

CONTEXTO ESTATÍSTICO COMPLETO:
${contextoEnriquecido}

INSTRUÇÕES IMPORTANTES:
- Seu papel é GUIAR e ORIENTAR, não dar certezas absolutas
- Compartilhe observações úteis baseadas nos dados acima
- Use frases como "tenho observado", "vale a pena notar", "uma possibilidade interessante..."
- NUNCA prometa resultados ou dê certezas sobre o que vai sair
- Reconheça que loteria envolve sorte: "claro que não há garantias, mas..."
- Convide à discussão no final: "O que vocês acham?" ou "Alguém mais notou isso?"
- Título: máximo 60 caracteres, chamativo mas não sensacionalista
- Conteúdo: máximo 800 caracteres, bem estruturado com emojis e seções
- Fale em primeira pessoa como membro da equipe Palpite Tech
- NUNCA mencione que você é IA, bot ou modelo de linguagem
- Seja prestativo e acolhedor, como um colega que divide o que descobriu

Responda APENAS no formato JSON:
{"titulo": "seu título aqui", "conteudo": "seu conteúdo aqui"}`
          }
        ]
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("Erro na API de IA:", aiResponse.status, errorText);
      throw new Error(`Erro na API de IA: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content;
    const usage = aiData.usage;
    const aiModel = "google/gemini-3-flash-preview";

    // Log de uso de IA
    if (usage) {
      const promptTokens = usage.prompt_tokens || 0;
      const completionTokens = usage.completion_tokens || 0;
      const costUsd = (promptTokens / 1e6) * 0.15 + (completionTokens / 1e6) * 0.60;
      supabaseAdmin.from("ai_usage_logs").insert({
        bot_persona_id: guide.id,
        bot_name: guide.perfis?.nome || null,
        edge_function: "generate-guide-post",
        action_type: "post_analitico_comunidade",
        prompt_tokens: promptTokens,
        completion_tokens: completionTokens,
        total_tokens: usage.total_tokens || (promptTokens + completionTokens),
        model: aiModel,
        cost_usd: costUsd,
        metadata: { tipo_post: tipoPost },
      }).then(() => {}).catch((e: any) => console.error("Erro log IA:", e));
    }

    if (!content) {
      throw new Error("Resposta da IA vazia");
    }

    // 5. Extrair JSON da resposta (pode vir com markdown)
    let parsed;
    try {
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || 
                        content.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]).trim() : content.trim();
      parsed = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error("Erro ao parsear resposta da IA:", content);
      throw new Error("Formato de resposta inválido da IA");
    }

    if (!parsed.titulo || !parsed.conteudo) {
      throw new Error("Resposta da IA incompleta");
    }

    // 6. Criar post na comunidade
    const { error: postError } = await supabaseAdmin.from("postagens").insert({
      user_id: guide.perfil_id,
      titulo: parsed.titulo.substring(0, 100),
      conteudo: parsed.conteudo.substring(0, 1000),
      loteria_tag: "Lotofácil",
      tipo: tipoPost || "analise",
    });

    if (postError) {
      console.error("Erro ao criar post:", postError.message);
      throw new Error("Erro ao criar post");
    }

    // 7. Atualizar timestamp do último post do guia
    await supabaseAdmin
      .from("guide_personas")
      .update({ ultimo_post_em: new Date().toISOString() })
      .eq("id", guide.id);

    console.log(`Post criado com sucesso pelo guia: ${guide.perfis?.nome} (tipo: ${tipoPost})`);
    console.log(`Contexto utilizado:\n${contextoEnriquecido}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        guide: guide.perfis?.nome,
        tipo_post: tipoPost,
        titulo: parsed.titulo,
        contexto_resumo: {
          concursos_analisados: resultados?.length || 0,
          ultimo_concurso: resultados?.[0]?.concurso_id
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Erro na função generate-guide-post:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
