-- Marca todos os 224 usuários existentes (não-bot) como verificados
-- para zerar o contador de "pendentes" a partir de hoje.
UPDATE public.perfis
SET email_verificado = true
WHERE email_verificado = false
  AND is_bot = false;