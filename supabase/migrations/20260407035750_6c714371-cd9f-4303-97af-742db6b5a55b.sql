
CREATE OR REPLACE FUNCTION public.increment_smart_link_clicks(p_slug text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE whatsapp_smart_links
  SET clicks = clicks + 1
  WHERE slug = p_slug AND is_active = true;
$$;
