WITH new_template AS (
  INSERT INTO public.message_templates (
    name,
    event_trigger,
    content,
    delay_enabled,
    delay_minutes,
    include_tags,
    exclude_tags,
    plan_ids,
    tags_match_mode,
    is_active,
    last_variant_position
  ) VALUES (
    'Lead pré-checkout - Sala Secreta Lotofácil',
    'lead_pre_checkout_abandono',
    E'Oi {{nome}}, vi que vc deu uma olhada no nosso grupo VIP da Lotofácil 👀\nFicou alguma dúvida? Posso te ajudar por aqui.\nEnquanto isso, entra na nossa sala secreta gratuita pra receber estudos e resultados todo dia: {{link_sala_secreta}}',
    true,
    60,
    ARRAY['pre_checkout_lp_2grupoviplf']::text[],
    ARRAY['pago_grupovip_lotofacil','pago_mensal','pago_anual','pago_anualvip']::text[],
    ARRAY[]::uuid[],
    'any',
    true,
    0
  )
  RETURNING id
)
INSERT INTO public.message_template_variants (template_id, content, position, is_active)
SELECT
  nt.id,
  v.content,
  v.position,
  true
FROM new_template nt
CROSS JOIN (VALUES
  (2, E'Eai {{nome}}! Tudo bem? Reparei q vc se interessou pelo grupo VIP de Lotofácil\nAntes de decidir, tal entrar na nossa sala secreta? É grátis e vc recebe os estudos do dia + resultado: {{link_sala_secreta}}'),
  (3, E'{{nome}}, aqui é da Palpite Tech 🎯\nVi q vc chegou no checkout do Grupo VIP Lotofácil mas não finalizou.\nTem alguma dúvida? Me chama aqui que respondo\nE pra te ajudar: entra na sala secreta gratuita {{link_sala_secreta}}'),
  (4, E'Oi {{nome}} td bem? Vc deu uma olhada no nosso Grupo VIP de Lotofacil hj\nPosso tirar alguma duvida pra vc? 😊\nAproveita e entra na sala secreta enquanto isso, é gratis e vc recebe estudos diarios: {{link_sala_secreta}}'),
  (5, E'{{nome}}, ficou faltando algo no seu cadastro do Grupo VIP?\nSe quiser entender melhor como funciona, é so me responder por aqui.\nTbm temos uma sala secreta gratuita com estudos diarios da Lotofacil: {{link_sala_secreta}}'),
  (6, E'Opa {{nome}}! Notamos q vc se cadastrou no Grupo VIP da Lotofacil mas nao concluiu. Alguma duvida q eu possa esclarecer?\nPra ja ir testando nosso conteudo, entra aqui: {{link_sala_secreta}}\n(sala secreta gratuita)'),
  (7, E'Oi {{nome}}, espero q esteja bem 🍀\nVc ficou interessado no Grupo VIP de Lotofacil mas nao finalizou, ta tudo certo? Se ficou alguma duvida me chama\nEnquanto isso ja entra na sala secreta gratis: {{link_sala_secreta}}'),
  (8, E'{{nome}} tudo certo?\nVi q vc parou no meio do cadastro do nosso Grupo VIP da Lotofacil\nQuer q eu te explique como funciona? Responde aqui q te ajudo\nE pra acompanhar os estudos do dia: {{link_sala_secreta}}'),
  (9, E'Eai {{nome}}, td bom? 👋\nDa uma olhada na sala secreta da Lotofacil, é grátis e ja vai te dar uma ideia da qualidade dos nossos estudos: {{link_sala_secreta}}\nSe ficou alguma duvida sobre o Grupo VIP é so me chamar'),
  (10, E'{{nome}}, aqui é o time da Palpite Tech\nReparamos q vc se interessou pelo nosso Grupo VIP de Lotofacil\nTem alguma duvida? Posso te ajudar\nPra ja receber estudos gratuitos diariamente entra aqui: {{link_sala_secreta}}')
) AS v(position, content);