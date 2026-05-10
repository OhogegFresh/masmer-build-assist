-- Link app_users rows to matching authenticated users when the email matches
UPDATE public.app_users au
SET user_id = u.id
FROM auth.users u
WHERE au.user_id IS NULL
  AND lower(au.email) = lower(u.email);

-- Ensure Jacob's admin app user is linked to the authenticated account and active
UPDATE public.app_users au
SET role = 'admin',
    is_active = true,
    full_name = COALESCE(au.full_name, 'Jacob'),
    business_name = COALESCE(au.business_name, '607 The Home Improvement CCS Group'),
    user_id = u.id
FROM auth.users u
WHERE lower(au.email) = 'jacob@casacapsolutions.com'
  AND lower(u.email) = 'jacob@casacapsolutions.com';

-- Ensure the admin role record exists for Jacob after linking
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'admin'::public.app_role
FROM auth.users u
WHERE lower(u.email) = 'jacob@casacapsolutions.com'
ON CONFLICT DO NOTHING;

-- Let signed-in users read their own app profile by user ID or email.
-- This prevents lockouts when an app_users row exists before user_id has been backfilled.
DROP POLICY IF EXISTS "Users view own app_user" ON public.app_users;
CREATE POLICY "Users view own app_user"
ON public.app_users
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  OR lower(email) = lower(auth.jwt() ->> 'email')
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
);