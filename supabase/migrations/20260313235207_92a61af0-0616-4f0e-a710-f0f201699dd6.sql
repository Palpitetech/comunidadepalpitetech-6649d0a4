-- Recriar view como SECURITY INVOKER para respeitar RLS do caller
DROP VIEW IF EXISTS public.usuarios_notificaveis_hoje;

CREATE VIEW public.usuarios_notificaveis_hoje
WITH (security_invoker = true)
AS
SELECT p.id,
    p.nome,
    p.celular,
    p.email,
    ur.role,
    p.created_at,
    p.created_at >= (timezone('utc'::text, now()) - '15 days'::interval) AS esta_no_periodo_teste,
    p.email_verificado,
    p.celular_verificado
   FROM perfis p
     JOIN user_roles ur ON p.id = ur.user_id
  WHERE ur.role = 'premium'::app_role OR (ur.role = 'user'::app_role AND p.created_at >= (timezone('utc'::text, now()) - '15 days'::interval));