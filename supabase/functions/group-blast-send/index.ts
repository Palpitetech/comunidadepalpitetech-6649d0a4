import {
  corsHeaders,
  getEvolutionEnv,
  getServiceRoleClient,
  jsonResponse,
  validateAdmin,
} from "../_shared/whatsapp-utils.ts";
import { handlePrepare, handleSendNow } from "../_shared/group-blast/schedule.ts";
import { handleRetry, handleSend } from "../_shared/group-blast/dispatch.ts";

/**
 * Roteador HTTP do disparo de grupo (refatorado).
 *
 * Actions aceitas:
 *  - "send"     → loop do cron (sem JWT) — entrega logs pending PRONTOS
 *  - "prepare"  → admin — agenda novos logs (suporta force=true)
 *  - "send_now" → admin — agenda 1 slot para envio em ~5s
 *  - "retry"    → admin — reenvia 1 log failed
 *
 * O conteúdo da mensagem (palpite/IA/manual) é resolvido NO PREPARE
 * e gravado direto em group_blast_logs.message_content. O dispatcher
 * só pega logs já com mensagem válida — nada de IA falhando in-flight.
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const evo = getEvolutionEnv();
  if (!evo) return jsonResponse({ error: "Evolution API não configurada" }, 500);

  const supabase = getServiceRoleClient();

  try {
    const body = await req.json().catch(() => ({}));
    const action = body?.action ?? "send";

    // Cron pode chamar "send" e "prepare" sem JWT admin
    if (action !== "send" && action !== "prepare") {
      const authErr = await validateAdmin(req);
      if (authErr) return authErr;
    }

    switch (action) {
      case "prepare":
        return await handlePrepare(supabase, {
          config_id: body.config_id,
          force: body.force,
        });
      case "send_now":
        return await handleSendNow(supabase, body.config_id, body.slot_id);
      case "retry":
        return await handleRetry(supabase, evo.url, evo.key, body.log_id);
      case "send":
      default:
        return await handleSend(supabase, evo.url, evo.key);
    }
  } catch (err: any) {
    console.error("[group-blast-send] error:", err);
    return jsonResponse({ error: err.message }, 500);
  }
});
