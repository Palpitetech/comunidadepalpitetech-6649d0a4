-- Desabilita temporariamente o trigger de proteção para fazer a correção administrativa
ALTER TABLE public.perfis DISABLE TRIGGER USER;

-- Reverte perfis afetados pelo bug
UPDATE public.perfis
SET
  plan_id = NULL,
  status_assinatura = 'pendente',
  validade_assinatura = NULL,
  trial_used = false,
  email_verificado = false,
  tags = array_append(
    array_remove(COALESCE(tags, ARRAY[]::text[]), 'email_verificado'),
    'email_pendente'
  )
WHERE id IN (
  'f425be3a-610b-4e9f-bcc2-e36f4219ab67',
  '60a7f7e8-4ba3-4b36-aea5-8f27f048c45e',
  'd64a11e1-5840-408e-bcc6-e3ba6b26c0d5',
  '0c8cde3e-ddeb-4c29-b3bb-3a5dbca815fe',
  'f52582a7-3222-4667-b63e-1df608654c82',
  '6b6af866-b17d-4fdf-865b-d4eb1d4001f4'
);

-- Reabilita os triggers
ALTER TABLE public.perfis ENABLE TRIGGER USER;

-- Remove role 'premium' concedida indevidamente
DELETE FROM public.user_roles
WHERE role = 'premium'
  AND user_id IN (
    'f425be3a-610b-4e9f-bcc2-e36f4219ab67',
    '60a7f7e8-4ba3-4b36-aea5-8f27f048c45e',
    'd64a11e1-5840-408e-bcc6-e3ba6b26c0d5',
    '0c8cde3e-ddeb-4c29-b3bb-3a5dbca815fe',
    'f52582a7-3222-4667-b63e-1df608654c82',
    '6b6af866-b17d-4fdf-865b-d4eb1d4001f4'
  );

-- Loga evento de auditoria
INSERT INTO public.events (user_id, event_type, metadata)
SELECT id, 'trial_revertido_bug',
  jsonb_build_object(
    'motivo', 'trial_concedido_automaticamente_sem_solicitacao',
    'acao', 'plano_zerado_email_pendente'
  )
FROM public.perfis
WHERE id IN (
  'f425be3a-610b-4e9f-bcc2-e36f4219ab67',
  '60a7f7e8-4ba3-4b36-aea5-8f27f048c45e',
  'd64a11e1-5840-408e-bcc6-e3ba6b26c0d5',
  '0c8cde3e-ddeb-4c29-b3bb-3a5dbca815fe',
  'f52582a7-3222-4667-b63e-1df608654c82',
  '6b6af866-b17d-4fdf-865b-d4eb1d4001f4'
);