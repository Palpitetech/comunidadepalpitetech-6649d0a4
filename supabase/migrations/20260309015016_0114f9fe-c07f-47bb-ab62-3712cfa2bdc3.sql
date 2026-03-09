
-- Add claimed_at to track manual claim
ALTER TABLE public.referral_rewards ADD COLUMN IF NOT EXISTS claimed_at timestamptz DEFAULT NULL;

-- Update the milestone function to NOT auto-extend subscription (just record milestone)
CREATE OR REPLACE FUNCTION public.check_referral_milestones(p_referrer_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  total_cadastros INTEGER;
  total_vendas INTEGER;
  last_cadastro_milestone INTEGER;
  last_venda_milestone INTEGER;
  next_cadastro_milestone INTEGER;
  next_venda_milestone INTEGER;
BEGIN
  -- Count total referrals (cadastros)
  SELECT COUNT(*) INTO total_cadastros
  FROM public.convites
  WHERE referrer_id = p_referrer_id;

  -- Count total sales (vendas)
  SELECT COUNT(*) INTO total_vendas
  FROM public.convites
  WHERE referrer_id = p_referrer_id AND converted_at IS NOT NULL;

  -- Get last granted cadastro milestone
  SELECT COALESCE(MAX(milestone_count), 0) INTO last_cadastro_milestone
  FROM public.referral_rewards
  WHERE user_id = p_referrer_id AND milestone_type = 'cadastros';

  -- Get last granted venda milestone
  SELECT COALESCE(MAX(milestone_count), 0) INTO last_venda_milestone
  FROM public.referral_rewards
  WHERE user_id = p_referrer_id AND milestone_type = 'vendas';

  -- Check cadastro milestones (every 50) - just record, don't extend
  next_cadastro_milestone := last_cadastro_milestone + 50;
  WHILE total_cadastros >= next_cadastro_milestone LOOP
    INSERT INTO public.referral_rewards (user_id, milestone_type, milestone_count, days_granted)
    VALUES (p_referrer_id, 'cadastros', next_cadastro_milestone, 30)
    ON CONFLICT DO NOTHING;
    next_cadastro_milestone := next_cadastro_milestone + 50;
  END LOOP;

  -- Check venda milestones (every 10) - just record, don't extend
  next_venda_milestone := last_venda_milestone + 10;
  WHILE total_vendas >= next_venda_milestone LOOP
    INSERT INTO public.referral_rewards (user_id, milestone_type, milestone_count, days_granted)
    VALUES (p_referrer_id, 'vendas', next_venda_milestone, 30)
    ON CONFLICT DO NOTHING;
    next_venda_milestone := next_venda_milestone + 10;
  END LOOP;
END;
$$;

-- Function to claim a reward
CREATE OR REPLACE FUNCTION public.claim_referral_reward(p_reward_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_reward RECORD;
  v_perfil RECORD;
  v_monthly_plan_id uuid;
BEGIN
  -- Get the reward
  SELECT * INTO v_reward
  FROM public.referral_rewards
  WHERE id = p_reward_id AND user_id = auth.uid();
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Recompensa não encontrada');
  END IF;
  
  IF v_reward.claimed_at IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Recompensa já foi reinvindicada');
  END IF;
  
  -- Get user's current subscription status
  SELECT * INTO v_perfil
  FROM public.perfis
  WHERE id = auth.uid();
  
  -- Get monthly plan (lowest price active plan > 0)
  SELECT id INTO v_monthly_plan_id
  FROM public.plans
  WHERE is_active = true AND price > 0
  ORDER BY price ASC
  LIMIT 1;
  
  -- Mark as claimed
  UPDATE public.referral_rewards
  SET claimed_at = now()
  WHERE id = p_reward_id;
  
  -- If user has active subscription, extend it
  IF v_perfil.status_assinatura = 'ativa' AND v_perfil.validade_assinatura > now() THEN
    UPDATE public.perfis
    SET validade_assinatura = validade_assinatura + INTERVAL '30 days'
    WHERE id = auth.uid();
    
    RETURN jsonb_build_object('success', true, 'action', 'extended', 'message', '30 dias adicionados à sua assinatura!');
  ELSE
    -- Activate monthly plan for 30 days
    UPDATE public.perfis
    SET 
      status_assinatura = 'ativa',
      validade_assinatura = now() + INTERVAL '30 days',
      plan_id = v_monthly_plan_id
    WHERE id = auth.uid();
    
    -- Add premium role if not exists
    INSERT INTO public.user_roles (user_id, role)
    VALUES (auth.uid(), 'premium')
    ON CONFLICT (user_id, role) DO NOTHING;
    
    RETURN jsonb_build_object('success', true, 'action', 'activated', 'message', 'Plano mensal ativado por 30 dias!');
  END IF;
END;
$$;

-- Allow authenticated users to call this function
GRANT EXECUTE ON FUNCTION public.claim_referral_reward(uuid) TO authenticated;

-- Update RLS to allow users to update their own rewards (for claiming)
DROP POLICY IF EXISTS "Users can claim own rewards" ON public.referral_rewards;
CREATE POLICY "Users can claim own rewards"
ON public.referral_rewards
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
