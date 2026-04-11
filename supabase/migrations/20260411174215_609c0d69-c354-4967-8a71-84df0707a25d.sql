-- Drop the existing function first to allow changing the return type
DROP FUNCTION IF EXISTS public.activate_free_trial();

-- Recreate the function with jsonb return type
CREATE OR REPLACE FUNCTION public.activate_free_trial()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with high privileges to bypass RLS and perform system updates
SET search_path TO 'public'
AS $$
DECLARE
    v_user_id UUID;
    v_trial_plan_id UUID;
    v_profile RECORD;
    v_expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Get the current user ID from the authentication context
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Não autenticado');
    END IF;

    -- Dynamic lookup of the trial plan ID to avoid hardcoded values
    SELECT id INTO v_trial_plan_id 
    FROM public.plans 
    WHERE slug IN ('trial', 'teste-gratis-3-dias') 
    ORDER BY (CASE WHEN slug = 'teste-gratis-3-dias' THEN 1 ELSE 2 END)
    LIMIT 1;

    IF v_trial_plan_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Plano de teste não encontrado no sistema');
    END IF;

    -- Get user profile using 'id' (correct column for perfis table)
    SELECT * INTO v_profile FROM public.perfis WHERE id = v_user_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Perfil não encontrado');
    END IF;

    -- Check if trial was already used
    IF v_profile.trial_used THEN
        RETURN jsonb_build_object('success', false, 'message', 'O teste grátis já foi utilizado por esta conta');
    END IF;

    -- Check if already has an active subscription
    IF v_profile.status_assinatura = 'ativa' THEN
        RETURN jsonb_build_object('success', false, 'message', 'Você já possui uma assinatura ativa');
    END IF;

    -- Calculate expiration date (3 days)
    v_expires_at := now() + interval '3 days';

    -- Set session variable to bypass the 'prevent_subscription_changes' trigger
    PERFORM set_config('app.bypass_subscription_checks', 'true', true);
    
    -- Update perfis using 'id' (correct column)
    UPDATE public.perfis
    SET 
        plan_id = v_trial_plan_id,
        status_assinatura = 'ativa',
        validade_assinatura = v_expires_at,
        trial_used = true,
        updated_at = now()
    WHERE id = v_user_id;

    -- Reset session variable to restore normal security checks
    PERFORM set_config('app.bypass_subscription_checks', 'false', true);

    RETURN jsonb_build_object('success', true, 'message', 'Teste grátis ativado com sucesso!');
EXCEPTION WHEN OTHERS THEN
    -- Capture any errors including the "column user_id does not exist" if it were to happen
    RETURN jsonb_build_object('success', false, 'message', 'Erro ao ativar trial: ' || SQLERRM);
END;
$$;

-- Revoke all permissions and grant only to authenticated users (standard practice for secure functions)
REVOKE ALL ON FUNCTION public.activate_free_trial() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.activate_free_trial() TO authenticated;