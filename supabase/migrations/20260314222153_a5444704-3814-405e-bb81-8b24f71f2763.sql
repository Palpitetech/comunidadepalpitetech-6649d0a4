ALTER TABLE boloes ADD COLUMN IF NOT EXISTS task_pago boolean DEFAULT false;
ALTER TABLE boloes ADD COLUMN IF NOT EXISTS valor_registro numeric DEFAULT 0;
ALTER TABLE boloes ADD COLUMN IF NOT EXISTS pago_em timestamptz;