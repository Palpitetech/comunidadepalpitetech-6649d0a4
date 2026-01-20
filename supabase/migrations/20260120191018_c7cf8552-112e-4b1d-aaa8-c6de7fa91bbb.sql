-- Reaplica somente o necessário para notificações (sem mexer em extensões pg_cron/pg_net)

-- 1) Adiciona email ao perfil (espelho do email de login)
ALTER TABLE public.perfis
ADD COLUMN IF NOT EXISTS email text;

-- 2) Atualiza função de criação de perfil/role no signup para preencher o email no perfil
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.perfis (id, nome, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email),
    NEW.email
  );

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');

  RETURN NEW;
END;
$$;

-- 3) View: usuários notificáveis para "resultado_novo" (premium OU user em teste <= 15 dias)
CREATE OR REPLACE VIEW public.usuarios_notificaveis_hoje AS
SELECT
  p.id,
  p.nome,
  p.celular,
  p.email,
  ur.role,
  p.created_at,
  (p.created_at >= (timezone('utc'::text, now()) - interval '15 days')) AS esta_no_periodo_teste,
  p.email_verificado,
  p.celular_verificado
FROM public.perfis p
JOIN public.user_roles ur ON p.id = ur.user_id
WHERE
  ur.role = 'premium'
  OR (
    ur.role = 'user'
    AND p.created_at >= (timezone('utc'::text, now()) - interval '15 days')
  );
