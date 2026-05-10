We need to make the app usable for tomorrow’s demo by removing the remaining account/profile/admin friction and giving you a simple, reliable way to get inside.

## What I found
- The backend is healthy.
- `dvpsolutions1@gmail.com` exists in `app_users`, but the login failure is coming from the authentication account/password layer: `Invalid login credentials` means that email/password combination is not valid for an auth login, even though a profile row exists.
- The app still depends on `app_users`, `user_roles`, and admin-only checks in places, which is unnecessary friction for a free demo tool.

## Plan

### 1. Reset login to a simple free-tool flow
- Keep `/login`, `/signup`, `/forgot-password`, and `/reset-password`.
- Make signup the primary path when a password is unknown or an email was only in the old demo/profile table.
- Improve login errors so users know exactly what to do:
  - If password is wrong: show “Password didn’t match. Use Forgot password or create a new free account.”
  - Add a clear button/link: “Create new free account”.
- After successful signup or login, always send users straight to `/dashboard`.

### 2. Stop profile/admin rows from blocking access
- Rewrite `useRequireAuth()` so any valid authenticated session can enter the app.
- Do not block dashboard/projects/customers/planner/settings if `app_users` is missing, loading, inactive, or not linked.
- Keep profile data only for display, not for route access.
- This prevents the “stuck loading / cannot get inside” problem.

### 3. Remove current admin users and old role dependence
- Delete existing rows from `user_roles` and `app_users` so you can start fresh.
- Do not delete real authentication accounts directly from code; instead, the app will no longer depend on those rows for access.
- Remove/hide the Admin Panel link from the app shell for now.
- Change `/admin` into a non-critical internal status page or redirect it to `/dashboard` so it cannot block work.

### 4. Make signup self-healing
- When someone signs up, create their profile row if possible, but do not fail the signup if profile creation fails.
- If the email already has an old profile row, update/link it instead of creating duplicates.
- If email confirmation is still required, the app will show a clear confirmation message; if you want instant access for tomorrow’s demo, I will enable auto-confirm email signups now.

### 5. Verify the login path
- Test that a new free account can sign up and reach `/dashboard`.
- Test that an existing account with wrong password gets a clear error and can use password reset.
- Test that dashboard loads even with no `app_users` or admin roles.

## Recommended demo workflow for tomorrow
Use `/signup` with a fresh email/password you control. If you already used `dvpsolutions1@gmail.com` and don’t know the actual auth password, use `/forgot-password` or sign up with a different email.

## Technical changes
- Edit `src/components/masmer/useRequireAuth.ts` to only require `session`.
- Edit `src/components/masmer/AuthContext.tsx` to make profile loading optional/non-blocking.
- Edit `src/routes/login.tsx` and `src/routes/signup.tsx` for clearer flow and resilient profile handling.
- Edit `src/components/masmer/AppShell.tsx` to remove Admin Panel role dependency.
- Edit or simplify `src/routes/admin.tsx` so it no longer matters for the demo.
- Run a data cleanup for `app_users` and `user_roles`.
- Optionally configure authentication so email signups are auto-confirmed for instant demo access.