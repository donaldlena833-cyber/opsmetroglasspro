// /api/v1/expenses
//   POST  record an expense (optionally linked to a job).
//
// Auth: Bearer API key with `write` scope.

import { NextRequest, NextResponse } from 'next/server'
import { ExpenseCategory, PaymentMethod } from '@/lib/supabase/types'
import { badRequest, internalError, readJson, requireApiKey } from '@/lib/api-auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const ALLOWED_CATEGORIES: ExpenseCategory[] = [
  'glass',
  'hardware',
  'consumables',
  'subcontractor',
  'gas_fuel',
  'vehicle',
  'tools_equipment',
  'office_admin',
  'food_meals',
  'other',
  // legacy values still accepted for compatibility with permit-pulse / older bots
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
]

const ALLOWED_METHODS: PaymentMethod[] = ['stripe', 'check', 'zelle', 'venmo', 'cashapp', 'cash', 'other']

interface CreateExpenseBody {
  amount?: unknown
  vendor?: unknown
  category?: unknown
  payment_method?: unknown
  date?: unknown
  job_id?: unknown
  note?: unknown
  receipt_image_url?: unknown
}

export async function POST(request: NextRequest) {
  const auth = await requireApiKey(request, { scope: 'write' })
  if (!auth.ok) return auth.response

  const parsed = await readJson<CreateExpenseBody>(request)
  if (!parsed.ok) return parsed.response
  const body = parsed.body

  const amount = typeof body.amount === 'number' ? body.amount : Number(body.amount)
  if (!Number.isFinite(amount) || amount <= 0) {
    return badRequest('`amount` must be a positive number.')
  }

  const vendor = typeof body.vendor === 'string' ? body.vendor.trim() : ''
  if (!vendor) return badRequest('`vendor` is required.')

  const category = typeof body.category === 'string' ? body.category.trim() : 'other'
  if (!ALLOWED_CATEGORIES.includes(category as ExpenseCategory)) {
    return badRequest(`Unknown category '${category}'.`, { allowed: ALLOWED_CATEGORIES })
  }

  const method =
    typeof body.payment_method === 'string' ? body.payment_method.trim() : 'stripe'
  if (!ALLOWED_METHODS.includes(method as PaymentMethod)) {
    return badRequest(`Unknown payment_method '${method}'.`, { allowed: ALLOWED_METHODS })
  }

  const date =
    typeof body.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(body.date)
      ? body.date
      : new Date().toISOString().slice(0, 10)

  const jobId = typeof body.job_id === 'string' && body.job_id.trim() ? body.job_id.trim() : null

  try {
    const { data, error } = await auth.supabase
      .from('expenses')
      .insert({
        job_id: jobId,
        amount,
        vendor,
        category: category as ExpenseCategory,
        payment_method: method as PaymentMethod,
        date,
        note: typeof body.note === 'string' && body.note.trim() ? body.note.trim() : null,
        receipt_image_url:
          typeof body.receipt_image_url === 'string' && body.receipt_image_url.trim()
            ? body.receipt_image_url.trim()
            : null,
      })
      .select('id, job_id, amount, vendor, category, payment_method, date, note, receipt_image_url, created_at')
      .single()

    if (error) return internalError(error)
    return NextResponse.json({ expense: data }, { status: 201 })
  } catch (error) {
    return internalError(error)
  }
}
