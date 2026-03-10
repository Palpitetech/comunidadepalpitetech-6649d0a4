CREATE TABLE public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.perfis(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX index_events_user_id ON public.events (user_id);
CREATE INDEX index_events_type ON public.events (event_type);
CREATE INDEX index_events_created_at ON public.events (created_at);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users have full access"
  ON public.events
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);