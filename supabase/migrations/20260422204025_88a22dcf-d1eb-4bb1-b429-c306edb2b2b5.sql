-- Limpa duplicata legada (mantém a mais recente)
DELETE FROM public.message_queue
WHERE template_id = 'b90a7b60-c495-42cc-b74a-437fc48ab8b3'
  AND recipient_phone = '11999887755'
  AND created_at = '2026-04-07 02:49:50.865964+00';

-- Habilita extensão necessária
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Função IMMUTABLE auxiliar
CREATE OR REPLACE FUNCTION public._message_queue_dedupe_window(p_created_at timestamptz)
RETURNS tstzrange
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
AS $$
  SELECT tstzrange(p_created_at, p_created_at + (7 * interval '1 day'), '[)');
$$;

COMMENT ON FUNCTION public._message_queue_dedupe_window(timestamptz) IS
  'Helper IMMUTABLE para a exclusion constraint de dedupe em message_queue. Retorna janela de 7 dias a partir do created_at.';

-- Remove constraint anterior se existir (idempotente)
ALTER TABLE public.message_queue
  DROP CONSTRAINT IF EXISTS message_queue_dedupe_7d_excl;

-- Exclusion constraint atômica
ALTER TABLE public.message_queue
  ADD CONSTRAINT message_queue_dedupe_7d_excl
  EXCLUDE USING gist (
    template_id WITH =,
    recipient_phone WITH =,
    public._message_queue_dedupe_window(created_at) WITH &&
  )
  WHERE (template_id IS NOT NULL AND recipient_phone IS NOT NULL);

COMMENT ON CONSTRAINT message_queue_dedupe_7d_excl ON public.message_queue IS
  'Garante atomicamente que (template_id, recipient_phone) não seja enfileirado 2x em janela de 7 dias. Complementa o check aplicativo em isEnqueueAllowed().';
