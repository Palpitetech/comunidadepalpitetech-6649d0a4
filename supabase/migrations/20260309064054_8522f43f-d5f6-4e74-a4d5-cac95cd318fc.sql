CREATE OR REPLACE FUNCTION public.get_referrer_name(p_code text)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT nome FROM public.perfis WHERE referral_code = p_code LIMIT 1;
$$;