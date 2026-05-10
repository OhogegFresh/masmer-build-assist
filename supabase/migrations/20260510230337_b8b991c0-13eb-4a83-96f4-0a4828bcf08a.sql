-- calls.customer_id
ALTER TABLE public.calls
  ADD COLUMN IF NOT EXISTS customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL;

-- scheduled_jobs.customer_id
ALTER TABLE public.scheduled_jobs
  ADD COLUMN IF NOT EXISTS customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL;

-- projects.customer_id already exists; ensure FK constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'projects_customer_id_fkey'
  ) THEN
    ALTER TABLE public.projects
      ADD CONSTRAINT projects_customer_id_fkey
      FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_calls_customer_id ON public.calls(customer_id);
CREATE INDEX IF NOT EXISTS idx_projects_customer_id ON public.projects(customer_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_jobs_customer_id ON public.scheduled_jobs(customer_id);