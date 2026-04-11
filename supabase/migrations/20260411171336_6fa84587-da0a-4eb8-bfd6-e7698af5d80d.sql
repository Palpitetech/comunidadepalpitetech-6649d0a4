-- Update the activate_free_trial function to set the bypass variable
CREATE OR REPLACE FUNCTION public.activate_free_trial()
RETURNS json AS $$
DECLARE
    v_user_id UUID;
    v_trial_plan_id UUID := 'b3a2a9e3-8e3b-4e3b-8e3b-8e3b8e3b8e3b';
    v_profile RECORD;
    v_expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Get the current user ID
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RETURN json_build_object('success', false, 'message', 'Não autenticado');
    END IF;

    -- Get user profile
    SELECT * INTO v_profile FROM public.perfis WHERE id = v_user_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'message', 'Perfil não encontrado');
    END IF;

    -- Check if trial was already used
    IF v_profile.trial_used THEN
        RETURN json_build_object('success', false, 'message', 'O teste grátis já foi utilizado por esta conta');
    END IF;

    -- Check if already has an active subscription
    IF v_profile.status_assinatura = 'ativa' THEN
        RETURN json_build_object('success', false, 'message', 'Você já possui uma assinatura ativa');
    END IF;

    -- Calculate expiration date (3 days)
    v_expires_at := now() + interval '3 days';

    -- Set session variable to bypass security trigger
    PERFORM set_config('app.bypass_subscription_checks', 'true', true);
    
    UPDATE public.perfis
    SET 
        plan_id = v_trial_plan_id,
        status_assinatura = 'ativa',
        validade_assinatura = v_expires_at,
        trial_used = true,
        updated_at = now()
    WHERE id = v_user_id;

    -- Reset session variable
    PERFORM set_config('app.bypass_subscription_checks', 'false', true);

    RETURN json_build_object('success', true, 'message', 'Teste grátis ativado com sucesso!');
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'message', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
