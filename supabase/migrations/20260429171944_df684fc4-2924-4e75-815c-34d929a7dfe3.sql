UPDATE public.message_queue
SET status = 'pending', error_message = NULL, retry_count = 0, scheduled_at = NOW()
WHERE id IN (
  'fa0ac564-4d4a-4f78-8115-28d11d018b80',
  'a3c38ff5-06c5-41f0-8c54-d69af2e7c3ab',
  '381a40c6-fc3b-4f4a-9f2b-4e954ca7ff2d',
  '4962fb83-341e-4762-adc0-d2e8d64a0bfc'
);