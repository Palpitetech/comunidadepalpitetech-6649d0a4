ALTER TABLE public.message_template_variants DROP CONSTRAINT IF EXISTS message_template_variants_position_check;
ALTER TABLE public.message_template_variants DROP CONSTRAINT IF EXISTS message_template_variants_position_range;

ALTER TABLE public.message_template_variants ADD CONSTRAINT message_template_variants_position_range CHECK (position >= 1 AND position <= 20);
