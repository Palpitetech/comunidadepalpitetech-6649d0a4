
CREATE TABLE public.community_group_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES public.postagens(id) ON DELETE SET NULL,
  instance_id uuid REFERENCES public.whatsapp_instances(id) ON DELETE SET NULL,
  message_sent text,
  sent_at timestamptz DEFAULT now()
);

ALTER TABLE public.community_group_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins podem gerenciar community_group_logs"
  ON public.community_group_logs
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role acesso community_group_logs"
  ON public.community_group_logs
  FOR ALL
  TO public
  USING (auth.role() = 'service_role'::text)
  WITH CHECK (auth.role() = 'service_role'::text);
