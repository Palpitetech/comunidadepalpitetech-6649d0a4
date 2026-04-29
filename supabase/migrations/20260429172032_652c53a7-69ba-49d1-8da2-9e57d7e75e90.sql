UPDATE public.message_queue
SET status = 'pending',
    error_message = NULL,
    retry_count = 0,
    sent_at = NULL,
    instance_id = NULL,
    scheduled_at = NOW()
WHERE id IN (
  '4962fb83-341e-4762-adc0-d2e8d64a0bfc',
  '381a40c6-fc3b-4f4a-9f2b-4e954ca7ff2d'
);