-- Anti-spam: Cadastro Comunidade não dispara para quem comprou direto na Kirvano
-- (esses já recebem o template "Compra aprovada" correspondente)
UPDATE public.message_templates
SET exclude_tags = ARRAY['pago_mensal', 'pago_anual', 'pago_anualvip', 'pago_grupovip_lotofacil']
WHERE id = 'b90a7b60-c495-42cc-b74a-437fc48ab8b3'
  AND name = 'Cadastro Comunidade';