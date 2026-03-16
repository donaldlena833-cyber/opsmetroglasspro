-- MetroGlassOps V4 Migration
-- Version: 4.0.0
-- Description: Adds editable job pricing and scope fields to power smarter invoice defaults

ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS quoted_price NUMERIC(12,2) CHECK (quoted_price IS NULL OR quoted_price >= 0),
  ADD COLUMN IF NOT EXISTS deposit_amount NUMERIC(12,2) CHECK (deposit_amount IS NULL OR deposit_amount >= 0),
  ADD COLUMN IF NOT EXISTS scope_of_work TEXT;

COMMENT ON COLUMN public.jobs.quoted_price IS 'Planned or quoted total for the job before invoices are created';
COMMENT ON COLUMN public.jobs.deposit_amount IS 'Suggested deposit amount for the job';
COMMENT ON COLUMN public.jobs.scope_of_work IS 'Plain-language summary of the work to be invoiced';
