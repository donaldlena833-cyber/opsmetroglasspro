// /api/v1/reminders/[id]
//   PATCH  toggle done / update title or date.
//
// Auth: Bearer API key with `write` scope.

import { NextRequest, NextResponse } from 'next/server'
import { ReminderPriority } from '@/lib/supabase/types'
import { badRequest, internalError, notFound, readJson, requireApiKey } from '@/lib/api-auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const ALLOWED_PRIORITIES: ReminderPriority[] = ['high', 'moderate', 'low']
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

interface RouteContext {
  params: { id: string }
}

interface PatchBody {
  title?: unknown
  reminder_date?: unknown
  priority?: unknown
  done?: unknown
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const auth = await requireApiKey(request, { scope: 'write' })
  if (!auth.ok) return auth.response

  if (!UUID_RE.test(params.id)) return badRequest('`id` must be a UUID.')

  const parsed = await readJson<PatchBody>(request)
  if (!parsed.ok) return parsed.response
  const body = parsed.body

  const updates: Record<string, unknown> = {}

  if (body.title !== undefined) {
    if (typeof body.title !== 'string' || !body.title.trim()) {
      return badRequest('`title` must be a non-empty string.')
    }
    updates.title = body.title.trim()
  }

  if (body.reminder_date !== undefined) {
    if (typeof body.reminder_date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(body.reminder_date)) {
      return badRequest('`reminder_date` must be a YYYY-MM-DD string.')
    }
    updates.reminder_date = body.reminder_date
  }

  if (body.priority !== undefined) {
    if (typeof body.priority !== 'string' || !ALLOWED_PRIORITIES.includes(body.priority as ReminderPriority)) {
      return badRequest(`Unknown priority.`, { allowed: ALLOWED_PRIORITIES })
    }
    updates.priority = body.priority
  }

  if (body.done !== undefined) {
    if (typeof body.done !== 'boolean') return badRequest('`done` must be true or false.')
    updates.done = body.done
  }

  if (Object.keys(updates).length === 0) {
    return badRequest('No updatable fields provided.')
  }

  try {
    const { data, error } = await auth.supabase
      .from('reminders')
      .update(updates)
      .eq('id', params.id)
      .select('id, title, job_id, reminder_date, priority, done, created_at')
      .maybeSingle()

    if (error) return internalError(error)
    if (!data) return notFound('Reminder')

    return NextResponse.json({ reminder: data })
  } catch (error) {
    return internalError(error)
  }
}
