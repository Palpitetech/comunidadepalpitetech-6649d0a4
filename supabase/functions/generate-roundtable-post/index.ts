import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Constantes para cálculos
const TOTAL_DEZENAS = 25;
const PERIODO_ANALISE = 20;
const LIMIAR_QUENTE = 0.71;
const LIMIAR_FRIO = 0.39;

// System prompt padrão para autor de resultados (fallback)
const DEFAULT_RESULT_AUTHOR_PROMPT = `Você é o líder do Palpite Tech e compartilha análises sobre a Lotofácil.

Diretrizes:
- Fale como líder que trabalha com sua equipe de especialistas
- Mencione que a equipe vai complementar nos comentários
- Tom: profissional, acolhedor, estratégico
- Reconheça que loteria envolve sorte
- Convide à discussão
- NUNCA mencione que é IA, bot ou modelo de linguagem`;

// System prompt especial para RESULTADO OFICIAL (Plantão)
const RESULTADO_OFICIAL_PROMPT = `Você é o âncora do PLANTÃO PALPITE TECH. Sua missão é anunciar o resultado oficial recém-saído da Lotofácil com entusiasmo e precisão jornalística.

FORMATO OBRIGATÓRIO:
1. Inicie com título chamativo usando emoji de alerta (ex: "🚨 SAIU! Resultado do Concurso [N]!")
2. Liste as 15 dezenas sorteadas em DESTAQUE (formato: **01 - 02 - 03 - ...**)
3. Apresente um "Raio-X Rápido" em tópicos:
   - Pares/Ímpares: X/Y
   - Moldura: X dezenas
   - Primos: X dezenas
   - Repetidas: X dezenas do concurso anterior
   - Ciclo: [Status atual]
4. Finalize chamando os especialistas: "Equipe, o que acharam desse padrão?"

DIRETRIZES:
- Tom: Jornalístico, ágil, informativo
- Seja energético mas factual
- NÃO faça previsões
- NUNCA mencione que é IA, bot ou modelo de linguagem`;

// Prompts especializados para comentaristas no modo RESULTADO OFICIAL
const COMENTARISTAS_RESULTADO_OFICIAL: Record<string, string> = {
  estatistica: `Você é especialista em estatística. Ao comentar o resultado oficial:
- Analise se a distribuição de pares/ímpares foi dentro da média (6-9 pares é normal)
- Comente se houve alguma anomalia estatística
- Mencione desvios notáveis
- Máximo 280 caracteres
- NUNCA mencione que é IA`,

  experiencia: `Você é um jogador veterano experiente. Ao comentar o resultado oficial:
- Destaque dezenas que estavam muito atrasadas e finalmente saíram ("Olha a [X] aí, gente!")
- Comente sobre dezenas que continuam sumidas
- Use tom de quem "já viu de tudo"
- Máximo 280 caracteres
- NUNCA mencione que é IA`,

  ciclos: `Você é professor especializado em ciclos da Lotofácil. Ao comentar o resultado oficial:
- Confirme o status do ciclo atual (fechou ou não)
- Liste quais dezenas ainda faltam para completar
- Estime quando o ciclo pode fechar
- Máximo 280 caracteres
- NUNCA mencione que é IA`,

  educação: `Você é professor de probabilidade. Ao comentar o resultado oficial:
- Explique algum padrão interessante do resultado
- Use didática para ensinar sobre probabilidades
- Corrija mitos se aplicável
- Máximo 280 caracteres
- NUNCA mencione que é IA`,

  engajamento: `Você é community manager entusiasta. Ao comentar o resultado oficial:
- Celebre o resultado com energia positiva
- Pergunte quem acertou quantas dezenas
- Incentive a participação da comunidade
- Máximo 280 caracteres
- NUNCA mencione que é IA`,
};

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
  acumulou?: boolean;
}

interface GuideData {
  id: string;
  perfil_id: string;
  system_prompt: string;
  especialidade: string;
  cargo: string;
  perfis: { nome: string | null } | { nome: string | null }[] | null;
}

// Helper para extrair nome do perfil (pode vir como objeto ou array)
function getGuideName(guide: GuideData): string | null {
  if (!guide.perfis) return null;
  if (Array.isArray(guide.perfis)) {
    return guide.perfis[0]?.nome || null;
  }
  return guide.perfis.nome;
}

// Mapeia especialidade do bot para chave do prompt especial
function mapearEspecialidadeParaChave(especialidade: string): string {
  const esp = especialidade.toLowerCase();
  if (esp.includes("estatística") || esp.includes("dados") || esp.includes("padrões")) {
    return "estatistica";
  }
  if (esp.includes("experiência") || esp.includes("intuição") || esp.includes("veterano")) {
    return "experiencia";
  }
  if (esp.includes("ciclo") || esp.includes("matemática") || esp.includes("probabilidade")) {
    return "ciclos";
  }
  if (esp.includes("educação") || esp.includes("didática") || esp.includes("professor")) {
    return "educação";
  }
  if (esp.includes("engajamento") || esp.includes("motivação") || esp.includes("community")) {
    return "engajamento";
  }
  return "estatistica"; // fallback
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

// Calcula o atraso atual de cada dezena
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

  if (quentes.length > 0) {
    contexto += `🔥 DEZENAS QUENTES:\n`;
    contexto += quentes.map(q => `${formatarDezena(q.dezena)} (${Math.round(q.percentual * 100)}%)`).join(", ");
    contexto += "\n\n";
  }

  if (frias.length > 0) {
    contexto += `❄️ DEZENAS FRIAS:\n`;
    contexto += frias.map(f => `${formatarDezena(f.dezena)} (${Math.round(f.percentual * 100)}%)`).join(", ");
    contexto += "\n";
  }

  if (maioresAtrasos.length > 0) {
    contexto += `⏳ MAIORES ATRASOS:\n`;
    contexto += maioresAtrasos.map(([d, a]) => `${formatarDezena(d)} (ausente há ${a} sorteios)`).join(", ");
    contexto += "\n\n";
  }

  if (ultimo.ciclo_numero !== null) {
    contexto += `🔄 STATUS DO CICLO:\n`;
    contexto += `Ciclo atual: ${ultimo.ciclo_numero}\n`;
    
    if (ultimo.dezenas_faltantes_ciclo && ultimo.dezenas_faltantes_ciclo.length > 0) {
      const faltantes = ultimo.dezenas_faltantes_ciclo.map(formatarDezena).join(", ");
      contexto += `Dezenas faltantes: [${faltantes}]\n`;
      
      if (ultimo.dezenas_faltantes_ciclo.length <= 3) {
        contexto += `⚡ Ciclo quase completo!\n`;
      }
    } else {
      contexto += `✅ Ciclo completo - iniciando novo ciclo\n`;
    }
  }

  return contexto;
}

// Monta contexto específico para RESULTADO OFICIAL
function montarContextoResultadoOficial(ultimo: Concurso, concursoAnterior: Concurso | null): string {
  const dezenasFormatadas = ultimo.dezenas.map(formatarDezena).join(" - ");
  
  let contexto = `🎯 RESULTADO OFICIAL CONCURSO ${ultimo.concurso_id}:

📌 DEZENAS SORTEADAS: **${dezenasFormatadas}**

📊 RAIO-X DO RESULTADO:
- Pares: ${ultimo.qtd_pares} | Ímpares: ${ultimo.qtd_impares}
- Moldura: ${ultimo.qtd_moldura} dezenas
- Primos: ${ultimo.qtd_primos} dezenas
- Repetidas: ${ultimo.qtd_repetidas} dezenas do concurso anterior
`;

  if (concursoAnterior) {
    const repetidasList = ultimo.dezenas.filter(d => concursoAnterior.dezenas.includes(d));
    if (repetidasList.length > 0) {
      contexto += `- Dezenas repetidas: [${repetidasList.map(formatarDezena).join(", ")}]\n`;
    }
  }

  contexto += `
🔄 STATUS DO CICLO:
- Ciclo atual: ${ultimo.ciclo_numero || "N/A"}
`;

  if (ultimo.dezenas_faltantes_ciclo && ultimo.dezenas_faltantes_ciclo.length > 0) {
    contexto += `- Dezenas faltantes: [${ultimo.dezenas_faltantes_ciclo.map(formatarDezena).join(", ")}]\n`;
    if (ultimo.dezenas_faltantes_ciclo.length <= 3) {
      contexto += `- ⚡ Ciclo quase fechando!\n`;
    }
  } else {
    contexto += `- ✅ Ciclo completo! Novo ciclo iniciando.\n`;
  }

  if (ultimo.acumulou) {
    contexto += `\n💰 ACUMULOU! Prêmio maior no próximo sorteio.\n`;
  }

  return contexto;
}

// Monta instruções específicas baseadas no tipo de post
function montarInstrucoesTipo(tipoPost: string): string {
  if (tipoPost === "pos_sorteio") {
    return `CONTEXTO: Pós-sorteio. Comente o resultado, destaque padrões, convide à discussão.`;
  } else if (tipoPost === "pre_sorteio") {
    return `CONTEXTO: Pré-sorteio. Compartilhe observações úteis, mencione tendências, deseje boa sorte.`;
  } else if (tipoPost === "resultado_oficial") {
    return `CONTEXTO: PLANTÃO - Resultado Oficial acabou de sair! Anuncie com destaque e energia.`;
  }
  return `CONTEXTO: Análise geral sobre os últimos resultados.`;
}

// Gera comentário de um guia para a mesa redonda
async function gerarComentarioMesaRedonda(
  guide: GuideData,
  contexto: string,
  postConteudo: string,
  LOVABLE_API_KEY: string,
  isResultadoOficial: boolean = false
): Promise<string> {
  // Se for resultado oficial, usar prompt especializado
  let systemPrompt = guide.system_prompt;
  let instrucaoExtra = "";
  
  if (isResultadoOficial) {
    const chaveEspecialidade = mapearEspecialidadeParaChave(guide.especialidade);
    const promptEspecial = COMENTARISTAS_RESULTADO_OFICIAL[chaveEspecialidade];
    if (promptEspecial) {
      systemPrompt = promptEspecial;
      instrucaoExtra = `\n\nIMPORTANTE: Este é o PLANTÃO de resultado oficial. Foque sua análise específica sobre ESTE sorteio que acabou de sair.`;
    }
  }

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: systemPrompt },
        { 
          role: "user", 
          content: `Você está em uma mesa redonda comentando a análise do líder.

POST DO LÍDER:
"${postConteudo}"

CONTEXTO ESTATÍSTICO:
${contexto}
${instrucaoExtra}

INSTRUÇÕES:
- Complemente a análise com sua perspectiva de ${guide.especialidade}
- Concorde, adicione um ponto novo ou destaque algo diferente
- Fale como se estivesse conversando na equipe
- Máximo 280 caracteres
- Seja natural e engajante
- NUNCA mencione que é IA/bot

Responda APENAS com o texto do comentário (sem JSON, sem aspas).`
        }
      ]
    }),
  });
  
  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() || "";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const tipoPost = body.tipo_post || "geral";
    const isResultadoOficial = tipoPost === "resultado_oficial";
    
    console.log(`Gerando post de resultado do tipo: ${tipoPost}${isResultadoOficial ? " (PLANTÃO)" : ""}`);

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1. Buscar autor principal de resultados (is_result_author = true)
    const { data: authorGuide, error: authorError } = await supabaseAdmin
      .from("guide_personas")
      .select("*, perfis(id, nome)")
      .eq("is_result_author", true)
      .eq("ativo", true)
      .eq("can_create_posts", true)
      .single();

    if (authorError || !authorGuide) {
      console.error("Nenhum autor de resultados configurado:", authorError);
      throw new Error("Nenhum bot configurado como autor de resultados. Configure is_result_author = true em um bot.");
    }

    const authorPerfilId = authorGuide.perfil_id;
    const authorName = (authorGuide.perfis as { nome: string | null })?.nome || "Autor";
    // Usar prompt especial para resultado oficial
    const authorPrompt = isResultadoOficial 
      ? RESULTADO_OFICIAL_PROMPT 
      : (authorGuide.system_prompt || DEFAULT_RESULT_AUTHOR_PROMPT);
    const authorModel = authorGuide.ai_model || "google/gemini-3-flash-preview";
    const maxChars = isResultadoOficial ? 600 : (authorGuide.max_chars_post || 400);

    console.log(`Autor de resultados: ${authorName} (${authorPerfilId})`);

    // 2. Buscar últimos resultados para análise
    const { data: resultados, error: resultadosError } = await supabaseAdmin
      .from("resultados")
      .select("concurso_id, dezenas, data_sorteio, ciclo_numero, dezenas_faltantes_ciclo, qtd_pares, qtd_impares, qtd_repetidas, qtd_primos, qtd_moldura, acumulou")
      .order("concurso_id", { ascending: false })
      .limit(PERIODO_ANALISE);

    if (resultadosError) {
      throw new Error("Erro ao buscar resultados");
    }

    const concursos = resultados as Concurso[];
    const ultimoResultado = concursos[0];
    const concursoAnterior = concursos[1] || null;

    // 3. Montar contexto enriquecido (diferente para resultado oficial)
    const contextoEnriquecido = isResultadoOficial
      ? montarContextoResultadoOficial(ultimoResultado, concursoAnterior)
      : montarContextoEnriquecido(concursos);
    
    const instrucoesTipo = montarInstrucoesTipo(tipoPost);

    // 4. Gerar post como autor principal
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY não configurada");
    }

    // Prompt diferente para resultado oficial
    const userPrompt = isResultadoOficial
      ? `Crie um post de PLANTÃO anunciando o resultado oficial da Lotofácil.

${contextoEnriquecido}

INSTRUÇÕES:
- Use o formato de plantão jornalístico
- Destaque as dezenas sorteadas em negrito
- Apresente o Raio-X rápido em tópicos
- Finalize convocando a equipe para análise
- Título: máximo 60 caracteres (use emoji 🚨)
- Conteúdo: máximo ${maxChars} caracteres

Responda APENAS no formato JSON:
{"titulo": "seu título aqui", "conteudo": "seu conteúdo aqui"}`
      : `Crie um post para a comunidade Palpite Tech.

${instrucoesTipo}

CONTEXTO ESTATÍSTICO:
${contextoEnriquecido}

INSTRUÇÕES:
- Você é o líder da comunidade, compartilhando análises com todos
- Mencione que sua equipe vai complementar nos comentários
- NUNCA prometa resultados ou dê certezas sobre o que vai sair
- Reconheça que loteria envolve sorte
- Convide à discussão
- Título: máximo 60 caracteres
- Conteúdo: máximo ${maxChars} caracteres

Responda APENAS no formato JSON:
{"titulo": "seu título aqui", "conteudo": "seu conteúdo aqui"}`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: authorModel,
        messages: [
          { role: "system", content: authorPrompt },
          { role: "user", content: userPrompt }
        ]
      }),
    });

    if (!aiResponse.ok) {
      throw new Error(`Erro na API de IA: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("Resposta da IA vazia");
    }

    // 5. Extrair JSON da resposta
    let parsed;
    try {
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || 
                        content.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]).trim() : content.trim();
      parsed = JSON.parse(jsonStr);
    } catch {
      console.error("Erro ao parsear resposta:", content);
      throw new Error("Formato de resposta inválido");
    }

    if (!parsed.titulo || !parsed.conteudo) {
      throw new Error("Resposta incompleta");
    }

    // 6. Criar post como autor principal (com concurso_referencia para resultado oficial)
    const postData: Record<string, unknown> = {
      user_id: authorPerfilId,
      titulo: parsed.titulo.substring(0, 100),
      conteudo: parsed.conteudo.substring(0, 1000),
      loteria_tag: "Lotofácil",
    };

    if (isResultadoOficial && ultimoResultado) {
      postData.concurso_referencia = ultimoResultado.concurso_id;
    }

    const { data: newPost, error: postError } = await supabaseAdmin
      .from("postagens")
      .insert(postData)
      .select("id")
      .single();

    if (postError || !newPost) {
      throw new Error("Erro ao criar post");
    }

    console.log(`Post criado por ${authorName}: ${newPost.id}${isResultadoOficial ? ` (Concurso ${ultimoResultado.concurso_id})` : ""}`);

    // 7. Atualizar estatísticas do autor
    await supabaseAdmin
      .from("guide_personas")
      .update({ 
        ultimo_post_em: new Date().toISOString(),
        total_posts: (authorGuide.total_posts || 0) + 1
      })
      .eq("id", authorGuide.id);

    // 8. Delay inicial antes dos comentários
    await new Promise(r => setTimeout(r, 2000));

    // 9. Buscar TODOS os guias ativos (exceto o autor)
    const { data: guides, error: guidesError } = await supabaseAdmin
      .from("guide_personas")
      .select("id, perfil_id, system_prompt, especialidade, cargo, perfis(nome)")
      .eq("ativo", true)
      .neq("id", authorGuide.id)
      .order("created_at", { ascending: true });

    if (guidesError || !guides || guides.length === 0) {
      console.log("Nenhum guia comentarista encontrado");
      return new Response(
        JSON.stringify({ 
          success: true, 
          post_id: newPost.id,
          author: authorName,
          comments: 0,
          message: "Post criado, mas sem guias para comentar"
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 10. Para cada guia, gerar e inserir comentário
    const comentariosInseridos: string[] = [];
    
    for (const guide of guides as GuideData[]) {
      try {
        const comentario = await gerarComentarioMesaRedonda(
          guide,
          contextoEnriquecido,
          parsed.conteudo,
          LOVABLE_API_KEY,
          isResultadoOficial
        );

        const guideName = getGuideName(guide);

        if (comentario) {
          await supabaseAdmin.from("post_comments").insert({
            post_id: newPost.id,
            user_id: guide.perfil_id,
            conteudo: comentario.substring(0, 500),
            parent_id: null,
          });

          // Atualizar contador de comentários do guia
          await supabaseAdmin
            .from("guide_personas")
            .update({ total_comments: guide.id })
            .eq("id", guide.id);

          comentariosInseridos.push(guideName || guide.perfil_id);
          console.log(`Comentário inserido por: ${guideName}`);
        }

        // Delay entre comentários para ordem cronológica
        await new Promise(r => setTimeout(r, 3000));
      } catch (err) {
        const guideName = getGuideName(guide);
        console.error(`Erro ao gerar comentário para ${guideName}:`, err);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        post_id: newPost.id,
        author: authorName,
        author_id: authorPerfilId,
        tipo_post: tipoPost,
        titulo: parsed.titulo,
        concurso_referencia: isResultadoOficial ? ultimoResultado.concurso_id : null,
        comentarios: comentariosInseridos,
        total_comentarios: comentariosInseridos.length
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Erro em generate-roundtable-post (autor de resultados):", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
