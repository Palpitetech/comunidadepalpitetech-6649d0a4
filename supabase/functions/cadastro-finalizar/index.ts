// Funil de cadastro — Etapa 5: cria a conta em auth.users + perfis com nome e senha.
// Requer email_verificado = true e celular_verificado = true.
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
    const { cadastro_id, nome, senha } = await req.json();
    const id = String(cadastro_id ?? '').trim();
    const nomeClean = String(nome ?? '').trim();
    const senhaClean = String(senha ?? '');

    if (!id) return json({ sucesso: false, erro: 'cadastro_id obrigatório' }, 400);
    if (nomeClean.length < 2) return json({ sucesso: false, erro: 'NOME_INVALIDO', mensagem: 'Informe seu nome completo.' }, 400);
    if (senhaClean.length < 8) return json({ sucesso: false, erro: 'SENHA_FRACA', mensagem: 'A senha precisa de pelo menos 8 caracteres.' }, 400);

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    const { data: cad } = await supabase
      .from('cadastros_pendentes')
      .select('id, email, celular, email_verificado, celular_verificado, finalizado, attribution, referral_code')
      .eq('id', id)
      .maybeSingle();

    if (!cad) return json({ sucesso: false, erro: 'NAO_ENCONTRADO' }, 404);
    if (cad.finalizado) return json({ sucesso: false, erro: 'JA_FINALIZADO' }, 400);
    if (!cad.email_verificado) return json({ sucesso: false, erro: 'EMAIL_NAO_VERIFICADO' }, 400);
    if (!cad.celular_verificado || !cad.celular) return json({ sucesso: false, erro: 'WHATSAPP_NAO_VERIFICADO' }, 400);

    // Cria usuário em auth.users com email já confirmado
    const { data: created, error: createErr } = await supabase.auth.admin.createUser({
      email: cad.email,
      password: senhaClean,
      email_confirm: true,
      user_metadata: {
        nome: nomeClean,
        celular: cad.celular,
        attribution: cad.attribution ?? {},
        referral_code: cad.referral_code ?? null,
      },
    });
    if (createErr || !created.user) {
      console.error('[CADASTRO-FIN] createUser', createErr);
      const msg = createErr?.message ?? '';
      if (msg.toLowerCase().includes('already')) {
        return json({ sucesso: false, erro: 'JA_CADASTRADO', mensagem: 'Esse e-mail já tem conta.' }, 409);
      }
      return json({ sucesso: false, erro: 'Erro ao criar conta' }, 500);
    }

    const userId = created.user.id;

    // Garante perfil completo (trigger cria, mas atualizamos campos chave)
    await supabase.from('perfis').upsert({
      id: userId,
      email: cad.email,
      nome: nomeClean,
      celular: cad.celular,
      email_verificado: true,
      celular_verificado: true,
    }, { onConflict: 'id' });

    await supabase.from('cadastros_pendentes').update({
      finalizado: true,
      finalizado_em: new Date().toISOString(),
      user_id: userId,
      email_codigo: null,
      celular_codigo: null,
    }).eq('id', id);

    return json({ sucesso: true, user_id: userId, email: cad.email, mensagem: 'Conta criada com sucesso!' });
  } catch (e) {
    console.error('[CADASTRO-FIN]', e);
    return json({ sucesso: false, erro: 'Erro inesperado' }, 500);
  }
});
