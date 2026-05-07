-- MetroGlassOps: Webhook event log
-- Version: 2.3.1
-- Description: Adds a small append-only log of every Stripe webhook event
--              the app receives. The webhook handler will insert one row
--              per event keyed by Stripe's event.id (UNIQUE) so duplicates
--              are no-ops, then proceed with whatever sync the event type
--              calls for. Refund and dispute events do not yet mutate the
--              ledger — but having them in payment_events means the
--              operator can SELECT them out of the database for follow-up
--              instead of digging through the Stripe dashboard.

CREATE TABLE IF NOT EXISTS public.payment_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  payment_id UUID REFERENCES public.payments(id) ON DELETE SET NULL,
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
  job_id UUID REFERENCES public.jobs(id) ON DELETE SET NULL,
  amount NUMERIC(12,2),
  raw JSONB NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_events_event_type
  ON public.payment_events(event_type);
CREATE INDEX IF NOT EXISTS idx_payment_events_received_at
  ON public.payment_events(received_at DESC);

ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Internal users can read payment events" ON public.payment_events;
CREATE POLICY "Internal users can read payment events"
  ON public.payment_events FOR SELECT
  TO authenticated
  USING (public.is_internal_user());

COMMENT ON TABLE public.payment_events IS
  'Append-only log of Stripe webhook events. Refund and dispute events land here for operator follow-up; checkout.session.completed events are also recorded so duplicates are visible at a glance.';
