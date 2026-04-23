import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { extrairBaseGeracaoLotofacil } from "../_shared/guide-post/lotofacil/base-geracao.ts";
import { extrairBaseGeracaoMegasena } from "../_shared/guide-post/megasena/base-geracao.ts";
import type { Concurso } from "../_shared/guide-post/types.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// =============================================================================
// Endpoint admin one-shot: hidrata base_geracao em postagens já criadas hoje
// que não tenham essa chave no fatos_snapshot. Reaproveita a engine canônica.
// =============================================================================

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await supabaseAuth.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Não autenticado" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const { data: roleRow } = await supabaseAdmin
      .from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
    if (!roleRow) {
      return new Response(JSON.stringify({ error: "Apenas admin" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Janela: últimas 48h, todos rascunhos/publicados de Lotofácil + Mega-Sena
    // Obs: loteria_tag no banco usa rótulos com acento ("Lotofácil", "Mega-Sena").
    const since = new Date(Date.now() - 48 * 3600 * 1000).toISOString();
    const { data: posts, error } = await supabaseAdmin
      .from("postagens")
      .select("id, fatos_snapshot, loteria_tag")
      .in("loteria_tag", ["Lotofácil", "Mega-Sena"])
      .in("status", ["rascunho", "publicado"])
      .gte("created_at", since);

    if (error) throw error;

    let processed = 0, hidratados = 0, jaTinha = 0, semSnapshot = 0, falhas = 0;

    for (const p of posts || []) {
      processed++;
      const snap = p.fatos_snapshot as any;
      if (!snap || !snap.loteria || !snap.tipo_post) { semSnapshot++; continue; }
      if (snap.base_geracao && (snap.base_geracao.fixar?.length || snap.base_geracao.apoio?.length)) {
        jaTinha++; continue;
      }

      const limite = snap.loteria === "megasena" ? 20 : 10;
      // Rebusca os concursos para o tipo
      const { data: results } = await supabaseAdmin
        .from("resultados_loterias")
        .select("concurso, dezenas, data_sorteio, ciclo_numero, dezenas_faltantes_ciclo, qtd_pares, qtd_impares, qtd_repetidas, qtd_primos, qtd_moldura")
        .eq("loteria", snap.loteria)
        .lte("concurso", snap.ultimo_concurso)
        .order("concurso", { ascending: false })
        .limit(limite);

      if (!results || results.length === 0) { falhas++; continue; }
      const concursos: Concurso[] = (results as any[]).map((r) => ({
        concurso_id: r.concurso, dezenas: r.dezenas, data_sorteio: r.data_sorteio,
        ciclo_numero: r.ciclo_numero, dezenas_faltantes_ciclo: r.dezenas_faltantes_ciclo,
        qtd_pares: r.qtd_pares, qtd_impares: r.qtd_impares, qtd_repetidas: r.qtd_repetidas,
        qtd_primos: r.qtd_primos, qtd_moldura: r.qtd_moldura,
      }));

      const base = snap.loteria === "megasena"
        ? extrairBaseGeracaoMegasena(snap.tipo_post, concursos)
        : extrairBaseGeracaoLotofacil(snap.tipo_post, concursos);
      if (!base) { falhas++; continue; }

      const novoSnap = { ...snap, base_geracao: base };
      const { error: upErr } = await supabaseAdmin
        .from("postagens").update({ fatos_snapshot: novoSnap }).eq("id", p.id);
      if (upErr) { falhas++; continue; }
      hidratados++;
    }

    return new Response(JSON.stringify({
      ok: true, processed, hidratados, jaTinha, semSnapshot, falhas,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("[regenerate-base-geracao] erro:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Erro" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
