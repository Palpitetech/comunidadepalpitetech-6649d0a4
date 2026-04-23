import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Mapeamento loteria slug -> tag exibida em postagens.loteria_tag
const TAG_BY_LOTERIA: Record<string, string> = {
  lotofacil: "Lotofácil",
  megasena: "Mega-Sena",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const authHeader = req.headers.get("Authorization");

    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await supabaseAuth.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Usuário não autenticado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = new URL(req.url);
    const loteria = (url.searchParams.get("loteria") || "lotofacil").toLowerCase();
    const limit = Math.min(Math.max(parseInt(url.searchParams.get("limit") || "10", 10), 1), 30);
    const tag = TAG_BY_LOTERIA[loteria];
    if (!tag) {
      return new Response(JSON.stringify({ error: `Loteria não suportada: ${loteria}` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Admin enxerga rascunho e publicado; usuário comum só publicado
    const { data: adminRole } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();
    const isAdmin = !!adminRole;
    const statusAceitos = isAdmin ? ["publicado", "rascunho"] : ["publicado"];

    const { data: posts, error } = await supabaseAdmin
      .from("postagens")
      .select("id, titulo, tema_estudo, status, publicar_em, fatos_snapshot, slug, loteria_tag")
      .eq("loteria_tag", tag)
      .in("status", statusAceitos)
      .not("fatos_snapshot", "is", null)
      .order("publicar_em", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("[list-estudos] erro:", error);
      return new Response(JSON.stringify({ error: "Erro ao listar estudos" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Busca último concurso oficial para marcar "passado vs próximo"
    const { data: ultimo } = await supabaseAdmin
      .from("resultados_loterias")
      .select("concurso")
      .eq("loteria", loteria)
      .order("concurso", { ascending: false })
      .limit(1)
      .maybeSingle();
    const ultimoConcursoOficial = ultimo?.concurso ?? 0;

    // Coleta números de próximo_concurso para buscar datas em proximos_concursos
    const numerosProximos = Array.from(
      new Set(
        (posts || [])
          .map((p: any) => p.fatos_snapshot?.proximo_concurso)
          .filter((n: any) => typeof n === "number"),
      ),
    ).map((n) => String(n));

    const dataPorConcurso: Record<string, string | null> = {};
    if (numerosProximos.length) {
      const { data: prox } = await supabaseAdmin
        .from("proximos_concursos")
        .select("numero_concurso, data_sorteio")
        .eq("loteria", loteria)
        .in("numero_concurso", numerosProximos);
      for (const r of prox || []) {
        dataPorConcurso[r.numero_concurso] = r.data_sorteio;
      }
    }

    const estudos = (posts || []).map((p: any) => {
      const snap = p.fatos_snapshot || {};
      const proximo = snap.proximo_concurso ?? null;
      const ehFuturo = typeof proximo === "number" && proximo > ultimoConcursoOficial;
      const dataSorteio = proximo != null ? dataPorConcurso[String(proximo)] ?? null : null;
      return {
        id: p.id,
        slug: p.slug,
        titulo: p.titulo,
        tema_estudo: p.tema_estudo,
        status: p.status,
        publicar_em: p.publicar_em,
        loteria_tag: p.loteria_tag,
        proximo_concurso: proximo,
        ultimo_concurso: snap.ultimo_concurso ?? null,
        recomendacao_direta: snap.recomendacao_direta ?? null,
        eh_futuro: ehFuturo,
        data_sorteio: dataSorteio,
      };
    });

    return new Response(
      JSON.stringify({
        success: true,
        loteria,
        ultimo_concurso_oficial: ultimoConcursoOficial,
        estudos,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("[list-estudos-disponiveis] erro:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
