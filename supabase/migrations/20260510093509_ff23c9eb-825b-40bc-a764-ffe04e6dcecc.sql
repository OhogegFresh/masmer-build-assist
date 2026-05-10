CREATE TABLE public.demo_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invite_code text NOT NULL UNIQUE,
  invitee_name text,
  invitee_email text,
  invitee_company text,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  activated_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  page_views integer NOT NULL DEFAULT 0,
  last_seen timestamptz
);

ALTER TABLE public.demo_invites ENABLE ROW LEVEL SECURITY;

-- Anyone can look up an invite by code (the code is the secret)
CREATE POLICY "Anyone can view demo invites"
  ON public.demo_invites FOR SELECT
  TO anon, authenticated
  USING (true);

-- Anyone can update tracking fields (page_views, last_seen, activated_at) for their invite
CREATE POLICY "Anyone can update demo invites"
  ON public.demo_invites FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Only admins can insert/delete
CREATE POLICY "Admins can insert demo invites"
  ON public.demo_invites FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete demo invites"
  ON public.demo_invites FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Seed 5 placeholder invites
INSERT INTO public.demo_invites (invite_code, invitee_name) VALUES
  ('demo-alpha-001', 'Friend 1'),
  ('demo-alpha-002', 'Friend 2'),
  ('demo-alpha-003', 'Friend 3'),
  ('demo-alpha-004', 'Friend 4'),
  ('demo-alpha-005', 'Friend 5');