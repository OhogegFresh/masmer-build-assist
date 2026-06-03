-- calls: remove anon access (inserts come via edge function with service role)
DROP POLICY IF EXISTS "Anyone can insert calls" ON public.calls;
DROP POLICY IF EXISTS "Anyone can view calls" ON public.calls;

-- company_settings: remove all anon policies
DROP POLICY IF EXISTS "Anyone can insert settings" ON public.company_settings;
DROP POLICY IF EXISTS "Anyone can update settings" ON public.company_settings;
DROP POLICY IF EXISTS "Anyone can view settings" ON public.company_settings;

-- demo_invites: restrict UPDATE to admins (was USING true / WITH CHECK true)
DROP POLICY IF EXISTS "Anyone can update demo invites" ON public.demo_invites;
CREATE POLICY "Admins update demo invites"
  ON public.demo_invites
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- storage: company-logos writes require authentication
DROP POLICY IF EXISTS "Anyone can upload company logos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update company logos" ON storage.objects;

CREATE POLICY "Authenticated upload company logos"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'company-logos');

CREATE POLICY "Authenticated update company logos"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'company-logos');

CREATE POLICY "Authenticated delete company logos"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'company-logos');

-- SECURITY DEFINER hardening
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;