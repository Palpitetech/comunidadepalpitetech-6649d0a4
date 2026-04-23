import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// =============================================================================
// Cron horário. Para cada slot ativo:
//  1) Se existe RASCUNHO pronto p/ a loteria/tipo, publica via UPDATE (sem IA)
//  2) Senão, fallback: chama generate-guide-post síncrono como antes
// =============================================================================

const LOTERIA_TAG: Record<string, string> = {
  lotofacil: "Lotofácil",
  megasena: "Mega-Sena",
  quina: "Quina",
  duplasena: "Dupla Sena",
  lotomania: "Lotomania",
  diadesorte: "Dia de Sorte",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const body = await req.json().catch(() => ({}));
    const testTime: string | undefined = body.testTime;
    const testDay: number | null = body.testDay !== undefined ? body.testDay : null;

    const now = new Date();
    const brasiliaOffset = -3 * 60;
    const utcOffset = now.getTimezoneOffset();
    const brasiliaTime = new Date(now.getTime() + (utcOffset + brasiliaOffset) * 60 * 1000);

    const currentHour = brasiliaTime.getHours().toString().padStart(2, "0");
    const currentMinute = brasiliaTime.getMinutes().toString().padStart(2, "0");

    let currentTime = `${currentHour}:${currentMinute}`;
    let currentDay = brasiliaTime.getDay();

    if (testTime) currentTime = testTime;
    if (testDay !== null) currentDay = testDay;

    const [simHour, simMin] = currentTime.split(":");
    const currentTotalMinutes = parseInt(simHour) * 60 + parseInt(simMin);

    const { data: schedules, error: schedErr } = await supabaseAdmin
      .from("post_schedules")
      .select("id, tipo_post, horario, dias, loteria")
      .eq("ativo", true);

    if (schedErr) throw schedErr;

    if (!schedules?.length) {
      return new Response(
        JSON.stringify({ success: true, processed: 0, message: "Nenhum schedule ativo" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const published: string[] = [];
    const generated: string[] = [];
    const skipped: string[] = [];
    const errors: string[] = [];

    for (const sched of schedules) {
      try {
        if (sched.tipo_post === "resultado_oficial") continue;
        if (!sched.dias?.includes(currentDay)) continue;

        const [schedHour, schedMin] = sched.horario.split(":");
        const schedTotal = parseInt(schedHour) * 60 + parseInt(schedMin);
        const matches = testTime
          ? sched.horario === currentTime
          : Math.abs(schedTotal - currentTotalMinutes) <= 1;
        if (!matches) continue;

        const loteria = sched.loteria || "lotofacil";
        const tag = LOTERIA_TAG[loteria] || loteria;

        // 1) Tenta publicar rascunho pronto
        const { data: rascunho } = await supabaseAdmin
          .from("postagens")
          .select("id")
          .eq("status", "rascunho")
          .eq("loteria_tag", tag)
          .eq("tema_estudo", sched.tipo_post)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (rascunho) {
          const { error: updErr } = await supabaseAdmin
            .from("postagens")
            .update({ status: "publicado", created_at: new Date().toISOString() })
            .eq("id", rascunho.id);
          if (updErr) throw updErr;
          published.push(`${loteria}/${sched.tipo_post}: ${rascunho.id}`);
          continue;
        }

        // 2) Dedup curto (mesma faixa de 30min) antes do fallback síncrono
        const thirtyMinAgo = new Date(now.getTime() - 30 * 60 * 1000).toISOString();
        const { data: recent } = await supabaseAdmin
          .from("postagens")
          .select("id")
          .eq("loteria_tag", tag)
          .eq("tipo", sched.tipo_post)
          .eq("status", "publicado")
          .gte("created_at", thirtyMinAgo)
          .limit(1)
          .maybeSingle();
        if (recent) {
          skipped.push(`${loteria}/${sched.tipo_post}: já publicou recentemente`);
          continue;
        }

        // 3) Fallback: gera ao vivo (legado)
        const r = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/generate-guide-post`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          },
          body: JSON.stringify({ tipo_post: sched.tipo_post, loteria }),
        });
        if (!r.ok) throw new Error(`generate-guide-post ${r.status}: ${await r.text()}`);
        const data = await r.json();
        generated.push(`${loteria}/${sched.tipo_post}: ${data.postId || "ok"}`);
      } catch (err) {
        const msg = `${sched.tipo_post}: ${err instanceof Error ? err.message : "erro"}`;
        errors.push(msg);
        console.error(`[process-scheduled-posts] ${msg}`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        published: published.length,
        generated_live: generated.length,
        skipped: skipped.length || undefined,
        errors: errors.length ? errors : undefined,
        details: { published, generated, skipped },
        checkedAt: currentTime,
        day: currentDay,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("[process-scheduled-posts] erro:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
