# Convert Masmer AI to a Free Open-Signup Tool

Big refactor. Removes the demo/access-request/invite gating layer, replaces it with standard email+password signup that grants instant access to all app routes. Admin role still gates `/admin`.

## Backup note
I can't create a GitHub branch from here — Git is managed by Lovable. Please pin the current version in **History** (button above) before approving. You can restore from there anytime.

---

## Part 1 — Auth simplification

**Delete (files):**
- `src/routes/request-access.tsx`
- `src/routes/demo..tsx` (demo invite landing)
- `src/routes/setup-admin.tsx`
- `src/components/masmer/DemoContext.tsx`
- `supabase/functions/ensure-demo-user/`
- `supabase/functions/setup-admin/`
- `supabase/functions/send-access-request-email/`
- `supabase/functions/approve-access-request/`
- `supabase/functions/test-email/` (no longer needed)

**Rewrite:**
- `src/components/masmer/useRequireAuth.ts` — remove demo branch; only check session + `is_active`. `adminOnly` still checks `role === 'admin'`.
- `src/routes/__root.tsx` — remove `DemoProvider` wrapper if present.
- `src/routes/login.tsx` — clean login form (see Part 2).
- `supabase/config.toml` — drop deleted function blocks.

**New:**
- `src/routes/signup.tsx` — full name, email, password, confirm. On submit:
  1. `supabase.auth.signUp({ email, password, options: { data: { full_name } } })`
  2. Insert `app_users` row (`role: 'user'`, `is_active: true`) via a new edge function `create-user-profile` (uses service role to bypass RLS since INSERT is admin-only).
  3. Trigger `send-welcome-email`.
  4. Sign in + redirect to `/dashboard`.
- `src/routes/forgot-password.tsx` — calls `supabase.auth.resetPasswordForEmail`.
- `src/routes/reset-password.tsx` — handles `type=recovery`, calls `updateUser({ password })`.
- `supabase/functions/create-user-profile/index.ts` — service-role insert into `app_users`.

**RLS change (migration):** Allow self-insert into `app_users` so signup works without an edge function — simpler. Policy: `INSERT WITH CHECK (auth.uid() IS NOT NULL AND email = auth.jwt() ->> 'email')`. This removes the need for the `create-user-profile` function.

## Part 2 — Login page UI

Centered card, max-w 400px, navy bg, orange accents:
- Logo
- "Welcome back" — Clash Display 700 / 32px
- Email + password (with show/hide eye toggle)
- "Sign In" full-width orange
- "Forgot password?" link → `/forgot-password`
- Divider "— or —"
- "Create free account →" ghost button → `/signup`
- Footer: "Free to use • No credit card required" / "Questions? jacob@casacapsolutions.com"
- "← Back to site" link

No `?team=true` gate. No demo button. No public credentials.

## Part 3 — Welcome email

Rewrite `supabase/functions/send-welcome-email/index.ts`:
- Remove auto-provision logic (signup creates the user now).
- Just sends the welcome email + admin notification.
- Subject: "Welcome to Masmer AI 🏠"
- Plain branded HTML with bullet list, login link to `https://masmer.pro/login`.
- From: `Masmer AI <onboarding@resend.dev>` (note in code that this switches to `hello@masmer.pro` once DNS verifies).

## Part 4 — Landing page

- `Hero.tsx` — replace subtitle with the free-tool copy; CTA buttons → `/signup`.
- `EstimatingBot.tsx` — "Try the Estimating Bot Free" → `/signup`.
- `Pricing.tsx` — CTAs → `/signup`.
- `Waitlist.tsx` — replace entire component with a 3-field inline signup (name/email/password) that creates the account and redirects to `/dashboard`. Rename to `FreeSignup.tsx` and update import in `routes/index.tsx`.
- Remove waitlist/coming-soon language anywhere it appears.

## Part 5 — Admin + password reset

**Migration:**
- Idempotent SQL: ensure `app_users` row for `jacob@casacapsolutions.com` exists with `role='admin'`, `is_active=true`, full_name='Jacob', business_name='607 The Home Improvement CCS Group'. Backfill `user_id` if a matching `auth.users` row exists.
- Add `user_roles` row with `role='admin'` for that user_id (so `has_role()` works).
- Add the new self-signup INSERT policy on `app_users`.

**Auth user creation:** I can't create the auth user via SQL migration (auth.users is managed). If the auth user doesn't already exist, you'll create it by:
- Going to `/signup` and signing up with `jacob@casacapsolutions.com` + a password you choose, OR
- Using "Forgot password" if the auth user already exists.
The migration ensures the `app_users`/`user_roles` rows are correct either way.

**Forgot/reset password:** Standard Supabase flow with the two new routes above.

---

## Files touched (summary)

**Deleted:** 4 routes, 5 edge functions, 1 context.
**New:** 3 routes (signup, forgot-password, reset-password), 0 edge functions (using new RLS policy instead).
**Edited:** login.tsx, useRequireAuth.ts, __root.tsx, Hero.tsx, EstimatingBot.tsx, Pricing.tsx, Waitlist→FreeSignup.tsx, send-welcome-email/index.ts, supabase/config.toml.
**Migration:** 1 (RLS policy + admin row backfill).

## Open questions
None — copy and behavior fully specified. Approve and I'll execute end-to-end.
