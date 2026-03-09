-- Add converted_at to convites (tracks when referred user makes a purchase)
ALTER TABLE public.convites ADD COLUMN IF NOT EXISTS converted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Create referral_rewards table to track granted rewards
CREATE TABLE public.referral_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.perfis(id) ON DELETE CASCADE,
  milestone_type TEXT NOT NULL, -- 'cadastros' or 'vendas'
  milestone_count INTEGER NOT NULL, -- 50, 100, 150... or 10, 20, 30...
  days_granted INTEGER NOT NULL DEFAULT 30,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_referral_rewards_user_id ON public.referral_rewards(user_id);

ALTER TABLE public.referral_rewards ENABLE ROW LEVEL SECURITY;

-- Users can see their own rewards
CREATE POLICY "Users can view own rewards"
  ON public.referral_rewards FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can insert rewards
CREATE POLICY "Service role can insert rewards"
  ON public.referral_rewards FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- Function to check and grant referral milestones
CREATE OR REPLACE FUNCTION public.check_referral_milestones(p_referrer_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

  -- Check cadastro milestones (every 50)
  next_cadastro_milestone := last_cadastro_milestone + 50;
  WHILE total_cadastros >= next_cadastro_milestone LOOP
    -- Grant reward
    INSERT INTO public.referral_rewards (user_id, milestone_type, milestone_count, days_granted)
    VALUES (p_referrer_id, 'cadastros', next_cadastro_milestone, 30);

    -- Extend subscription by 30 days
    UPDATE public.perfis
    SET validade_assinatura = GREATEST(COALESCE(validade_assinatura, now()), now()) + INTERVAL '30 days',
        status_assinatura = 'ativa'
    WHERE id = p_referrer_id;

    next_cadastro_milestone := next_cadastro_milestone + 50;
  END LOOP;

  -- Check venda milestones (every 10)
  next_venda_milestone := last_venda_milestone + 10;
  WHILE total_vendas >= next_venda_milestone LOOP
    -- Grant reward
    INSERT INTO public.referral_rewards (user_id, milestone_type, milestone_count, days_granted)
    VALUES (p_referrer_id, 'vendas', next_venda_milestone, 30);

    -- Extend subscription by 30 days
    UPDATE public.perfis
    SET validade_assinatura = GREATEST(COALESCE(validade_assinatura, now()), now()) + INTERVAL '30 days',
        status_assinatura = 'ativa'
    WHERE id = p_referrer_id;

    next_venda_milestone := next_venda_milestone + 10;
  END LOOP;
END;
$$;