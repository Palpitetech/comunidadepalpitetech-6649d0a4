-- Add INSERT and UPDATE policies for service role on bot_publishing_logs
CREATE POLICY "Service role can insert publishing logs"
ON public.bot_publishing_logs
FOR INSERT
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can update publishing logs"
ON public.bot_publishing_logs
FOR UPDATE
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');