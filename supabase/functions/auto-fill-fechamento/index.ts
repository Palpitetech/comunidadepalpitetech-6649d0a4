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

    const systemPrompt = `Você é um especialista em análise estatística da Lotofácil.

TAREFA: Analisar os últimos 4 concursos e sugerir ${totalDezenas} dezenas para um fechamento.

REGRAS DO FECHAMENTO:
- A Lotofácil tem números de 01 a 25
- Você DEVE selecionar EXATAMENTE ${totalDezenas} dezenas
- As dezenas devem estar entre 1 e 25
- Retorne APENAS um array JSON com os números, exemplo: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]

CRITÉRIOS DE ANÁLISE:
1. Frequência: Dê preferência às dezenas que apareceram mais nos últimos concursos
2. Equilíbrio Par/Ímpar: Mantenha proporção próxima de 8/7 ou 7/8
3. Moldura: Inclua algumas dezenas da moldura (bordas do volante)
4. Primos: Inclua alguns números primos (02, 03, 05, 07, 11, 13, 17, 19, 23)
5. Repetidas: Considere as dezenas que se repetiram entre concursos

Responda APENAS com o array JSON, sem explicações.`;

    const userPrompt = `Últimos 4 concursos da Lotofácil:

${contexto.map(c => `Concurso ${c.concurso}: ${c.dezenas.map((d: number) => d.toString().padStart(2, '0')).join(', ')}
  - Pares: ${c.pares}, Ímpares: ${c.impares}
  - Primos: ${c.primos}, Moldura: ${c.moldura}
  - Repetidas do anterior: ${c.repetidas}`).join('\n\n')}

Selecione EXATAMENTE ${totalDezenas} dezenas para o fechamento.`;

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
    const content = aiData.choices?.[0]?.message?.content || "";

    // Extrair array de dezenas da resposta
    let dezenas: number[] = [];
    try {
      // Tentar encontrar array na resposta
      const match = content.match(/\[[\d,\s]+\]/);
      if (match) {
        dezenas = JSON.parse(match[0]);
      }
    } catch (e) {
      console.error("Erro ao parsear resposta da IA:", e, content);
    }

    // Validar dezenas
    dezenas = dezenas
      .filter((d: number) => typeof d === 'number' && d >= 1 && d <= 25)
      .slice(0, totalDezenas);

    // Se não tiver dezenas suficientes, completar aleatoriamente
    if (dezenas.length < totalDezenas) {
      const faltando = totalDezenas - dezenas.length;
      const disponiveis = Array.from({ length: 25 }, (_, i) => i + 1)
        .filter(n => !dezenas.includes(n));
      
      for (let i = 0; i < faltando && disponiveis.length > 0; i++) {
        const idx = Math.floor(Math.random() * disponiveis.length);
        dezenas.push(disponiveis.splice(idx, 1)[0]);
      }
    }

    // Ordenar
    dezenas.sort((a, b) => a - b);

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

    return new Response(
      JSON.stringify({ dezenas, analise: contexto }),
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
