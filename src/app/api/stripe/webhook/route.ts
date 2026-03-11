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

async function syncCheckoutSessionPayment(stripe: Stripe, session: Stripe.Checkout.Session) {
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

  const { data: existingPayment } = await supabase
    .from('payments')
    .select('id')
    .eq('note', note)
    .maybeSingle()

  if (existingPayment) {
    return
  }

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
  })

  if (insertError) {
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
      { error: 'Missing STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET.' },
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
          await syncCheckoutSessionPayment(stripe, session)
        }
        break
      }
      case 'checkout.session.async_payment_succeeded': {
        const session = event.data.object as Stripe.Checkout.Session
        await syncCheckoutSessionPayment(stripe, session)
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
