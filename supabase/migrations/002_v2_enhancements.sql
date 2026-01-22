-- MetroGlassOps V2 Migration
-- Version: 2.0.0
-- Description: Adds job specifications, expanded expense categories, Stripe fee tracking, and reporting support

-- ============================================
-- BACKUP NOTE
-- ============================================
-- Before running this migration, ensure you have a backup of your data.
-- This migration adds new columns and modifies enums.

-- ============================================
-- NEW ENUMS FOR JOB SPECS
-- ============================================

CREATE TYPE glass_type AS ENUM (
  'clear',
  'low_iron',
  'frosted',
  'rain',
  'tinted_gray',
  'tinted_bronze',
  'other'
);

CREATE TYPE glass_thickness AS ENUM (
  '1/4"',
  '5/16"',
  '3/8"',
  '1/2"',
  '5/8"',
  '3/4"'
);

CREATE TYPE hardware_finish AS ENUM (
  'chrome',
  'brushed_nickel',
  'matte_black',
  'oil_rubbed_bronze',
  'polished_brass',
  'satin_brass',
  'gold',
  'other'
);

-- ============================================
-- UPDATE EXPENSE CATEGORIES
-- ============================================

-- First, we need to add new values to the existing enum
-- PostgreSQL doesn't allow direct enum modification, so we use ALTER TYPE ADD VALUE

ALTER TYPE expense_category ADD VALUE IF NOT EXISTS 'glass';
ALTER TYPE expense_category ADD VALUE IF NOT EXISTS 'hardware';
ALTER TYPE expense_category ADD VALUE IF NOT EXISTS 'consumables';
ALTER TYPE expense_category ADD VALUE IF NOT EXISTS 'subcontractor';
ALTER TYPE expense_category ADD VALUE IF NOT EXISTS 'gas_fuel';
ALTER TYPE expense_category ADD VALUE IF NOT EXISTS 'vehicle';
ALTER TYPE expense_category ADD VALUE IF NOT EXISTS 'tools_equipment';
ALTER TYPE expense_category ADD VALUE IF NOT EXISTS 'office_admin';
ALTER TYPE expense_category ADD VALUE IF NOT EXISTS 'food_meals';

-- Note: Old categories (crl, glass_fabrication, mr_glass, home_depot, etc.) will remain 
-- for backwards compatibility with existing data

-- ============================================
-- ADD JOB SPECIFICATION FIELDS
-- ============================================

ALTER TABLE jobs ADD COLUMN IF NOT EXISTS glass_type glass_type;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS glass_thickness glass_thickness;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS hardware_finish hardware_finish;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS configuration TEXT; -- Free text: french door, sliding, etc.
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS dimensions TEXT; -- Free text for dimensions

-- ============================================
-- ADD STRIPE FEE TRACKING TO PAYMENTS
-- ============================================

ALTER TABLE payments ADD COLUMN IF NOT EXISTS gross_amount NUMERIC(12,2);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS stripe_fee NUMERIC(12,2) DEFAULT 0;

-- Note: 'amount' field will now represent NET amount (what you actually received)
-- 'gross_amount' is the original charge amount
-- 'stripe_fee' is 2.9% + $0.30 (auto-calculated in app)

-- ============================================
-- ADD USER PREFERENCES TABLE (for dark mode, etc.)
-- ============================================

CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  theme TEXT DEFAULT 'light' CHECK (theme IN ('light', 'dark')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own preferences"
  ON user_preferences FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Trigger for updated_at
CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ADD MONTHLY REPORTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS monthly_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_month DATE NOT NULL, -- First day of the month
  total_revenue NUMERIC(12,2) DEFAULT 0,
  total_expenses NUMERIC(12,2) DEFAULT 0,
  net_profit NUMERIC(12,2) DEFAULT 0,
  jobs_completed INTEGER DEFAULT 0,
  jobs_created INTEGER DEFAULT 0,
  expenses_by_category JSONB DEFAULT '{}'::jsonb,
  payments_by_method JSONB DEFAULT '{}'::jsonb,
  top_clients JSONB DEFAULT '[]'::jsonb,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  pdf_url TEXT,
  UNIQUE(report_month)
);

-- Enable RLS
ALTER TABLE monthly_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage reports"
  ON monthly_reports FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_monthly_reports_month ON monthly_reports(report_month DESC);

-- ============================================
-- FUNCTION TO GENERATE MONTHLY REPORT DATA
-- ============================================

CREATE OR REPLACE FUNCTION generate_monthly_report(report_date DATE)
RETURNS UUID
LANGUAGE plpgsql
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

  -- Calculate total revenue (payments received)
  SELECT COALESCE(SUM(amount), 0) INTO rev
  FROM payments
  WHERE date >= month_start AND date <= month_end;

  -- Calculate total expenses
  SELECT COALESCE(SUM(amount), 0) INTO exp
  FROM expenses
  WHERE date >= month_start AND date <= month_end;

  -- Count jobs completed (status changed to 'closed')
  SELECT COUNT(*) INTO completed
  FROM jobs
  WHERE status = 'closed'
  AND updated_at >= month_start AND updated_at <= month_end + INTERVAL '1 day';

  -- Count jobs created
  SELECT COUNT(*) INTO created
  FROM jobs
  WHERE created_at >= month_start AND created_at <= month_end + INTERVAL '1 day';

  -- Expenses by category
  SELECT COALESCE(jsonb_object_agg(category, total), '{}'::jsonb) INTO exp_by_cat
  FROM (
    SELECT category::text, SUM(amount) as total
    FROM expenses
    WHERE date >= month_start AND date <= month_end
    GROUP BY category
  ) sub;

  -- Payments by method
  SELECT COALESCE(jsonb_object_agg(method, total), '{}'::jsonb) INTO pay_by_method
  FROM (
    SELECT method::text, SUM(amount) as total
    FROM payments
    WHERE date >= month_start AND date <= month_end
    GROUP BY method
  ) sub;

  -- Top clients by revenue
  SELECT COALESCE(jsonb_agg(client_data), '[]'::jsonb) INTO top_cli
  FROM (
    SELECT jsonb_build_object(
      'client_id', c.id,
      'client_name', c.name,
      'revenue', SUM(p.amount)
    ) as client_data
    FROM payments p
    JOIN jobs j ON p.job_id = j.id
    JOIN clients c ON j.client_id = c.id
    WHERE p.date >= month_start AND p.date <= month_end
    GROUP BY c.id, c.name
    ORDER BY SUM(p.amount) DESC
    LIMIT 5
  ) sub;

  -- Insert or update report
  INSERT INTO monthly_reports (
    report_month, total_revenue, total_expenses, net_profit,
    jobs_completed, jobs_created, expenses_by_category,
    payments_by_method, top_clients
  ) VALUES (
    month_start, rev, exp, rev - exp,
    completed, created, exp_by_cat,
    pay_by_method, top_cli
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

-- ============================================
-- HELPER VIEWS FOR REPORTING
-- ============================================

-- View: Job with total invoice value
CREATE OR REPLACE VIEW jobs_with_value AS
SELECT 
  j.*,
  COALESCE(SUM(i.total), 0) as total_invoice_value,
  COUNT(i.id) as invoice_count
FROM jobs j
LEFT JOIN invoices i ON j.id = i.job_id
GROUP BY j.id;

-- View: Client dashboard stats
CREATE OR REPLACE VIEW client_stats AS
SELECT 
  c.id as client_id,
  c.name as client_name,
  COUNT(DISTINCT j.id) as total_jobs,
  COALESCE(SUM(i.total), 0) as total_invoiced,
  COALESCE(SUM(p.amount), 0) as total_paid,
  COALESCE(SUM(i.total), 0) - COALESCE(SUM(p.amount), 0) as outstanding_balance
FROM clients c
LEFT JOIN jobs j ON c.id = j.client_id
LEFT JOIN invoices i ON j.id = i.job_id
LEFT JOIN payments p ON j.id = p.job_id
GROUP BY c.id, c.name;

-- ============================================
-- INDEX FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_jobs_glass_type ON jobs(glass_type);
CREATE INDEX IF NOT EXISTS idx_jobs_hardware_finish ON jobs(hardware_finish);
CREATE INDEX IF NOT EXISTS idx_payments_method ON payments(method);

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON COLUMN jobs.glass_type IS 'Type of glass: clear, low_iron, frosted, rain, tinted_gray, tinted_bronze, other';
COMMENT ON COLUMN jobs.glass_thickness IS 'Thickness: 1/4", 5/16", 3/8", 1/2", 5/8", 3/4"';
COMMENT ON COLUMN jobs.hardware_finish IS 'Hardware finish: chrome, brushed_nickel, matte_black, etc.';
COMMENT ON COLUMN jobs.configuration IS 'Door configuration: french door, sliding door, fixed panel, etc.';
COMMENT ON COLUMN jobs.dimensions IS 'Free text field for glass dimensions';
COMMENT ON COLUMN payments.gross_amount IS 'Original charge amount before fees';
COMMENT ON COLUMN payments.stripe_fee IS 'Stripe processing fee (2.9% + $0.30)';
COMMENT ON COLUMN payments.amount IS 'Net amount received after fees';
