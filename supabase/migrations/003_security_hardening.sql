-- MetroGlassOps Security Hardening
-- Version: 2.2.0
-- Description: Tightens public schema access, fixes mutable search_path warnings,
--              makes reporting views security-invoker, and supports private receipt storage.

CREATE OR REPLACE FUNCTION public.is_internal_user()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SET search_path = public, auth
AS $$
  SELECT auth.uid() IS NOT NULL
    AND COALESCE(LOWER(auth.jwt() ->> 'email'), '') LIKE '%@metroglasspro.com';
$$;

CREATE OR REPLACE FUNCTION public.get_next_invoice_number()
RETURNS INTEGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  next_num INTEGER;
BEGIN
  UPDATE public.invoice_sequence
  SET last_number = last_number + 1
  WHERE id = 1
  RETURNING last_number INTO next_num;

  RETURN next_num;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_monthly_report(report_date DATE)
RETURNS UUID
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  month_start DATE;
  month_end DATE;
  report_id UUID;
  rev NUMERIC(12,2);
  exp NUMERIC(12,2);
  completed INTEGER;
  created INTEGER;
  exp_by_cat JSONB;
  pay_by_method JSONB;
  top_cli JSONB;
BEGIN
  month_start := date_trunc('month', report_date)::DATE;
  month_end := (date_trunc('month', report_date) + INTERVAL '1 month - 1 day')::DATE;

  SELECT COALESCE(SUM(amount), 0) INTO rev
  FROM public.payments
  WHERE date >= month_start AND date <= month_end;

  SELECT COALESCE(SUM(amount), 0) INTO exp
  FROM public.expenses
  WHERE date >= month_start AND date <= month_end;

  SELECT COUNT(*) INTO completed
  FROM public.jobs
  WHERE status = 'closed'
    AND updated_at >= month_start
    AND updated_at <= month_end + INTERVAL '1 day';

  SELECT COUNT(*) INTO created
  FROM public.jobs
  WHERE created_at >= month_start
    AND created_at <= month_end + INTERVAL '1 day';

  SELECT COALESCE(jsonb_object_agg(category, total), '{}'::jsonb) INTO exp_by_cat
  FROM (
    SELECT category::text, SUM(amount) AS total
    FROM public.expenses
    WHERE date >= month_start AND date <= month_end
    GROUP BY category
  ) sub;

  SELECT COALESCE(jsonb_object_agg(method, total), '{}'::jsonb) INTO pay_by_method
  FROM (
    SELECT method::text, SUM(amount) AS total
    FROM public.payments
    WHERE date >= month_start AND date <= month_end
    GROUP BY method
  ) sub;

  SELECT COALESCE(jsonb_agg(client_data), '[]'::jsonb) INTO top_cli
  FROM (
    SELECT jsonb_build_object(
      'client_id', c.id,
      'client_name', c.name,
      'revenue', SUM(p.amount)
    ) AS client_data
    FROM public.payments p
    JOIN public.jobs j ON p.job_id = j.id
    JOIN public.clients c ON j.client_id = c.id
    WHERE p.date >= month_start AND p.date <= month_end
    GROUP BY c.id, c.name
    ORDER BY SUM(p.amount) DESC
    LIMIT 5
  ) sub;

  INSERT INTO public.monthly_reports (
    report_month,
    total_revenue,
    total_expenses,
    net_profit,
    jobs_completed,
    jobs_created,
    expenses_by_category,
    payments_by_method,
    top_clients
  ) VALUES (
    month_start,
    rev,
    exp,
    rev - exp,
    completed,
    created,
    exp_by_cat,
    pay_by_method,
    top_cli
  )
  ON CONFLICT (report_month) DO UPDATE SET
    total_revenue = EXCLUDED.total_revenue,
    total_expenses = EXCLUDED.total_expenses,
    net_profit = EXCLUDED.net_profit,
    jobs_completed = EXCLUDED.jobs_completed,
    jobs_created = EXCLUDED.jobs_created,
    expenses_by_category = EXCLUDED.expenses_by_category,
    payments_by_method = EXCLUDED.payments_by_method,
    top_clients = EXCLUDED.top_clients,
    generated_at = NOW()
  RETURNING id INTO report_id;

  RETURN report_id;
END;
$$;

CREATE OR REPLACE VIEW public.jobs_with_value
WITH (security_invoker = true) AS
SELECT
  j.*,
  COALESCE(SUM(i.total), 0) AS total_invoice_value,
  COUNT(i.id) AS invoice_count
FROM public.jobs j
LEFT JOIN public.invoices i ON j.id = i.job_id
GROUP BY j.id;

CREATE OR REPLACE VIEW public.client_stats
WITH (security_invoker = true) AS
SELECT
  c.id AS client_id,
  c.name AS client_name,
  COUNT(DISTINCT j.id) AS total_jobs,
  COALESCE(SUM(i.total), 0) AS total_invoiced,
  COALESCE(SUM(p.amount), 0) AS total_paid,
  COALESCE(SUM(i.total), 0) - COALESCE(SUM(p.amount), 0) AS outstanding_balance
FROM public.clients c
LEFT JOIN public.jobs j ON c.id = j.client_id
LEFT JOIN public.invoices i ON j.id = i.job_id
LEFT JOIN public.payments p ON j.id = p.job_id
GROUP BY c.id, c.name;

GRANT SELECT ON public.jobs_with_value TO authenticated;
GRANT SELECT ON public.client_stats TO authenticated;

DROP POLICY IF EXISTS "Authenticated users can do everything with clients" ON public.clients;
DROP POLICY IF EXISTS "Full access" ON public.clients;
DROP POLICY IF EXISTS "Internal users can manage clients" ON public.clients;
CREATE POLICY "Internal users can manage clients"
  ON public.clients FOR ALL
  TO authenticated
  USING (public.is_internal_user())
  WITH CHECK (public.is_internal_user());

DROP POLICY IF EXISTS "Authenticated users can do everything with jobs" ON public.jobs;
DROP POLICY IF EXISTS "Full access" ON public.jobs;
DROP POLICY IF EXISTS "Internal users can manage jobs" ON public.jobs;
CREATE POLICY "Internal users can manage jobs"
  ON public.jobs FOR ALL
  TO authenticated
  USING (public.is_internal_user())
  WITH CHECK (public.is_internal_user());

DROP POLICY IF EXISTS "Authenticated users can do everything with expenses" ON public.expenses;
DROP POLICY IF EXISTS "Full access" ON public.expenses;
DROP POLICY IF EXISTS "Internal users can manage expenses" ON public.expenses;
CREATE POLICY "Internal users can manage expenses"
  ON public.expenses FOR ALL
  TO authenticated
  USING (public.is_internal_user())
  WITH CHECK (public.is_internal_user());

DROP POLICY IF EXISTS "Authenticated users can do everything with invoices" ON public.invoices;
DROP POLICY IF EXISTS "Full access" ON public.invoices;
DROP POLICY IF EXISTS "Internal users can manage invoices" ON public.invoices;
CREATE POLICY "Internal users can manage invoices"
  ON public.invoices FOR ALL
  TO authenticated
  USING (public.is_internal_user())
  WITH CHECK (public.is_internal_user());

DROP POLICY IF EXISTS "Authenticated users can do everything with payments" ON public.payments;
DROP POLICY IF EXISTS "Full access" ON public.payments;
DROP POLICY IF EXISTS "Internal users can manage payments" ON public.payments;
CREATE POLICY "Internal users can manage payments"
  ON public.payments FOR ALL
  TO authenticated
  USING (public.is_internal_user())
  WITH CHECK (public.is_internal_user());

DROP POLICY IF EXISTS "Authenticated users can do everything with reminders" ON public.reminders;
DROP POLICY IF EXISTS "Full access" ON public.reminders;
DROP POLICY IF EXISTS "Internal users can manage reminders" ON public.reminders;
CREATE POLICY "Internal users can manage reminders"
  ON public.reminders FOR ALL
  TO authenticated
  USING (public.is_internal_user())
  WITH CHECK (public.is_internal_user());

DROP POLICY IF EXISTS "Authenticated users can manage reports" ON public.monthly_reports;
DROP POLICY IF EXISTS "Full access" ON public.monthly_reports;
DROP POLICY IF EXISTS "Internal users can manage reports" ON public.monthly_reports;
CREATE POLICY "Internal users can manage reports"
  ON public.monthly_reports FOR ALL
  TO authenticated
  USING (public.is_internal_user())
  WITH CHECK (public.is_internal_user());

DROP POLICY IF EXISTS "Users can manage their own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Full access" ON public.user_preferences;
CREATE POLICY "Users can manage their own preferences"
  ON public.user_preferences FOR ALL
  TO authenticated
  USING (public.is_internal_user() AND user_id = auth.uid())
  WITH CHECK (public.is_internal_user() AND user_id = auth.uid());

DROP POLICY IF EXISTS "Authenticated users can read/update invoice sequence" ON public.invoice_sequence;
DROP POLICY IF EXISTS "Full access" ON public.invoice_sequence;
DROP POLICY IF EXISTS "Internal users can manage invoice sequence" ON public.invoice_sequence;
CREATE POLICY "Internal users can manage invoice sequence"
  ON public.invoice_sequence FOR ALL
  TO authenticated
  USING (public.is_internal_user())
  WITH CHECK (public.is_internal_user());

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_tables
    WHERE schemaname = 'public' AND tablename = 'keep_alive'
  ) THEN
    EXECUTE 'ALTER TABLE public.keep_alive ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "Full access" ON public.keep_alive';
    EXECUTE 'DROP POLICY IF EXISTS "Internal users can manage keep_alive" ON public.keep_alive';
    EXECUTE 'CREATE POLICY "Internal users can manage keep_alive" ON public.keep_alive FOR ALL TO authenticated USING (public.is_internal_user()) WITH CHECK (public.is_internal_user())';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_tables
    WHERE schemaname = 'public' AND tablename = 'invoice_counters'
  ) THEN
    EXECUTE 'ALTER TABLE public.invoice_counters ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "Full access" ON public.invoice_counters';
    EXECUTE 'DROP POLICY IF EXISTS "Internal users can manage invoice_counters" ON public.invoice_counters';
    EXECUTE 'CREATE POLICY "Internal users can manage invoice_counters" ON public.invoice_counters FOR ALL TO authenticated USING (public.is_internal_user()) WITH CHECK (public.is_internal_user())';
  END IF;
END
$$;

DROP POLICY IF EXISTS "Authenticated users can upload receipts" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view receipts" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete receipts" ON storage.objects;
DROP POLICY IF EXISTS "Internal users can manage receipt objects" ON storage.objects;
CREATE POLICY "Internal users can manage receipt objects"
  ON storage.objects FOR ALL
  TO authenticated
  USING (bucket_id = 'receipts' AND public.is_internal_user())
  WITH CHECK (bucket_id = 'receipts' AND public.is_internal_user());
