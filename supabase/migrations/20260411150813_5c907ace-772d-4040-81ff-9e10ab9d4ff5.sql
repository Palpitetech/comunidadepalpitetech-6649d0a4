-- Temporarily disable the protection trigger
ALTER TABLE perfis DISABLE TRIGGER prevent_subscription_changes;

-- Update the user's status to inativa (this triggers the trial modal logic)
UPDATE perfis 
SET status_assinatura = 'inativa' 
WHERE email = 'gu.h_angelis@hotmail.com';

-- Re-enable the protection trigger
ALTER TABLE perfis ENABLE TRIGGER prevent_subscription_changes;