-- Allow events without user_id (anonymous leads)
ALTER TABLE public.events
  ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS lead_email text,
  ADD COLUMN IF NOT EXISTS lead_phone text,
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'system';

-- Indexes for the events admin UI and lead lookup
CREATE INDEX IF NOT EXISTS idx_events_type_created
  ON public.events(event_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_events_lead_email
  ON public.events(lead_email)
  WHERE lead_email IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_events_created_at
  ON public.events(created_at DESC);
