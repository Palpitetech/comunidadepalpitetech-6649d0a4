
CREATE OR REPLACE FUNCTION public.count_sequences(arr integer[])
RETURNS integer
LANGUAGE plpgsql IMMUTABLE
SET search_path = public
AS $$
DECLARE
  sorted integer[];
  seq_count integer := 0;
  i integer;
BEGIN
  sorted := (SELECT array_agg(x ORDER BY x) FROM unnest(arr) x);
  IF array_length(sorted, 1) IS NULL OR array_length(sorted, 1) < 2 THEN
    RETURN 0;
  END IF;
  FOR i IN 2..array_length(sorted, 1) LOOP
    IF sorted[i] = sorted[i-1] + 1 THEN
      seq_count := seq_count + 1;
    END IF;
  END LOOP;
  RETURN seq_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.count_array_overlap(a integer[], b integer[])
RETURNS integer
LANGUAGE sql IMMUTABLE
SET search_path = public
AS $$
  SELECT count(*)::integer FROM unnest(a) x WHERE x = ANY(b);
$$;
