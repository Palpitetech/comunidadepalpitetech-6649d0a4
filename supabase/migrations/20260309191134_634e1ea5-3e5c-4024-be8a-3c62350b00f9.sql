ALTER TABLE perfis DISABLE TRIGGER prevent_subscription_changes;

UPDATE perfis 
SET plan_id = 'a1fc6ca2-cce2-41ef-aca4-4a2e8e60226f',
    status_assinatura = 'ativa',
    validade_assinatura = now() + INTERVAL '365 days'
WHERE id = '0cc9312e-509f-4b51-830b-36c2fb87ca26';

ALTER TABLE perfis ENABLE TRIGGER prevent_subscription_changes;