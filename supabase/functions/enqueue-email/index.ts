import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EnqueuePayload {
  event_trigger: string;
  recipient_email: string;
  recipient_name?: string;
  variables?: Record<string, string>;
  plan_id?: string;
  tags?: string[];
  priority?: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = (await req.json()) as EnqueuePayload | EnqueuePayload[];
    const items = Array.isArray(body) ? body : [body];
    const results: any[] = [];

    for (const payload of items) {
      const { event_trigger, recipient_email, recipient_name, variables = {}, plan_id, tags = [], priority = 5 } = payload;

      if (!event_trigger || !recipient_email) {
        results.push({ ok: false, error: "missing event_trigger or recipient_email", recipient_email });
        continue;
      }

      const email = recipient_email.trim().toLowerCase();

      // Suppression check
      const { data: supp } = await supabase
        .from("email_suppressions")
        .select("email")
        .eq("email", email)
        .maybeSingle();
      if (supp) {
        results.push({ ok: false, skipped: "suppressed", recipient_email: email });
        continue;
      }

      // Active templates for this trigger
      const { data: templates, error: tplErr } = await supabase
        .from("email_templates")
        .select("*")
        .eq("event_trigger", event_trigger)
        .eq("is_active", true);

      if (tplErr) {
        results.push({ ok: false, error: tplErr.message, recipient_email: email });
        continue;
      }
      if (!templates || templates.length === 0) {
        results.push({ ok: false, skipped: "no_active_template", recipient_email: email });
        continue;
      }

      for (const tpl of templates) {
        // Plan filter
        if (tpl.plan_ids?.length > 0 && plan_id && !tpl.plan_ids.includes(plan_id)) continue;
        // Exclude tags
        if (tpl.exclude_tags?.length > 0 && tags.some((t) => tpl.exclude_tags.includes(t))) continue;
        // Include tags
        if (tpl.include_tags?.length > 0) {
          const matchAll = tpl.tags_match_mode === "all";
          const ok = matchAll
            ? tpl.include_tags.every((t: string) => tags.includes(t))
            : tpl.include_tags.some((t: string) => tags.includes(t));
          if (!ok) continue;
        }

        const scheduled_at = new Date(Date.now() + (tpl.delay_minutes || 0) * 60_000).toISOString();

        const { error: insErr } = await supabase.from("email_queue").insert({
          template_id: tpl.id,
          recipient_email: email,
          recipient_name: recipient_name || null,
          variables,
          status: "pending",
          scheduled_at,
          priority,
        });

        if (insErr) {
          // 23P01 = exclusion violation (dedupe). Treat as success-skip.
          const isDedupe = insErr.message?.includes("email_queue_dedupe_7d_excl");
          results.push({
            ok: isDedupe,
            template_id: tpl.id,
            recipient_email: email,
            ...(isDedupe ? { skipped: "duplicate_7d" } : { error: insErr.message }),
          });
        } else {
          results.push({ ok: true, template_id: tpl.id, recipient_email: email, scheduled_at });
        }
      }
    }

    return new Response(JSON.stringify({ ok: true, results }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("[enqueue-email]", err);
    return new Response(JSON.stringify({ ok: false, error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
