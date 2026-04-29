UPDATE public.leads_inbox
SET
  tags = (
    SELECT array_agg(DISTINCT CASE
      WHEN t = 'pre_checkou_lp_2grupoviplf' THEN 'pre_checkout_lp_2grupoviplf'
      ELSE t
    END)
    FROM unnest(tags) AS t
  ),
  updated_at = now()
WHERE 'pre_checkou_lp_2grupoviplf' = ANY(tags)
  AND created_at >= CURRENT_DATE;