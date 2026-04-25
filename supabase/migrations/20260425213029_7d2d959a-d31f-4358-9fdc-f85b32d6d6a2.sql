-- RPC para o painel admin do "Disparo em Grupos" consultar o status
-- dos jobs de cron (group-blast-prepare e group-blast-send-cron)
CREATE OR REPLACE FUNCTION public.get_group_blast_schedule()
RETURNS TABLE (
  jobid bigint,
  jobname text,
  schedule text,
  active boolean,
  last_ran_at timestamptz,
  next_run_at timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, cron, extensions
AS $$
BEGIN
  -- Apenas admin pode chamar
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores';
  END IF;

  RETURN QUERY
  WITH last_runs AS (
    SELECT
      jrd.jobid,
      max(jrd.start_time) AS last_ran_at
    FROM cron.job_run_details jrd
    GROUP BY jrd.jobid
  )
  SELECT
    j.jobid,
    j.jobname::text,
    j.schedule::text,
    j.active,
    lr.last_ran_at,
    -- Aproximação grosseira da próxima execução baseada no schedule
    CASE
      WHEN j.schedule = '* * * * *'   THEN date_trunc('minute', now()) + interval '1 minute'
      WHEN j.schedule = '0 7 * * *'   THEN
        CASE
          WHEN now() < (date_trunc('day', now() AT TIME ZONE 'UTC') + interval '7 hours') AT TIME ZONE 'UTC'
          THEN (date_trunc('day', now() AT TIME ZONE 'UTC') + interval '7 hours') AT TIME ZONE 'UTC'
          ELSE (date_trunc('day', now() AT TIME ZONE 'UTC') + interval '1 day 7 hours') AT TIME ZONE 'UTC'
        END
      ELSE NULL
    END AS next_run_at
  FROM cron.job j
  LEFT JOIN last_runs lr ON lr.jobid = j.jobid
  WHERE j.jobname IN ('group-blast-prepare', 'group-blast-send-cron')
  ORDER BY j.jobname;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_group_blast_schedule() TO authenticated;