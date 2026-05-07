import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { getServiceSupabaseEnv, getStripeEnv } from '@/lib/env'
import { calculateStripeFee } from '@/lib/utils'
import { PaymentType } from '@/lib/supabase/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function formatDbDate(date = new Date()) {
  return date.toISOString().slice(0, 10)
}

function getMetadataValue(metadata: Stripe.Metadata | null | undefined, key: string) {
  const value = metadata?.[key]
  return typeof value === 'string' && value.length > 0 ? value : null
}

async function syncCheckoutSessionPayment(stripe: Stripe, session: Stripe.Checkout.Session, eventId: string) {
  if (!session.payment_intent || typeof session.payment_intent !== 'string') {
    return
  }

  const paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent, {
    expand: ['latest_charge.balance_transaction'],
  })

  const metadata = paymentIntent.metadata || session.metadata || {}
  const invoiceId = getMetadataValue(metadata, 'invoice_id')
  const jobId = getMetadataValue(metadata, 'job_id')

  if (!invoiceId || !jobId) {
    return
  }

  const paymentType = (getMetadataValue(metadata, 'payment_type') || 'other') as PaymentType
  const note = `Stripe webhook payment link sync | session=${session.id} | intent=${paymentIntent.id}`

  const { url, serviceRoleKey } = getServiceSupabaseEnv()
  const supabase = createClient(url, serviceRoleKey)

  const grossAmount = Number(session.amount_total || 0) / 100

  let stripeFee = calculateStripeFee(grossAmount).fee
  const latestCharge = typeof paymentIntent.latest_charge === 'object' ? paymentIntent.latest_charge : null
  const balanceTransaction =
    latestCharge && typeof latestCharge.balance_transaction === 'object'
      ? latestCharge.balance_transaction
      : null

  if (balanceTransaction && typeof balanceTransaction.fee === 'number') {
    stripeFee = Number(balanceTransaction.fee) / 100
  }

  const netAmount = Math.max(Math.round((grossAmount - stripeFee) * 100) / 100, 0)

  const { error: insertError } = await supabase.from('payments').insert({
    job_id: jobId,
    invoice_id: invoiceId,
    date: formatDbDate(),
    amount: netAmount,
    gross_amount: grossAmount,
    stripe_fee: stripeFee,
    payment_type: paymentType,
    method: 'stripe',
    note,
    stripe_event_id: eventId,
  })

  if (insertError) {
    // 23505 = unique_violation: another delivery of the same Stripe event
    // already inserted this payment. Treat as idempotent success.
    if ((insertError as { code?: string }).code === '23505') {
      return
    }
    throw insertError
  }

  const [{ data: invoice }, { data: payments }] = await Promise.all([
    supabase.from('invoices').select('total').eq('id', invoiceId).single(),
    supabase.from('payments').select('amount, gross_amount').eq('invoice_id', invoiceId),
  ])

  if (!invoice) {
    return
  }

  const totalPaid = (payments || []).reduce((sum, payment) => {
    return sum + Number(payment.gross_amount ?? payment.amount ?? 0)
  }, 0)

  const invoiceStatus =
    totalPaid >= Number(invoice.total) ? 'paid' : totalPaid > 0 ? 'deposit_paid' : 'sent'

  await supabase
    .from('invoices')
    .update({ status: invoiceStatus })
    .eq('id', invoiceId)
}

export async function POST(request: NextRequest) {
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing Stripe signature.' }, { status: 400 })
  }

  const { secretKey, webhookSecret } = getStripeEnv()

  if (!secretKey || !webhookSecret) {
    return NextResponse.json(
      { error: 'Missing Stripe server key or webhook secret. Add STRIPE_SECRET_KEY/STRIPE_SECRET/STRIPE_API_KEY and STRIPE_WEBHOOK_SECRET/STRIPE_SIGNING_SECRET.' },
      { status: 500 }
    )
  }

  if (secretKey.startsWith('pk_')) {
    return NextResponse.json(
      { error: 'Stripe publishable key detected. The webhook needs the server secret key that starts with sk_live_ or sk_test_.' },
      { status: 500 }
    )
  }

  const stripe = new Stripe(secretKey)
  const rawBody = await request.text()

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Invalid Stripe webhook signature.' },
      { status: 400 }
    )
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session

        if (session.payment_status === 'paid') {
          await syncCheckoutSessionPayment(stripe, session, event.id)
        }
        break
      }
      case 'checkout.session.async_payment_succeeded': {
        const session = event.data.object as Stripe.Checkout.Session
        await syncCheckoutSessionPayment(stripe, session, event.id)
        break
      }
      case 'charge.refunded':
      case 'charge.dispute.created':
      case 'charge.dispute.closed': {
        // The ledger does not yet mutate on refund/dispute — that requires a
        // schema decision (negative payment row vs separate refunds table).
        // For now, capture the raw event in payment_events so the operator
        // can SELECT it out and reconcile manually.
        await recordPaymentEvent(event)
        break
      }
      default:
        break
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Stripe webhook handling error:', error)

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Webhook processing failed.' },
      { status: 500 }
    )
  }
}

async function recordPaymentEvent(event: Stripe.Event) {
  const { url, serviceRoleKey } = getServiceSupabaseEnv()
  const supabase = createClient(url, serviceRoleKey)

  // Try to surface the dollar amount and link to a known payment by
  // payment_intent. Both are best-effort — the raw event is the source of
  // truth.
  let amount: number | null = null
  let paymentId: string | null = null
  let invoiceId: string | null = null
  let jobId: string | null = null

  const data = event.data.object as unknown as Record<string, unknown>
  if (data && typeof data === 'object') {
    const charge = data as Partial<Stripe.Charge> & { amount_refunded?: number; payment_intent?: string }
    if (typeof charge.amount_refunded === 'number') {
      amount = charge.amount_refunded / 100
    } else if (typeof charge.amount === 'number') {
      amount = charge.amount / 100
    }
    const paymentIntent = typeof charge.payment_intent === 'string' ? charge.payment_intent : null
    if (paymentIntent) {
      const { data: matched } = await supabase
        .from('payments')
        .select('id, invoice_id, job_id')
        .ilike('note', `%intent=${paymentIntent}%`)
        .maybeSingle()
      if (matched) {
        paymentId = matched.id
        invoiceId = matched.invoice_id
        jobId = matched.job_id
      }
    }
  }

  const { error } = await supabase.from('payment_events').insert({
    stripe_event_id: event.id,
    event_type: event.type,
    payment_id: paymentId,
    invoice_id: invoiceId,
    job_id: jobId,
    amount,
    raw: event as unknown as Record<string, unknown>,
  })

  // 23505 = unique violation = duplicate delivery; treat as no-op.
  if (error && (error as { code?: string }).code !== '23505') {
    throw error
  }
}
