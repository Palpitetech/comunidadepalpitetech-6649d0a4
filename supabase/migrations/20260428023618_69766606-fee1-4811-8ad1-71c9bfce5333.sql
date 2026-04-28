ALTER TABLE public.group_blast_configs
ADD COLUMN IF NOT EXISTS palpite_settings jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.group_blast_configs.palpite_settings IS
'Configurações por loteria para slots tipo "palpite". Formato: {"lotofacil":{"include_palpites":bool,"vip_group_link":text|null},"megasena":{...}}';