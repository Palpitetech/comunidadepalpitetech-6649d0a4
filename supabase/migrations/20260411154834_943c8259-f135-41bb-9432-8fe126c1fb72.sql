-- Inserir o plano Trial se não existir
INSERT INTO public.plans (name, slug, price, features, is_active, display_order)
VALUES (
  'Trial (3 dias)', 
  'trial', 
  0.00, 
  '{"gerador": true, "fechamento": true, "desdobramento": true, "estatisticas": true, "quentes_frias": true, "ciclos": true, "tendencias": true, "linhas_colunas": true, "tabela_movimentacao": true, "frequencia_dezenas": true, "dezenas_por_posicao": true, "analise_do_dia": true, "comunidade_full": true, "guias": true, "notificacoes_push": true, "notificacoes_email": true, "notificacoes_sms": true, "chat_boloes": true, "chat_duvidas_ferramentas": true, "chat_duvidas_comunidade": true, "chat_acesso_ferramentas": true, "chat_estatisticas": true, "palpites_salvos": true}',
  true,
  -1 -- Menor ordem para aparecer primeiro se necessário
) ON CONFLICT (slug) DO UPDATE 
SET features = EXCLUDED.features, 
    price = EXCLUDED.price,
    name = EXCLUDED.name;

-- Função para validar e marcar uso de trial
CREATE OR REPLACE FUNCTION public.check_trial_limit()
RETURNS TRIGGER AS $$
DECLARE
  trial_plan_id UUID;
BEGIN
  -- Busca o ID do plano trial
  SELECT id INTO trial_plan_id FROM public.plans WHERE slug = 'trial' LIMIT 1;
  
  -- Se está tentando mudar para o plano trial
  IF NEW.plan_id = trial_plan_id THEN
    -- Se já usou o trial antes (e não é apenas uma renovação do mesmo plano trial por algum motivo)
    IF OLD.trial_used = true AND (OLD.plan_id IS NULL OR OLD.plan_id != trial_plan_id) THEN
      RAISE EXCEPTION 'Usuário já utilizou o período de teste.';
    END IF;
    
    -- Marca como usado
    NEW.trial_used := true;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para aplicar a regra de 1 trial por usuário
DROP TRIGGER IF EXISTS trg_check_trial_limit ON public.perfis;
CREATE TRIGGER trg_check_trial_limit
BEFORE UPDATE ON public.perfis
FOR EACH ROW
EXECUTE FUNCTION public.check_trial_limit();
