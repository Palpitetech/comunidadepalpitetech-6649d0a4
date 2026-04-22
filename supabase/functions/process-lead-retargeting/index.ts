import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { isEnqueueAllowed, makeSupabaseDedupeClient } from "./dedupe.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SALA_SECRETA_BASE = "https://www.palpitetech.com.br/g/entrar-sala-secreta";

function getSupabase() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
}

/**
 * Acrescenta UTMs de rastreamento ao link da sala secreta.
 * Garante que cada conversão futura apareça como
 * whatsapp / lead_retarget / pre_checkout_2grupoviplf
 * na dashboard de atribuição (last-click).
 */
function buildSalaSecretaLink(): string {
  const url = new URL(SALA_SECRETA_BASE);
  url.searchParams.set("utm_source", "whatsapp");
  url.searchParams.set("utm_medium", "lead_retarget");
  url.searchParams.set("utm_campaign", "pre_checkout_2grupoviplf");
  return url.toString();
}

interface LeadRow {
  id: string;
  nome: string | null;
  email: string | null;
  celular: string | null;
  tags: string[] | null;
  perfil_id: string | null;
  created_at: string;
}

interface TemplateRow {
  id: string;
  delay_minutes: number;
  include_tags: string[];
  exclude_tags: string[];
}

interface TemplateMetrics {
  enqueued: number;
  skipped: number;
  /** Skipped because of dedupe (already queued in last 7d). */
  skipped_dedupe: number;
  /** Skipped because of recent paid conversion (anti-conversion). */
  skipped_converted: number;
  /** Skipped because the linked profile already has a paid tag. */
  skipped_paid_profile: number;
  /** Skipped because the lead has no phone after trim. */
  skipped_no_phone: number;
  /** Atomic dedupe at DB level (exclusion constraint) — race-condition catches. */
  blocked_by_db_constraint: number;
  /** Lead was skipped because the dedupe DB query itself failed. */
  errors_dedupe_db: number;
  /** Lead was skipped because the anti-conversion DB query failed. */
  errors_sales_db: number;
  /** Insert into message_queue failed (other reasons). */
  errors_insert_db: number;
  errors: string[];
}

function emptyMetrics(): TemplateMetrics {
  return {
    enqueued: 0,
    skipped: 0,
    skipped_dedupe: 0,
    skipped_converted: 0,
    skipped_paid_profile: 0,
    skipped_no_phone: 0,
    blocked_by_db_constraint: 0,
    errors_dedupe_db: 0,
    errors_sales_db: 0,
    errors_insert_db: 0,
    errors: [],
  };
}

async function processOneTemplate(
  supabase: ReturnType<typeof createClient>,
  template: TemplateRow
): Promise<TemplateMetrics> {
  const metrics = emptyMetrics();

  const delayMin = Math.max(0, template.delay_minutes ?? 60);
  const upperBound = new Date(Date.now() - delayMin * 60_000).toISOString();
  const lowerBound = new Date(Date.now() - 24 * 60 * 60_000).toISOString();

  // Busca leads na janela [now-24h, now-delay] com celular preenchido
  const { data: leads, error: leadsErr } = await supabase
    .from("leads_inbox")
    .select("id, nome, email, celular, tags, perfil_id, created_at")
    .not("celular", "is", null)
    .neq("status", "descartado")
    .gte("created_at", lowerBound)
    .lte("created_at", upperBound)
    .overlaps("tags", template.include_tags)
    .limit(200);

  if (leadsErr) {
    metrics.errors.push(leadsErr.message);
    return metrics;
  }

  if (!leads || leads.length === 0) {
    return metrics;
  }

  const linkSalaSecreta = buildSalaSecretaLink();

  for (const lead of leads as LeadRow[]) {
    try {
      const phone = (lead.celular ?? "").trim();
      if (!phone) {
        metrics.skipped++;
        metrics.skipped_no_phone++;
        continue;
      }

      // 1) Anti-conversão por compra aprovada (24h) via email OU celular
      const since24h = new Date(Date.now() - 24 * 60 * 60_000).toISOString();
      const { count: salesCount, error: salesErr } = await supabase
        .from("kirvano_webhook_logs")
        .select("id", { count: "exact", head: true })
        .eq("status", "approved")
        .gte("received_at", since24h)
        .or(
          [
            lead.email ? `email.eq.${lead.email.toLowerCase()}` : null,
            `phone.eq.${phone}`,
          ]
            .filter(Boolean)
            .join(",")
        );

      if (salesErr) {
        metrics.errors.push(`sales check ${lead.id}: ${salesErr.message}`);
        metrics.errors_sales_db++;
        continue;
      }
      if ((salesCount ?? 0) > 0) {
        metrics.skipped++;
        metrics.skipped_converted++;
        continue;
      }

      // 2) Anti-conversão via perfil pago (tags do template)
      if (lead.perfil_id) {
        const { data: perfil } = await supabase
          .from("perfis")
          .select("tags")
          .eq("id", lead.perfil_id)
          .maybeSingle();

        const perfilTags: string[] = (perfil?.tags as string[]) ?? [];
        const hasPaidTag = perfilTags.some((t) =>
          template.exclude_tags.includes(t)
        );
        if (hasPaidTag) {
          metrics.skipped++;
          metrics.skipped_paid_profile++;
          continue;
        }
      }

      // 3) Dedupe forte: 7 dias por (template_id + recipient_phone)
      const dedupeClient = makeSupabaseDedupeClient(supabase as never);
      const dedupeRes = await isEnqueueAllowed(dedupeClient, template.id, phone);
      if (dedupeRes.error) {
        metrics.errors.push(`dedupe ${lead.id}: ${dedupeRes.error}`);
        metrics.errors_dedupe_db++;
        continue;
      }
      if (!dedupeRes.allowed) {
        metrics.skipped++;
        metrics.skipped_dedupe++;
        continue;
      }

      // 4) Pega variante rotativa
      const { data: variantId, error: variantErr } = await supabase.rpc(
        "pick_template_variant",
        { p_template_id: template.id }
      );
      if (variantErr) {
        metrics.errors.push(`variant ${lead.id}: ${variantErr.message}`);
      }

      // 5) Enfileira
      const variables = {
        nome: lead.nome ?? "",
        telefone: phone,
        link_sala_secreta: linkSalaSecreta,
      };

      const { error: insErr } = await supabase.from("message_queue").insert({
        recipient_phone: phone,
        recipient_name: lead.nome,
        template_id: template.id,
        variant_id: variantId ?? null,
        variables,
        status: "pending",
        priority: 4,
        scheduled_at: new Date().toISOString(),
      });

      if (insErr) {
        // Race condition: a constraint atômica do banco rejeitou — outra execução enfileirou primeiro
        const errMsg = insErr.message ?? "";
        const isDedupeRace =
          errMsg.includes("message_queue_dedupe_7d_excl") ||
          (insErr as { code?: string }).code === "23P01";
        if (isDedupeRace) {
          metrics.skipped++;
          metrics.skipped_dedupe++;
          metrics.blocked_by_db_constraint++;
        } else {
          metrics.errors.push(`insert ${lead.id}: ${errMsg}`);
          metrics.errors_insert_db++;
        }
        continue;
      }

      metrics.enqueued++;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      metrics.errors.push(`lead ${lead.id}: ${msg}`);
    }
  }

  return metrics;
}

async function processAll() {
  const supabase = getSupabase();

  const { data: templates, error: tplErr } = await supabase
    .from("message_templates")
    .select("id, delay_minutes, include_tags, exclude_tags")
    .eq("event_trigger", "lead_pre_checkout_abandono")
    .eq("is_active", true);

  if (tplErr) {
    return { processed_templates: 0, enqueued: 0, errors: [tplErr.message] };
  }

  if (!templates || templates.length === 0) {
    return { processed_templates: 0, enqueued: 0, errors: [] };
  }

  const totals = emptyMetrics();

  for (const tpl of templates) {
    const tplRow: TemplateRow = {
      id: tpl.id as string,
      delay_minutes: (tpl.delay_minutes as number) ?? 60,
      include_tags: (tpl.include_tags as string[]) ?? [],
      exclude_tags: (tpl.exclude_tags as string[]) ?? [],
    };

    if (tplRow.include_tags.length === 0) continue;

    const r = await processOneTemplate(supabase, tplRow);
    totals.enqueued += r.enqueued;
    totals.skipped += r.skipped;
    totals.skipped_dedupe += r.skipped_dedupe;
    totals.skipped_converted += r.skipped_converted;
    totals.skipped_paid_profile += r.skipped_paid_profile;
    totals.skipped_no_phone += r.skipped_no_phone;
    totals.blocked_by_db_constraint += r.blocked_by_db_constraint;
    totals.errors_dedupe_db += r.errors_dedupe_db;
    totals.errors_sales_db += r.errors_sales_db;
    totals.errors_insert_db += r.errors_insert_db;
    totals.errors.push(...r.errors);
  }

  const result = {
    processed_templates: templates.length,
    enqueued: totals.enqueued,
    skipped: totals.skipped,
    skipped_dedupe: totals.skipped_dedupe,
    skipped_converted: totals.skipped_converted,
    skipped_paid_profile: totals.skipped_paid_profile,
    skipped_no_phone: totals.skipped_no_phone,
    blocked_by_db_constraint: totals.blocked_by_db_constraint,
    errors_dedupe_db: totals.errors_dedupe_db,
    errors_sales_db: totals.errors_sales_db,
    errors_insert_db: totals.errors_insert_db,
    errors: totals.errors,
  };

  // Log estruturado para acompanhamento diário
  console.log("[process-lead-retargeting] run summary", JSON.stringify(result));

  // Persistir métricas para o painel admin
  const { error: runInsertErr } = await supabase
    .from("lead_retargeting_runs")
    .insert({
      processed_templates: result.processed_templates,
      enqueued: result.enqueued,
      skipped: result.skipped,
      skipped_dedupe: result.skipped_dedupe,
      skipped_converted: result.skipped_converted,
      skipped_paid_profile: result.skipped_paid_profile,
      skipped_no_phone: result.skipped_no_phone,
      blocked_by_db_constraint: result.blocked_by_db_constraint,
      errors_dedupe_db: result.errors_dedupe_db,
      errors_sales_db: result.errors_sales_db,
      errors_insert_db: result.errors_insert_db,
      errors: result.errors,
    });
  if (runInsertErr) {
    console.error(
      "[process-lead-retargeting] failed to persist run metrics",
      runInsertErr.message
    );
  }

  return result;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const result = await processAll();
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
