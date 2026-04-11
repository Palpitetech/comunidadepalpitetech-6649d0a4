-- Drop the existing function first
DROP FUNCTION IF EXISTS public.activate_free_trial();

-- Create the new function with boolean return
CREATE OR REPLACE FUNCTION public.activate_free_trial()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id UUID;
  v_trial_plan_id UUID;
BEGIN
  -- Get current user ID
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN 
    RETURN false; 
  END IF;

  -- Get trial plan ID (slug 'trial' or 'teste-gratis-3-dias')
  SELECT id INTO v_trial_plan_id 
  FROM public.plans
  WHERE slug IN ('trial', 'teste-gratis-3-dias')
  LIMIT 1;

  IF v_trial_plan_id IS NULL THEN 
    RETURN false; 
  END IF;

  -- Check if trial already used
  IF EXISTS (SELECT 1 FROM public.perfis WHERE id = v_user_id AND trial_used = true) THEN
    RETURN false;
  END IF;

  -- Update profile with trial info
  UPDATE public.perfis
  SET
    plan_id = v_trial_plan_id,
    status_assinatura = 'ativa',
    validade_assinatura = now() + interval '3 days',
    trial_used = true,
    updated_at = now()
  WHERE id = v_user_id;

  RETURN true;
END;
$$;