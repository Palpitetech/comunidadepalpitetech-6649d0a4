-- Add loteria column to palpites_pastas for lottery-specific folder isolation
ALTER TABLE public.palpites_pastas 
ADD COLUMN loteria text DEFAULT 'lotofacil';

-- Update existing folders based on their palpites content (if any)
-- This preserves existing data by checking what lottery the folder's palpites belong to
UPDATE public.palpites_pastas p
SET loteria = COALESCE(
  (SELECT DISTINCT ps.loteria 
   FROM public.palpites_salvos ps 
   WHERE ps.pasta_id = p.id 
   LIMIT 1),
  'lotofacil'
);

-- Create index for faster filtering
CREATE INDEX idx_palpites_pastas_loteria ON public.palpites_pastas(loteria);
CREATE INDEX idx_palpites_pastas_user_loteria ON public.palpites_pastas(user_id, loteria);