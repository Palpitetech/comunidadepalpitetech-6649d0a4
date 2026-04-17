CREATE OR REPLACE FUNCTION public.verificar_existencia_usuario(p_email TEXT DEFAULT NULL, p_celular TEXT DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_nome TEXT;
    v_email TEXT;
    v_exists BOOLEAN := FALSE;
    v_type TEXT := NULL;
BEGIN
    -- Busca por email se fornecido
    IF p_email IS NOT NULL AND p_email <> '' THEN
        SELECT nome, email INTO v_nome, v_email 
        FROM public.perfis 
        WHERE LOWER(email) = LOWER(p_email) 
        LIMIT 1;
        
        IF FOUND THEN
            v_exists := TRUE;
            v_type := 'email';
        END IF;
    END IF;

    -- Busca por celular se não encontrou por email e celular foi fornecido
    IF NOT v_exists AND p_celular IS NOT NULL AND p_celular <> '' THEN
        -- Limpa o celular para comparação (remove caracteres não numéricos)
        SELECT nome, email INTO v_nome, v_email 
        FROM public.perfis 
        WHERE regexp_replace(celular, '\D', '', 'g') = regexp_replace(p_celular, '\D', '', 'g')
        LIMIT 1;

        IF FOUND THEN
            v_exists := TRUE;
            v_type := 'celular';
        END IF;
    END IF;

    RETURN jsonb_build_object(
        'exists', v_exists,
        'nome', v_nome,
        'email', v_email,
        'type', v_type
    );
END;
$$;
