import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient as createServerSupabaseClient } from '@/lib/supabase/server'
import { getStripeEnv } from '@/lib/env'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function toCurrencyCents(amount: number) {
  return Math.max(Math.round(amount * 100), 0)
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'You need to sign in before creating a Stripe link.' }, { status: 401 })
    }

    const { secretKey } = getStripeEnv()

    if (!secretKey) {
      return NextResponse.json(
        { error: 'Missing STRIPE_SECRET_KEY in Vercel. Add it before creating payment links.' },
        { status: 503 }
      )
    }

    const { invoiceId } = await request.json()

    if (!invoiceId || typeof invoiceId !== 'string') {
      return NextResponse.json({ error: 'Invoice ID is required.' }, { status: 400 })
    }

    const { data: invoice, error } = await supabase
      .from('invoices')
      .select(`
        id,
        job_id,
        invoice_number,
        customer_name,
        total,
        due_date,
        jobs (job_name),
        payments (id, amount, gross_amount)
      `)
      .eq('id', invoiceId)
      .single()

    if (error || !invoice) {
      return NextResponse.json({ error: 'Invoice not found.' }, { status: 404 })
    }

    const paidAmount = (invoice.payments || []).reduce((sum, payment) => {
      return sum + Number(payment.gross_amount ?? payment.amount ?? 0)
    }, 0)
    const balanceDue = Math.max(Number(invoice.total) - paidAmount, 0)
    const balanceDueCents = toCurrencyCents(balanceDue)

    if (balanceDueCents <= 0) {
      return NextResponse.json({ error: 'This invoice is already fully paid.' }, { status: 400 })
    }

    const stripe = new Stripe(secretKey)
    const invoiceLabel = `Invoice #${invoice.invoice_number}`
    const job = Array.isArray(invoice.jobs) ? invoice.jobs[0] : invoice.jobs
    const jobName = job?.job_name ? ` • ${job.job_name}` : ''

    const product = await stripe.products.create({
      name: `${invoiceLabel}${jobName}`,
      description: `MetroGlass Pro balance for ${invoice.customer_name}`,
      metadata: {
        invoice_id: invoice.id,
        job_id: invoice.job_id,
        invoice_number: String(invoice.invoice_number),
        payment_type: 'final',
        source: 'stripe_payment_link',
      },
    })

    const price = await stripe.prices.create({
      currency: 'usd',
      unit_amount: balanceDueCents,
      product: product.id,
      metadata: {
        invoice_id: invoice.id,
        invoice_number: String(invoice.invoice_number),
        payment_type: 'final',
        source: 'stripe_payment_link',
      },
    })

    const paymentLink = await stripe.paymentLinks.create({
      line_items: [
        {
          price: price.id,
          quantity: 1,
        },
      ],
      billing_address_collection: 'auto',
      allow_promotion_codes: false,
      metadata: {
        invoice_id: invoice.id,
        job_id: invoice.job_id,
        invoice_number: String(invoice.invoice_number),
        payment_type: 'final',
        source: 'stripe_payment_link',
      },
      payment_intent_data: {
        metadata: {
          invoice_id: invoice.id,
          job_id: invoice.job_id,
          invoice_number: String(invoice.invoice_number),
          due_date: invoice.due_date,
          payment_type: 'final',
          source: 'stripe_payment_link',
        },
      },
      after_completion: {
        type: 'hosted_confirmation',
        hosted_confirmation: {
          custom_message: `Thanks for paying ${invoiceLabel}. MetroGlass Pro has your payment.`,
        },
      },
    })

    return NextResponse.json({
      url: paymentLink.url,
      balanceDue,
      amountCents: balanceDueCents,
    })
  } catch (error) {
    console.error('Stripe payment link error:', error)

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create Stripe payment link.' },
      { status: 500 }
    )
  }
}
