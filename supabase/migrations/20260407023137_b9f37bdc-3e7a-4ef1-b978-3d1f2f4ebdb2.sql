-- Add priority column to message_queue
ALTER TABLE public.message_queue
ADD COLUMN priority integer NOT NULL DEFAULT 0;

-- Index for efficient queue ordering (priority DESC, scheduled_at ASC)
CREATE INDEX idx_message_queue_priority_scheduled
ON public.message_queue (status, priority DESC, scheduled_at ASC)
WHERE status = 'pending';