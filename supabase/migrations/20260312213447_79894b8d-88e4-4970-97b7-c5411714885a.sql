ALTER TABLE public.group_blast_configs ADD COLUMN IF NOT EXISTS messages_per_day int DEFAULT 1;

CREATE OR REPLACE FUNCTION public.validate_messages_per_day()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.messages_per_day < 1 OR NEW.messages_per_day > 10 THEN
    RAISE EXCEPTION 'messages_per_day deve ser entre 1 e 10';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_messages_per_day
  BEFORE INSERT OR UPDATE ON public.group_blast_configs
  FOR EACH ROW EXECUTE FUNCTION public.validate_messages_per_day();