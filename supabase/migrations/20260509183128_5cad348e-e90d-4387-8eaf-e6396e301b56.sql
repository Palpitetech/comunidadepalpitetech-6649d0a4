CREATE TABLE public.mega30_aula_descricoes (
  aula_id text NOT NULL PRIMARY KEY,
  slides jsonb NOT NULL DEFAULT '[]'::jsonb,
  descricao_youtube text NOT NULL DEFAULT '',
  engine_version text,
  generated_at timestamptz NOT NULL DEFAULT now(),
  generated_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.mega30_aula_descricoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins gerenciam mega30_aula_descricoes"
ON public.mega30_aula_descricoes
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role acesso mega30_aula_descricoes"
ON public.mega30_aula_descricoes
FOR ALL
TO public
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

CREATE TRIGGER update_mega30_aula_descricoes_updated_at
BEFORE UPDATE ON public.mega30_aula_descricoes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();