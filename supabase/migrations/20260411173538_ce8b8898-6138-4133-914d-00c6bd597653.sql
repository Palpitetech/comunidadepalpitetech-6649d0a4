-- 1. Audit and Fix activate_free_trial function
-- Ensuring it uses SECURITY DEFINER and correct column names (id for perfis)
CREATE OR REPLACE FUNCTION public.activate_free_trial()
RETURNS json
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
        RETURN json_build_object('success', false, 'message', 'Não autenticado');
    END IF;

    -- Dynamic lookup of the trial plan ID to avoid hardcoded values
    SELECT id INTO v_trial_plan_id 
    FROM public.plans 
    WHERE slug IN ('trial', 'teste-gratis-3-dias') 
    ORDER BY (CASE WHEN slug = 'teste-gratis-3-dias' THEN 1 ELSE 2 END)
    LIMIT 1;

    IF v_trial_plan_id IS NULL THEN
        RETURN json_build_object('success', false, 'message', 'Plano de teste não encontrado no sistema');
    END IF;

    -- Get user profile using 'id' (correct column for perfis table)
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

    RETURN json_build_object('success', true, 'message', 'Teste grátis ativado com sucesso!');
EXCEPTION WHEN OTHERS THEN
    -- Capture any errors including the "column user_id does not exist" if it were to happen
    RETURN json_build_object('success', false, 'message', 'Erro ao ativar trial: ' || SQLERRM);
END;
$$;

-- 2. Audit and Fix RLS Policies for 'perfis'
-- Ensure they use 'id' instead of 'user_id'

-- Drop existing if they were potentially misconfigured (using names from audit)
-- Note: Based on my audit, they are already using 'id', but we re-apply for certainty.

DROP POLICY IF EXISTS "Usuários podem atualizar seu próprio perfil" ON public.perfis;
CREATE POLICY "Usuários podem atualizar seu próprio perfil" 
ON public.perfis 
FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Usuarios podem ver seu proprio perfil" ON public.perfis;
CREATE POLICY "Usuarios podem ver seu proprio perfil" 
ON public.perfis 
FOR SELECT 
USING (auth.uid() = id);

-- 3. Audit and Fix RLS Policies for 'plans' (planos)
-- Plans are usually public, ensure no user_id conflict here
DROP POLICY IF EXISTS "Planos são públicos para leitura" ON public.plans;
CREATE POLICY "Planos são públicos para leitura" 
ON public.plans 
FOR SELECT 
USING (true);
