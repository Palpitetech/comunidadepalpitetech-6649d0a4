
CREATE OR REPLACE FUNCTION public.prevent_post_field_manipulation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Allow service_role and admins
  IF current_setting('request.jwt.claim.role', true) = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  -- Block manipulation of system-managed fields
  IF NEW.curtidas IS DISTINCT FROM OLD.curtidas THEN
    RAISE EXCEPTION 'Não é permitido alterar curtidas diretamente';
  END IF;

  IF NEW.respostas_count IS DISTINCT FROM OLD.respostas_count THEN
    RAISE EXCEPTION 'Não é permitido alterar contagem de respostas';
  END IF;

  IF NEW.bot_interactions_enabled IS DISTINCT FROM OLD.bot_interactions_enabled THEN
    RAISE EXCEPTION 'Não é permitido alterar configurações de bot';
  END IF;

  IF NEW.bot_interactions_target IS DISTINCT FROM OLD.bot_interactions_target THEN
    RAISE EXCEPTION 'Não é permitido alterar configurações de bot';
  END IF;

  IF NEW.bot_interactions_done IS DISTINCT FROM OLD.bot_interactions_done THEN
    RAISE EXCEPTION 'Não é permitido alterar configurações de bot';
  END IF;

  IF NEW.bot_interactions_last_at IS DISTINCT FROM OLD.bot_interactions_last_at THEN
    RAISE EXCEPTION 'Não é permitido alterar configurações de bot';
  END IF;

  IF NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    RAISE EXCEPTION 'Não é permitido alterar o autor do post';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_post_manipulation ON public.postagens;
CREATE TRIGGER prevent_post_manipulation
  BEFORE UPDATE ON public.postagens
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_post_field_manipulation();
