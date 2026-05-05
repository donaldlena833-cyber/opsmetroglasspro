-- MetroGlassOps: Restore internal-user email-domain gate
-- Version: 2.2.1
-- Description: 003_security_hardening.sql relaxed is_internal_user() to a bare
--              `auth.uid() IS NOT NULL` check, which made every authenticated
--              Supabase account effectively an internal admin against the RLS
--              policies on clients/jobs/invoices/payments/expenses/reminders/
--              monthly_reports/invoice_sequence and the receipts storage
--              bucket. This restores the email-domain check so only
--              @metroglasspro.com accounts pass.

CREATE OR REPLACE FUNCTION public.is_internal_user()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SET search_path = public, auth
AS $$
  SELECT auth.uid() IS NOT NULL
    AND COALESCE(LOWER(auth.jwt() ->> 'email'), '') LIKE '%@metroglasspro.com';
$$;
