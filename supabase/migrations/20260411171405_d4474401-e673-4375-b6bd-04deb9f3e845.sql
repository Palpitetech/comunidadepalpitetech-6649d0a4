-- Update check_trial_limit trigger function
CREATE OR REPLACE FUNCTION public.check_trial_limit()
RETURNS TRIGGER AS $$
DECLARE
  trial_plan_id UUID;
BEGIN
  -- Busca o ID do plano trial usando o slug correto
  SELECT id INTO trial_plan_id FROM public.plans 
  WHERE slug IN ('trial', 'teste-gratis-3-dias') 
  ORDER BY (CASE WHEN slug = 'teste-gratis-3-dias' THEN 1 ELSE 2 END)
  LIMIT 1;
  
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
