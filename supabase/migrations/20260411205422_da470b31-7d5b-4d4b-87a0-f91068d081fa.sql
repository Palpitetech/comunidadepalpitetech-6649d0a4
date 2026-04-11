-- Update the function to handle new users with a 3-day trial automatically
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  trial_plan_id UUID := 'b3a2a9e3-8e3b-4e3b-8e3b-8e3b8e3b8e3b';
BEGIN
  -- Insert into perfis with 3-day trial
  INSERT INTO public.perfis (
    id, 
    nome, 
    email, 
    tags, 
    plan_id, 
    status_assinatura, 
    validade_assinatura, 
    trial_used
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email),
    NEW.email,
    ARRAY['comunidade', 'trial', 'ativo'],
    trial_plan_id,
    'ativa',
    now() + interval '3 days',
    true
  );

  -- Add base user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  -- Add premium role for trial access
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'premium');

  -- Log signup event
  INSERT INTO public.events (user_id, event_type, metadata)
  VALUES (
    NEW.id,
    'novo_cadastro',
    jsonb_build_object(
      'email', NEW.email,
      'nome', COALESCE(NEW.raw_user_meta_data->>'nome', null),
      'origem', COALESCE(NEW.raw_user_meta_data->>'origem', 'comunidade'),
      'trial_activated', true
    )
  );

  RETURN NEW;
END;
$function$;

-- Update existing users who are currently 'inativa' and haven't used trial yet to have the 3-day trial
-- Using session variable to bypass the 'prevent_subscription_changes' trigger
DO $$
DECLARE
  trial_plan_id UUID := 'b3a2a9e3-8e3b-4e3b-8e3b-8e3b8e3b8e3b';
BEGIN
  -- Bypass trigger for this session
  SET LOCAL app.bypass_subscription_checks = 'true';

  -- Update perfis
  UPDATE public.perfis
  SET 
    plan_id = trial_plan_id,
    status_assinatura = 'ativa',
    validade_assinatura = now() + interval '3 days',
    trial_used = true,
    tags = array_append(tags, 'trial'),
    updated_at = now()
  WHERE 
    status_assinatura = 'inativa' 
    AND (trial_used IS FALSE OR trial_used IS NULL)
    AND is_bot IS FALSE;

  -- Add premium role for these users if they don't have it
  INSERT INTO public.user_roles (user_id, role)
  SELECT id, 'premium'::app_role
  FROM public.perfis
  WHERE status_assinatura = 'ativa' 
    AND plan_id = trial_plan_id
    AND is_bot IS FALSE
  ON CONFLICT (user_id, role) DO NOTHING;
END $$;
