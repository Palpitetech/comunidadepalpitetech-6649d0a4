
CREATE OR REPLACE FUNCTION public.identificar_conta(p_identificador text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_raw text;
  v_is_email boolean;
  v_email text;
  v_celular text;
  v_result record;
BEGIN
  v_raw := trim(p_identificador);
  
  IF v_raw IS NULL OR v_raw = '' THEN
    RETURN jsonb_build_object('error', 'Informe seu telefone ou e-mail.');
  END IF;
  
  v_is_email := v_raw LIKE '%@%';
  
  IF v_is_email THEN
    v_email := lower(v_raw);
    
    SELECT id, email INTO v_result
    FROM public.perfis
    WHERE lower(email) = v_email
    LIMIT 1;
    
    IF v_result.id IS NULL THEN
      RETURN jsonb_build_object('exists', false);
    END IF;
    
    RETURN jsonb_build_object('exists', true, 'email', COALESCE(v_result.email, v_email));
  ELSE
    -- Extract digits only
    v_celular := regexp_replace(v_raw, '\D', '', 'g');
    
    -- Remove country code 55 if present
    IF v_celular LIKE '55%' AND (length(v_celular) = 12 OR length(v_celular) = 13) THEN
      v_celular := substring(v_celular from 3);
    END IF;
    
    IF length(v_celular) < 10 OR length(v_celular) > 11 THEN
      RETURN jsonb_build_object('error', 'Telefone inválido. Digite com DDD.');
    END IF;
    
    SELECT id, email INTO v_result
    FROM public.perfis
    WHERE celular = v_celular
    LIMIT 1;
    
    IF v_result.id IS NULL THEN
      RETURN jsonb_build_object('exists', false);
    END IF;
    
    RETURN jsonb_build_object('exists', true, 'email', v_result.email);
  END IF;
END;
$$;
