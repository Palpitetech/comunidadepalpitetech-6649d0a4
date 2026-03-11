
ALTER TABLE public.community_group_logs
  ADD COLUMN status text NOT NULL DEFAULT 'sent',
  ADD COLUMN scheduled_for timestamptz,
  ADD COLUMN message_generated text,
  ADD COLUMN instance_evolution_id text;
