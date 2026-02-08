import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verificar usuário autenticado
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Usuário não autenticado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verificar se é admin
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    const isAdmin = !!roleData;

    // Verificar uso diário (não admins têm limite de 1)
    if (!isAdmin) {
      const today = new Date().toISOString().split("T")[0];
      const { data: usageData } = await supabase
        .from("fechamento_auto_usage")
        .select("count")
        .eq("user_id", user.id)
        .eq("day", today)
        .single();

      if (usageData && usageData.count >= 1) {
        return new Response(
          JSON.stringify({ error: "Limite diário atingido. Tente novamente amanhã." }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // Obter parâmetros do fechamento
    const { estrategiaId, totalDezenas } = await req.json();

    if (!estrategiaId || !totalDezenas) {
      return new Response(
        JSON.stringify({ error: "Parâmetros inválidos" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Definir regras de fixas por estratégia
    const estrategiaConfig: Record<string, { fixas: number; variaveis: number; descricao: string }> = {
      "16-14-4": { fixas: 0, variaveis: 16, descricao: "Selecione 16 dezenas sem ordem específica" },
      "17-14-8": { fixas: 0, variaveis: 17, descricao: "Selecione 17 dezenas sem ordem específica" },
      "19-14-6": { fixas: 13, variaveis: 6, descricao: "As PRIMEIRAS 13 dezenas serão FIXAS e as ÚLTIMAS 6 serão VARIÁVEIS" },
      "21-14-7": { fixas: 14, variaveis: 7, descricao: "As PRIMEIRAS 14 dezenas serão FIXAS e as ÚLTIMAS 7 serão VARIÁVEIS" },
    };

    const config = estrategiaConfig[estrategiaId] || { fixas: 0, variaveis: totalDezenas, descricao: "Selecione as dezenas" };

    // Buscar últimos 4 concursos
    const { data: resultados, error: resultadosError } = await supabase
      .from("resultados")
      .select("concurso_id, dezenas, qtd_pares, qtd_impares, qtd_primos, qtd_moldura, qtd_repetidas")
      .order("concurso_id", { ascending: false })
      .limit(4);

    if (resultadosError || !resultados?.length) {
      return new Response(
        JSON.stringify({ error: "Erro ao buscar resultados" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Preparar contexto para a IA
    const contexto = resultados.map((r, i) => ({
      posicao: i + 1,
      concurso: r.concurso_id,
      dezenas: r.dezenas,
      pares: r.qtd_pares,
      impares: r.qtd_impares,
      primos: r.qtd_primos,
      moldura: r.qtd_moldura,
      repetidas: r.qtd_repetidas,
    }));

    // Chamar Lovable AI
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Configuração de IA não encontrada" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Sistema de prompt diferenciado por estratégia
    let systemPrompt = `Você é um especialista em análise estatística da Lotofácil.

TAREFA: Analisar os últimos 4 concursos e sugerir ${totalDezenas} dezenas para um fechamento.

REGRAS DO FECHAMENTO:
- A Lotofácil tem números de 01 a 25
- Você DEVE selecionar EXATAMENTE ${totalDezenas} dezenas
- As dezenas devem estar entre 1 e 25`;

    // Adicionar regras específicas para estratégias com fixas
    if (config.fixas > 0) {
      systemPrompt += `

⚠️ REGRA CRÍTICA DE ORDENAÇÃO:
- ${config.descricao}
- PRIMEIRO: Escolha as ${config.fixas} dezenas que você considera mais FORTES/CONFIÁVEIS (apareceram mais, são mais equilibradas, etc)
- DEPOIS: Escolha as ${config.variaveis} dezenas que são boas opções mas com menor certeza
- A ORDEM NO ARRAY IMPORTA: posições 0-${config.fixas - 1} = FIXAS, posições ${config.fixas}-${totalDezenas - 1} = VARIÁVEIS
- As FIXAS aparecerão em TODOS os jogos gerados
- As VARIÁVEIS serão distribuídas entre os jogos
- NÃO ORDENE NUMERICAMENTE! Organize por prioridade: FIXAS primeiro, VARIÁVEIS depois`;
    }

    systemPrompt += `

CRITÉRIOS DE ANÁLISE:
1. Frequência: Dê preferência às dezenas que apareceram mais nos últimos concursos
2. Equilíbrio Par/Ímpar: Mantenha proporção próxima de 8/7 ou 7/8
3. Moldura: Inclua algumas dezenas da moldura (bordas do volante)
4. Primos: Inclua alguns números primos (02, 03, 05, 07, 11, 13, 17, 19, 23)
5. Repetidas: Considere as dezenas que se repetiram entre concursos

NÚMEROS PRIMOS da Lotofácil: 02, 03, 05, 07, 11, 13, 17, 19, 23
NÚMEROS DA MOLDURA: 01, 02, 03, 04, 05, 06, 10, 11, 15, 16, 20, 21, 22, 23, 24, 25`;

    let userPrompt = `Últimos 4 concursos da Lotofácil:

${contexto.map(c => `Concurso ${c.concurso}: ${c.dezenas.map((d: number) => d.toString().padStart(2, '0')).join(', ')}
  - Pares: ${c.pares}, Ímpares: ${c.impares}
  - Primos: ${c.primos}, Moldura: ${c.moldura}
  - Repetidas do anterior: ${c.repetidas}`).join('\n\n')}

Selecione EXATAMENTE ${totalDezenas} dezenas para o fechamento.`;

    if (config.fixas > 0) {
      userPrompt += `

IMPORTANTE: Organize as dezenas assim no array de resposta:
- Primeiras ${config.fixas} posições: suas dezenas MAIS FORTES (serão FIXAS em todos os jogos)
- Últimas ${config.variaveis} posições: dezenas complementares (serão VARIÁVEIS)
- NÃO ordene numericamente, ordene por PRIORIDADE/CONFIANÇA!`;
    }

    // Usar tool calling para obter resposta estruturada
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3,
        tools: [
          {
            type: "function",
            function: {
              name: "sugerir_dezenas_fechamento",
              description: config.fixas > 0 
                ? `Retorna as dezenas sugeridas para o fechamento. IMPORTANTE: As primeiras ${config.fixas} dezenas do array serão FIXAS, as últimas ${config.variaveis} serão VARIÁVEIS. NÃO ordene numericamente!`
                : "Retorna as dezenas sugeridas para o fechamento com a estratégia utilizada",
              parameters: {
                type: "object",
                properties: {
                  dezenas: {
                    type: "array",
                    items: { type: "number" },
                    description: config.fixas > 0
                      ? `Array com ${totalDezenas} dezenas. ORDEM IMPORTA: primeiras ${config.fixas} são FIXAS (mais fortes), últimas ${config.variaveis} são VARIÁVEIS`
                      : "Array com as dezenas selecionadas (entre 1 e 25)"
                  },
                  estrategia: {
                    type: "object",
                    properties: {
                      ferramentas: {
                        type: "array",
                        items: { type: "string" },
                        description: "Ferramentas/técnicas de análise utilizadas"
                      },
                      dezenas_priorizadas: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            dezenas: { type: "array", items: { type: "number" } },
                            motivo: { type: "string" }
                          },
                          required: ["dezenas", "motivo"]
                        },
                        description: config.fixas > 0 ? "Dezenas escolhidas como FIXAS e o motivo" : "Dezenas priorizadas e o motivo"
                      },
                      dezenas_evitadas: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            dezenas: { type: "array", items: { type: "number" } },
                            motivo: { type: "string" }
                          },
                          required: ["dezenas", "motivo"]
                        },
                        description: "Dezenas que foram evitadas e o motivo"
                      },
                      filtros_aplicados: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            filtro: { type: "string" },
                            valor_alvo: { type: "string" },
                            motivo: { type: "string" }
                          },
                          required: ["filtro", "motivo"]
                        },
                        description: "Filtros estatísticos aplicados"
                      },
                      conclusao: {
                        type: "string",
                        description: "Resumo da estratégia em 1-2 frases"
                      }
                    },
                    required: ["ferramentas", "filtros_aplicados", "conclusao"]
                  }
                },
                required: ["dezenas", "estrategia"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "sugerir_dezenas_fechamento" } }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI Gateway error:", aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns segundos." }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "Erro ao processar com IA" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const aiData = await aiResponse.json();
    
    // Extrair dados do tool call
    let dezenas: number[] = [];
    let estrategia = null;
    
    try {
      const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
      if (toolCall?.function?.arguments) {
        const args = JSON.parse(toolCall.function.arguments);
        dezenas = args.dezenas || [];
        
        // Converter para formato EstrategiaData
        if (args.estrategia) {
          estrategia = {
            ferramentas: args.estrategia.ferramentas || [],
            dezenas_fixas: args.estrategia.dezenas_priorizadas || [],
            dezenas_evitadas: args.estrategia.dezenas_evitadas || [],
            filtros_aplicados: args.estrategia.filtros_aplicados || [],
            conclusao: args.estrategia.conclusao || "Análise baseada nos últimos 4 concursos."
          };
        }
      }
    } catch (e) {
      console.error("Erro ao parsear resposta da IA:", e);
      
      // Fallback: tentar extrair do content se tool call falhar
      const content = aiData.choices?.[0]?.message?.content || "";
      const match = content.match(/\[[\d,\s]+\]/);
      if (match) {
        dezenas = JSON.parse(match[0]);
      }
    }

    // Validar dezenas (manter ordem original se tem fixas!)
    dezenas = dezenas.filter((d: number) => typeof d === 'number' && d >= 1 && d <= 25);
    
    // Remover duplicatas mantendo ordem
    dezenas = [...new Set(dezenas)];
    
    // Limitar ao total necessário
    dezenas = dezenas.slice(0, totalDezenas);

    // Se não tiver dezenas suficientes, completar
    if (dezenas.length < totalDezenas) {
      const faltando = totalDezenas - dezenas.length;
      const disponiveis = Array.from({ length: 25 }, (_, i) => i + 1)
        .filter(n => !dezenas.includes(n));
      
      for (let i = 0; i < faltando && disponiveis.length > 0; i++) {
        const idx = Math.floor(Math.random() * disponiveis.length);
        dezenas.push(disponiveis.splice(idx, 1)[0]);
      }
    }

    // IMPORTANTE: Só ordenar se NÃO tiver fixas (FC01, FC02)
    // Para FC03 e FC04, manter a ordem que a IA retornou (fixas primeiro, variáveis depois)
    if (config.fixas === 0) {
      dezenas.sort((a, b) => a - b);
    }

    // Garantir estratégia mínima se não veio da IA
    if (!estrategia) {
      estrategia = {
        ferramentas: ["Frequência (4 concursos)", "Equilíbrio Par/Ímpar"],
        dezenas_fixas: [],
        dezenas_evitadas: [],
        filtros_aplicados: [
          {
            filtro: "Análise de Frequência",
            valor_alvo: "4 concursos",
            motivo: "Baseado nos resultados mais recentes"
          }
        ],
        conclusao: config.fixas > 0 
          ? `Seleção com ${config.fixas} dezenas fixas (mais frequentes) e ${config.variaveis} variáveis.`
          : "Seleção baseada na análise estatística dos últimos 4 concursos da Lotofácil."
      };
    }

    // Registrar uso (não admins)
    if (!isAdmin) {
      const today = new Date().toISOString().split("T")[0];
      const { data: existingUsage } = await supabase
        .from("fechamento_auto_usage")
        .select("id, count")
        .eq("user_id", user.id)
        .eq("day", today)
        .single();

      if (existingUsage) {
        await supabase
          .from("fechamento_auto_usage")
          .update({ count: existingUsage.count + 1 })
          .eq("id", existingUsage.id);
      } else {
        await supabase
          .from("fechamento_auto_usage")
          .insert({ user_id: user.id, day: today, count: 1 });
      }
    }

    console.log(`[auto-fill-fechamento] Estratégia: ${estrategiaId}, Fixas: ${config.fixas}, Dezenas geradas:`, dezenas);

    return new Response(
      JSON.stringify({ 
        dezenas, 
        estrategia, 
        analise: contexto,
        config: { fixas: config.fixas, variaveis: config.variaveis }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Erro no auto-fill-fechamento:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
