
ALTER TABLE public.waitlist_signups
  ADD COLUMN IF NOT EXISTS marketing_consent boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS consent_timestamp timestamptz,
  ADD COLUMN IF NOT EXISTS source text;

ALTER TABLE public.waitlist_signups ALTER COLUMN full_name DROP NOT NULL;
ALTER TABLE public.waitlist_signups ALTER COLUMN business_name DROP NOT NULL;
ALTER TABLE public.waitlist_signups ALTER COLUMN phone DROP NOT NULL;
ALTER TABLE public.waitlist_signups ALTER COLUMN contractor_type DROP NOT NULL;
ALTER TABLE public.waitlist_signups ALTER COLUMN feature_interest DROP NOT NULL;
