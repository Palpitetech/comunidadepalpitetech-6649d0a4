UPDATE public.perfis
SET updated_at = now()
WHERE plan_id = (SELECT id FROM public.plans WHERE slug = 'aula-ao-vivo-mega-especial');