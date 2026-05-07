// /api/v1/payments
//   POST  record a payment against a job (optionally an invoice).
//
// `gross_amount` is the amount actually charged to the customer. For Stripe
// payments the route also computes the standard 2.9% + $0.30 fee and stores
// the post-fee net in `amount` so dashboards stay consistent with what the
// webhook does.
//
// Auth: Bearer API key with `write` scope.

import { NextRequest, NextResponse } from 'next/server'
import { PaymentMethod, PaymentType } from '@/lib/supabase/types'
import { badRequest, internalError, readJson, requireApiKey } from '@/lib/api-auth'
import { calculateStripeFee } from '@/lib/utils'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const ALLOWED_METHODS: PaymentMethod[] = ['stripe', 'check', 'zelle', 'venmo', 'cashapp', 'cash', 'other']
const ALLOWED_TYPES: PaymentType[] = ['deposit', 'final', 'other']

interface CreatePaymentBody {
  job_id?: unknown
  invoice_id?: unknown
  gross_amount?: unknown
  payment_type?: unknown
  method?: unknown
  date?: unknown
  note?: unknown
  confirmation_image_url?: unknown
}

export async function POST(request: NextRequest) {
  const auth = await requireApiKey(request, { scope: 'write' })
  if (!auth.ok) return auth.response

  const parsed = await readJson<CreatePaymentBody>(request)
  if (!parsed.ok) return parsed.response
  const body = parsed.body

  const jobId = typeof body.job_id === 'string' && body.job_id.trim() ? body.job_id.trim() : null
  if (!jobId) return badRequest('`job_id` is required.')

  const grossAmount = typeof body.gross_amount === 'number' ? body.gross_amount : Number(body.gross_amount)
  if (!Number.isFinite(grossAmount) || grossAmount <= 0) {
    return badRequest('`gross_amount` must be a positive number (amount charged to client).')
  }

  const method = typeof body.method === 'string' ? body.method.trim() : 'stripe'
  if (!ALLOWED_METHODS.includes(method as PaymentMethod)) {
    return badRequest(`Unknown method '${method}'.`, { allowed: ALLOWED_METHODS })
  }

  const paymentType = typeof body.payment_type === 'string' ? body.payment_type.trim() : 'deposit'
  if (!ALLOWED_TYPES.includes(paymentType as PaymentType)) {
    return badRequest(`Unknown payment_type '${paymentType}'.`, { allowed: ALLOWED_TYPES })
  }

  const fee = method === 'stripe' ? calculateStripeFee(grossAmount) : { fee: 0, netAmount: grossAmount }

  const date =
    typeof body.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(body.date)
      ? body.date
      : new Date().toISOString().slice(0, 10)

  const invoiceId =
    typeof body.invoice_id === 'string' && body.invoice_id.trim() ? body.invoice_id.trim() : null

  try {
    const { data, error } = await auth.supabase
      .from('payments')
      .insert({
        job_id: jobId,
        invoice_id: invoiceId,
        amount: fee.netAmount,
        gross_amount: grossAmount,
        stripe_fee: fee.fee,
        payment_type: paymentType as PaymentType,
        method: method as PaymentMethod,
        date,
        note: typeof body.note === 'string' && body.note.trim() ? body.note.trim() : null,
        confirmation_image_url:
          typeof body.confirmation_image_url === 'string' && body.confirmation_image_url.trim()
            ? body.confirmation_image_url.trim()
            : null,
      })
      .select('id, job_id, invoice_id, amount, gross_amount, stripe_fee, payment_type, method, date, note, created_at')
      .single()

    if (error) return internalError(error)
    return NextResponse.json({ payment: data }, { status: 201 })
  } catch (error) {
    return internalError(error)
  }
}
