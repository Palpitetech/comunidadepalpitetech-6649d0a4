-- Renomear coluna is_roundtable_author para is_result_author
ALTER TABLE public.guide_personas 
RENAME COLUMN is_roundtable_author TO is_result_author;