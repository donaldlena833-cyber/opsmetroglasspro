# Non-Technical Deploy Checklist

Use this after the latest push to `main`.

## 1. Run the Supabase security migration

1. Open your Supabase project.
2. In the left sidebar, click `SQL Editor`.
3. Click `New query`.
4. Open this file in the repo:
   - `supabase/migrations/003_security_hardening.sql`
5. Copy the entire file contents.
6. Paste it into the SQL Editor.
7. Click `Run`.

What this does:
- fixes the security warnings about the reporting views
- tightens the database policies
- fixes the function warnings
- enables the private receipt flow

If Supabase shows an error, stop there and send me the exact message or a screenshot.

## 2. Make sure the `receipts` bucket is private

1. In Supabase, click `Storage`.
2. Click the `receipts` bucket.
3. Open the bucket settings.
4. Confirm `Public bucket` is turned `OFF`.

The app now uses signed URLs, so receipts do not need to be public.

## 3. Turn on leaked password protection

This warning is not fixed by code. You need to enable it in Supabase Auth.

1. In Supabase, click `Authentication`.
2. Open `Providers` or `Settings` depending on the dashboard layout.
3. Find password security settings.
4. Turn on `Leaked password protection`.

## 4. Check your Vercel environment variables

In Vercel, open the project and confirm these exist:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

If any are missing, add them and redeploy.

## 5. Redeploy the app

1. Open Vercel.
2. Open the `opsmetroglasspro` project.
3. Trigger a new deployment from the latest `main` commit.

## 6. Test these 5 things after deploy

1. Log in.
2. Open `Expenses`.
3. Tap a receipt image and confirm it opens.
4. Open a job with an attached receipt and confirm that image loads there too.
5. In Supabase, re-run the linter/security checks and confirm the fixed warnings are gone.

## If you want the fastest path

Do these in order:

1. Run the SQL migration.
2. Confirm `receipts` is private.
3. Enable leaked password protection.
4. Redeploy on Vercel.
5. Test receipt previews.
