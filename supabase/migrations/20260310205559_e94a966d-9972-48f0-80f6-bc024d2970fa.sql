
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.perfis (id, nome, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email),
    NEW.email
  );

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');

  -- Registra evento de novo cadastro
  INSERT INTO public.events (user_id, event_type, metadata)
  VALUES (
    NEW.id,
    'novo_cadastro',
    jsonb_build_object(
      'email', NEW.email,
      'nome', COALESCE(NEW.raw_user_meta_data->>'nome', null),
      'origem', COALESCE(NEW.raw_user_meta_data->>'origem', 'comunidade')
    )
  );

  -- Adiciona tag comunidade ao perfil
  UPDATE public.perfis
  SET tags = array_append(tags, 'comunidade')
  WHERE id = NEW.id AND NOT ('comunidade' = ANY(tags));

  RETURN NEW;
END;
$function$;
