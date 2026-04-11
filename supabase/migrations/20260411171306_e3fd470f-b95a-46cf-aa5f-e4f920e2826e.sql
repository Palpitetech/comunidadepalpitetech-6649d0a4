-- Create a function to activate free trial securely
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

    -- Update profile using service_role bypass or by being allowed in the trigger
    -- Since this function runs as the owner (superuser if created via migration), 
    -- and we want to bypass the trigger check for these specific fields,
    -- we can temporarily disable the trigger or just perform the update if the function is defined to SECURITY DEFINER.
    
    UPDATE public.perfis
    SET 
        plan_id = v_trial_plan_id,
        status_assinatura = 'ativa',
        validade_assinatura = v_expires_at,
        trial_used = true,
        updated_at = now()
    WHERE id = v_user_id;

    RETURN json_build_object('success', true, 'message', 'Teste grátis ativado com sucesso!');
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'message', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Revoke all permissions and grant only to authenticated users
REVOKE ALL ON FUNCTION public.activate_free_trial() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.activate_free_trial() TO authenticated;
