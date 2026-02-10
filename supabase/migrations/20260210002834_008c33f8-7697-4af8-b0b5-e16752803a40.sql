
-- Add CTA fields to public view (these are user-facing, not sensitive)
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
  gp.chat_priority,
  gp.cta_override_enabled,
  gp.cta_override_text,
  gp.cta_override_buttons
FROM public.guide_personas gp;
