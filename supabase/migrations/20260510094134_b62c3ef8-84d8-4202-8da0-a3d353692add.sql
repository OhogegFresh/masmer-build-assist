-- Calls table for AI receptionist logs
CREATE TABLE public.calls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  caller_name text,
  caller_phone text,
  call_duration integer DEFAULT 0,
  ai_summary text,
  job_type text,
  job_address text,
  estimated_budget text,
  lead_status text DEFAULT 'new',
  lead_score integer DEFAULT 0,
  transcript text
);

ALTER TABLE public.calls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view calls" ON public.calls FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert calls" ON public.calls FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update calls" ON public.calls FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete calls" ON public.calls FOR DELETE TO authenticated USING (true);
-- Allow demo (anon) users to view sample calls
CREATE POLICY "Anyone can view calls" ON public.calls FOR SELECT TO anon USING (true);
CREATE POLICY "Anyone can insert calls" ON public.calls FOR INSERT TO anon WITH CHECK (true);

-- Company settings (single-tenant config)
CREATE TABLE public.company_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  company_name text,
  license_number text,
  phone text,
  email text,
  address text,
  logo_url text,
  default_deposit numeric DEFAULT 0,
  default_general_conditions text,
  default_disclaimer text,
  notify_call_email boolean DEFAULT true,
  notify_lead_whatsapp boolean DEFAULT false,
  notify_payment_reminders boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view settings" ON public.company_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert settings" ON public.company_settings FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update settings" ON public.company_settings FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Anyone can view settings" ON public.company_settings FOR SELECT TO anon USING (true);
CREATE POLICY "Anyone can insert settings" ON public.company_settings FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anyone can update settings" ON public.company_settings FOR UPDATE TO anon USING (true);

CREATE TRIGGER company_settings_updated_at
  BEFORE UPDATE ON public.company_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Logo storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('company-logos', 'company-logos', true)
  ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public can read company logos" ON storage.objects FOR SELECT
  USING (bucket_id = 'company-logos');
CREATE POLICY "Anyone can upload company logos" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'company-logos');
CREATE POLICY "Anyone can update company logos" ON storage.objects FOR UPDATE
  USING (bucket_id = 'company-logos');