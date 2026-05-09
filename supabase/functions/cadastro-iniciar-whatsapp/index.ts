// Funil de cadastro — Etapa 3: recebe celular, envia código via WhatsApp (Evolution API)
// usando o sistema de fila existente (message_queue) com prioridade máxima.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { normalizePhoneBR } from '../_shared/br-phone.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
};
const json = (b: Record<string, unknown>, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: corsHeaders });
const gerarCodigo = () => Math.floor(100000 + Math.random() * 900000).toString();

function validateCelular(value: string): { ok: boolean; normalized?: string; reason?: string } {
  const r = normalizePhoneBR(value);
  if (!r.ok) {
    const map: Record<string, string> = {
      empty: 'Celular obrigatório',
      too_short: 'Celular precisa ter DDD + número',
      too_long: 'Celular inválido',
      invalid_ddd: 'DDD inválido',
      invalid_mobile: 'Celular deve começar com 9 após o DDD',
      sequence: 'Celular inválido',
      non_br: 'Celular inválido',
    };
    return { ok: false, reason: map[r.reason] ?? 'Celular inválido' };
  }
  // Mantém retorno antigo: "55" + canonical (e164 sem "+").
  return { ok: true, normalized: r.e164 };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  try {
    const { cadastro_id, celular: rawCel } = await req.json();
    const id = String(cadastro_id ?? '').trim();
    if (!id) return json({ sucesso: false, erro: 'cadastro_id obrigatório' }, 400);

    const v = validateCelular(String(rawCel ?? ''));
    if (!v.ok || !v.normalized) {
      return json({ sucesso: false, erro: 'INVALIDO', mensagem: v.reason ?? 'Celular inválido' }, 400);
    }

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    const { data: cad } = await supabase
      .from('cadastros_pendentes')
      .select('id, email_verificado, finalizado, celular, celular_codigo_enviado_em')
      .eq('id', id)
      .maybeSingle();
    if (!cad || cad.finalizado) return json({ sucesso: false, erro: 'NAO_ENCONTRADO' }, 404);
    if (!cad.email_verificado) return json({ sucesso: false, erro: 'EMAIL_NAO_VERIFICADO' }, 400);

    // Bloqueia se celular já está em uso por conta ativa
    const { data: perfilCel } = await supabase
      .from('perfis')
      .select('id')
      .eq('celular', v.normalized)
      .maybeSingle();
    if (perfilCel) return json({ sucesso: false, erro: 'CELULAR_EM_USO', mensagem: 'Esse WhatsApp já tem conta.' }, 409);

    // Rate limit 60s — retorna 200 com flag `ja_enviado` para que o cliente
    // possa avançar para a tela de digitar o código (o código anterior já foi
    // enviado e ainda é válido por 10 min).
    if (cad.celular_codigo_enviado_em) {
      const diff = Date.now() - new Date(cad.celular_codigo_enviado_em).getTime();
      if (diff < 60_000) {
        const wait = Math.ceil((60_000 - diff) / 1000);
        const numeroAtual = (cad as any).celular ?? v.normalized;
        const mascarado = `${numeroAtual.slice(0, 4)}*****${numeroAtual.slice(-2)}`;
        return json({
          sucesso: false,
          erro: 'AGUARDE',
          ja_enviado: true,
          destino_mascarado: mascarado,
          celular_normalizado: numeroAtual,
          mensagem: `Aguarde ${wait}s para reenviar. Verifique seu WhatsApp — o código anterior ainda é válido.`,
        }, 200);
      }
    }

    const codigo = gerarCodigo();
    const expira = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    await supabase.from('cadastros_pendentes').update({
      celular: v.normalized,
      celular_codigo: codigo,
      celular_codigo_expira_em: expira,
      celular_codigo_enviado_em: new Date().toISOString(),
      celular_tentativas: 0,
      celular_verificado: false,
    }).eq('id', id);

    // Enfileira mensagem WhatsApp via message_queue (prioridade máxima 100)
    const mensagem = `🔐 *Palpite Tech*\n\nSeu código de verificação é:\n\n*${codigo}*\n\n⏱ Expira em 10 minutos.\n\nSe você não solicitou, ignore esta mensagem.`;

    const { error: queueErr } = await supabase.from('message_queue').insert({
      recipient_phone: v.normalized,
      variables: { mensagem_livre: mensagem },
      status: 'pending',
      priority: 100, // máxima — OTP de cadastro
      scheduled_at: new Date().toISOString(),
    });
    if (queueErr) {
      console.error('[CADASTRO-WPP] queue', queueErr);
      return json({ sucesso: false, erro: 'Falha ao enfileirar mensagem' }, 500);
    }

    // Dispara processamento imediato (fire-and-forget)
    fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/process-queue`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ trigger: 'cadastro-otp' }),
    }).catch(() => {});

    const mascarado = `${v.normalized.slice(0, 4)}*****${v.normalized.slice(-2)}`;
    return json({
      sucesso: true,
      destino_mascarado: mascarado,
      celular_normalizado: v.normalized,
      mensagem: 'Código enviado por WhatsApp.',
    });
  } catch (e) {
    console.error('[CADASTRO-WPP]', e);
    return json({ sucesso: false, erro: 'Erro inesperado' }, 500);
  }
});
