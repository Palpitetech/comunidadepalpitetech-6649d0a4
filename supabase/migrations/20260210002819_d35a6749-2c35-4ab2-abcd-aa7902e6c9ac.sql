
-- 1) Create a public view with ONLY safe columns (no prompts, no safety config, no schedule)
CREATE OR REPLACE VIEW public.guide_personas_publico
WITH (security_invoker = on) AS
SELECT
  gp.id,
  gp.perfil_id,
  gp.cargo,
  gp.especialidade,
  gp.badge_emoji,
  gp.ativo,
  gp.chat_enabled,
  gp.chat_tags,
  gp.chat_priority
FROM public.guide_personas gp;

-- 2) Drop the overly permissive SELECT policy
DROP POLICY IF EXISTS "Guide personas são visíveis para leitura" ON public.guide_personas;

-- 3) Only admins and service_role can read the full table
CREATE POLICY "Service role pode ver guide_personas"
  ON public.guide_personas
  FOR SELECT
  USING (auth.role() = 'service_role'::text);

-- 4) Grant public view access
GRANT SELECT ON public.guide_personas_publico TO anon;
GRANT SELECT ON public.guide_personas_publico TO authenticated;
