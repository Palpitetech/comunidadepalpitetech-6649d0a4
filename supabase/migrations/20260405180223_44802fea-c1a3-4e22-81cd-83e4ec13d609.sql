ALTER TABLE public.group_blast_configs
  ADD COLUMN include_palpites boolean NOT NULL DEFAULT true,
  ADD COLUMN vip_group_link text;