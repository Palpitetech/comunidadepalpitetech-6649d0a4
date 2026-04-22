-- Tabela de pool de proxies
CREATE TABLE public.whatsapp_proxies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  protocol text NOT NULL DEFAULT 'socks5' CHECK (protocol IN ('socks5', 'http', 'https')),
  host text NOT NULL,
  port integer NOT NULL CHECK (port > 0 AND port <= 65535),
  username text,
  password text,
  status text NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'in_use', 'disabled')),
  instance_id uuid UNIQUE REFERENCES public.whatsapp_instances(id) ON DELETE SET NULL,
  assigned_at timestamptz,
  last_health_check_at timestamptz,
  external_ip text,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_whatsapp_proxies_status ON public.whatsapp_proxies(status);
CREATE INDEX idx_whatsapp_proxies_instance ON public.whatsapp_proxies(instance_id) WHERE instance_id IS NOT NULL;

-- Trigger updated_at
CREATE TRIGGER trg_whatsapp_proxies_updated_at
BEFORE UPDATE ON public.whatsapp_proxies
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS: somente admins
ALTER TABLE public.whatsapp_proxies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins podem ver proxies"
ON public.whatsapp_proxies
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins podem inserir proxies"
ON public.whatsapp_proxies
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins podem atualizar proxies"
ON public.whatsapp_proxies
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins podem excluir proxies"
ON public.whatsapp_proxies
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Função: reserva atômica de proxy
CREATE OR REPLACE FUNCTION public.claim_proxy_for_instance(p_instance_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing record;
  v_picked record;
BEGIN
  IF p_instance_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'instance_id obrigatório');
  END IF;

  -- Idempotente: se a instância já tem proxy, retorna ele
  SELECT id, label, protocol, host, port, username, password
    INTO v_existing
  FROM public.whatsapp_proxies
  WHERE instance_id = p_instance_id
    AND status = 'in_use'
  LIMIT 1;

  IF v_existing.id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', true,
      'reused', true,
      'proxy', jsonb_build_object(
        'id', v_existing.id,
        'label', v_existing.label,
        'protocol', v_existing.protocol,
        'host', v_existing.host,
        'port', v_existing.port,
        'username', v_existing.username,
        'password', v_existing.password
      )
    );
  END IF;

  -- Pega o primeiro proxy disponível (atômico via SKIP LOCKED)
  SELECT id, label, protocol, host, port, username, password
    INTO v_picked
  FROM public.whatsapp_proxies
  WHERE status = 'available'
  ORDER BY created_at ASC
  LIMIT 1
  FOR UPDATE SKIP LOCKED;

  IF v_picked.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'no_proxy_available');
  END IF;

  UPDATE public.whatsapp_proxies
  SET status = 'in_use',
      instance_id = p_instance_id,
      assigned_at = now(),
      updated_at = now()
  WHERE id = v_picked.id;

  RETURN jsonb_build_object(
    'success', true,
    'reused', false,
    'proxy', jsonb_build_object(
      'id', v_picked.id,
      'label', v_picked.label,
      'protocol', v_picked.protocol,
      'host', v_picked.host,
      'port', v_picked.port,
      'username', v_picked.username,
      'password', v_picked.password
    )
  );
END;
$$;

-- Função: liberar proxy de uma instância
CREATE OR REPLACE FUNCTION public.release_proxy_for_instance(p_instance_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  IF p_instance_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'instance_id obrigatório');
  END IF;

  UPDATE public.whatsapp_proxies
  SET status = 'available',
      instance_id = NULL,
      assigned_at = NULL,
      updated_at = now()
  WHERE instance_id = p_instance_id;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN jsonb_build_object('success', true, 'released', v_count);
END;
$$;