import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, svix-id, svix-timestamp, svix-signature",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    const event = await req.json();
    const type = event?.type as string;
    const data = event?.data ?? {};
    const messageId: string | undefined = data.email_id || data.id;
    const to: string | undefined = Array.isArray(data.to) ? data.to[0] : data.to;

    console.log(`[resend-webhook] ${type} for ${to} id=${messageId}`);

    if (!type || !to) {
      return new Response(JSON.stringify({ ok: true, ignored: true }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const recipientEmail = to.toLowerCase();

    // Mirror status into send logs
    await supabase.from("email_send_logs").insert({
      recipient_email: recipientEmail,
      status: type.replace("email.", ""),
      resend_message_id: messageId || null,
      error_message: data?.bounce?.message || data?.complaint?.feedback_id || null,
    });

    if (type === "email.bounced" || type === "email.complained") {
      const reason = type === "email.bounced" ? "bounce" : "complaint";
      await supabase.from("email_suppressions").upsert(
        { email: recipientEmail, reason },
        { onConflict: "email" }
      );
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("[resend-webhook]", err);
    return new Response(JSON.stringify({ ok: false, error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
