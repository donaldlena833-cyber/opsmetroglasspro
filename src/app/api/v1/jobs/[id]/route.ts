// /api/v1/jobs/[id]
//   GET    fetch one job with related invoices/payments/expenses
//   PATCH  partial update (status, scheduling, pricing, scope, etc.)
//
// Auth: Bearer API key. GET requires `read`, PATCH requires `write`.

import { NextRequest, NextResponse } from 'next/server'
import { JobStatus } from '@/lib/supabase/types'
import { badRequest, internalError, notFound, readJson, requireApiKey } from '@/lib/api-auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const ALLOWED_STATUSES: JobStatus[] = [
  'estimate',
  'deposit_received',
  'measured',
  'ordered',
  'installed',
  'closed',
]

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

interface RouteContext {
  params: { id: string }
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  const auth = await requireApiKey(request, { scope: 'read' })
  if (!auth.ok) return auth.response

  if (!UUID_RE.test(params.id)) return badRequest('`id` must be a UUID.')

  try {
    const { data, error } = await auth.supabase
      .from('jobs')
      .select(
        `*,
         clients (id, name, email, phone, billing_address),
         invoices (id, invoice_number, status, total, invoice_date, due_date),
         payments (id, date, amount, gross_amount, stripe_fee, payment_type, method, note),
         expenses (id, date, amount, vendor, category, payment_method, note)`
      )
      .eq('id', params.id)
      .maybeSingle()

    if (error) return internalError(error)
    if (!data) return notFound('Job')

    return NextResponse.json({ job: data })
  } catch (error) {
    return internalError(error)
  }
}

interface PatchBody {
  job_name?: unknown
  address?: unknown
  status?: unknown
  install_date?: unknown
  install_end_date?: unknown
  quoted_price?: unknown
  deposit_amount?: unknown
  scope_of_work?: unknown
  area?: unknown
  glass_type?: unknown
  glass_thickness?: unknown
  hardware_finish?: unknown
  configuration?: unknown
  dimensions?: unknown
  notes?: unknown
}

function asStringOrNull(value: unknown): string | null | undefined {
  if (value === undefined) return undefined
  if (value === null) return null
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function asNumberOrNull(value: unknown): number | null | undefined {
  if (value === undefined) return undefined
  if (value === null || value === '') return null
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? n : undefined
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const auth = await requireApiKey(request, { scope: 'write' })
  if (!auth.ok) return auth.response

  if (!UUID_RE.test(params.id)) return badRequest('`id` must be a UUID.')

  const parsed = await readJson<PatchBody>(request)
  if (!parsed.ok) return parsed.response
  const body = parsed.body

  const updates: Record<string, unknown> = {}

  const jobName = asStringOrNull(body.job_name)
  if (jobName !== undefined) {
    if (jobName === null) return badRequest('`job_name` cannot be cleared.')
    updates.job_name = jobName
  }

  const address = asStringOrNull(body.address)
  if (address !== undefined) {
    if (address === null) return badRequest('`address` cannot be cleared.')
    updates.address = address
  }

  if (body.status !== undefined) {
    const s = asStringOrNull(body.status)
    if (!s || !ALLOWED_STATUSES.includes(s as JobStatus)) {
      return badRequest(`Invalid status.`, { allowed: ALLOWED_STATUSES })
    }
    updates.status = s
  }

  const installDate = asStringOrNull(body.install_date)
  if (installDate !== undefined) updates.install_date = installDate
  const installEndDate = asStringOrNull(body.install_end_date)
  if (installEndDate !== undefined) updates.install_end_date = installEndDate

  if (
    typeof updates.install_date === 'string' &&
    typeof updates.install_end_date === 'string' &&
    (updates.install_end_date as string) < (updates.install_date as string)
  ) {
    return badRequest('`install_end_date` cannot be before `install_date`.')
  }

  const quotedPrice = asNumberOrNull(body.quoted_price)
  if (quotedPrice === undefined && body.quoted_price !== undefined) {
    return badRequest('`quoted_price` must be a number.')
  }
  if (quotedPrice !== undefined) {
    if (quotedPrice !== null && quotedPrice < 0) {
      return badRequest('`quoted_price` must be zero or positive.')
    }
    updates.quoted_price = quotedPrice
  }

  const depositAmount = asNumberOrNull(body.deposit_amount)
  if (depositAmount === undefined && body.deposit_amount !== undefined) {
    return badRequest('`deposit_amount` must be a number.')
  }
  if (depositAmount !== undefined) {
    if (depositAmount !== null && depositAmount < 0) {
      return badRequest('`deposit_amount` must be zero or positive.')
    }
    updates.deposit_amount = depositAmount
  }

  for (const key of [
    'scope_of_work',
    'area',
    'glass_type',
    'glass_thickness',
    'hardware_finish',
    'configuration',
    'dimensions',
    'notes',
  ] as const) {
    const value = asStringOrNull((body as Record<string, unknown>)[key])
    if (value !== undefined) updates[key] = value
  }

  if (Object.keys(updates).length === 0) {
    return badRequest('No updatable fields provided.')
  }

  try {
    const { data, error } = await auth.supabase
      .from('jobs')
      .update(updates)
      .eq('id', params.id)
      .select(
        `id, job_name, address, status, install_date, install_end_date,
         quoted_price, deposit_amount, scope_of_work, client_id,
         created_at, updated_at`
      )
      .maybeSingle()

    if (error) return internalError(error)
    if (!data) return notFound('Job')

    return NextResponse.json({ job: data })
  } catch (error) {
    return internalError(error)
  }
}
