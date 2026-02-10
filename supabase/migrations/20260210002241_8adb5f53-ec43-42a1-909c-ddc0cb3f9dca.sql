
-- 1) Create a public view with ONLY safe columns (no email, CPF, celular, whatsapp, etc.)
CREATE OR REPLACE VIEW public.perfis_publicos
WITH (security_invoker = on) AS
SELECT
  id,
  nome,
  avatar_url,
  is_bot
FROM public.perfis;

-- 2) Drop the overly permissive SELECT policy on perfis
DROP POLICY IF EXISTS "Perfis são visíveis para todos" ON public.perfis;

-- 3) Users can only see their own full profile
CREATE POLICY "Usuarios podem ver seu proprio perfil"
  ON public.perfis
  FOR SELECT
  USING (auth.uid() = id);

-- 4) Admins can see all profiles (needed for admin panel)
CREATE POLICY "Admins podem ver todos os perfis"
  ON public.perfis
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 5) Service role can see all profiles (needed for edge functions)
CREATE POLICY "Service role pode ver todos os perfis"
  ON public.perfis
  FOR SELECT
  USING (auth.role() = 'service_role'::text);

-- 6) Restrict usuarios_notificaveis_hoje - recreate with security_invoker
-- Then add RLS-like protection by revoking access from anon/authenticated
REVOKE SELECT ON public.usuarios_notificaveis_hoje FROM anon;
REVOKE SELECT ON public.usuarios_notificaveis_hoje FROM authenticated;

-- Grant only to service_role (edge functions use this)
GRANT SELECT ON public.usuarios_notificaveis_hoje TO service_role;

-- 7) Grant access to perfis_publicos for all authenticated users
GRANT SELECT ON public.perfis_publicos TO anon;
GRANT SELECT ON public.perfis_publicos TO authenticated;
