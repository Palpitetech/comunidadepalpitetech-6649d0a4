-- Função para o painel admin saber o cronograma do retargeting
CREATE OR REPLACE FUNCTION public.get_lead_retargeting_schedule()
RETURNS TABLE (
  jobid bigint,
  jobname text,
  schedule text,
  active boolean,
  last_ran_at timestamptz,
  next_run_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, cron, extensions
AS $$
DECLARE
  v_job RECORD;
  v_last timestamptz;
  v_next timestamptz;
  v_step_min int;
BEGIN
  -- Apenas admins podem ler
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;

  SELECT j.jobid, j.jobname, j.schedule, j.active
    INTO v_job
  FROM cron.job j
  WHERE j.command ILIKE '%process-lead-retargeting%'
  LIMIT 1;

  IF v_job IS NULL THEN
    RETURN;
  END IF;

  -- Última execução conhecida (preferimos a tabela própria; fallback p/ cron.job_run_details)
  SELECT MAX(r.ran_at) INTO v_last
  FROM public.lead_retargeting_runs r;

  IF v_last IS NULL THEN
    BEGIN
      SELECT MAX(d.start_time) INTO v_last
      FROM cron.job_run_details d
      WHERE d.jobid = v_job.jobid;
    EXCEPTION WHEN OTHERS THEN
      v_last := NULL;
    END;
  END IF;

  -- Calcula próxima execução assumindo schedules do tipo "*/N * * * *"
  v_step_min := NULLIF(regexp_replace(v_job.schedule, '^\*/(\d+).*$', '\1'), v_job.schedule)::int;

  IF v_step_min IS NOT NULL AND v_step_min > 0 THEN
    -- próximo múltiplo de v_step_min a partir de agora (UTC)
    v_next := date_trunc('hour', now())
      + (ceil((extract(minute FROM now()) + extract(second FROM now())/60.0) / v_step_min) * v_step_min) * interval '1 minute';
    IF v_next <= now() THEN
      v_next := v_next + (v_step_min || ' minutes')::interval;
    END IF;
  ELSE
    v_next := NULL;
  END IF;

  jobid := v_job.jobid;
  jobname := v_job.jobname;
  schedule := v_job.schedule;
  active := v_job.active;
  last_ran_at := v_last;
  next_run_at := v_next;
  RETURN NEXT;
END;
$$;

REVOKE ALL ON FUNCTION public.get_lead_retargeting_schedule() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_lead_retargeting_schedule() TO authenticated;