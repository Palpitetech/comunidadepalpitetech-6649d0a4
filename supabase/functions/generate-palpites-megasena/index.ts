import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Constantes da Mega Sena
const TOTAL_DEZENAS = 60;
const DEZENAS_POR_JOGO = 6;
const PRIMOS = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59];
const MOLDURA = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60]; // Primeira e última linha do volante 6x10

interface ResultadoRow {
  concurso_id: number;
  data_sorteio: string;
  dezenas: number[];
  qtd_pares: number | null;
  qtd_impares: number | null;
  qtd_moldura: number | null;
  qtd_primos: number | null;
  qtd_repetidas: number | null;
}

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
    const periodoAnalise = Math.min(Math.max(body.periodoAnalise || 50, 1), 100);
    
    const dezenasFiexas: number[] = (body.dezenasFiexas || [])
      .filter((d: number) => d >= 1 && d <= TOTAL_DEZENAS)
      .slice(0, 5); // Limite de 5 fixas para Mega Sena (6 dezenas no total)
    const dezenasExcluidas: number[] = (body.dezenasExcluidas || [])
      .filter((d: number) => d >= 1 && d <= TOTAL_DEZENAS)
      .slice(0, 10);
    const pedidoEspecial: string = (body.pedidoEspecial || "").trim().slice(0, 200);

    // Verificar se é admin
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
    let hasGeradorFeature = false;

    if (perfil?.plan_id) {
      const { data: plan } = await supabaseAdmin
        .from("plans")
        .select("features, gerador_max_per_day")
        .eq("id", perfil.plan_id)
        .single();

      if (plan) {
        const features = plan.features as Record<string, boolean> || {};
        hasGeradorFeature = features.gerador === true;
        geradorMaxPerDay = plan.gerador_max_per_day || 1;
      }
    }

    if (perfil?.custom_features) {
      const customFeatures = perfil.custom_features as Record<string, boolean>;
      if (customFeatures.gerador !== undefined) {
        hasGeradorFeature = customFeatures.gerador;
      }
    }

    // Uso diário (compartilhado com Lotofácil)
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

    // Buscar resultados da Mega Sena
    const { data: rawResultados, error: resultadosError } = await supabaseAdmin
      .from("resultados_loterias")
      .select("concurso, data_sorteio, dezenas, qtd_pares, qtd_impares, qtd_moldura, qtd_primos, qtd_repetidas")
      .eq("loteria", "megasena")
      .order("concurso", { ascending: false })
      .limit(periodoAnalise);
    const resultados = (rawResultados || []).map((r: any) => ({ ...r, concurso_id: r.concurso })) as ResultadoRow[];

    if (resultadosError || !resultados?.length) {
      console.error("Erro ao buscar resultados:", resultadosError);
      return new Response(JSON.stringify({ error: "Erro ao buscar resultados da Mega Sena" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Calcular estatísticas
    const frequencias: Record<number, number> = {};
    for (let i = 1; i <= TOTAL_DEZENAS; i++) frequencias[i] = 0;

    for (const r of resultados) {
      for (const d of r.dezenas) {
        frequencias[d]++;
      }
    }

    const dezenasMaisFrequentes = Object.entries(frequencias)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 15)
      .map(([d]) => parseInt(d));

    const dezenasMenosFrequentes = Object.entries(frequencias)
      .sort(([,a], [,b]) => a - b)
      .slice(0, 15)
      .map(([d]) => parseInt(d));

    const ultimoResultado = resultados[0];

    // Calcular médias
    const mediaPares = resultados.reduce((acc, r) => acc + (r.qtd_pares || 0), 0) / resultados.length;
    const mediaMoldura = resultados.reduce((acc, r) => acc + (r.qtd_moldura || 0), 0) / resultados.length;
    const mediaPrimos = resultados.reduce((acc, r) => acc + (r.qtd_primos || 0), 0) / resultados.length;
    const mediaRepetidas = resultados.reduce((acc, r) => acc + (r.qtd_repetidas || 0), 0) / resultados.length;

    // Contexto para IA
const contextoEstatistico = `
ANÁLISE DOS ÚLTIMOS ${periodoAnalise} CONCURSOS DA MEGA SENA:

ÚLTIMO RESULTADO (Concurso ${ultimoResultado.concurso_id}):
- Dezenas sorteadas: ${ultimoResultado.dezenas.map((d: number) => d.toString().padStart(2, '0')).join(', ')}
- Pares: ${ultimoResultado.qtd_pares} | Ímpares: ${ultimoResultado.qtd_impares}
- Moldura: ${ultimoResultado.qtd_moldura} | Primos: ${ultimoResultado.qtd_primos}

FREQUÊNCIAS NOS ÚLTIMOS ${periodoAnalise} JOGOS:
- Dezenas mais sorteadas: ${dezenasMaisFrequentes.slice(0, 10).map(d => `${d.toString().padStart(2, '0')} (${frequencias[d]}x)`).join(', ')}
- Dezenas menos sorteadas: ${dezenasMenosFrequentes.slice(0, 10).map(d => `${d.toString().padStart(2, '0')} (${frequencias[d]}x)`).join(', ')}

MÉDIAS HISTÓRICAS (${periodoAnalise} concursos):
- Média de pares por jogo: ${mediaPares.toFixed(1)} (de 6 dezenas)
- Média de dezenas na moldura: ${mediaMoldura.toFixed(1)}
- Média de números primos: ${mediaPrimos.toFixed(1)}
- Média de dezenas repetidas: ${mediaRepetidas.toFixed(1)}

DEFINIÇÕES MEGA SENA:
- Volante: 60 dezenas organizadas em grid 6x10
- Moldura: primeira e última linha [01-10, 51-60]
- Primos: [02, 03, 05, 07, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59]
- Pares: dezenas divisíveis por 2
- Repetidas: dezenas que saíram no concurso anterior

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

    const systemPrompt = `Você é um especialista em análise estatística da MEGA SENA brasileira.

REGRAS OBRIGATÓRIAS:
1. Cada jogo DEVE ter EXATAMENTE 6 dezenas únicas de 01 a 60
2. As dezenas devem ser números inteiros entre 1 e 60
3. Diversifique as estratégias entre os jogos (se houver mais de um)
4. Considere o equilíbrio par/ímpar e distribuição no volante
5. NUNCA prometa vitória - loteria é probabilidade
6. Seja didático e acessível na explicação
${dezenasFiexas.length > 0 ? `7. OBRIGATÓRIO: Todas as dezenas fixas [${dezenasFiexas.join(', ')}] DEVEM aparecer em TODOS os jogos` : ''}
${dezenasExcluidas.length > 0 ? `8. PROIBIDO: As dezenas excluídas [${dezenasExcluidas.join(', ')}] NÃO PODEM aparecer em nenhum jogo` : ''}

Use a função generate_palpites_megasena para retornar os jogos estruturados.`;

    const userPrompt = `${contextoEstatistico}${filtrosTexto}

Com base nesta análise, gere ${quantidade} jogo(s) de MEGA SENA com EXATAMENTE 6 dezenas cada.

Para cada jogo, utilize uma abordagem diferente:
- Jogo 1: Foco nas dezenas quentes (mais frequentes)
- Jogo 2: Equilíbrio entre quentes e frias
- Jogo 3: Combinação balanceada de pares/ímpares
- Jogo 4+: Estratégias variadas

Explique brevemente a estratégia utilizada.`;

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
              name: "generate_palpites_megasena",
              description: "Gera palpites estruturados para a Mega Sena com explicação detalhada",
              parameters: {
                type: "object",
                properties: {
                  jogos: {
                    type: "array",
                    description: "Lista de jogos gerados, cada um com exatamente 6 dezenas",
                    items: {
                      type: "object",
                      properties: {
                        dezenas: {
                          type: "array",
                          description: "Array com exatamente 6 dezenas únicas de 1 a 60",
                          items: { type: "integer", minimum: 1, maximum: 60 }
                        }
                      },
                      required: ["dezenas"]
                    }
                  },
                  estrategia: {
                    type: "object",
                    description: "Detalhes da estratégia utilizada",
                    properties: {
                      ferramentas: {
                        type: "array",
                        description: "Lista de metodologias utilizadas",
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
                      conclusao: {
                        type: "string",
                        description: "Resumo final da estratégia"
                      }
                    },
                    required: ["ferramentas", "filtros_aplicados", "conclusao"]
                  }
                },
                required: ["jogos", "estrategia"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "generate_palpites_megasena" } },
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
      
      return new Response(JSON.stringify({ error: "Erro ao gerar palpites" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall?.function?.arguments) {
      return new Response(JSON.stringify({ error: "Resposta inválida da IA" }), {
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
        .filter((d: number) => d >= 1 && d <= TOTAL_DEZENAS);
      
      // Remover dezenas excluídas
      if (dezenasExcluidas.length > 0) {
        dezenas = dezenas.filter((d: number) => !dezenasExcluidas.includes(d));
      }
      
      // Garantir dezenas fixas
      if (dezenasFiexas.length > 0) {
        for (const fixa of dezenasFiexas) {
          if (!dezenas.includes(fixa)) {
            dezenas.push(fixa);
          }
        }
      }
      
      const dezenasUnicas = [...new Set(dezenas)].slice(0, DEZENAS_POR_JOGO);
      
      // Completar com dezenas aleatórias se necessário
      while (dezenasUnicas.length < DEZENAS_POR_JOGO) {
        const random = Math.floor(Math.random() * TOTAL_DEZENAS) + 1;
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
