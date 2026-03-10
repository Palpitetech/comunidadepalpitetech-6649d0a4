
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

  -- Adiciona tags: comunidade + gratis
  UPDATE public.perfis
  SET tags = ARRAY['comunidade', 'gratis']
  WHERE id = NEW.id;

  RETURN NEW;
END;
$function$;
