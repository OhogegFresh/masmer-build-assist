ALTER TABLE public.waitlist_signups
  ADD COLUMN IF NOT EXISTS demo_access boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS demo_expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  ADD COLUMN IF NOT EXISTS demo_link text NOT NULL DEFAULT 'https://masmer-build-assist.lovable.app/estimate';

CREATE POLICY "Admins update signups"
ON public.waitlist_signups
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));