// One-off: envia email de "Compra Aprovada — Grupo VIP Lotofácil" para o lead
// Alexandre Nalon (alexandre_nalon@hotmail.com), cujo disparo via WhatsApp falhou.
// Esta função é temporária — remover após o envio.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SUPPORT_PHONE = "51981854281";
const SUPPORT_WHATSAPP = `https://wa.me/55${SUPPORT_PHONE}`;
const COMMUNITY_URL = "https://comunidadepalpitetech.lovable.app";

const RECIPIENT_EMAIL = "alexandre_nalon@hotmail.com";
const RECIPIENT_NAME = "Alexandre Nalon";
const PLAN_NAME = "Grupo VIP Lotofácil";

function buildHtml(): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#ffffff;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:40px 24px;">
    <div style="text-align:center;margin-bottom:24px;">
      <h1 style="color:#1a1a2e;font-size:24px;margin:0 0 8px;">✅ Compra aprovada!</h1>
      <p style="color:#374151;font-size:16px;margin:0;">Seja bem-vindo(a) ao <strong>${PLAN_NAME}</strong></p>
    </div>

    <div style="background:#f8fafc;border-radius:12px;padding:24px;margin-bottom:20px;">
      <p style="color:#1a1a2e;font-size:16px;margin:0 0 12px;">Olá, <strong>${RECIPIENT_NAME}</strong>!</p>
      <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 12px;">
        Recebemos a confirmação do seu pagamento. Seu acesso ao <strong>${PLAN_NAME}</strong> já está liberado. 🎉
      </p>
      <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 12px;">
        Tentamos enviar suas instruções de acesso pelo WhatsApp, mas o número cadastrado não está ativo no aplicativo. Por isso estamos enviando tudo por aqui.
      </p>
      <p style="color:#374151;font-size:15px;line-height:1.6;margin:0;">
        Para entrar no grupo VIP e receber suporte, é só falar com a nossa equipe pelo WhatsApp abaixo. Vamos te encaminhar pessoalmente para o grupo correto.
      </p>
    </div>

    <div style="background:#f0fdf4;border-radius:8px;padding:20px;margin-bottom:20px;text-align:center;">
      <p style="color:#374151;font-size:15px;margin:0 0 12px;"><strong>Fale com o suporte para liberar seu acesso ao grupo:</strong></p>
      <a href="${SUPPORT_WHATSAPP}" style="display:inline-block;background:#25D366;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:8px;font-size:16px;font-weight:bold;">
        💬 Falar no WhatsApp
      </a>
      <p style="color:#6b7280;font-size:13px;margin:10px 0 0;">
        (${SUPPORT_PHONE.substring(0, 2)}) ${SUPPORT_PHONE.substring(2, 7)}-${SUPPORT_PHONE.substring(7)}
      </p>
    </div>

    <div style="background:#eff6ff;border-radius:8px;padding:16px;margin-bottom:20px;">
      <p style="color:#1e3a8a;font-size:13px;margin:0 0 6px;"><strong>Acesse também a comunidade:</strong></p>
      <a href="${COMMUNITY_URL}" style="color:#2563eb;font-size:13px;text-decoration:underline;">${COMMUNITY_URL}</a>
    </div>

    <div style="text-align:center;padding-top:16px;border-top:1px solid #e5e7eb;">
      <p style="color:#9ca3af;font-size:12px;margin:0;">© Palpite Tech — Comunidade de Loteria</p>
    </div>
  </div>
</body>
</html>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) throw new Error("RESEND_API_KEY ausente");

    const fromEmail =
      Deno.env.get("RESEND_FROM_EMAIL") ||
      "Comunidade Palpite Tech <solicitacao@palpitetech.com.br>";

    const html = buildHtml();

    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [RECIPIENT_EMAIL],
        subject: "✅ Compra aprovada — Bem-vindo ao Grupo VIP Lotofácil",
        html,
      }),
    });

    const data = await resp.json();

    if (!resp.ok) {
      console.error("[ERRO RESEND]", data);
      return new Response(
        JSON.stringify({ sucesso: false, status: resp.status, erro: data }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    console.log(`[OK] Email enviado para ${RECIPIENT_EMAIL} — id=${data.id}`);

    return new Response(
      JSON.stringify({
        sucesso: true,
        id: data.id,
        destino: RECIPIENT_EMAIL,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[ERRO]", msg);
    return new Response(JSON.stringify({ sucesso: false, erro: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
