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
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Usuário não autenticado" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: roleData } = await supabase
      .from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").single();
    const isAdmin = !!roleData;

    if (!isAdmin) {
      const today = new Date().toISOString().split("T")[0];
      const { data: usageData } = await supabase
        .from("fechamento_auto_usage").select("count").eq("user_id", user.id).eq("day", today).single();
      if (usageData && usageData.count >= 1) {
        return new Response(JSON.stringify({ error: "Limite diário atingido. Tente novamente amanhã." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const { estrategiaId, totalDezenas } = await req.json();
    if (!estrategiaId || !totalDezenas) {
      return new Response(JSON.stringify({ error: "Parâmetros inválidos" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: rawResultados, error: resultadosError } = await supabase
      .from("resultados_loterias")
      .select("concurso, dezenas, dezenas_sorteio2, qtd_pares, qtd_impares, qtd_primos, qtd_moldura, qtd_repetidas")
      .eq("loteria", "duplasena")
      .order("concurso", { ascending: false })
      .limit(10);
    const resultados = (rawResultados || []).map((r: any) => ({
      concurso_id: r.concurso, dezenas_sorteio1: r.dezenas, dezenas_sorteio2: r.dezenas_sorteio2,
      qtd_pares_s1: r.qtd_pares, qtd_impares_s1: r.qtd_impares, qtd_primos_s1: r.qtd_primos, qtd_moldura_s1: r.qtd_moldura, qtd_repetidas_s1: r.qtd_repetidas,
    }));

    if (resultadosError || !resultados?.length) {
      return new Response(JSON.stringify({ error: "Erro ao buscar resultados da Dupla Sena" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const contexto = resultados.map((r, i) => ({
      posicao: i + 1,
      concurso: r.concurso_id,
      dezenas_s1: r.dezenas_sorteio1,
      dezenas_s2: r.dezenas_sorteio2,
      pares: r.qtd_pares_s1,
      impares: r.qtd_impares_s1,
      primos: r.qtd_primos_s1,
      moldura: r.qtd_moldura_s1,
      repetidas: r.qtd_repetidas_s1,
    }));

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "Configuração de IA não encontrada" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `Você é um especialista em análise estatística da Dupla Sena.

TAREFA: Analisar os últimos 10 concursos e sugerir ${totalDezenas} dezenas para um fechamento da Dupla Sena.

REGRAS DO FECHAMENTO:
- A Dupla Sena tem números de 01 a 50
- Você DEVE selecionar EXATAMENTE ${totalDezenas} dezenas
- As dezenas devem estar entre 1 e 50
- Cada jogo da Dupla Sena tem 6 dezenas
- São 2 sorteios por concurso

CRITÉRIOS DE ANÁLISE:
1. Frequência: Dê preferência às dezenas que apareceram mais nos últimos concursos (ambos os sorteios)
2. Equilíbrio Par/Ímpar: Mantenha proporção equilibrada (geralmente 3/3 ou 4/2)
3. Moldura: Considere as dezenas da moldura (bordas do volante 5x10)
4. Primos: Inclua alguns números primos (02, 03, 05, 07, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47)
5. Repetidas: Considere dezenas que se repetiram entre concursos
6. Distribuição: Espalhe as dezenas entre as 5 linhas do volante

MOLDURA DA DUPLA SENA (grid 5x10): 01-10, 41-50, 11, 21, 31, 20, 30, 40`;

    const userPrompt = `Últimos 10 concursos da Dupla Sena:

${contexto.map(c => `Concurso ${c.concurso}:
  Sorteio 1: ${c.dezenas_s1.map((d: number) => d.toString().padStart(2, '0')).join(', ')}
  Sorteio 2: ${c.dezenas_s2.map((d: number) => d.toString().padStart(2, '0')).join(', ')}
  - Pares: ${c.pares}, Ímpares: ${c.impares}, Primos: ${c.primos}, Moldura: ${c.moldura}`).join('\n\n')}

Selecione EXATAMENTE ${totalDezenas} dezenas para o fechamento da Dupla Sena.
Para cada dezena, explique brevemente o motivo.`;

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
        tools: [{
          type: "function",
          function: {
            name: "sugerir_dezenas_duplasena",
            description: "Retorna as dezenas sugeridas para o fechamento da Dupla Sena",
            parameters: {
              type: "object",
              properties: {
                dezenas: {
                  type: "array",
                  items: { type: "number" },
                  description: `Array com ${totalDezenas} dezenas selecionadas (entre 1 e 50)`
                },
                estrategia: {
                  type: "object",
                  properties: {
                    ferramentas: { type: "array", items: { type: "string" } },
                    dezenas_justificadas: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: { dezena: { type: "number" }, motivo: { type: "string" } },
                        required: ["dezena", "motivo"]
                      }
                    },
                    dezenas_evitadas: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: { dezenas: { type: "array", items: { type: "number" } }, motivo: { type: "string" } },
                        required: ["dezenas", "motivo"]
                      }
                    },
                    filtros_aplicados: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: { filtro: { type: "string" }, valor_alvo: { type: "string" }, motivo: { type: "string" } },
                        required: ["filtro", "motivo"]
                      }
                    },
                    conclusao: { type: "string" }
                  },
                  required: ["ferramentas", "dezenas_justificadas", "filtros_aplicados", "conclusao"]
                }
              },
              required: ["dezenas", "estrategia"]
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "sugerir_dezenas_duplasena" } }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI Gateway error:", aiResponse.status, errorText);
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns segundos." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados. Adicione créditos ao workspace para continuar." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "Erro ao processar com IA" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
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
      const content = aiData.choices?.[0]?.message?.content || "";
      const match = content.match(/\[[\d,\s]+\]/);
      if (match) dezenas = JSON.parse(match[0]);
    }

    // Validar dezenas (1-50 para Dupla Sena)
    dezenas = dezenas.filter((d: number) => typeof d === 'number' && d >= 1 && d <= 50);
    dezenas = [...new Set(dezenas)];
    dezenas = dezenas.slice(0, totalDezenas);

    if (dezenas.length < totalDezenas) {
      const faltando = totalDezenas - dezenas.length;
      const disponiveis = Array.from({ length: 50 }, (_, i) => i + 1).filter(n => !dezenas.includes(n));
      for (let i = 0; i < faltando && disponiveis.length > 0; i++) {
        const idx = Math.floor(Math.random() * disponiveis.length);
        dezenas.push(disponiveis.splice(idx, 1)[0]);
      }
    }

    dezenas.sort((a, b) => a - b);

    if (!estrategia) {
      estrategia = {
        ferramentas: ["Frequência (10 concursos)", "Equilíbrio Par/Ímpar", "Análise de Moldura"],
        dezenas_justificadas: dezenas.map(d => ({ dezena: d, motivo: "Selecionada com base na análise estatística" })),
        dezenas_evitadas: [],
        filtros_aplicados: [{ filtro: "Análise de Frequência", valor_alvo: "10 concursos", motivo: "Baseado nos resultados mais recentes da Dupla Sena" }],
        conclusao: "Seleção baseada na análise estatística dos últimos 10 concursos da Dupla Sena."
      };
    }

    if (!isAdmin) {
      const today = new Date().toISOString().split("T")[0];
      const { data: existingUsage } = await supabase
        .from("fechamento_auto_usage").select("id, count").eq("user_id", user.id).eq("day", today).single();
      if (existingUsage) {
        await supabase.from("fechamento_auto_usage").update({ count: existingUsage.count + 1 }).eq("id", existingUsage.id);
      } else {
        await supabase.from("fechamento_auto_usage").insert({ user_id: user.id, day: today, count: 1 });
      }
    }

    console.log(`[auto-fill-duplasena] Estratégia: ${estrategiaId}, Dezenas geradas:`, dezenas);

    return new Response(JSON.stringify({ dezenas, estrategia, analise: contexto }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Erro no auto-fill-duplasena:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
