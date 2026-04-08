import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function estimateCost(usage: { prompt_tokens?: number; completion_tokens?: number }, model: string): number {
  const rates: Record<string, { input: number; output: number }> = {
    "google/gemini-3-flash-preview": { input: 0.15, output: 0.60 },
  };
  const rate = rates[model] || { input: 0.15, output: 0.60 };
  return ((usage.prompt_tokens || 0) / 1e6) * rate.input + ((usage.completion_tokens || 0) / 1e6) * rate.output;
}

// Constantes da Quina
const MOLDURA_QUINA = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
  11, 21, 31, 41, 51, 61,
  20, 30, 40, 50, 60, 70,
  71, 72, 73, 74, 75, 76, 77, 78, 79, 80
];
const PRIMOS_QUINA = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79];

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
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Usuário não autenticado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json().catch(() => ({}));
    const quantidade = Math.min(Math.max(body.quantidade || 1, 1), 250);
    const qtdDezenas = 5; // Quina sempre 5 dezenas
    const periodoAnalise = Math.min(Math.max(body.periodoAnalise || 50, 1), 100);

    const dezenasFiexas: number[] = (body.dezenasFiexas || [])
      .filter((d: number) => d >= 1 && d <= 80)
      .slice(0, 4); // Max 4 fixas para Quina (5 dezenas)
    const dezenasExcluidas: number[] = (body.dezenasExcluidas || [])
      .filter((d: number) => d >= 1 && d <= 80)
      .slice(0, 20);
    const pedidoEspecial: string = (body.pedidoEspecial || "").trim().slice(0, 200);

    // Verificar admin
    const { data: userRole } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();
    const isAdmin = !!userRole;

    // Verificar plano
    const { data: perfil } = await supabaseAdmin
      .from("perfis")
      .select("plan_id, custom_features")
      .eq("id", user.id)
      .single();

    let geradorMaxPerDay = 1;
    if (perfil?.plan_id) {
      const { data: plan } = await supabaseAdmin
        .from("plans")
        .select("features, gerador_max_per_day")
        .eq("id", perfil.plan_id)
        .single();
      if (plan) {
        geradorMaxPerDay = plan.gerador_max_per_day || 1;
      }
    }

    // Verificar uso diário
    const today = new Date().toISOString().split("T")[0];
    const { data: usage } = await supabaseAdmin
      .from("gerador_daily_usage")
      .select("count")
      .eq("user_id", user.id)
      .eq("day", today)
      .single();

    const currentUsage = usage?.count || 0;
    const remainingToday = isAdmin ? 999 : Math.max(geradorMaxPerDay - currentUsage, 0);
    const effectiveMaxPerDay = isAdmin ? -1 : geradorMaxPerDay;

    if (!isAdmin && remainingToday <= 0 && geradorMaxPerDay > 0) {
      return new Response(JSON.stringify({
        error: "Limite diário atingido",
        remaining_today: 0,
        max_per_day: geradorMaxPerDay
      }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Buscar resultados da Quina
    const { data: resultados, error: resultadosError } = await supabaseAdmin
      .from("resultados_loterias")
      .select("concurso_id:concurso, data_sorteio, dezenas, qtd_pares, qtd_impares, qtd_moldura, qtd_primos, qtd_repetidas, ciclo_numero, dezenas_faltantes_ciclo")
      .eq("loteria", "quina")
      .order("concurso", { ascending: false })
      .limit(periodoAnalise);

    if (resultadosError || !resultados?.length) {
      return new Response(JSON.stringify({ error: "Erro ao buscar resultados da Quina" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Calcular estatísticas
    const frequencias: Record<number, number> = {};
    for (let i = 1; i <= 80; i++) frequencias[i] = 0;

    for (const r of resultados) {
      for (const d of r.dezenas) {
        frequencias[d]++;
      }
    }

    const sortedByFreq = Object.entries(frequencias)
      .sort(([, a], [, b]) => b - a);

    const dezenasMaisFrequentes = sortedByFreq
      .slice(0, 15)
      .map(([d]) => parseInt(d));

    const dezenasMenosFrequentes = sortedByFreq
      .slice(-15)
      .map(([d]) => parseInt(d));

    const ultimoResultado = resultados[0];
    const dezenasFaltantesCiclo = ultimoResultado.dezenas_faltantes_ciclo || [];

    // Calcular médias
    const mediaPares = resultados.reduce((acc: number, r: any) => acc + (r.qtd_pares || 0), 0) / resultados.length;
    const mediaMoldura = resultados.reduce((acc: number, r: any) => acc + (r.qtd_moldura || 0), 0) / resultados.length;
    const mediaPrimos = resultados.reduce((acc: number, r: any) => acc + (r.qtd_primos || 0), 0) / resultados.length;
    const mediaRepetidas = resultados.reduce((acc: number, r: any) => acc + (r.qtd_repetidas || 0), 0) / resultados.length;

    const contextoEstatistico = `
ANÁLISE DOS ÚLTIMOS ${periodoAnalise} CONCURSOS DA QUINA:

ÚLTIMO RESULTADO (Concurso ${ultimoResultado.concurso_id}):
- Dezenas sorteadas: ${ultimoResultado.dezenas.map((d: number) => d.toString().padStart(2, '0')).join(', ')}
- Pares: ${ultimoResultado.qtd_pares} | Ímpares: ${ultimoResultado.qtd_impares}
- Moldura: ${ultimoResultado.qtd_moldura} | Primos: ${ultimoResultado.qtd_primos}
- Ciclo atual: ${ultimoResultado.ciclo_numero}
- Dezenas faltantes no ciclo: ${dezenasFaltantesCiclo.length > 0 ? dezenasFaltantesCiclo.map((d: number) => d.toString().padStart(2, '0')).join(', ') : 'Nenhuma (ciclo completo)'}

FREQUÊNCIAS NOS ÚLTIMOS ${periodoAnalise} JOGOS:
- Dezenas mais sorteadas: ${dezenasMaisFrequentes.map(d => `${d.toString().padStart(2, '0')} (${frequencias[d]}x)`).join(', ')}
- Dezenas menos sorteadas: ${dezenasMenosFrequentes.map(d => `${d.toString().padStart(2, '0')} (${frequencias[d]}x)`).join(', ')}

MÉDIAS HISTÓRICAS (${periodoAnalise} concursos):
- Média de pares por jogo: ${mediaPares.toFixed(1)}
- Média de dezenas na moldura: ${mediaMoldura.toFixed(1)}
- Média de números primos: ${mediaPrimos.toFixed(1)}
- Média de dezenas repetidas: ${mediaRepetidas.toFixed(1)}

DEFINIÇÕES DA QUINA:
- Universo: 80 dezenas (01 a 80)
- Sorteio: 5 dezenas por concurso
- Grid: 8 linhas x 10 colunas
- Moldura: dezenas nas bordas do volante 8x10
- Primos dentro do universo: ${PRIMOS_QUINA.join(', ')}

PERÍODO DE ANÁLISE: ${periodoAnalise} concurso(s)
`;

    let filtrosTexto = "";
    if (dezenasFiexas.length > 0) {
      filtrosTexto += `\nDEZENAS FIXAS (OBRIGATÓRIAS em TODOS os jogos): ${dezenasFiexas.map((d: number) => d.toString().padStart(2, '0')).join(', ')}`;
    }
    if (dezenasExcluidas.length > 0) {
      filtrosTexto += `\nDEZENAS EXCLUÍDAS (PROIBIDAS em todos os jogos): ${dezenasExcluidas.map((d: number) => d.toString().padStart(2, '0')).join(', ')}`;
    }
    if (pedidoEspecial) {
      filtrosTexto += `\nPEDIDO ESPECIAL DO USUÁRIO: "${pedidoEspecial}"`;
    }

    const systemPrompt = `Você é um especialista em análise estatística da Quina.

REGRAS OBRIGATÓRIAS:
1. Cada jogo DEVE ter EXATAMENTE 5 dezenas únicas de 01 a 80
2. As dezenas devem ser números inteiros entre 1 e 80
3. Diversifique as estratégias entre os jogos
4. Considere o equilíbrio histórico nas suas escolhas
5. Inclua dezenas faltantes do ciclo quando disponíveis
6. NUNCA prometa vitória
7. Seja didático e acessível
${dezenasFiexas.length > 0 ? `8. OBRIGATÓRIO: Todas as dezenas fixas [${dezenasFiexas.join(', ')}] DEVEM aparecer em TODOS os jogos` : ''}
${dezenasExcluidas.length > 0 ? `9. PROIBIDO: As dezenas excluídas [${dezenasExcluidas.join(', ')}] NÃO PODEM aparecer em nenhum jogo` : ''}

Use a função generate_palpites para retornar os jogos estruturados.`;

    const userPrompt = `${contextoEstatistico}${filtrosTexto}

Com base nesta análise, gere ${quantidade} jogo(s) de Quina com EXATAMENTE 5 dezenas cada (de 01 a 80).

Para cada jogo, utilize uma abordagem diferente (se houver mais de um):
- Jogo 1: Foco nas dezenas quentes (mais frequentes)
- Jogo 2: Equilíbrio entre quentes e frias
- Jogo 3: Foco nas dezenas faltantes do ciclo
- Jogo 4+: Combinações estratégicas variadas

Explique brevemente a estratégia geral utilizada.`;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "API key não configurada" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
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
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_palpites",
              description: "Gera palpites estruturados para a Quina",
              parameters: {
                type: "object",
                properties: {
                  jogos: {
                    type: "array",
                    description: "Lista de jogos, cada um com exatamente 5 dezenas de 1-80",
                    items: {
                      type: "object",
                      properties: {
                        dezenas: {
                          type: "array",
                          description: "Array com exatamente 5 dezenas únicas de 1 a 80",
                          items: { type: "integer", minimum: 1, maximum: 80 }
                        }
                      },
                      required: ["dezenas"]
                    }
                  },
                  estrategia: {
                    type: "object",
                    properties: {
                      ferramentas: {
                        type: "array",
                        items: { type: "string" }
                      },
                      dezenas_fixas: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            dezenas: { type: "array", items: { type: "integer" } },
                            motivo: { type: "string" }
                          }
                        }
                      },
                      dezenas_evitadas: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            dezenas: { type: "array", items: { type: "integer" } },
                            motivo: { type: "string" }
                          }
                        }
                      },
                      filtros_aplicados: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            filtro: { type: "string" },
                            valor_alvo: { type: "string" },
                            motivo: { type: "string" }
                          }
                        }
                      },
                      conclusao: { type: "string" }
                    },
                    required: ["ferramentas", "filtros_aplicados", "conclusao"]
                  }
                },
                required: ["jogos", "estrategia"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "generate_palpites" } },
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI error:", aiResponse.status, errorText);

      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições atingido, tente novamente em alguns minutos" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ error: "Erro ao gerar palpites" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    const aiUsage = aiData.usage;

    // Log de uso
    if (aiUsage) {
      supabaseAdmin.from("ai_usage_logs").insert({
        user_id: user.id,
        edge_function: "generate-palpites-quina",
        action_type: "palpite",
        prompt_tokens: aiUsage.prompt_tokens || 0,
        completion_tokens: aiUsage.completion_tokens || 0,
        total_tokens: aiUsage.total_tokens || 0,
        model: "google/gemini-3-flash-preview",
        cost_usd: estimateCost(aiUsage, "google/gemini-3-flash-preview"),
        metadata: { quantidade, periodoAnalise, loteria: "quina" },
      }).then(() => {}).catch(e => console.error("Erro log:", e));
    }

    if (!toolCall?.function?.arguments) {
      return new Response(JSON.stringify({ error: "Resposta inválida" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const palpitesData = JSON.parse(toolCall.function.arguments);

    // Validar jogos
    const jogosValidados = [];
    for (const jogo of palpitesData.jogos) {
      let dezenas = jogo.dezenas
        .map((d: number) => Math.round(d))
        .filter((d: number) => d >= 1 && d <= 80);

      if (dezenasExcluidas.length > 0) {
        dezenas = dezenas.filter((d: number) => !dezenasExcluidas.includes(d));
      }

      if (dezenasFiexas.length > 0) {
        for (const fixa of dezenasFiexas) {
          if (!dezenas.includes(fixa)) {
            dezenas.push(fixa);
          }
        }
      }

      const dezenasUnicas = [...new Set(dezenas)].slice(0, 5);

      // Completar se necessário
      while (dezenasUnicas.length < 5) {
        const random = Math.floor(Math.random() * 80) + 1;
        if (!dezenasUnicas.includes(random) && !dezenasExcluidas.includes(random)) {
          dezenasUnicas.push(random);
        }
      }

      jogosValidados.push({
        dezenas: (dezenasUnicas as number[]).sort((a, b) => a - b)
      });
    }

    // Atualizar uso diário
    await supabaseAdmin
      .from("gerador_daily_usage")
      .upsert({
        user_id: user.id,
        day: today,
        count: currentUsage + 1,
        updated_at: new Date().toISOString()
      }, {
        onConflict: "user_id,day"
      });

    return new Response(JSON.stringify({
      jogos: jogosValidados,
      estrategia: palpitesData.estrategia,
      remaining_today: isAdmin ? 999 : Math.max(remainingToday - 1, 0),
      max_per_day: effectiveMaxPerDay,
      is_admin: isAdmin
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: "Erro interno do servidor" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
