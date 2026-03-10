
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Authenticated users have full access" ON public.events;

-- Admins can read all events
CREATE POLICY "Admins podem ler events"
  ON public.events
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Service role can insert events (for edge functions)
CREATE POLICY "Service role pode inserir events"
  ON public.events
  FOR INSERT
  TO public
  WITH CHECK (auth.role() = 'service_role');

-- Allow postgres/trigger inserts (handle_new_user is SECURITY DEFINER)
CREATE POLICY "Triggers podem inserir events"
  ON public.events
  FOR INSERT
  TO authenticated
  WITH CHECK (true);
