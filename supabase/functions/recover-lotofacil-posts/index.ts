import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function criarPostResultadoOficial(params: {
  supabase: any;
  concurso: number;
  dezenas: number[];
  indicadores: { qtd_pares: number; qtd_impares: number; qtd_moldura: number; qtd_primos: number; qtd_repetidas: number };
  cicloInfo: { ciclo_numero: number; dezenas_faltantes_ciclo: number[] };
  acumulou: boolean;
}): Promise<string> {
  const { supabase, concurso, dezenas, indicadores, cicloInfo, acumulou } = params;

  console.log(`[RESULT-POST] Criando post de resultado para concurso ${concurso}`);

  // 1. Buscar perfil_id do autor de resultados
  const { data: author, error: authorError } = await supabase
    .from("guide_personas")
    .select("id, perfil_id, system_prompt, max_chars_post, ai_model, total_posts, perfis(nome)")
    .eq("is_result_author", true)
    .eq("ativo", true)
    .single();

  if (authorError || !author) {
    throw new Error(`Autor de resultados não encontrado: ${authorError?.message}`);
  }

  // 2. Montar contexto
  const dezenasFormatadas = dezenas.map(d => d.toString().padStart(2, "0")).join(" - ");
  const faltantes = cicloInfo.dezenas_faltantes_ciclo.map(d => d.toString().padStart(2, "0")).join(", ");

  const contextoResultado = `RESULTADO OFICIAL CONCURSO ${concurso}:
Dezenas: **${dezenasFormatadas}**
Pares: ${indicadores.qtd_pares} | Ímpares: ${indicadores.qtd_impares}
Moldura: ${indicadores.qtd_moldura} | Primos: ${indicadores.qtd_primos}
Repetidas: ${indicadores.qtd_repetidas}
Ciclo: ${cicloInfo.ciclo_numero} | Faltantes: [${faltantes}]
${acumulou ? "💰 ACUMULOU!" : ""}`;

  // 3. Chamar IA
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: author.ai_model || "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: author.system_prompt },
        {
          role: "user",
          content: `Crie um post de PLANTÃO retrô anunciando o resultado oficial da Lotofácil (CONCURSO ${concurso}).
          
${contextoResultado}

Responda APENAS no formato JSON:
{"titulo": "seu título", "conteudo": "seu conteúdo"}`
        }
      ]
    }),
  });

  const aiData = await aiResponse.json();
  const content = aiData.choices?.[0]?.message?.content;
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  const parsed = JSON.parse(jsonMatch?.[0] || content);

  // 4. Inserir post
  const { data: newPost, error: postError } = await supabase
    .from("postagens")
    .insert({
      user_id: author.perfil_id,
      titulo: parsed.titulo,
      conteudo: parsed.conteudo,
      loteria_tag: "Lotofácil",
      tipo: "resultado_oficial",
      concurso_referencia: concurso,
      metadata: { concurso, indicadores, ciclo: cicloInfo, dezenas }
    })
    .select("id")
    .single();

  if (postError) throw postError;

  return newPost.id;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const concursos = [
      {
        concurso: 3657,
        dezenas: [1,2,4,7,8,10,12,13,17,18,19,20,22,23,24],
        indicadores: { qtd_pares: 9, qtd_impares: 6, qtd_moldura: 8, qtd_primos: 6, qtd_repetidas: 9 },
        cicloInfo: { ciclo_numero: 42, dezenas_faltantes_ciclo: [5,9,25] },
        acumulou: false
      },
      {
        concurso: 3658,
        dezenas: [2,3,4,5,9,10,11,12,13,16,18,20,22,23,24],
        indicadores: { qtd_pares: 9, qtd_impares: 6, qtd_moldura: 11, qtd_primos: 6, qtd_repetidas: 10 },
        cicloInfo: { ciclo_numero: 42, dezenas_faltantes_ciclo: [25] },
        acumulou: false
      }
    ];

    const results = [];
    for (const c of concursos) {
      const postId = await criarPostResultadoOficial({
        supabase: supabaseAdmin,
        ...c
      });
      results.push({ concurso: c.concurso, postId });
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
