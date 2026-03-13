-- Substituir política permissiva por uma restritiva
DROP POLICY IF EXISTS "Triggers podem inserir events" ON public.events;

CREATE POLICY "Usuarios podem inserir seus proprios events"
  ON public.events
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);