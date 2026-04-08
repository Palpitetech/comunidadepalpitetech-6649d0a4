-- Etapa 1: Migrar posts da Ana para Palpite Tech
UPDATE public.postagens 
SET user_id = '24fa35cb-04f8-4dc7-a173-5b1e0cab3ea0' 
WHERE user_id = '98d31554-c19a-4f0b-8913-d3f3a9c88ec8';

-- Migrar comentários de bots mortos para Palpite Tech
UPDATE public.post_comments 
SET user_id = '24fa35cb-04f8-4dc7-a173-5b1e0cab3ea0' 
WHERE user_id IN (
  '98d31554-c19a-4f0b-8913-d3f3a9c88ec8',
  '92dcb239-deb9-433f-8eb5-ee7f6d273012',
  'd8516c82-d948-45b9-95b6-423815da5bd8',
  'eb246e09-b2ce-4a58-83a0-6b08f2fd344f',
  '496398bb-798a-4ee9-9e64-972df9fbe8cd',
  '48c1a80e-bccf-4648-bef9-f7c3a6d131d4'
);

-- Deletar bot_post_interactions dos bots mortos (logs sem valor)
DELETE FROM public.bot_post_interactions 
WHERE bot_perfil_id IN (
  '98d31554-c19a-4f0b-8913-d3f3a9c88ec8',
  '92dcb239-deb9-433f-8eb5-ee7f6d273012',
  'd8516c82-d948-45b9-95b6-423815da5bd8',
  'eb246e09-b2ce-4a58-83a0-6b08f2fd344f',
  '496398bb-798a-4ee9-9e64-972df9fbe8cd',
  '48c1a80e-bccf-4648-bef9-f7c3a6d131d4',
  '7189b85f-8d5c-411a-a896-ab8b0f1d5964',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  '6f689c3d-2ff1-492a-a5a4-c0baaabcb949'
);

-- Transferir is_result_author para Palpite Tech
UPDATE public.guide_personas SET is_result_author = false WHERE id = '018528e7-1f1d-4e43-91ac-abf5c9481211';
UPDATE public.guide_personas SET is_result_author = true WHERE id = '2a827e7d-a3d1-416e-8552-e830dc7e633c';

-- Desativar bots mortos
UPDATE public.guide_personas 
SET ativo = false, can_create_posts = false, can_comment_on_posts = false, auto_reply_enabled = false, chat_enabled = false
WHERE id IN (
  '018528e7-1f1d-4e43-91ac-abf5c9481211',
  'dfb76c07-fa68-4c58-8cf2-0df422f29c19',
  '8c4d3acb-48da-4849-a434-04b1634d17e6',
  '7c5c23c2-77b6-4ec9-831f-911d2e77fbd2',
  '8758c9e4-e3f7-4af0-8907-459b71bc7ccf',
  'a9eedb0a-239e-4acc-b180-5cc3b1934131'
);

-- Ajustar bots de chat
UPDATE public.guide_personas 
SET can_comment_on_posts = false, auto_reply_enabled = false, can_create_posts = false
WHERE id IN (
  '9885c48e-edd9-4884-bbf0-67b1e3456996',
  '7625b931-48dc-4550-81f3-1f8bd8a0ce33',
  '865470d7-ec46-4cd7-a6ce-9ad2fb672156'
);