UPDATE public.guide_personas 
SET post_schedule = '{"dias": [0,1,2,3,4,5,6], "horarios": ["09:00","10:00","11:00","14:00","16:00"], "tipo_por_horario": {"09:00":"analise_ciclo","10:00":"analise_movimentacao","11:00":"analise_pares_impares","14:00":"analise_repetidas","16:00":"analise_moldura"}}'::jsonb
WHERE id = '2a827e7d-a3d1-416e-8552-e830dc7e633c';