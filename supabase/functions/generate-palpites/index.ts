import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Constantes da Lotofácil
const MOLDURA = [1, 2, 3, 4, 5, 6, 10, 11, 15, 16, 20, 21, 22, 23, 24, 25];
const PRIMOS = [2, 3, 5, 7, 11, 13, 17, 19, 23];

interface ResultadoRow {
  concurso_id: number;
  data_sorteio: string;
  dezenas: number[];
  qtd_pares: number | null;
  qtd_impares: number | null;
  qtd_moldura: number | null;
  qtd_primos: number | null;
  qtd_repetidas: number | null;
  ciclo_numero: number | null;
  dezenas_faltantes_ciclo: number[] | null;
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

    // Cliente autenticado para verificar usuário
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

    // Cliente service role para operações privilegiadas
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Obter parâmetros do body
    const body = await req.json().catch(() => ({}));
    const quantidade = Math.min(Math.max(body.quantidade || 1, 1), 250);
    const qtdDezenas = Math.min(Math.max(body.qtdDezenas || 15, 15), 20);

    // Verificar se é admin (geração infinita)
    const { data: userRole } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();
    
    const isAdmin = !!userRole;

    // Verificar plano e feature do usuário
    const { data: perfil } = await supabaseAdmin
      .from("perfis")
      .select("plan_id, custom_features")
      .eq("id", user.id)
      .single();

    let geradorMaxPerDay = 1; // Default para usuários sem plano
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

    // Verificar custom_features override
    if (perfil?.custom_features) {
      const customFeatures = perfil.custom_features as Record<string, boolean>;
      if (customFeatures.gerador !== undefined) {
        hasGeradorFeature = customFeatures.gerador;
      }
    }

    // Verificar uso diário (admins ignoram o limite)
    const today = new Date().toISOString().split("T")[0];
    const { data: usage } = await supabaseAdmin
      .from("gerador_daily_usage")
      .select("count")
      .eq("user_id", user.id)
      .eq("day", today)
      .single();

    const currentUsage = usage?.count || 0;
    
    // Admins têm geração infinita
    const remainingToday = isAdmin ? 999 : Math.max(geradorMaxPerDay - currentUsage, 0);
    const effectiveMaxPerDay = isAdmin ? -1 : geradorMaxPerDay; // -1 = infinito

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

    // Buscar últimos 50 resultados para análise
    const { data: resultados, error: resultadosError } = await supabaseAdmin
      .from("resultados")
      .select("concurso_id, data_sorteio, dezenas, qtd_pares, qtd_impares, qtd_moldura, qtd_primos, qtd_repetidas, ciclo_numero, dezenas_faltantes_ciclo")
      .order("concurso_id", { ascending: false })
      .limit(50);

    if (resultadosError || !resultados?.length) {
      return new Response(JSON.stringify({ error: "Erro ao buscar resultados" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Calcular estatísticas
    const frequencias: Record<number, number> = {};
    for (let i = 1; i <= 25; i++) frequencias[i] = 0;

    for (const r of resultados) {
      for (const d of r.dezenas) {
        frequencias[d]++;
      }
    }

    const dezenasMaisFrequentes = Object.entries(frequencias)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([d]) => parseInt(d));

    const dezenasMenosFrequentes = Object.entries(frequencias)
      .sort(([,a], [,b]) => a - b)
      .slice(0, 10)
      .map(([d]) => parseInt(d));

    const ultimoResultado = resultados[0];
    const dezenasFaltantesCiclo = ultimoResultado.dezenas_faltantes_ciclo || [];

    // Calcular médias
    const mediaPares = resultados.reduce((acc, r) => acc + (r.qtd_pares || 0), 0) / resultados.length;
    const mediaMoldura = resultados.reduce((acc, r) => acc + (r.qtd_moldura || 0), 0) / resultados.length;
    const mediaPrimos = resultados.reduce((acc, r) => acc + (r.qtd_primos || 0), 0) / resultados.length;
    const mediaRepetidas = resultados.reduce((acc, r) => acc + (r.qtd_repetidas || 0), 0) / resultados.length;

    // Montar contexto para a IA
const contextoEstatistico = `
ANÁLISE DOS ÚLTIMOS 50 CONCURSOS DA LOTOFÁCIL:

ÚLTIMO RESULTADO (Concurso ${ultimoResultado.concurso_id}):
- Dezenas sorteadas: ${ultimoResultado.dezenas.map((d: number) => d.toString().padStart(2, '0')).join(', ')}
- Pares: ${ultimoResultado.qtd_pares} | Ímpares: ${ultimoResultado.qtd_impares}
- Moldura: ${ultimoResultado.qtd_moldura} | Primos: ${ultimoResultado.qtd_primos}
- Ciclo atual: ${ultimoResultado.ciclo_numero}
- Dezenas faltantes no ciclo: ${dezenasFaltantesCiclo.length > 0 ? dezenasFaltantesCiclo.map((d: number) => d.toString().padStart(2, '0')).join(', ') : 'Nenhuma (ciclo completo)'}

FREQUÊNCIAS NOS ÚLTIMOS 50 JOGOS:
- Dezenas mais sorteadas: ${dezenasMaisFrequentes.map(d => `${d.toString().padStart(2, '0')} (${frequencias[d]}x)`).join(', ')}
- Dezenas menos sorteadas: ${dezenasMenosFrequentes.map(d => `${d.toString().padStart(2, '0')} (${frequencias[d]}x)`).join(', ')}

MÉDIAS HISTÓRICAS (50 concursos):
- Média de pares por jogo: ${mediaPares.toFixed(1)}
- Média de dezenas na moldura: ${mediaMoldura.toFixed(1)}
- Média de números primos: ${mediaPrimos.toFixed(1)}
- Média de dezenas repetidas: ${mediaRepetidas.toFixed(1)}

DEFINIÇÕES:
- Moldura: dezenas nas bordas do volante [01-06, 10, 11, 15, 16, 20-25]
- Primos: [02, 03, 05, 07, 11, 13, 17, 19, 23]
- Pares: dezenas divisíveis por 2
- Repetidas: dezenas que saíram no concurso anterior
`;

    const systemPrompt = `Você é um especialista em análise estatística da Lotofácil.

REGRAS OBRIGATÓRIAS:
1. Cada jogo DEVE ter EXATAMENTE ${qtdDezenas} dezenas únicas de 01 a 25
2. As dezenas devem ser números inteiros entre 1 e 25
3. Diversifique as estratégias entre os jogos (se houver mais de um)
4. Considere o equilíbrio histórico nas suas escolhas
5. Inclua pelo menos algumas dezenas faltantes do ciclo quando disponíveis
6. NUNCA prometa vitória - loteria é probabilidade
7. Seja didático e acessível na explicação

Você deve usar a função generate_palpites para retornar os jogos estruturados.`;

    const userPrompt = `${contextoEstatistico}

Com base nesta análise, gere ${quantidade} jogo(s) de Lotofácil com EXATAMENTE ${qtdDezenas} dezenas cada.

Para cada jogo, utilize uma abordagem diferente (se houver mais de um):
- Jogo 1: Foco nas dezenas quentes (mais frequentes)
- Jogo 2: Equilíbrio entre quentes e frias
- Jogo 3: Foco nas dezenas faltantes do ciclo
- Jogo 4+: Combinações estratégicas variadas

Explique brevemente a estratégia geral utilizada, citando dados específicos.`;

    // Chamar Lovable AI com tool calling
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
              description: "Gera palpites estruturados para a Lotofácil com explicação da estratégia",
              parameters: {
                type: "object",
                properties: {
                  jogos: {
                    type: "array",
                    description: `Lista de jogos gerados, cada um com exatamente ${qtdDezenas} dezenas`,
                    items: {
                      type: "object",
                      properties: {
                        dezenas: {
                          type: "array",
                          description: `Array com exatamente ${qtdDezenas} dezenas únicas de 1 a 25`,
                          items: { type: "integer", minimum: 1, maximum: 25 }
                        }
                      },
                      required: ["dezenas"]
                    }
                  },
                  estrategia: {
                    type: "string",
                    description: "Explicação detalhada da estratégia utilizada, citando dados específicos"
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
      const dezenas = jogo.dezenas
        .map((d: number) => Math.round(d))
        .filter((d: number) => d >= 1 && d <= 25);
      
      const dezenasUnicas = [...new Set(dezenas)].slice(0, qtdDezenas);
      
      // Completar com dezenas aleatórias se necessário
      while (dezenasUnicas.length < qtdDezenas) {
        const random = Math.floor(Math.random() * 25) + 1;
        if (!dezenasUnicas.includes(random)) {
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
