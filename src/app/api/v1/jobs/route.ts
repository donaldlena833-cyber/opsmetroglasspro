// /api/v1/jobs
//   GET   list active jobs (or filter via ?status=...)
//   POST  create a new job
//
// Auth: Bearer API key. GET requires `read`, POST requires `write`.

import { NextRequest, NextResponse } from 'next/server'
import { JobStatus } from '@/lib/supabase/types'
import { badRequest, internalError, readJson, requireApiKey } from '@/lib/api-auth'

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
    const limit = clampLimit(url.searchParams.get('limit'))

    let query = auth.supabase
      .from('jobs')
      .select(
        `id, job_name, address, status, install_date, install_end_date,
         quoted_price, deposit_amount, scope_of_work, area, glass_type,
         glass_thickness, hardware_finish, configuration, dimensions,
         client_id, created_at, updated_at,
         clients (id, name, email, phone)`
      )
      .order('created_at', { ascending: false })
      .limit(limit)

    if (status) {
      if (!ALLOWED_STATUSES.includes(status as JobStatus)) {
        return badRequest(`Unknown status '${status}'.`, { allowed: ALLOWED_STATUSES })
      }
      query = query.eq('status', status as JobStatus)
    }

    const { data, error } = await query
    if (error) return internalError(error)

    return NextResponse.json({ jobs: data ?? [] })
  } catch (error) {
    return internalError(error)
  }
}

interface CreateJobBody {
  job_name?: unknown
  address?: unknown
  client_id?: unknown
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

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null
}

function asNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? n : null
}

export async function POST(request: NextRequest) {
  const auth = await requireApiKey(request, { scope: 'write' })
  if (!auth.ok) return auth.response

  const parsed = await readJson<CreateJobBody>(request)
  if (!parsed.ok) return parsed.response
  const body = parsed.body

  const jobName = asString(body.job_name)
  const address = asString(body.address)
  if (!jobName) return badRequest('`job_name` is required and must be a non-empty string.')
  if (!address) return badRequest('`address` is required and must be a non-empty string.')

  const status = asString(body.status) ?? 'estimate'
  if (!ALLOWED_STATUSES.includes(status as JobStatus)) {
    return badRequest(`Unknown status '${status}'.`, { allowed: ALLOWED_STATUSES })
  }

  const quotedPrice = asNumber(body.quoted_price)
  if (quotedPrice !== null && quotedPrice < 0) {
    return badRequest('`quoted_price` must be zero or positive.')
  }

  const depositAmount = asNumber(body.deposit_amount)
  if (depositAmount !== null && depositAmount < 0) {
    return badRequest('`deposit_amount` must be zero or positive.')
  }

  if (quotedPrice !== null && depositAmount !== null && depositAmount > quotedPrice) {
    return badRequest('`deposit_amount` cannot exceed `quoted_price`.')
  }

  const installDate = asString(body.install_date)
  const installEndDate = asString(body.install_end_date)
  if (installDate && installEndDate && installEndDate < installDate) {
    return badRequest('`install_end_date` cannot be before `install_date`.')
  }

  try {
    const { data, error } = await auth.supabase
      .from('jobs')
      .insert({
        job_name: jobName,
        address,
        client_id: asString(body.client_id),
        status: status as JobStatus,
        install_date: installDate,
        install_end_date: installEndDate,
        quoted_price: quotedPrice,
        deposit_amount: depositAmount,
        scope_of_work: asString(body.scope_of_work),
        area: asString(body.area),
        glass_type: asString(body.glass_type),
        glass_thickness: asString(body.glass_thickness),
        hardware_finish: asString(body.hardware_finish),
        configuration: asString(body.configuration),
        dimensions: asString(body.dimensions),
        notes: asString(body.notes),
      })
      .select(
        `id, job_name, address, status, install_date, install_end_date,
         quoted_price, deposit_amount, scope_of_work, client_id,
         created_at, updated_at`
      )
      .single()

    if (error) return internalError(error)

    return NextResponse.json({ job: data }, { status: 201 })
  } catch (error) {
    return internalError(error)
  }
}
