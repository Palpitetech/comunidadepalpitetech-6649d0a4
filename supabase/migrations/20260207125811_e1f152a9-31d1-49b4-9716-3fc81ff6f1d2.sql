-- Create bot publishing logs table
CREATE TABLE public.bot_publishing_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guide_persona_id UUID NOT NULL REFERENCES public.guide_personas(id) ON DELETE CASCADE,
  bot_name TEXT,
  event_type TEXT NOT NULL, -- 'permission_denied', 'success', 'error', 'skipped'
  reason TEXT,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index for efficient querying
CREATE INDEX idx_bot_publishing_logs_guide_persona_id ON public.bot_publishing_logs(guide_persona_id);
CREATE INDEX idx_bot_publishing_logs_event_type ON public.bot_publishing_logs(event_type);
CREATE INDEX idx_bot_publishing_logs_created_at ON public.bot_publishing_logs(created_at DESC);

-- Enable RLS
ALTER TABLE public.bot_publishing_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Only admins can view logs
CREATE POLICY "Admins can view all publishing logs"
ON public.bot_publishing_logs
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));