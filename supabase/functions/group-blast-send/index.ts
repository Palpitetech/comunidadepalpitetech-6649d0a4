import {
  corsHeaders,
  getEvolutionEnv,
  getServiceRoleClient,
  jsonResponse,
  validateAdmin,
} from "../_shared/whatsapp-utils.ts";
import { handlePrepare } from "../_shared/group-blast/prepare.ts";
import { handleSend } from "../_shared/group-blast/send.ts";
import { handleSendNow } from "../_shared/group-blast/send-now.ts";
import { handleRetry } from "../_shared/group-blast/retry.ts";

/**
 * Roteador HTTP do disparo de grupo.
 *
 * Actions aceitas:
 *  - "send"     → loop do cron (sem auth) — entrega logs pending
 *  - "prepare"  → admin — agenda novos logs (suporta force=true)
 *  - "send_now" → admin — agenda 1 slot para envio em ~5s
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const evo = getEvolutionEnv();
  if (!evo) {
    return jsonResponse({ error: "Evolution API não configurada" }, 500);
  }

  const supabase = getServiceRoleClient();

  try {
    const body = await req.json().catch(() => ({}));
    const action = body?.action ?? "send";

    // Apenas o cron pode chamar "send" sem JWT admin
    if (action !== "send") {
      try {
        const authErr = await validateAdmin(req);
        if (authErr) return authErr;
      } catch (e: any) {
        console.error("[group-blast-send] validateAdmin threw:", e);
        return jsonResponse(
          { error: "Falha na autenticação: " + (e?.message ?? String(e)) },
          401,
        );
      }
    }

    if (action === "prepare") {
      return await handlePrepare(supabase, {
        config_id: body.config_id,
        force: body.force,
      });
    }

    if (action === "send_now") {
      return await handleSendNow(supabase, body.config_id, body.slot_id);
    }

    return await handleSend(supabase, evo.url, evo.key);
  } catch (err: any) {
    console.error("[group-blast-send] error:", err);
    return jsonResponse({ error: err.message }, 500);
  }
});
