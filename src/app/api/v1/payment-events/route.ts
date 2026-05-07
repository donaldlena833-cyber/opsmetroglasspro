// /api/v1/payment-events
//   GET  list recent Stripe webhook events captured into payment_events.
//        Useful for the bot to surface refunds and disputes that need
//        manual reconciliation.
//
// Auth: Bearer API key with `read` scope.

import { NextRequest, NextResponse } from 'next/server'
import { badRequest, internalError, requireApiKey } from '@/lib/api-auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

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
    const eventType = url.searchParams.get('event_type')
    const limit = clampLimit(url.searchParams.get('limit'))
    const before = url.searchParams.get('before')

    if (before && Number.isNaN(Date.parse(before))) {
      return badRequest('`before` must be an ISO-8601 timestamp from a prior page.')
    }

    let query = auth.supabase
      .from('payment_events')
      .select('id, stripe_event_id, event_type, payment_id, invoice_id, job_id, amount, received_at')
      .order('received_at', { ascending: false })
      .limit(limit)

    if (eventType) query = query.eq('event_type', eventType)
    if (before) query = query.lt('received_at', before)

    const { data, error } = await query
    if (error) return internalError(error)

    const events = data ?? []
    const nextCursor = events.length === limit ? events[events.length - 1].received_at : null
    return NextResponse.json({ events, next_cursor: nextCursor })
  } catch (error) {
    return internalError(error)
  }
}
