import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPPORT_PHONE = "51981854281";
const SUPPORT_WHATSAPP = `https://wa.me/55${SUPPORT_PHONE}`;
const SITE_URL = "https://comunidadepalpitetech.lovable.app";

type EmailType =
  | "pix_generated"
  | "expira_7dias"
  | "expira_3dias"
  | "renove_assinatura"
  | "atrasada_7dias";

interface EmailPayload {
  type: EmailType;
  to: string;
  customerName?: string;
  // PIX specific
  pixQrCode?: string;
  pixQrCodeImage?: string;
  pixExpiresAt?: string;
  totalPrice?: string;
  // Subscription specific
  validadeAssinatura?: string;
  planName?: string;
  checkoutLink?: string;
}

function formatDate(isoStr?: string): string {
  if (!isoStr) return "—";
  const d = new Date(isoStr);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatDateTime(isoStr?: string): string {
  if (!isoStr) return "—";
  const d = new Date(isoStr);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function baseTemplate(title: string, emoji: string, body: string, ctaText?: string, ctaUrl?: string): string {
  const ctaBlock = ctaText && ctaUrl ? `
    <div style="text-align:center;margin:28px 0;">
      <a href="${ctaUrl}" style="display:inline-block;background:#7c3aed;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:16px;font-weight:bold;">
        ${ctaText}
      </a>
    </div>` : "";

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#ffffff;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:40px 24px;">
    <div style="text-align:center;margin-bottom:32px;">
      <h1 style="color:#1a1a2e;font-size:22px;margin:0 0 8px;">${emoji} ${title}</h1>
    </div>
    <div style="background:#f8fafc;border-radius:12px;padding:24px;margin-bottom:24px;">
      ${body}
      ${ctaBlock}
    </div>
    <div style="background:#f0fdf4;border-radius:8px;padding:16px;margin-bottom:24px;text-align:center;">
      <p style="color:#374151;font-size:14px;margin:0 0 8px;"><strong>Precisa de ajuda?</strong></p>
      <a href="${SUPPORT_WHATSAPP}" style="display:inline-block;background:#25D366;color:#ffffff;text-decoration:none;padding:10px 24px;border-radius:8px;font-size:14px;font-weight:bold;">
        💬 Falar no WhatsApp
      </a>
      <p style="color:#6b7280;font-size:12px;margin:8px 0 0;">Telefone: (${SUPPORT_PHONE.substring(0,2)}) ${SUPPORT_PHONE.substring(2,7)}-${SUPPORT_PHONE.substring(7)}</p>
    </div>
    <div style="text-align:center;padding-top:16px;border-top:1px solid #e5e7eb;">
      <p style="color:#9ca3af;font-size:12px;margin:0;">© Palpite Tech — Comunidade de Loteria</p>
    </div>
  </div>
</body>
</html>`;
}

function buildEmail(payload: EmailPayload): { subject: string; html: string } {
  const name = payload.customerName || "Jogador";

  switch (payload.type) {
    case "pix_generated": {
      const body = `
        <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 16px;">
          Olá, <strong>${name}</strong>! 👋
        </p>
        <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 16px;">
          Seu PIX foi gerado com sucesso. Finalize o pagamento para ativar seu acesso imediatamente.
        </p>
        <div style="background:#ffffff;border:2px dashed #7c3aed;border-radius:8px;padding:16px;margin:16px 0;text-align:center;">
          <p style="color:#6b7280;font-size:14px;margin:0 0 8px;"><strong>Valor:</strong> ${payload.totalPrice || "—"}</p>
          <p style="color:#6b7280;font-size:14px;margin:0 0 8px;"><strong>Expira em:</strong> ${formatDateTime(payload.pixExpiresAt)}</p>
          ${payload.pixQrCodeImage ? `<img src="${payload.pixQrCodeImage}" alt="QR Code PIX" style="max-width:200px;margin:12px auto;display:block;" />` : ""}
          ${payload.pixQrCode ? `
            <p style="color:#6b7280;font-size:12px;margin:8px 0 4px;">Código copia e cola:</p>
            <div style="background:#f1f5f9;border-radius:6px;padding:8px;word-break:break-all;">
              <code style="color:#374151;font-size:11px;">${payload.pixQrCode}</code>
            </div>` : ""}
        </div>
        <p style="color:#ef4444;font-size:14px;line-height:1.5;margin:16px 0 0;">
          ⚠️ <strong>Atenção:</strong> O PIX tem prazo de validade. Pague antes do vencimento para garantir seu acesso.
        </p>`;
      return {
        subject: "💰 PIX gerado — Finalize seu pagamento | Palpite Tech",
        html: baseTemplate("PIX Gerado com Sucesso", "💰", body),
      };
    }

    case "expira_7dias": {
      const body = `
        <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 16px;">
          Olá, <strong>${name}</strong>! 👋
        </p>
        <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 16px;">
          Sua assinatura do plano <strong>${payload.planName || "Premium"}</strong> vence em <strong>7 dias</strong> (${formatDate(payload.validadeAssinatura)}).
        </p>
        <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 0;">
          Renove agora para continuar aproveitando todas as ferramentas de análise, palpites por IA e acesso completo à comunidade.
        </p>`;
      return {
        subject: "⏰ Sua assinatura vence em 7 dias | Palpite Tech",
        html: baseTemplate("Assinatura Vence em 7 Dias", "⏰", body, "Renovar Agora", payload.checkoutLink || SITE_URL + "/planos"),
      };
    }

    case "expira_3dias": {
      const body = `
        <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 16px;">
          Olá, <strong>${name}</strong>! 👋
        </p>
        <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 16px;">
          <strong>Faltam apenas 3 dias</strong> para sua assinatura expirar (${formatDate(payload.validadeAssinatura)}).
        </p>
        <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 0;">
          Após o vencimento, você perderá acesso ao Gerador de Palpites por IA, análises avançadas e ferramentas premium. <strong>Renove agora para não perder nada!</strong>
        </p>`;
      return {
        subject: "🚨 Sua assinatura vence em 3 dias! | Palpite Tech",
        html: baseTemplate("Assinatura Vence em 3 Dias!", "🚨", body, "Renovar Agora", payload.checkoutLink || SITE_URL + "/planos"),
      };
    }

    case "renove_assinatura": {
      const body = `
        <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 16px;">
          Olá, <strong>${name}</strong>! 👋
        </p>
        <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 16px;">
          Sua assinatura <strong>expirou</strong> em ${formatDate(payload.validadeAssinatura)}.
        </p>
        <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 0;">
          Você não tem mais acesso às ferramentas premium. Renove agora para voltar a usar o Gerador por IA, fechamentos, desdobramentos e todas as análises avançadas.
        </p>`;
      return {
        subject: "❌ Sua assinatura expirou — Renove agora | Palpite Tech",
        html: baseTemplate("Sua Assinatura Expirou", "❌", body, "Renovar Minha Assinatura", payload.checkoutLink || SITE_URL + "/planos"),
      };
    }

    case "atrasada_7dias": {
      const body = `
        <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 16px;">
          Olá, <strong>${name}</strong>! 👋
        </p>
        <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 16px;">
          Sua assinatura está <strong>vencida há 7 dias</strong> (desde ${formatDate(payload.validadeAssinatura)}).
        </p>
        <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 16px;">
          Enquanto isso, você está perdendo palpites gerados por IA, análises de frequência e tendências, e acesso à comunidade premium.
        </p>
        <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 0;">
          <strong>Reative seu acesso agora mesmo:</strong>
        </p>`;
      return {
        subject: "⚠️ Assinatura vencida há 7 dias — Reative seu acesso | Palpite Tech",
        html: baseTemplate("Assinatura Vencida há 7 Dias", "⚠️", body, "Reativar Meu Acesso", payload.checkoutLink || SITE_URL + "/planos"),
      };
    }
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  if (!resendApiKey) {
    return new Response(JSON.stringify({ error: "RESEND_API_KEY not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const payload: EmailPayload = await req.json();
  if (!payload.to || !payload.type) {
    return new Response(JSON.stringify({ error: "Missing 'to' or 'type'" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { subject, html } = buildEmail(payload);

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Palpite Tech <noreply@resend.dev>",
      to: [payload.to],
      subject,
      html,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error(`[SEND-EMAIL] Resend error: ${res.status} - ${errText}`);
    return new Response(JSON.stringify({ error: "Failed to send email", detail: errText }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const result = await res.json();
  console.log(`[SEND-EMAIL] Sent ${payload.type} to ${payload.to}`, result);

  return new Response(JSON.stringify({ ok: true, id: result.id }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
