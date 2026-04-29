-- Reagendar o cron de 'prepare' para rodar a cada 30 minutos.
-- O dedup interno (20h por config+slot+grupo) impede duplicações,
-- então execuções múltiplas ao dia só preenchem buracos (slots novos,
-- falhas anteriores, ajustes de config após as 04:00 BRT).
SELECT cron.unschedule('group-blast-prepare');

SELECT cron.schedule(
  'group-blast-prepare',
  '*/30 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://vevuduwmzoucjaqqdfzw.supabase.co/functions/v1/group-blast-send',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZldnVkdXdtem91Y2phcXFkZnp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5MjkyNzMsImV4cCI6MjA4NDUwNTI3M30.bMYRddIQQ3Y2AY9AbH2jfPvUTPrYBjEZdB2dpiLtbh4"}'::jsonb,
    body := '{"action":"prepare"}'::jsonb
  ) AS request_id;
  $$
);

-- Atualizar a função get_group_blast_schedule para entender o novo schedule '*/30 * * * *'
CREATE OR REPLACE FUNCTION public.get_group_blast_schedule()
 RETURNS TABLE(jobid bigint, jobname text, schedule text, active boolean, last_ran_at timestamp with time zone, next_run_at timestamp with time zone)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'cron', 'extensions'
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores';
  END IF;

  RETURN QUERY
  WITH last_runs AS (
    SELECT jrd.jobid, max(jrd.start_time) AS last_ran_at
    FROM cron.job_run_details jrd
    GROUP BY jrd.jobid
  )
  SELECT
    j.jobid,
    j.jobname::text,
    j.schedule::text,
    j.active,
    lr.last_ran_at,
    CASE
      WHEN j.schedule = '* * * * *'    THEN date_trunc('minute', now()) + interval '1 minute'
      WHEN j.schedule = '*/30 * * * *' THEN
        date_trunc('hour', now())
        + (CASE WHEN extract(minute from now())::int < 30 THEN interval '30 minutes' ELSE interval '1 hour' END)
      WHEN j.schedule = '0 7 * * *'    THEN
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
$function$;