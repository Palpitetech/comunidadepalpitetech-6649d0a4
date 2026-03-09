CREATE OR REPLACE FUNCTION public.check_referral_milestones(p_referrer_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
DECLARE
  last_claim_at timestamptz;
  current_cadastros INTEGER;
  current_vendas INTEGER;
  last_cadastro_milestone INTEGER;
  last_venda_milestone INTEGER;
  next_cadastro_milestone INTEGER;
  next_venda_milestone INTEGER;
BEGIN
  -- Find the last claimed_at timestamp
  SELECT MAX(claimed_at) INTO last_claim_at
  FROM public.referral_rewards
  WHERE user_id = p_referrer_id AND claimed_at IS NOT NULL;

  -- Count referrals since last claim (or all if never claimed)
  IF last_claim_at IS NOT NULL THEN
    SELECT COUNT(*) INTO current_cadastros
    FROM public.convites
    WHERE referrer_id = p_referrer_id AND created_at > last_claim_at;

    SELECT COUNT(*) INTO current_vendas
    FROM public.convites
    WHERE referrer_id = p_referrer_id AND converted_at IS NOT NULL AND created_at > last_claim_at;
  ELSE
    SELECT COUNT(*) INTO current_cadastros
    FROM public.convites
    WHERE referrer_id = p_referrer_id;

    SELECT COUNT(*) INTO current_vendas
    FROM public.convites
    WHERE referrer_id = p_referrer_id AND converted_at IS NOT NULL;
  END IF;

  -- Get last granted cadastro milestone (only unclaimed ones count for "current cycle")
  SELECT COALESCE(MAX(milestone_count), 0) INTO last_cadastro_milestone
  FROM public.referral_rewards
  WHERE user_id = p_referrer_id AND milestone_type = 'cadastros' AND claimed_at IS NULL;

  SELECT COALESCE(MAX(milestone_count), 0) INTO last_venda_milestone
  FROM public.referral_rewards
  WHERE user_id = p_referrer_id AND milestone_type = 'vendas' AND claimed_at IS NULL;

  -- Check cadastro milestones (every 50)
  next_cadastro_milestone := CASE WHEN last_cadastro_milestone > 0 THEN last_cadastro_milestone + 50 ELSE 50 END;
  WHILE current_cadastros >= next_cadastro_milestone LOOP
    INSERT INTO public.referral_rewards (user_id, milestone_type, milestone_count, days_granted)
    VALUES (p_referrer_id, 'cadastros', next_cadastro_milestone, 30)
    ON CONFLICT DO NOTHING;
    next_cadastro_milestone := next_cadastro_milestone + 50;
  END LOOP;

  -- Check venda milestones (every 10)
  next_venda_milestone := CASE WHEN last_venda_milestone > 0 THEN last_venda_milestone + 10 ELSE 10 END;
  WHILE current_vendas >= next_venda_milestone LOOP
    INSERT INTO public.referral_rewards (user_id, milestone_type, milestone_count, days_granted)
    VALUES (p_referrer_id, 'vendas', next_venda_milestone, 30)
    ON CONFLICT DO NOTHING;
    next_venda_milestone := next_venda_milestone + 10;
  END LOOP;
END;
$$;