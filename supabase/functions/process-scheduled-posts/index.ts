import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// =============================================================================
// CONSTANTES — autor único da comunidade
// =============================================================================
const AUGUSTO_PERFIL_ID = "41b58d48-2ef1-4bf7-a536-ed8a49607fa9";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Overrides de teste (testTime "HH:MM", testDay 0..6)
    const body = await req.json().catch(() => ({}));
    const testTime: string | undefined = body.testTime;
    const testDay: number | null = body.testDay !== undefined ? body.testDay : null;

    // Horário atual em Brasília (UTC-3)
    const now = new Date();
    const brasiliaOffset = -3 * 60;
    const utcOffset = now.getTimezoneOffset();
    const brasiliaTime = new Date(now.getTime() + (utcOffset + brasiliaOffset) * 60 * 1000);

    const currentHour = brasiliaTime.getHours().toString().padStart(2, "0");
    const currentMinute = brasiliaTime.getMinutes().toString().padStart(2, "0");

    let currentTime = `${currentHour}:${currentMinute}`;
    let currentDay = brasiliaTime.getDay(); // 0=Dom

    if (testTime) {
      currentTime = testTime;
      console.log(`[process-scheduled-posts] 🧪 TESTE: simulando horário ${currentTime}`);
    }
    if (testDay !== null) {
      currentDay = testDay;
      console.log(`[process-scheduled-posts] 🧪 TESTE: simulando dia ${currentDay}`);
    }

    const [simulatedHour, simulatedMinute] = currentTime.split(":");
    const currentTotalMinutes = parseInt(simulatedHour) * 60 + parseInt(simulatedMinute);

    console.log(`[process-scheduled-posts] Verificando ${currentTime} (dia ${currentDay})`);

    // Buscar agenda ativa que combina com horário+dia atuais
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

    const processed: string[] = [];
    const skipped: string[] = [];
    const errors: string[] = [];

    for (const sched of schedules) {
      try {
        // Pular slot 23:00 do tipo resultado_oficial (disparado por sync-lotofacil)
        if (sched.tipo_post === "resultado_oficial") {
          continue;
        }

        // Filtrar por dia
        if (!sched.dias?.includes(currentDay)) continue;

        // Filtrar por horário (margem 1min em produção, exato em teste)
        const [schedHour, schedMin] = sched.horario.split(":");
        const schedTotalMinutes = parseInt(schedHour) * 60 + parseInt(schedMin);
        const matches = testTime
          ? sched.horario === currentTime
          : Math.abs(schedTotalMinutes - currentTotalMinutes) <= 1;

        if (!matches) continue;

        // Dedup 30 min — mesmo tipo, mesmo autor
        const thirtyMinAgo = new Date(now.getTime() - 30 * 60 * 1000).toISOString();
        const { data: recent } = await supabaseAdmin
          .from("postagens")
          .select("id")
          .eq("user_id", AUGUSTO_PERFIL_ID)
          .eq("tipo", sched.tipo_post)
          .gte("created_at", thirtyMinAgo)
          .limit(1)
          .maybeSingle();

        if (recent) {
          skipped.push(`${sched.tipo_post}: já postou recentemente`);
          continue;
        }

        console.log(`[process-scheduled-posts] ✅ Disparando ${sched.tipo_post} (${sched.horario})`);

        const generateUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/generate-guide-post`;
        const r = await fetch(generateUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          },
          body: JSON.stringify({ tipo_post: sched.tipo_post }),
        });

        if (!r.ok) {
          const errBody = await r.text();
          throw new Error(`generate-guide-post ${r.status}: ${errBody}`);
        }

        const data = await r.json();
        processed.push(`${sched.tipo_post}: ${data.postId || "ok"}`);
      } catch (err) {
        const msg = `${sched.tipo_post}: ${err instanceof Error ? err.message : "erro"}`;
        errors.push(msg);
        console.error(`[process-scheduled-posts] ${msg}`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: processed.length,
        posts: processed,
        skipped: skipped.length ? skipped : undefined,
        errors: errors.length ? errors : undefined,
        checkedAt: currentTime,
        day: currentDay,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("[process-scheduled-posts] Erro geral:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
