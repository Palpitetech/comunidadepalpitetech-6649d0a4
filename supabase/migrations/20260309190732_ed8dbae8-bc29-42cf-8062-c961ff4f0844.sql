ALTER TABLE perfis DISABLE TRIGGER prevent_subscription_changes;

UPDATE perfis SET validade_assinatura = created_at + INTERVAL '180 days'
WHERE id IN ('08510961-055c-4795-964c-96914df7f71b', 'e69066fe-354a-4b51-ba8e-b9780fe7fa24')
AND validade_assinatura IS NULL;

ALTER TABLE perfis ENABLE TRIGGER prevent_subscription_changes;