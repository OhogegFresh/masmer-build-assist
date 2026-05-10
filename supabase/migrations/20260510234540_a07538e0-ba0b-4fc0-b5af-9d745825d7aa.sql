-- Backfill calls.customer_id by phone (last 10 digits)
UPDATE public.calls c
SET customer_id = cu.id
FROM public.customers cu
WHERE c.customer_id IS NULL
  AND c.caller_phone IS NOT NULL
  AND cu.phone IS NOT NULL
  AND right(regexp_replace(c.caller_phone, '\D', '', 'g'), 10)
    = right(regexp_replace(cu.phone, '\D', '', 'g'), 10)
  AND length(regexp_replace(c.caller_phone, '\D', '', 'g')) >= 10
  AND length(regexp_replace(cu.phone, '\D', '', 'g')) >= 10;

-- Backfill calls.customer_id by name (still NULL)
UPDATE public.calls c
SET customer_id = cu.id
FROM public.customers cu
WHERE c.customer_id IS NULL
  AND c.caller_name IS NOT NULL
  AND lower(btrim(c.caller_name)) = lower(btrim(cu.name));

-- Backfill projects.customer_id by name
UPDATE public.projects p
SET customer_id = cu.id
FROM public.customers cu
WHERE p.customer_id IS NULL
  AND lower(btrim(p.customer_name)) = lower(btrim(cu.name));

-- Backfill scheduled_jobs.customer_id by name
UPDATE public.scheduled_jobs s
SET customer_id = cu.id
FROM public.customers cu
WHERE s.customer_id IS NULL
  AND lower(btrim(s.customer_name)) = lower(btrim(cu.name));
