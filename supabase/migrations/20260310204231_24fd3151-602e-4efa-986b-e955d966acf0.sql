
ALTER TABLE public.perfis
  ADD COLUMN tags text[] NOT NULL DEFAULT '{}';

CREATE INDEX index_perfis_tags ON public.perfis USING GIN (tags);
