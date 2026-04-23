import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// =============================================================================
// Pré-gera posts (status='rascunho') para todos os slots ativos do dia.
// Idempotente: pula se já existe rascunho/publicado do mesmo (loteria, tipo) hoje BRT.
// =============================================================================

const LOTERIA_TAG: Record<string, string> = {
  lotofacil: "Lotofácil",
  megasena: "Mega-Sena",
  quina: "Quina",
  duplasena: "Dupla Sena",
  lotomania: "Lotomania",
  diadesorte: "Dia de Sorte",
};

function inicioDiaBRTISO(): string {
  // 00h BRT = 03h UTC do mesmo dia (ou anterior se ainda for madrugada)
  const agora = new Date();
  const inicio = new Date(agora);
  inicio.setUTCHours(3, 0, 0, 0);
  if (agora.getTime() < inicio.getTime()) {
    inicio.setUTCDate(inicio.getUTCDate() - 1);
  }
  return inicio.toISOString();
}

function publicarEmISO(horarioHHMM: string): string {
  // Monta timestamptz para HOJE no horário BRT do schedule
  // BRT = UTC-3, então HH:MM BRT = (HH+3):MM UTC
  const [h, m] = horarioHHMM.split(":").map((n) => parseInt(n));
  const agora = new Date();
  const d = new Date(agora);
  d.setUTCHours(h + 3, m, 0, 0);
  // Se o slot já passou hoje, agenda mesmo assim (cron publica no próximo tick e se for >= now() pega imediato)
  return d.toISOString();
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    const body = await req.json().catch(() => ({}));
    const loteriaFiltro: string | null = body.loteria || null;

    // Lê schedules ativos. Ignora resultado_oficial (vem de sync-*).
    let q = supabaseAdmin
      .from("post_schedules")
      .select("id, tipo_post, horario, dias, loteria")
      .eq("ativo", true)
      .neq("tipo_post", "resultado_oficial");

    if (loteriaFiltro) q = q.eq("loteria", loteriaFiltro);

    const { data: schedules, error: schedErr } = await q;
    if (schedErr) throw schedErr;

    if (!schedules?.length) {
      return new Response(
        JSON.stringify({ success: true, processed: 0, message: "Nenhum schedule ativo" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const inicioBRT = inicioDiaBRTISO();
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const created: string[] = [];
    const skipped: string[] = [];
    const errors: string[] = [];

    for (const sched of schedules) {
      const loteria = sched.loteria || "lotofacil";
      const tag = LOTERIA_TAG[loteria] || loteria;

      try {
        // Idempotência: pula se já existe rascunho ou publicado do dia
        const { data: existente } = await supabaseAdmin
          .from("postagens")
          .select("id, status")
          .eq("loteria_tag", tag)
          .eq("tipo", sched.tipo_post)
          .gte("created_at", inicioBRT)
          .limit(1)
          .maybeSingle();

        if (existente) {
          skipped.push(`${loteria}/${sched.tipo_post}: já existe (${existente.status})`);
          continue;
        }

        // Chama generate-guide-post como rascunho com publicar_em do schedule
        const r = await fetch(`${supabaseUrl}/functions/v1/generate-guide-post`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${serviceKey}`,
          },
          body: JSON.stringify({
            tipo_post: sched.tipo_post,
            loteria,
            status: "rascunho",
            publicar_em: publicarEmISO(sched.horario),
          }),
        });

        if (!r.ok) {
          const errBody = await r.text();
          throw new Error(`generate-guide-post ${r.status}: ${errBody}`);
        }

        const data = await r.json();
        if (data.skipped) {
          skipped.push(`${loteria}/${sched.tipo_post}: ${data.reason}`);
        } else {
          created.push(`${loteria}/${sched.tipo_post}: ${data.postId}`);
        }
      } catch (err) {
        const msg = `${loteria}/${sched.tipo_post}: ${err instanceof Error ? err.message : "erro"}`;
        errors.push(msg);
        console.error(`[precompute-daily-posts] ${msg}`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        created: created.length,
        skipped: skipped.length,
        errors: errors.length,
        details: { created, skipped, errors },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("[precompute-daily-posts] erro:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
