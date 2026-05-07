// /api/v1/reminders
//   POST  create a reminder, optionally linked to a job.
//
// Auth: Bearer API key with `write` scope.

import { NextRequest, NextResponse } from 'next/server'
import { ReminderPriority } from '@/lib/supabase/types'
import { badRequest, internalError, readJson, requireApiKey } from '@/lib/api-auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const ALLOWED_PRIORITIES: ReminderPriority[] = ['high', 'moderate', 'low']

interface CreateReminderBody {
  title?: unknown
  job_id?: unknown
  reminder_date?: unknown
  priority?: unknown
}

export async function POST(request: NextRequest) {
  const auth = await requireApiKey(request, { scope: 'write' })
  if (!auth.ok) return auth.response

  const parsed = await readJson<CreateReminderBody>(request)
  if (!parsed.ok) return parsed.response
  const body = parsed.body

  const title = typeof body.title === 'string' ? body.title.trim() : ''
  if (!title) return badRequest('`title` is required.')

  const priority = typeof body.priority === 'string' ? body.priority.trim() : 'moderate'
  if (!ALLOWED_PRIORITIES.includes(priority as ReminderPriority)) {
    return badRequest(`Unknown priority '${priority}'.`, { allowed: ALLOWED_PRIORITIES })
  }

  const reminderDate =
    typeof body.reminder_date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(body.reminder_date)
      ? body.reminder_date
      : new Date().toISOString().slice(0, 10)

  const jobId = typeof body.job_id === 'string' && body.job_id.trim() ? body.job_id.trim() : null

  try {
    const { data, error } = await auth.supabase
      .from('reminders')
      .insert({
        title,
        job_id: jobId,
        reminder_date: reminderDate,
        priority: priority as ReminderPriority,
      })
      .select('id, title, job_id, reminder_date, priority, done, created_at')
      .single()

    if (error) return internalError(error)
    return NextResponse.json({ reminder: data }, { status: 201 })
  } catch (error) {
    return internalError(error)
  }
}
