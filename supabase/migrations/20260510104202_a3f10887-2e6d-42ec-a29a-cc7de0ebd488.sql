CREATE TABLE public.scheduled_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  customer_name text NOT NULL,
  job_address text,
  job_type text,
  scheduled_date date NOT NULL DEFAULT CURRENT_DATE,
  start_time time NOT NULL DEFAULT '09:00',
  duration_minutes integer NOT NULL DEFAULT 120,
  assigned_to text,
  notes text,
  status text NOT NULL DEFAULT 'scheduled',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.scheduled_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view scheduled_jobs" ON public.scheduled_jobs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert scheduled_jobs" ON public.scheduled_jobs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update scheduled_jobs" ON public.scheduled_jobs FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete scheduled_jobs" ON public.scheduled_jobs FOR DELETE TO authenticated USING (true);

INSERT INTO public.scheduled_jobs (customer_name, job_address, job_type, scheduled_date, start_time, duration_minutes, status) VALUES
('Sarah Johnson', '142 Oak Street, Binghamton NY', 'Kitchen Renovation - Check In', CURRENT_DATE, '09:00', 120, 'scheduled'),
('Mike Rodriguez', '89 Elm Ave, Endicott NY', 'Siding Estimate', CURRENT_DATE, '11:30', 90, 'scheduled'),
('Williams Family', '334 Pine Road, Vestal NY', 'Final Walk Through', CURRENT_DATE, '14:00', 60, 'scheduled');