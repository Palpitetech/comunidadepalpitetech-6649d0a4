
DO $$
DECLARE
  v_template_id uuid;
BEGIN
  -- Cria/atualiza o template
  INSERT INTO public.message_templates (
    name, content, event_trigger, is_active, type, category,
    delay_enabled, delay_minutes, include_tags, exclude_tags, plan_ids, tags_match_mode
  ) VALUES (
    'Bolão Mega Sena - Lead Recebido',
    'Olá {{nome}}! Augusto do Palpite Tech aqui.

Recebemos sua solicitação de reserva da sua cota do Bolão da Mega-Sena.

Qualquer dúvida, fale com nosso suporte pelo contato abaixo.

Já vamos te entregar o bônus que prometemos para você.

Suporte: wa.me/5516997175392
Bônus: Receba os estudos diários entrando aqui: https://chat.whatsapp.com/EBHBFt2h8UOGlzIau0nZ54',
    'lead_bolao_mega_sena',
    true,
    'random',
    'transactional',
    false, 0, '{}', '{}', '{}', 'any'
  )
  ON CONFLICT DO NOTHING;

  SELECT id INTO v_template_id
  FROM public.message_templates
  WHERE event_trigger = 'lead_bolao_mega_sena'
  ORDER BY created_at DESC
  LIMIT 1;

  -- Limpa variantes anteriores e insere as 5 novas
  DELETE FROM public.message_template_variants WHERE template_id = v_template_id;

  INSERT INTO public.message_template_variants (template_id, content, position, is_active) VALUES
  (v_template_id, 'Olá {{nome}}! Augusto do Palpite Tech aqui.

Recebemos sua solicitação de reserva da sua cota do Bolão da Mega-Sena.

Qualquer dúvida, fale com nosso suporte pelo contato abaixo.

Já vamos te entregar o bônus que prometemos para você.

Suporte: wa.me/5516997175392
Bônus: Receba os estudos diários entrando aqui: https://chat.whatsapp.com/EBHBFt2h8UOGlzIau0nZ54', 1, true),
  (v_template_id, 'Oi, {{nome}}! Aqui é o Augusto, do Palpite Tech.

Sua solicitação de reserva da cota do Bolão da Mega-Sena foi recebida com sucesso.

Em caso de dúvidas, nosso suporte está disponível no contato abaixo.

Como prometido, seu bônus já está liberado.

Suporte: wa.me/5516997175392
Bônus: Entre para receber os estudos diários: https://chat.whatsapp.com/EBHBFt2h8UOGlzIau0nZ54', 2, true),
  (v_template_id, 'Olá, {{nome}}! Tudo certo?

Aqui é o Augusto, do Palpite Tech.

Recebemos sua reserva para participar do Bolão da Mega-Sena.

Se precisar de ajuda, é só chamar nosso suporte.

Seu bônus prometido já está disponível para acesso.

Suporte: wa.me/5516997175392
Bônus: https://chat.whatsapp.com/EBHBFt2h8UOGlzIau0nZ54', 3, true),
  (v_template_id, 'Fala, {{nome}}! Augusto do Palpite Tech passando aqui.

Sua solicitação de reserva da cota do Bolão da Mega-Sena chegou para nós.

Agora é só acompanhar as próximas informações.

E como combinado, já vamos te entregar o bônus prometido.

Suporte: wa.me/5516997175392
Bônus: Receba os estudos diários entrando aqui: https://chat.whatsapp.com/EBHBFt2h8UOGlzIau0nZ54', 4, true),
  (v_template_id, 'Olá, {{nome}}! Seja bem-vindo.

Aqui é o Augusto, do Palpite Tech.

Confirmamos o recebimento da sua solicitação de reserva para o Bolão da Mega-Sena.

Caso tenha qualquer dúvida, fale com nosso suporte pelo link abaixo.

Seu bônus já está liberado conforme prometido.

Suporte: wa.me/5516997175392
Bônus: Entre no grupo de estudos diários aqui: https://chat.whatsapp.com/EBHBFt2h8UOGlzIau0nZ54', 5, true);
END $$;

-- Adiciona prioridade alta (10) para o evento lead_bolao_mega_sena
CREATE OR REPLACE FUNCTION public.trigger_queue_event_templates()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_perfil record;
  v_plan_name text;
  v_plan_slug text;
  v_vip_link text;
  v_priority integer;
  v_variables jsonb;
  v_total_price numeric;
  v_valor_fmt text;
  v_meta_plan_slug text;
  v_link_novo_pix text;
  v_pix_codigo text;
  v_link_sala_secreta_mega text := 'https://www.palpitetech.com.br/g/ms-sala-secreta?utm_source=email&utm_medium=lead_retarget&utm_campaign=maratona_mega_30anos';
  v_link_sala_vip_mega text := 'https://www.palpitetech.com.br/g/ms-sala-vip?utm_source=email&utm_medium=sale_confirmed&utm_campaign=aula_mega_especial_vip';
BEGIN
  SELECT id, celular, nome, email, plan_id
  INTO v_perfil
  FROM public.perfis
  WHERE id = NEW.user_id;

  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  IF v_perfil.plan_id IS NOT NULL THEN
    SELECT name, slug INTO v_plan_name, v_plan_slug
    FROM public.plans WHERE id = v_perfil.plan_id;
  END IF;

  v_meta_plan_slug := NULLIF(NEW.metadata->>'plan_slug', '');
  IF v_meta_plan_slug IS NOT NULL THEN
    v_plan_slug := v_meta_plan_slug;
  END IF;

  SELECT vip_group_link INTO v_vip_link
  FROM public.group_blast_configs
  WHERE is_active = true AND vip_group_link IS NOT NULL AND vip_group_link <> ''
  ORDER BY created_at ASC
  LIMIT 1;

  v_total_price := NULLIF(NEW.metadata->>'total_price', '')::numeric;
  IF v_total_price IS NOT NULL THEN
    v_valor_fmt := 'R$ ' || replace(to_char(v_total_price, 'FM999G990D00'), '.', ',');
    v_valor_fmt := regexp_replace(v_valor_fmt, '(\d)(\d{3})(?=,)', '\1.\2');
  ELSE
    v_valor_fmt := '';
  END IF;

  IF v_plan_slug IS NOT NULL AND v_plan_slug <> '' THEN
    v_link_novo_pix := 'https://www.palpitetech.com.br/gerar-novo-pix/' || v_plan_slug;
  ELSE
    v_link_novo_pix := 'https://www.palpitetech.com.br/planos';
  END IF;

  v_pix_codigo := COALESCE(NEW.metadata->>'pix_codigo', '');

  v_priority := CASE NEW.event_type
    WHEN 'novo_cadastro' THEN 10
    WHEN 'sale_confirmed' THEN 10
    WHEN 'compra_aprovada' THEN 10
    WHEN 'lead_bolao_mega_sena' THEN 10
    WHEN 'pix_gerado' THEN 9
    WHEN 'trial_iniciado' THEN 9
    WHEN 'assinatura_expirada' THEN 8
    WHEN 'subscription_expired' THEN 8
    WHEN 'acesso_cortado' THEN 8
    WHEN 'carrinho_abandonado' THEN 5
    ELSE 5
  END;

  v_variables := COALESCE(NEW.metadata, '{}'::jsonb) || jsonb_build_object(
    'nome', COALESCE(v_perfil.nome, ''),
    'telefone', COALESCE(v_perfil.celular, ''),
    'email', COALESCE(v_perfil.email, ''),
    'produto', COALESCE(v_plan_name, ''),
    'plano_nome', COALESCE(v_plan_name, ''),
    'link_grupo_vip', COALESCE(v_vip_link, ''),
    'valor', v_valor_fmt,
    'link_novo_pix', v_link_novo_pix,
    'pix_codigo', v_pix_codigo,
    'link_sala_secreta_mega', v_link_sala_secreta_mega,
    'link_sala_vip_mega', v_link_sala_vip_mega
  );

  IF v_perfil.celular IS NOT NULL AND v_perfil.celular <> '' THEN
    PERFORM public.queue_templates_for_event(
      NEW.event_type, v_perfil.celular, v_perfil.nome, v_perfil.id, v_variables, v_priority
    );
  END IF;

  IF v_perfil.email IS NOT NULL AND v_perfil.email <> '' THEN
    PERFORM public.queue_email_templates_for_event(
      NEW.event_type, v_perfil.email, v_perfil.nome, v_perfil.id, v_variables, v_priority
    );
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Erro em trigger_queue_event_templates: %', SQLERRM;
    RETURN NEW;
END;
$function$;
