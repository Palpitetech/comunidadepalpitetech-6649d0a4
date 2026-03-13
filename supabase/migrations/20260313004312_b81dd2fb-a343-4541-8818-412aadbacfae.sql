CREATE POLICY "Admins podem atualizar perfis"
ON public.perfis FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));