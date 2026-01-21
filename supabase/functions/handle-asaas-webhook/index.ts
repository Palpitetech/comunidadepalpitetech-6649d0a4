import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, asaas-access-token',
};

// Eventos que ativam assinatura
const EVENTOS_ATIVAR = ['PAYMENT_RECEIVED', 'PAYMENT_CONFIRMED'];
const EVENTOS_CANCELAR = ['PAYMENT_REFUNDED', 'PAYMENT_DELETED'];
const EVENTOS_INADIMPLENTE = ['PAYMENT_OVERDUE'];

// Duração padrão da assinatura (30 dias)
const DIAS_ASSINATURA = 30;

interface AsaasPayment {
  id: string;
  customer: string;
  value: number;
  status: string;
  billingType: string;
  customerEmail?: string;
  customerName?: string;
  customerCpfCnpj?: string;
  externalReference?: string;
}

interface AsaasWebhookPayload {
  event: string;
  payment: AsaasPayment;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1. Validar token de acesso do Asaas
    const accessToken = req.headers.get('asaas-access-token');
    const expectedToken = Deno.env.get('ASAAS_WEBHOOK_ACCESS_TOKEN');
    
    if (!expectedToken || accessToken !== expectedToken) {
      console.error('[WEBHOOK] Token inválido ou não configurado');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Parsear payload
    const body: AsaasWebhookPayload = await req.json();
    const { event, payment } = body;

    console.log(`[WEBHOOK] Evento recebido: ${event}`);
    console.log(`[WEBHOOK] Pagamento ID: ${payment.id}, Valor: R$ ${payment.value}`);

    // 3. Verificar se é evento relevante
    const isEventoRelevante = 
      EVENTOS_ATIVAR.includes(event) || 
      EVENTOS_CANCELAR.includes(event) || 
      EVENTOS_INADIMPLENTE.includes(event);

    if (!isEventoRelevante) {
      console.log(`[WEBHOOK] Evento ${event} ignorado`);
      return new Response(
        JSON.stringify({ received: true, message: 'Evento ignorado' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. Conectar Supabase com service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 5. Buscar plano pelo valor exato
    const { data: plano, error: planoError } = await supabase
      .from('plans')
      .select('id, name, slug')
      .eq('price', payment.value)
      .eq('is_active', true)
      .single();

    if (planoError || !plano) {
      console.warn(`[WEBHOOK] Plano não encontrado para valor: R$ ${payment.value}`);
      return new Response(
        JSON.stringify({ 
          received: true, 
          warning: `Plano não mapeado para R$ ${payment.value}` 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[WEBHOOK] Plano identificado: ${plano.name} (${plano.slug})`);

    // 6. Buscar usuário por email ou asaas_customer_id
    let perfilExistente = null;
    
    if (payment.customerEmail) {
      const { data: perfilPorEmail } = await supabase
        .from('perfis')
        .select('id, email, nome')
        .eq('email', payment.customerEmail)
        .maybeSingle();
      
      if (perfilPorEmail) {
        perfilExistente = perfilPorEmail;
      }
    }

    if (!perfilExistente && payment.customer) {
      const { data: perfilPorAsaas } = await supabase
        .from('perfis')
        .select('id, email, nome')
        .eq('asaas_customer_id', payment.customer)
        .maybeSingle();
      
      if (perfilPorAsaas) {
        perfilExistente = perfilPorAsaas;
      }
    }

    let userId: string;
    let isNewUser = false;

    if (perfilExistente) {
      // Usuário já existe
      userId = perfilExistente.id;
      console.log(`[WEBHOOK] Usuário existente: ${perfilExistente.email}`);
    } else {
      // Verificar se temos email para criar usuário
      if (!payment.customerEmail) {
        console.error('[WEBHOOK] Email não fornecido para criar novo usuário');
        return new Response(
          JSON.stringify({ 
            error: 'Email obrigatório para novos usuários',
            payment_id: payment.id 
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Criar novo usuário via auth.admin
      isNewUser = true;
      const senhaTemporaria = crypto.randomUUID().slice(0, 12);
      
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: payment.customerEmail,
        password: senhaTemporaria,
        email_confirm: true,
        user_metadata: {
          nome: payment.customerName || payment.customerEmail.split('@')[0],
          cpf: payment.customerCpfCnpj,
        }
      });

      if (createError) {
        console.error('[WEBHOOK] Erro ao criar usuário:', createError);
        return new Response(
          JSON.stringify({ 
            error: `Falha ao criar usuário: ${createError.message}`,
            payment_id: payment.id
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      userId = newUser.user.id;
      console.log(`[WEBHOOK] Novo usuário criado: ${payment.customerEmail} (ID: ${userId})`);

      // Disparar reset de senha para usuário definir sua própria
      try {
        await supabase.auth.admin.generateLink({
          type: 'recovery',
          email: payment.customerEmail,
        });
        console.log(`[WEBHOOK] Link de recuperação gerado para ${payment.customerEmail}`);
      } catch (linkError) {
        console.warn('[WEBHOOK] Erro ao gerar link de recuperação:', linkError);
      }
    }

    // 7. Calcular validade e status
    let status_assinatura: string;
    let validade_assinatura: string | null = null;

    if (EVENTOS_ATIVAR.includes(event)) {
      status_assinatura = 'ativa';
      const validade = new Date();
      validade.setDate(validade.getDate() + DIAS_ASSINATURA);
      validade_assinatura = validade.toISOString();
    } else if (EVENTOS_INADIMPLENTE.includes(event)) {
      status_assinatura = 'inadimplente';
    } else {
      status_assinatura = 'cancelada';
    }

    // 8. Montar objeto de atualização
    const updateData: Record<string, unknown> = {
      plan_id: plano.id,
      status_assinatura,
      asaas_customer_id: payment.customer,
    };

    // Só atualizar validade se for ativação
    if (validade_assinatura) {
      updateData.validade_assinatura = validade_assinatura;
    }

    // Só atualizar CPF se foi fornecido
    if (payment.customerCpfCnpj) {
      updateData.cpf = payment.customerCpfCnpj;
    }

    // Só atualizar nome se foi fornecido e é novo usuário
    if (payment.customerName && isNewUser) {
      updateData.nome = payment.customerName;
    }

    // 9. Atualizar perfil
    const { error: updateError } = await supabase
      .from('perfis')
      .update(updateData)
      .eq('id', userId);

    if (updateError) {
      console.error('[WEBHOOK] Erro ao atualizar perfil:', updateError);
      return new Response(
        JSON.stringify({ 
          error: `Falha ao atualizar perfil: ${updateError.message}`,
          user_id: userId
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[WEBHOOK] ✅ Perfil atualizado: status=${status_assinatura}, plano=${plano.name}`);

    return new Response(
      JSON.stringify({ 
        received: true,
        user_id: userId,
        plano: plano.name,
        status: status_assinatura,
        validade: validade_assinatura,
        is_new_user: isNewUser
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[WEBHOOK ERROR]', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Erro interno do servidor'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
