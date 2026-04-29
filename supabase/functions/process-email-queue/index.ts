import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SENDER_DOMAIN = "palpitetech.com.br";
const DEFAULT_FROM = `Palpite Tech <noreply@${SENDER_DOMAIN}>`;
const SITE_URL = "https://comunidadepalpitetech.lovable.app";
const SUPPORT_PHONE = "51981854281";

function renderTemplate(text: string, vars: Record<string, string>): string {
  return text.replace(/\{\{\s*([\w]+)\s*\}\}/g, (_, k) => (vars[k] ?? ""));
}

function unsubscribeFooter(email: string): string {
  const url = `${SITE_URL}/email/descadastrar?email=${encodeURIComponent(email)}`;
  return `
    <div style="margin-top:32px;padding-top:16px;border-top:1px solid #e5e7eb;text-align:center;color:#9ca3af;font-size:12px;font-family:Arial,sans-serif;">
      <p style="margin:0 0 4px;">© Palpite Tech — Comunidade de Loteria</p>
      <p style="margin:0;">
        <a href="${url}" style="color:#9ca3af;text-decoration:underline;">Não quero mais receber estes emails</a>
      </p>
    </div>`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  if (!RESEND_API_KEY) {
    return new Response(JSON.stringify({ error: "RESEND_API_KEY missing" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Pull batch
  const { data: batch, error } = await supabase
    .from("email_queue")
    .select("*, email_templates(*)")
    .eq("status", "pending")
    .lte("scheduled_at", new Date().toISOString())
    .order("priority", { ascending: false })
    .order("scheduled_at", { ascending: true })
    .limit(30);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!batch || batch.length === 0) {
    return new Response(JSON.stringify({ ok: true, processed: 0 }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let sent = 0, failed = 0, skipped = 0;

  for (const row of batch) {
    const tpl: any = row.email_templates;
    if (!tpl) {
      await supabase.from("email_queue").update({ status: "failed", error_message: "template_missing" }).eq("id", row.id);
      failed++;
      continue;
    }

    // Re-check suppression at send time
    const { data: supp } = await supabase
      .from("email_suppressions")
      .select("email")
      .eq("email", row.recipient_email)
      .maybeSingle();
    if (supp) {
      await supabase.from("email_queue").update({ status: "skipped", error_message: "suppressed" }).eq("id", row.id);
      await supabase.from("email_send_logs").insert({
        queue_id: row.id, recipient_email: row.recipient_email, template_id: tpl.id,
        status: "skipped", error_message: "suppressed",
      });
      skipped++;
      continue;
    }

    const vars = {
      nome: row.recipient_name || "",
      email: row.recipient_email,
      telefone: "",
      site: SITE_URL,
      suporte: `https://wa.me/55${SUPPORT_PHONE}`,
      ...(row.variables || {}),
    };
    const subject = renderTemplate(tpl.subject, vars);
    const html = renderTemplate(tpl.html, vars) + unsubscribeFooter(row.recipient_email);
    const fromEmail = `${tpl.from_name || "Palpite Tech"} <noreply@${SENDER_DOMAIN}>`;

    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [row.recipient_email],
          subject,
          html,
          ...(tpl.reply_to ? { reply_to: tpl.reply_to } : {}),
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        await supabase.from("email_queue").update({
          status: "failed",
          error_message: errText.slice(0, 500),
          retry_count: (row.retry_count || 0) + 1,
        }).eq("id", row.id);
        await supabase.from("email_send_logs").insert({
          queue_id: row.id, recipient_email: row.recipient_email, template_id: tpl.id,
          status: "failed", error_message: errText.slice(0, 500),
        });
        failed++;
      } else {
        const result = await res.json();
        await supabase.from("email_queue").update({
          status: "sent",
          sent_at: new Date().toISOString(),
          resend_message_id: result.id,
          subject_render: subject,
          html_render: html,
        }).eq("id", row.id);
        await supabase.from("email_send_logs").insert({
          queue_id: row.id, recipient_email: row.recipient_email, template_id: tpl.id,
          status: "sent", resend_message_id: result.id,
        });
        sent++;
      }
    } catch (err: any) {
      await supabase.from("email_queue").update({
        status: "failed",
        error_message: err.message?.slice(0, 500),
        retry_count: (row.retry_count || 0) + 1,
      }).eq("id", row.id);
      failed++;
    }

    await new Promise((r) => setTimeout(r, 150));
  }

  return new Response(JSON.stringify({ ok: true, processed: batch.length, sent, failed, skipped }), {
    status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
