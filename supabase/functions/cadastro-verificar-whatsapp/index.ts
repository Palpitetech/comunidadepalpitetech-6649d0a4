// Funil de cadastro — Etapa 4: valida o código de 6 dígitos do WhatsApp.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
};
const json = (b: Record<string, unknown>, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: corsHeaders });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  try {
    const { cadastro_id, codigo } = await req.json();
    const id = String(cadastro_id ?? '').trim();
    const code = String(codigo ?? '').trim();
    if (!id || !/^\d{6}$/.test(code)) {
      return json({ sucesso: false, erro: 'INVALIDO', mensagem: 'Código inválido.' }, 400);
    }
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    const { data: cad } = await supabase
      .from('cadastros_pendentes')
      .select('id, celular_codigo, celular_codigo_expira_em, celular_tentativas, celular_verificado, finalizado, email_verificado')
      .eq('id', id)
      .maybeSingle();
    if (!cad || cad.finalizado) return json({ sucesso: false, erro: 'NAO_ENCONTRADO' }, 404);
    if (!cad.email_verificado) return json({ sucesso: false, erro: 'EMAIL_NAO_VERIFICADO' }, 400);
    if (cad.celular_verificado) return json({ sucesso: true, mensagem: 'WhatsApp já verificado.' });
    if (!cad.celular_codigo || !cad.celular_codigo_expira_em) {
      return json({ sucesso: false, erro: 'INVALIDO', mensagem: 'Solicite um novo código.' }, 400);
    }
    if (new Date(cad.celular_codigo_expira_em).getTime() < Date.now()) {
      return json({ sucesso: false, erro: 'EXPIRADO', mensagem: 'Código expirado. Solicite um novo.' }, 400);
    }
    if ((cad.celular_tentativas ?? 0) >= 5) {
      return json({ sucesso: false, erro: 'BLOQUEADO', mensagem: 'Muitas tentativas. Solicite um novo código.' }, 400);
    }
    if (cad.celular_codigo !== code) {
      const novas = (cad.celular_tentativas ?? 0) + 1;
      const restantes = Math.max(0, 5 - novas);
      await supabase.from('cadastros_pendentes').update({ celular_tentativas: novas }).eq('id', id);
      return json({
        sucesso: false,
        erro: 'INCORRETO',
        mensagem: restantes > 0
          ? `Código incorreto. ${restantes} tentativa${restantes !== 1 ? 's' : ''} restante${restantes !== 1 ? 's' : ''}.`
          : 'Muitas tentativas. Solicite um novo código.',
        tentativas_restantes: restantes,
      }, 400);
    }

    await supabase.from('cadastros_pendentes').update({
      celular_verificado: true,
      celular_codigo: null,
    }).eq('id', id);

    return json({ sucesso: true, mensagem: 'WhatsApp verificado!' });
  } catch (e) {
    console.error('[CADASTRO-VERIF-WPP]', e);
    return json({ sucesso: false, erro: 'Erro inesperado' }, 500);
  }
});
