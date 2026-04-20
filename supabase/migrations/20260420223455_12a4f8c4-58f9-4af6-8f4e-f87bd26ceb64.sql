-- Remove variantes obsoletas em position=1 (slot #1 é sempre o conteúdo do próprio template, não da tabela de variantes)
DELETE FROM public.message_template_variants WHERE position = 1;

-- Adiciona constraint para impedir position=1 no futuro (slot #1 é reservado para message_templates.content)
ALTER TABLE public.message_template_variants
  ADD CONSTRAINT message_template_variants_position_range
  CHECK (position BETWEEN 2 AND 10);