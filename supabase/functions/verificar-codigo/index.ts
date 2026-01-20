import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_id, codigo } = await req.json();

    if (!user_id || !codigo) {
      throw new Error('user_id e codigo são obrigatórios');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Configuração do Supabase não encontrada');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Buscar código válido mais recente
    const { data: codigoData, error: fetchError } = await supabase
      .from('codigos_verificacao')
      .select('*')
      .eq('user_id', user_id)
      .eq('usado', false)
      .gt('expira_em', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fetchError) {
      console.error('[ERRO] Falha ao buscar código:', fetchError);
      throw new Error('Erro ao verificar código');
    }

    if (!codigoData) {
      throw new Error('Código expirado ou inválido. Solicite um novo.');
    }

    // Verificar tentativas (máx 5)
    if (codigoData.tentativas >= 5) {
      // Marcar como usado para forçar novo código
      await supabase
        .from('codigos_verificacao')
        .update({ usado: true })
        .eq('id', codigoData.id);
        
      throw new Error('Muitas tentativas incorretas. Solicite um novo código.');
    }

    // Verificar se código está correto
    if (codigoData.codigo !== codigo) {
      // Incrementar tentativas
      await supabase
        .from('codigos_verificacao')
        .update({ tentativas: codigoData.tentativas + 1 })
        .eq('id', codigoData.id);

      const restantes = 5 - (codigoData.tentativas + 1);
      throw new Error(`Código incorreto. ${restantes} tentativa${restantes !== 1 ? 's' : ''} restante${restantes !== 1 ? 's' : ''}.`);
    }

    // Código correto - marcar como usado
    await supabase
      .from('codigos_verificacao')
      .update({ usado: true })
      .eq('id', codigoData.id);

    // Atualizar perfil como verificado
    const { error: updateError } = await supabase
      .from('perfis')
      .update({ celular_verificado: true })
      .eq('id', user_id);

    if (updateError) {
      console.error('[ERRO] Falha ao atualizar perfil:', updateError);
      // Não lançamos erro aqui pois o código foi verificado
    }

    console.log(`[VERIFICAÇÃO] Usuário ${user_id} verificado com sucesso`);

    return new Response(
      JSON.stringify({ sucesso: true, mensagem: 'Celular verificado com sucesso!' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[ERRO VERIFICAÇÃO]', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ sucesso: false, erro: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
