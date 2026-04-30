DO $$
DECLARE
    v_template_id UUID := 'e22db03d-8f07-492d-b3c4-da4b9b011bf3';
BEGIN
    -- Remover variantes existentes para este template
    DELETE FROM public.message_template_variants WHERE template_id = v_template_id;

    -- Inserir as 10 novas variações
    INSERT INTO public.message_template_variants (template_id, content, position, is_active)
    VALUES 
    (v_template_id, '{Olá|Oi|Tudo bem?} {{primeiro_nome}}, sua compra do VIP Lotofácil foi aprovada! 🎉 Parabéns por dar esse passo rumo aos prêmios. Lá no grupo temos estudos diários e o envio dos melhores palpites fundamentados.' || chr(10) || chr(10) || 'Acesse agora: https://www.palpitetech.com.br/g/grupo-vip-assinantes' || chr(10) || 'Suporte: 5551981806918', 1, true),
    
    (v_template_id, '{{primeiro_nome}}, pagamento confirmado! ✅ Bem-vindo ao time de elite da Lotofácil. Prepare-se para receber estudos técnicos todos os dias e palpites com análise profunda no nosso grupo.' || chr(10) || chr(10) || 'Link de acesso: https://www.palpitetech.com.br/g/grupo-vip-assinantes' || chr(10) || 'Precisa de ajuda? Suporte: 5551981806918', 2, true),
    
    (v_template_id, '{Fala|Opa} {{primeiro_nome}}, tudo certo com seu acesso! 🚀 Parabéns pela escolha. No nosso grupo VIP você terá acesso a estudos exclusivos todos os dias, além de palpites baseados em dados reais.' || chr(10) || chr(10) || 'Entre por aqui: https://www.palpitetech.com.br/g/grupo-vip-assinantes' || chr(10) || 'Dúvidas? Chame o suporte: 5551981806918', 3, true),
    
    (v_template_id, 'Boas notícias, {{primeiro_nome}}! Sua vaga no VIP Lotofácil está garantida. 💪 Agora você faz parte do grupo que recebe estudos diários e palpites certeiros com base em estatísticas.' || chr(10) || chr(10) || 'Link do Grupo: https://www.palpitetech.com.br/g/grupo-vip-assinantes' || chr(10) || 'Suporte Eros: 5551981806918', 4, true),
    
    (v_template_id, '{Parabéns|Excelente escolha}, {{primeiro_nome}}! Compra aprovada. 🎫 A partir de hoje você recebe no grupo VIP estudos detalhados e os melhores palpites estudados para a Lotofácil todos os dias.' || chr(10) || chr(10) || 'Acesse o grupo: https://www.palpitetech.com.br/g/grupo-vip-assinantes' || chr(10) || 'Qualquer coisa, chame no suporte: 5551981806918', 5, true),
    
    (v_template_id, '{{primeiro_nome}}, sua entrada no VIP Lotofácil foi autorizada! 🎊 Fico feliz com sua decisão de profissionalizar suas apostas. No grupo enviamos estudos diários e palpites com fundamentação técnica.' || chr(10) || chr(10) || 'Link para entrar: https://www.palpitetech.com.br/g/grupo-vip-assinantes' || chr(10) || 'Contato Suporte: 5551981806918', 6, true),
    
    (v_template_id, '{Oi|Olá} {{primeiro_nome}}, seu pagamento do Lotofácil VIP caiu! ✅ Prepare o volante, pois no grupo temos estudos todos os dias e os palpites já vêm com toda a análise feita para você.' || chr(10) || chr(10) || 'Garanta seu lugar: https://www.palpitetech.com.br/g/grupo-vip-assinantes' || chr(10) || 'Suporte: 5551981806918', 7, true),
    
    (v_template_id, '{{primeiro_nome}}, seja muito bem-vindo ao VIP Lotofácil! 🚀 Sua compra foi aprovada. Diariamente compartilhamos estudos de ponta e palpites com base em estudos estatísticos avançados dentro do grupo.' || chr(10) || chr(10) || 'Acesso imediato: https://www.palpitetech.com.br/g/grupo-vip-assinantes' || chr(10) || 'Ajuda no suporte: 5551981806918', 8, true),
    
    (v_template_id, '{Tudo pronto|Acesso liberado}, {{primeiro_nome}}! Parabéns por se juntar a nós. 🍀 Todos os dias você terá acesso a novos estudos e palpites que realmente têm embasamento técnico no nosso grupo.' || chr(10) || chr(10) || 'Link do VIP: https://www.palpitetech.com.br/g/grupo-vip-assinantes' || chr(10) || 'Suporte: 5551981806918', 9, true),
    
    (v_template_id, '{{primeiro_nome}}, parabéns pela nova fase no VIP Lotofácil! 🏆 Sua compra foi confirmada. Aproveite os estudos diários e os palpites selecionados por especialistas que enviamos direto no grupo.' || chr(10) || chr(10) || 'Entre agora: https://www.palpitetech.com.br/g/grupo-vip-assinantes' || chr(10) || 'Suporte: 5551981806918', 10, true);
END $$;
