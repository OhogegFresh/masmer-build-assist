
-- Allow self-signup into app_users
DROP POLICY IF EXISTS "Users can self-insert app_user" ON public.app_users;
CREATE POLICY "Users can self-insert app_user"
ON public.app_users
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL
  AND email = (auth.jwt() ->> 'email')
  AND role = 'user'
);

-- Backfill admin row (idempotent)
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = 'jacob@casacapsolutions.com' LIMIT 1;

  IF EXISTS (SELECT 1 FROM public.app_users WHERE lower(email) = 'jacob@casacapsolutions.com') THEN
    UPDATE public.app_users
    SET role = 'admin',
        is_active = true,
        full_name = COALESCE(full_name, 'Jacob'),
        business_name = COALESCE(business_name, '607 The Home Improvement CCS Group'),
        user_id = COALESCE(user_id, v_user_id)
    WHERE lower(email) = 'jacob@casacapsolutions.com';
  ELSE
    INSERT INTO public.app_users (email, full_name, business_name, role, is_active, user_id)
    VALUES ('jacob@casacapsolutions.com', 'Jacob', '607 The Home Improvement CCS Group', 'admin', true, v_user_id);
  END IF;

  IF v_user_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (v_user_id, 'admin'::app_role)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;
