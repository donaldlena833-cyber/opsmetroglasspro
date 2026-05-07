// /api/v1/invoices
//   GET  list invoices (?status=, ?job_id=, ?limit max 200).
//
// Auth: Bearer API key with `read` scope.

import { NextRequest, NextResponse } from 'next/server'
import { InvoiceStatus } from '@/lib/supabase/types'
import { badRequest, internalError, requireApiKey } from '@/lib/api-auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const ALLOWED_STATUSES: InvoiceStatus[] = ['sent', 'deposit_paid', 'paid']
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function clampLimit(raw: string | null): number {
  if (!raw) return 50
  const n = Number(raw)
  if (!Number.isFinite(n) || n < 1) return 50
  return Math.min(Math.floor(n), 200)
}

export async function GET(request: NextRequest) {
  const auth = await requireApiKey(request, { scope: 'read' })
  if (!auth.ok) return auth.response

  try {
    const url = new URL(request.url)
    const status = url.searchParams.get('status')
    const jobId = url.searchParams.get('job_id')
    const limit = clampLimit(url.searchParams.get('limit'))
    const before = url.searchParams.get('before')

    if (status && !ALLOWED_STATUSES.includes(status as InvoiceStatus)) {
      return badRequest(`Unknown status '${status}'.`, { allowed: ALLOWED_STATUSES })
    }
    if (jobId && !UUID_RE.test(jobId)) {
      return badRequest('`job_id` must be a UUID.')
    }
    if (before && Number.isNaN(Date.parse(before))) {
      return badRequest('`before` must be an ISO-8601 timestamp from a prior page.')
    }

    let query = auth.supabase
      .from('invoices')
      .select(
        `id, invoice_number, customer_name, customer_address, status, total,
         subtotal, tax, tax_applied, tax_rate, discount_applied,
         discount_amount, discount_percent, invoice_date, due_date, notes,
         pdf_url, job_id, created_at, updated_at,
         jobs (id, job_name, address)`
      )
      .order('created_at', { ascending: false })
      .limit(limit)

    if (status) query = query.eq('status', status as InvoiceStatus)
    if (jobId) query = query.eq('job_id', jobId)
    if (before) query = query.lt('created_at', before)

    const { data, error } = await query
    if (error) return internalError(error)

    const invoices = data ?? []
    const nextCursor = invoices.length === limit ? invoices[invoices.length - 1].created_at : null
    return NextResponse.json({ invoices, next_cursor: nextCursor })
  } catch (error) {
    return internalError(error)
  }
}
