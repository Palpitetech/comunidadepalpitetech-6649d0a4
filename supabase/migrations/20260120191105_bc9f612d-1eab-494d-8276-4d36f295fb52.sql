-- 1) Corrige view para não ser SECURITY DEFINER (usa permissões/RLS do usuário que consulta)
CREATE OR REPLACE VIEW public.usuarios_notificaveis_hoje
WITH (security_invoker = on) AS
SELECT
  p.id,
  p.nome,
  p.celular,
  p.email,
  ur.role,
  p.created_at,
  (p.created_at >= (timezone('utc'::text, now()) - interval '15 days')) AS esta_no_periodo_teste,
  p.email_verificado,
  p.celular_verificado
FROM public.perfis p
JOIN public.user_roles ur ON p.id = ur.user_id
WHERE
  ur.role = 'premium'
  OR (
    ur.role = 'user'
    AND p.created_at >= (timezone('utc'::text, now()) - interval '15 days')
  );

-- 2) Endurece políticas do codigos_verificacao (evita USING/WITH CHECK sempre true)
DROP POLICY IF EXISTS "Service role pode inserir codigos" ON public.codigos_verificacao;
DROP POLICY IF EXISTS "Service role pode atualizar codigos" ON public.codigos_verificacao;

CREATE POLICY "Service role pode inserir codigos"
ON public.codigos_verificacao
FOR INSERT
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role pode atualizar codigos"
ON public.codigos_verificacao
FOR UPDATE
USING (auth.role() = 'service_role');
