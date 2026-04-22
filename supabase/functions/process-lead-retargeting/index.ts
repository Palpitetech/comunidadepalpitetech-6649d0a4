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

async function processOneTemplate(
  supabase: ReturnType<typeof createClient>,
  template: TemplateRow
): Promise<{ enqueued: number; skipped: number; errors: string[] }> {
  const errors: string[] = [];
  let enqueued = 0;
  let skipped = 0;

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
    return { enqueued: 0, skipped: 0, errors: [leadsErr.message] };
  }

  if (!leads || leads.length === 0) {
    return { enqueued: 0, skipped: 0, errors: [] };
  }

  const linkSalaSecreta = buildSalaSecretaLink();

  for (const lead of leads as LeadRow[]) {
    try {
      const phone = (lead.celular ?? "").trim();
      if (!phone) {
        skipped++;
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
        errors.push(`sales check ${lead.id}: ${salesErr.message}`);
        continue;
      }
      if ((salesCount ?? 0) > 0) {
        skipped++;
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
          skipped++;
          continue;
        }
      }

      // 3) Dedupe forte: 7 dias por (template_id + recipient_phone)
      const dedupeClient = makeSupabaseDedupeClient(supabase as never);
      const dedupeRes = await isEnqueueAllowed(dedupeClient, template.id, phone);
      if (dedupeRes.error) {
        errors.push(`dedupe ${lead.id}: ${dedupeRes.error}`);
        continue;
      }
      if (!dedupeRes.allowed) {
        skipped++;
        continue;
      }

      // 4) Pega variante rotativa
      const { data: variantId, error: variantErr } = await supabase.rpc(
        "pick_template_variant",
        { p_template_id: template.id }
      );
      if (variantErr) {
        errors.push(`variant ${lead.id}: ${variantErr.message}`);
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
        errors.push(`insert ${lead.id}: ${insErr.message}`);
        continue;
      }

      enqueued++;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`lead ${lead.id}: ${msg}`);
    }
  }

  return { enqueued, skipped, errors };
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

  let enqueued = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const tpl of templates) {
    const tplRow: TemplateRow = {
      id: tpl.id as string,
      delay_minutes: (tpl.delay_minutes as number) ?? 60,
      include_tags: (tpl.include_tags as string[]) ?? [],
      exclude_tags: (tpl.exclude_tags as string[]) ?? [],
    };

    if (tplRow.include_tags.length === 0) continue;

    const r = await processOneTemplate(supabase, tplRow);
    enqueued += r.enqueued;
    skipped += r.skipped;
    errors.push(...r.errors);
  }

  return {
    processed_templates: templates.length,
    enqueued,
    skipped,
    errors,
  };
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
