-- 1. Garantir que a coluna category existe
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='message_templates' AND column_name='category') THEN
        ALTER TABLE public.message_templates ADD COLUMN category TEXT DEFAULT 'marketing';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='email_templates' AND column_name='category') THEN
        ALTER TABLE public.email_templates ADD COLUMN category TEXT DEFAULT 'marketing';
    END IF;
END $$;

-- 2. Desativar templates antigos do Grupo VIP Lotofácil
UPDATE public.message_templates 
SET is_active = false, name = name || ' (ANTIGO)'
WHERE plan_ids @> ARRAY['a23694fd-87f4-4edd-a6eb-8e51b3c90430']::uuid[]
AND is_active = true;

-- 3. Inserir Novos Templates Transacionais com variantes e posições (respeitando CHECK >= 2)

-- Template: Compra Aprovada
DO $$
DECLARE
    v_template_id UUID;
BEGIN
    INSERT INTO public.message_templates (
        name, content, event_trigger, category, is_active, plan_ids, delay_enabled, delay_minutes
    ) VALUES (
        'Compra Aprovada - VIP Lotofácil', 
        'Link do grupo: https://www.palpitetech.com.br/g/grupo-vip-assinantes', 
        'compra_aprovada', 
        'transactional', 
        true, 
        ARRAY['a23694fd-87f4-4edd-a6eb-8e51b3c90430']::uuid[], 
        false, 
        0
    ) RETURNING id INTO v_template_id;

    INSERT INTO public.message_template_variants (template_id, content, position) VALUES 
    (v_template_id, '{Olá|Oi|Tudo bem?} {{primeiro_nome}}! Sua compra do *Grupo VIP Lotofácil* foi aprovada com sucesso. 🚀\n\nAcesse aqui o seu grupo: https://www.palpitetech.com.br/g/grupo-vip-assinantes\n\nQualquer dúvida, fale com nosso suporte: 5551981806918', 2),
    (v_template_id, 'Parabéns, {{primeiro_nome}}! 🎉 Seu acesso ao *VIP Lotofácil* já está liberado.\n\nLink do Grupo VIP: https://www.palpitetech.com.br/g/grupo-vip-assinantes\n\nSuporte: 5551981806918', 3);
END $$;

-- Template: Pix Gerado (5 min delay)
DO $$
DECLARE
    v_template_id UUID;
BEGIN
    INSERT INTO public.message_templates (
        name, content, event_trigger, category, is_active, plan_ids, delay_enabled, delay_minutes
    ) VALUES (
        'Pix Gerado - VIP Lotofácil', 
        'Aguardando pagamento Pix', 
        'pix_gerado', 
        'transactional', 
        true, 
        ARRAY['a23694fd-87f4-4edd-a6eb-8e51b3c90430']::uuid[], 
        true, 
        5
    ) RETURNING id INTO v_template_id;

    INSERT INTO public.message_template_variants (template_id, content, position) VALUES 
    (v_template_id, '{{primeiro_nome}}, notamos que você gerou o Pix para o *VIP Lotofácil* mas ainda não concluiu. 🤔\n\nPrecisa de ajuda com o código? Chame o suporte: 5551981806918', 2),
    (v_template_id, 'Oi {{primeiro_nome}}! Sua vaga no *VIP Lotofácil* está reservada. Falta apenas concluir o Pix.\n\nSuporte para dúvidas: 5551981806918', 3);
END $$;

-- Template: Pix Cancelado
DO $$
DECLARE
    v_template_id UUID;
BEGIN
    INSERT INTO public.message_templates (
        name, content, event_trigger, category, is_active, plan_ids, delay_enabled, delay_minutes
    ) VALUES (
        'Pix Cancelado - VIP Lotofácil', 
        'Pix expirou', 
        'pix_expirado', 
        'transactional', 
        true, 
        ARRAY['a23694fd-87f4-4edd-a6eb-8e51b3c90430']::uuid[], 
        false, 
        0
    ) RETURNING id INTO v_template_id;

    INSERT INTO public.message_template_variants (template_id, content, position) VALUES 
    (v_template_id, 'Infelizmente seu Pix para o VIP Lotofácil expirou, {{primeiro_nome}}. 😕\n\nPara não perder nossas dicas, entre na nossa sala gratuita aqui: https://www.palpitetech.com.br/g/entrar-sala-secreta\n\nSuporte: 5551981806918', 2),
    (v_template_id, 'Seu pagamento via Pix não foi concluído. Caso queira continuar acompanhando, entre aqui: https://www.palpitetech.com.br/g/entrar-sala-secreta\n\nDúvidas? 5551981806918', 3);
END $$;
