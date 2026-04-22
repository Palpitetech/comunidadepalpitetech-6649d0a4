-- Reagenda o cron job de retargeting de leads pré-checkout para rodar a cada 5 minutos
DO $$
DECLARE
  v_jobid bigint;
  v_command text;
BEGIN
  -- Localiza qualquer job existente que invoque a função process-lead-retargeting
  SELECT jobid, command INTO v_jobid, v_command
  FROM cron.job
  WHERE command ILIKE '%process-lead-retargeting%'
  LIMIT 1;

  IF v_jobid IS NOT NULL THEN
    -- Remove o job antigo (15 min)
    PERFORM cron.unschedule(v_jobid);

    -- Recria com a mesma chamada HTTP, mas a cada 5 minutos
    PERFORM cron.schedule(
      'process-lead-retargeting-every-5min',
      '*/5 * * * *',
      v_command
    );
  END IF;
END $$;