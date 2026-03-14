
-- PASSO 1: Adicionar coluna slug
ALTER TABLE public.postagens
ADD COLUMN IF NOT EXISTS slug text UNIQUE;

-- PASSO 2: Função para gerar slug a partir do título
CREATE OR REPLACE FUNCTION public.generate_slug(title text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  base_slug text;
  final_slug text;
  counter int := 0;
BEGIN
  IF title IS NULL OR trim(title) = '' THEN
    RETURN gen_random_uuid()::text;
  END IF;

  base_slug := lower(trim(title));
  base_slug := translate(base_slug,
    'áàãâäéèêëíìîïóòõôöúùûüçñÁÀÃÂÄÉÈÊËÍÌÎÏÓÒÕÔÖÚÙÛÜÇÑ',
    'aaaaaeeeeiiiiooooouuuucnAAAAAEEEEIIIIOOOOOUUUUCN');
  base_slug := lower(base_slug);
  base_slug := regexp_replace(base_slug, '[^a-z0-9\s-]', '', 'g');
  base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
  base_slug := regexp_replace(base_slug, '-+', '-', 'g');
  base_slug := trim(both '-' from base_slug);
  base_slug := left(base_slug, 80);

  IF base_slug = '' THEN
    RETURN gen_random_uuid()::text;
  END IF;

  final_slug := base_slug;

  WHILE EXISTS (
    SELECT 1 FROM public.postagens WHERE slug = final_slug
  ) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;

  RETURN final_slug;
END;
$$;

-- PASSO 3: Trigger automático
CREATE OR REPLACE FUNCTION public.set_post_slug()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := public.generate_slug(NEW.titulo);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_post_slug ON public.postagens;
CREATE TRIGGER trg_set_post_slug
BEFORE INSERT ON public.postagens
FOR EACH ROW
EXECUTE FUNCTION public.set_post_slug();

-- PASSO 4: Migrar posts existentes
UPDATE public.postagens
SET slug = public.generate_slug(titulo)
WHERE slug IS NULL;
