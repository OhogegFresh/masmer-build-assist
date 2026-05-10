-- Projects table
CREATE TABLE public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text,
  customer_name text NOT NULL,
  customer_address text,
  project_title text NOT NULL,
  status text NOT NULL DEFAULT 'new',
  progress_pct integer NOT NULL DEFAULT 0,
  contract_total numeric NOT NULL DEFAULT 0,
  deposit numeric NOT NULL DEFAULT 0,
  deposit_paid boolean NOT NULL DEFAULT false,
  payment1_paid boolean NOT NULL DEFAULT false,
  payment2_paid boolean NOT NULL DEFAULT false,
  payment3_paid boolean NOT NULL DEFAULT false,
  final_paid boolean NOT NULL DEFAULT false,
  scope_of_work text,
  punchlist_items text[] NOT NULL DEFAULT '{}',
  notes text,
  customer_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view projects" ON public.projects FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert projects" ON public.projects FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update projects" ON public.projects FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete projects" ON public.projects FOR DELETE TO authenticated USING (true);

-- Customers table
CREATE TABLE public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text,
  phone text,
  email text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view customers" ON public.customers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert customers" ON public.customers FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update customers" ON public.customers FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete customers" ON public.customers FOR DELETE TO authenticated USING (true);

-- Project photos table
CREATE TABLE public.project_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  url text NOT NULL,
  caption text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.project_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view project_photos" ON public.project_photos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert project_photos" ON public.project_photos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update project_photos" ON public.project_photos FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete project_photos" ON public.project_photos FOR DELETE TO authenticated USING (true);

-- updated_at trigger for projects
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER projects_set_updated_at
BEFORE UPDATE ON public.projects
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Storage bucket for project photos
INSERT INTO storage.buckets (id, name, public) VALUES ('project-photos', 'project-photos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read project photos" ON storage.objects FOR SELECT USING (bucket_id = 'project-photos');
CREATE POLICY "Authenticated upload project photos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'project-photos');
CREATE POLICY "Authenticated update project photos" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'project-photos');
CREATE POLICY "Authenticated delete project photos" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'project-photos');