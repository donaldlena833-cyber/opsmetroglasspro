// /api/v1/clients
//   GET   list clients (most-recent first; ?search=name to filter, ?limit max 200)
//   POST  create a client. Bot can call this before /api/v1/jobs to link a job
//         to a brand-new client.
//
// Auth: Bearer API key. GET requires `read`, POST requires `write`.

import { NextRequest, NextResponse } from 'next/server'
import { badRequest, internalError, readJson, requireApiKey } from '@/lib/api-auth'

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
    const search = (url.searchParams.get('search') ?? '').trim()
    const limit = clampLimit(url.searchParams.get('limit'))
    const before = url.searchParams.get('before')

    if (before && Number.isNaN(Date.parse(before))) {
      return badRequest('`before` must be an ISO-8601 timestamp from a prior page.')
    }

    let query = auth.supabase
      .from('clients')
      .select('id, name, email, phone, billing_address, created_at, updated_at')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (search) {
      // ilike is case-insensitive substring match
      query = query.ilike('name', `%${search.replace(/[%_]/g, m => `\\${m}`)}%`)
    }
    if (before) query = query.lt('created_at', before)

    const { data, error } = await query
    if (error) return internalError(error)

    const clients = data ?? []
    const nextCursor = clients.length === limit ? clients[clients.length - 1].created_at : null
    return NextResponse.json({ clients, next_cursor: nextCursor })
  } catch (error) {
    return internalError(error)
  }
}

interface CreateClientBody {
  name?: unknown
  email?: unknown
  phone?: unknown
  billing_address?: unknown
}

function asTrimmed(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null
}

export async function POST(request: NextRequest) {
  const auth = await requireApiKey(request, { scope: 'write' })
  if (!auth.ok) return auth.response

  const parsed = await readJson<CreateClientBody>(request)
  if (!parsed.ok) return parsed.response
  const body = parsed.body

  const name = asTrimmed(body.name)
  if (!name) return badRequest('`name` is required.')

  try {
    const { data, error } = await auth.supabase
      .from('clients')
      .insert({
        name,
        email: asTrimmed(body.email),
        phone: asTrimmed(body.phone),
        billing_address: asTrimmed(body.billing_address),
      })
      .select('id, name, email, phone, billing_address, created_at, updated_at')
      .single()

    if (error) return internalError(error)

    return NextResponse.json({ client: data }, { status: 201 })
  } catch (error) {
    return internalError(error)
  }
}
