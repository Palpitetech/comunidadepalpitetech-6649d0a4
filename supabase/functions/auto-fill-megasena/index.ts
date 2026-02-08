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

    // Buscar últimos 10 concursos da Mega Sena
    const { data: resultados, error: resultadosError } = await supabase
      .from("resultados_megasena")
      .select("concurso_id, dezenas, qtd_pares, qtd_impares, qtd_primos, qtd_moldura, qtd_repetidas")
      .order("concurso_id", { ascending: false })
      .limit(10);

    if (resultadosError || !resultados?.length) {
      return new Response(
        JSON.stringify({ error: "Erro ao buscar resultados da Mega Sena" }),
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

    // Sistema de prompt para Mega Sena
    const systemPrompt = `Você é um especialista em análise estatística da Mega Sena.

TAREFA: Analisar os últimos 10 concursos e sugerir ${totalDezenas} dezenas para um fechamento da Mega Sena.

REGRAS DO FECHAMENTO:
- A Mega Sena tem números de 01 a 60
- Você DEVE selecionar EXATAMENTE ${totalDezenas} dezenas
- As dezenas devem estar entre 1 e 60
- Cada jogo da Mega Sena tem 6 dezenas

CRITÉRIOS DE ANÁLISE:
1. Frequência: Dê preferência às dezenas que apareceram mais nos últimos concursos
2. Equilíbrio Par/Ímpar: Mantenha proporção equilibrada (geralmente 3/3 ou 4/2)
3. Moldura: Considere as dezenas da moldura (bordas do volante 6x10)
4. Primos: Inclua alguns números primos (02, 03, 05, 07, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59)
5. Repetidas: Considere as dezenas que se repetiram entre concursos
6. Distribuição: Espalhe as dezenas entre as 6 dezenas do volante

NÚMEROS PRIMOS da Mega Sena: 02, 03, 05, 07, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59
NÚMEROS DA MOLDURA (primeira e última linha, primeira e última coluna do grid 6x10): 01-10, 51-60, 01, 11, 21, 31, 41, 51, 10, 20, 30, 40, 50, 60`;

    const userPrompt = `Últimos 10 concursos da Mega Sena:

${contexto.map(c => `Concurso ${c.concurso}: ${c.dezenas.map((d: number) => d.toString().padStart(2, '0')).join(', ')}
  - Pares: ${c.pares}, Ímpares: ${c.impares}
  - Primos: ${c.primos}, Moldura: ${c.moldura}
  - Repetidas do anterior: ${c.repetidas}`).join('\n\n')}

Selecione EXATAMENTE ${totalDezenas} dezenas para o fechamento da Mega Sena.
Para cada dezena selecionada, explique brevemente o motivo da escolha.`;

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
        temperature: 0.4,
        tools: [
          {
            type: "function",
            function: {
              name: "sugerir_dezenas_megasena",
              description: "Retorna as dezenas sugeridas para o fechamento da Mega Sena com a estratégia e justificativa de cada dezena",
              parameters: {
                type: "object",
                properties: {
                  dezenas: {
                    type: "array",
                    items: { type: "number" },
                    description: `Array com ${totalDezenas} dezenas selecionadas (entre 1 e 60)`
                  },
                  estrategia: {
                    type: "object",
                    properties: {
                      ferramentas: {
                        type: "array",
                        items: { type: "string" },
                        description: "Ferramentas/técnicas de análise utilizadas"
                      },
                      dezenas_justificadas: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            dezena: { type: "number" },
                            motivo: { type: "string" }
                          },
                          required: ["dezena", "motivo"]
                        },
                        description: "Cada dezena selecionada com seu motivo específico"
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
                    required: ["ferramentas", "dezenas_justificadas", "filtros_aplicados", "conclusao"]
                  }
                },
                required: ["dezenas", "estrategia"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "sugerir_dezenas_megasena" } }
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
      
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes. Por favor, adicione créditos." }),
          {
            status: 402,
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
        estrategia = args.estrategia || null;
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

    // Validar dezenas (1-60 para Mega Sena)
    dezenas = dezenas.filter((d: number) => typeof d === 'number' && d >= 1 && d <= 60);
    
    // Remover duplicatas
    dezenas = [...new Set(dezenas)];
    
    // Limitar ao total necessário
    dezenas = dezenas.slice(0, totalDezenas);

    // Se não tiver dezenas suficientes, completar
    if (dezenas.length < totalDezenas) {
      const faltando = totalDezenas - dezenas.length;
      const disponiveis = Array.from({ length: 60 }, (_, i) => i + 1)
        .filter(n => !dezenas.includes(n));
      
      for (let i = 0; i < faltando && disponiveis.length > 0; i++) {
        const idx = Math.floor(Math.random() * disponiveis.length);
        dezenas.push(disponiveis.splice(idx, 1)[0]);
      }
    }

    // Ordenar numericamente
    dezenas.sort((a, b) => a - b);

    // Garantir estratégia mínima se não veio da IA
    if (!estrategia) {
      estrategia = {
        ferramentas: ["Frequência (10 concursos)", "Equilíbrio Par/Ímpar", "Análise de Moldura"],
        dezenas_justificadas: dezenas.map(d => ({
          dezena: d,
          motivo: "Selecionada com base na análise estatística"
        })),
        dezenas_evitadas: [],
        filtros_aplicados: [
          {
            filtro: "Análise de Frequência",
            valor_alvo: "10 concursos",
            motivo: "Baseado nos resultados mais recentes da Mega Sena"
          }
        ],
        conclusao: "Seleção baseada na análise estatística dos últimos 10 concursos da Mega Sena."
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

    console.log(`[auto-fill-megasena] Estratégia: ${estrategiaId}, Dezenas geradas:`, dezenas);

    return new Response(
      JSON.stringify({ 
        dezenas, 
        estrategia, 
        analise: contexto
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Erro no auto-fill-megasena:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
