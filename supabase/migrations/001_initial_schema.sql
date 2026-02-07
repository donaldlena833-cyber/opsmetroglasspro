-- MetroGlassOps Database Schema
-- Version: 1.0.0
-- Description: Complete schema for MetroGlass Pro operations management

-- ============================================
-- ENUMS
-- ============================================

CREATE TYPE job_status AS ENUM (
  'estimate',
  'deposit_received',
  'measured',
  'ordered',
  'installed',
  'closed'
);

CREATE TYPE expense_category AS ENUM (
  'crl',
  'glass_fabrication',
  'mr_glass',
  'home_depot',
  'uhaul',
  'parking',
  'tolls',
  'tools',
  'meals',
  'referral_payout',
  'other'
);

CREATE TYPE payment_method AS ENUM (
  'stripe',
  'check',
  'zelle',
  'venmo',
  'cashapp',
  'cash',
  'other'
);

CREATE TYPE payment_type AS ENUM (
  'deposit',
  'final',
  'other'
);

CREATE TYPE invoice_status AS ENUM (
  'sent',
  'deposit_paid',
  'paid'
);

CREATE TYPE reminder_priority AS ENUM (
  'high',
  'moderate',
  'low'
);

-- ============================================
-- TABLES
-- ============================================

-- Clients table
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  billing_address TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Jobs table
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  job_name TEXT NOT NULL,
  address TEXT NOT NULL,
  area TEXT,
  status job_status DEFAULT 'estimate',
  install_date DATE,
  install_end_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Expenses table
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  vendor TEXT NOT NULL,
  category expense_category NOT NULL DEFAULT 'other',
  payment_method payment_method NOT NULL DEFAULT 'card',
  note TEXT,
  receipt_image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoice sequence table for safe auto-increment
CREATE TABLE invoice_sequence (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  last_number INTEGER NOT NULL DEFAULT 0
);

-- Initialize the sequence
INSERT INTO invoice_sequence (id, last_number) VALUES (1, 0);

-- Invoices table
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  invoice_number INTEGER UNIQUE NOT NULL,
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '30 days'),
  customer_name TEXT NOT NULL,
  customer_address TEXT,
  notes TEXT,
  line_items_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount_applied BOOLEAN DEFAULT FALSE,
  discount_percent NUMERIC(5,2) DEFAULT 10,
  discount_amount NUMERIC(12,2) DEFAULT 0,
  tax_applied BOOLEAN DEFAULT FALSE,
  tax_rate NUMERIC(6,3) DEFAULT 8.875,
  tax NUMERIC(12,2) NOT NULL DEFAULT 0,
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  status invoice_status DEFAULT 'sent',
  pdf_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payments table
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  payment_type payment_type NOT NULL DEFAULT 'deposit',
  method payment_method NOT NULL DEFAULT 'stripe',
  note TEXT,
  confirmation_image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reminders table
CREATE TABLE reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  reminder_date DATE NOT NULL DEFAULT CURRENT_DATE,
  priority reminder_priority NOT NULL DEFAULT 'moderate',
  done BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_jobs_client_id ON jobs(client_id);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_install_date ON jobs(install_date);
CREATE INDEX idx_jobs_created_at ON jobs(created_at DESC);

CREATE INDEX idx_expenses_job_id ON expenses(job_id);
CREATE INDEX idx_expenses_date ON expenses(date DESC);
CREATE INDEX idx_expenses_category ON expenses(category);

CREATE INDEX idx_invoices_job_id ON invoices(job_id);
CREATE INDEX idx_invoices_invoice_number ON invoices(invoice_number DESC);
CREATE INDEX idx_invoices_status ON invoices(status);

CREATE INDEX idx_payments_job_id ON payments(job_id);
CREATE INDEX idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX idx_payments_date ON payments(date DESC);

CREATE INDEX idx_reminders_job_id ON reminders(job_id);
CREATE INDEX idx_reminders_date ON reminders(reminder_date);
CREATE INDEX idx_reminders_done ON reminders(done);

CREATE INDEX idx_clients_name ON clients(name);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to get next invoice number safely
CREATE OR REPLACE FUNCTION get_next_invoice_number()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  next_num INTEGER;
BEGIN
  UPDATE invoice_sequence
  SET last_number = last_number + 1
  WHERE id = 1
  RETURNING last_number INTO next_num;
  
  RETURN next_num;
END;
$$;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGERS
-- ============================================

CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_jobs_updated_at
  BEFORE UPDATE ON jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at
  BEFORE UPDATE ON expenses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reminders_updated_at
  BEFORE UPDATE ON reminders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on all tables
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_sequence ENABLE ROW LEVEL SECURITY;

-- Policies: Allow all authenticated users full access
-- (Since this is a 2-user internal app)

CREATE POLICY "Authenticated users can do everything with clients"
  ON clients FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can do everything with jobs"
  ON jobs FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can do everything with expenses"
  ON expenses FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can do everything with invoices"
  ON invoices FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can do everything with payments"
  ON payments FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can do everything with reminders"
  ON reminders FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can read/update invoice sequence"
  ON invoice_sequence FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================
-- STORAGE BUCKETS
-- ============================================
-- Run these in Supabase Dashboard > Storage > Create Bucket

-- Bucket: receipts (for expense receipts and payment confirmations)
-- Bucket: invoices (for generated invoice PDFs)

-- Note: Storage bucket creation and policies need to be set up in Supabase Dashboard
-- or via Supabase CLI. Here are the SQL policies to run after creating buckets:

-- For receipts bucket:
-- CREATE POLICY "Authenticated users can upload receipts"
--   ON storage.objects FOR INSERT
--   TO authenticated
--   WITH CHECK (bucket_id = 'receipts');

-- CREATE POLICY "Authenticated users can view receipts"
--   ON storage.objects FOR SELECT
--   TO authenticated
--   USING (bucket_id = 'receipts');

-- CREATE POLICY "Authenticated users can delete receipts"
--   ON storage.objects FOR DELETE
--   TO authenticated
--   USING (bucket_id = 'receipts');

-- For invoices bucket:
-- CREATE POLICY "Authenticated users can upload invoices"
--   ON storage.objects FOR INSERT
--   TO authenticated
--   WITH CHECK (bucket_id = 'invoices');

-- CREATE POLICY "Authenticated users can view invoices"
--   ON storage.objects FOR SELECT
--   TO authenticated
--   USING (bucket_id = 'invoices');

-- CREATE POLICY "Public can view invoice PDFs"
--   ON storage.objects FOR SELECT
--   TO public
--   USING (bucket_id = 'invoices');
