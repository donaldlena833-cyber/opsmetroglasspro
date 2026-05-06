-- MetroGlassOps: Stripe webhook idempotency
-- Version: 2.2.2
-- Description: The Stripe webhook handler currently dedupes against the `note`
--              text field via a select-then-insert. Two near-simultaneous
--              webhook deliveries from Stripe (retry storms, network blips)
--              both pass the SELECT and create duplicate payment rows. Add a
--              dedicated `stripe_event_id` column with a UNIQUE index so the
--              database itself enforces idempotency, then have the webhook
--              insert with this key. Existing rows have NULL and are
--              unaffected.

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS stripe_event_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_stripe_event_id
  ON public.payments(stripe_event_id)
  WHERE stripe_event_id IS NOT NULL;

COMMENT ON COLUMN public.payments.stripe_event_id IS
  'Stripe webhook event id used as the idempotency key for syncing payment-link payments. Null for non-Stripe payments.';
