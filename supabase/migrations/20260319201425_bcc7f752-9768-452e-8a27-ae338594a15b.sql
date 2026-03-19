
ALTER TABLE public.group_blast_configs ADD COLUMN group_jids text[] NOT NULL DEFAULT '{}';

UPDATE public.group_blast_configs SET group_jids = ARRAY[group_jid] WHERE group_jid IS NOT NULL AND group_jid != '';

ALTER TABLE public.group_blast_configs DROP COLUMN group_jid;
