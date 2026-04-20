-- ============================================================
-- BLOCO A: Padronizar eventos
-- ============================================================

-- 1. Unifica subscription_expired → assinatura_expirada no histórico
UPDATE public.events
SET event_type = 'assinatura_expirada'
WHERE event_type = 'subscription_expired';

-- 2. Documenta vocabulário oficial de eventos
COMMENT ON COLUMN public.events.event_type IS
'Vocabulário oficial de eventos (sempre em português, snake_case):
 - novo_cadastro: usuário criou conta (lead inicial, antes de confirmar email)
 - lead_email_confirmado: lead confirmou email e ganhou trial automaticamente
 - email_verificado: usuário verificou email manualmente (fluxo OTP existente)
 - trial_iniciado: usuário entrou em período de teste
 - trial_finalizado: trial expirou, usuário virou trial_ok (free)
 - sale_confirmed: pagamento Kirvano aprovado
 - assinatura_renovada: pagamento recorrente confirmado
 - assinatura_expirada: validade vencida (ex-subscription_expired)
 - acesso_cortado: usuário perdeu acesso premium definitivamente
 - carrinho_abandonado: usuário começou checkout e não finalizou';

-- ============================================================
-- BLOCO B: Sistema de tags automáticas
-- ============================================================

-- 3. Função que reconstrói o array de tags de um perfil a partir do estado atual
CREATE OR REPLACE FUNCTION public.sync_perfil_tags()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan_slug text;
  v_now timestamptz := now();
  v_tags text[] := ARRAY[]::text[];
  v_preserved text[] := ARRAY[]::text[];
  -- Tags que NÃO são gerenciadas automaticamente (CRM, eventos manuais, etc.)
  v_managed text[] := ARRAY[
    'comunidade',
    'verificado','nao_verificado',
    'trial_ativo','trial_ok',
    'pago_mensal','pago_anual','pago_anualvip',
    'gratis',
    'plano_vencido',
    'cancelado_ativo','cancelado_inativo',
    -- legados que essa função substitui
    'trial','expirado','mensal','anual','semestral','anualvip','ativo','email_pendente','email_verificado'
  ];
BEGIN
  -- Bots e perfis bloqueados não recebem retagging automático
  IF NEW.is_bot = true THEN
    RETURN NEW;
  END IF;

  -- Preserva tags customizadas (não gerenciadas)
  IF NEW.tags IS NOT NULL THEN
    SELECT COALESCE(array_agg(t), ARRAY[]::text[])
    INTO v_preserved
    FROM unnest(NEW.tags) t
    WHERE t <> ALL(v_managed);
  END IF;

  -- comunidade sempre presente
  v_tags := array_append(v_tags, 'comunidade');

  -- Verificação
  IF COALESCE(NEW.email_verificado, false) THEN
    v_tags := array_append(v_tags, 'verificado');
  ELSE
    v_tags := array_append(v_tags, 'nao_verificado');
  END IF;

  -- Slug do plano atual
  IF NEW.plan_id IS NOT NULL THEN
    SELECT slug INTO v_plan_slug FROM public.plans WHERE id = NEW.plan_id;
  END IF;

  -- Lógica de plano + status
  IF v_plan_slug = 'teste-gratis-3-dias' THEN
    -- Trial: ativo se status ativa E dentro da validade
    IF NEW.status_assinatura = 'ativa'
       AND NEW.validade_assinatura IS NOT NULL
       AND NEW.validade_assinatura > v_now THEN
      v_tags := array_append(v_tags, 'trial_ativo');
    ELSE
      v_tags := array_append(v_tags, 'trial_ok');
    END IF;

  ELSIF v_plan_slug IN ('mensal','anual','plano-anual-vip') THEN
    -- Planos pagos
    IF NEW.status_assinatura = 'ativa'
       AND NEW.validade_assinatura IS NOT NULL
       AND NEW.validade_assinatura > v_now THEN
      -- Pago ativo
      IF v_plan_slug = 'mensal' THEN
        v_tags := array_append(v_tags, 'pago_mensal');
      ELSIF v_plan_slug = 'anual' THEN
        v_tags := array_append(v_tags, 'pago_anual');
      ELSIF v_plan_slug = 'plano-anual-vip' THEN
        v_tags := array_append(v_tags, 'pago_anualvip');
      END IF;
    ELSIF NEW.status_assinatura = 'cancelada' THEN
      -- Cancelado: ativo se ainda tem tempo, inativo se vencido
      IF NEW.validade_assinatura IS NOT NULL AND NEW.validade_assinatura > v_now THEN
        v_tags := array_append(v_tags, 'cancelado_ativo');
      ELSE
        v_tags := array_append(v_tags, 'cancelado_inativo');
      END IF;
    ELSE
      -- Status não-ativa, validade vencida → plano vencido
      v_tags := array_append(v_tags, 'plano_vencido');
    END IF;

  ELSE
    -- Grátis (slug 'gratis' ou nenhum plano)
    v_tags := array_append(v_tags, 'gratis');
  END IF;

  -- Junta tags geradas + preservadas (sem duplicatas)
  NEW.tags := ARRAY(SELECT DISTINCT unnest(v_tags || v_preserved));

  RETURN NEW;
END;
$$;

-- 4. Trigger BEFORE para campos relevantes (executa antes do prevent_user_subscription_changes via service_role/admin)
DROP TRIGGER IF EXISTS trg_sync_perfil_tags ON public.perfis;
CREATE TRIGGER trg_sync_perfil_tags
BEFORE INSERT OR UPDATE OF email_verificado, plan_id, status_assinatura, validade_assinatura
ON public.perfis
FOR EACH ROW
EXECUTE FUNCTION public.sync_perfil_tags();

-- 5. Backfill: recalcula tags de todos os perfis existentes
-- Usa bypass para passar pelo prevent_user_subscription_changes
DO $$
DECLARE
  r record;
BEGIN
  PERFORM set_config('app.bypass_subscription_checks', 'true', true);
  FOR r IN SELECT id FROM public.perfis WHERE is_bot IS NOT TRUE LOOP
    -- UPDATE no-op força o trigger a rodar
    UPDATE public.perfis
    SET email_verificado = email_verificado
    WHERE id = r.id;
  END LOOP;
END $$;