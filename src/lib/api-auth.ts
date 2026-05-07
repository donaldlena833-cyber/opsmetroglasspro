// Bearer-token authentication for /api/v1/* endpoints.
//
// Usage from a route:
//   const auth = await requireApiKey(request, { scope: 'write' })
//   if (!auth.ok) return auth.response
//   const { supabase, keyId } = auth   // service-role client + key id
//
// Tokens are issued via the SQL helper public.issue_api_key(name) and stored
// as SHA-256 hex hashes in public.api_keys. The plaintext is only seen at
// issue time. We hash the incoming Bearer header and look up the active key
// row, then bump last_used_at for observability.

import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'node:crypto'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { getServiceSupabaseEnv } from '@/lib/env'

export type ApiScope = 'read' | 'write'

interface AuthSuccess {
  ok: true
  keyId: string
  keyName: string
  scopes: ApiScope[]
  supabase: SupabaseClient
}

interface AuthFailure {
  ok: false
  response: NextResponse
}

export type AuthResult = AuthSuccess | AuthFailure

function jsonError(status: number, code: string, message: string): NextResponse {
  return NextResponse.json({ error: { code, message } }, { status })
}

function extractBearer(request: NextRequest): string | null {
  const header = request.headers.get('authorization') || request.headers.get('Authorization')
  if (!header) return null
  const match = /^Bearer\s+(.+)$/i.exec(header.trim())
  return match ? match[1].trim() : null
}

export async function requireApiKey(
  request: NextRequest,
  options: { scope?: ApiScope } = {}
): Promise<AuthResult> {
  const token = extractBearer(request)
  if (!token) {
    return {
      ok: false,
      response: jsonError(401, 'missing_token', 'Provide an API key via the Authorization: Bearer header.'),
    }
  }

  if (token.length < 16 || token.length > 200) {
    return { ok: false, response: jsonError(401, 'invalid_token', 'API key is malformed.') }
  }

  const hash = createHash('sha256').update(token).digest('hex')

  let supabase: SupabaseClient
  try {
    const { url, serviceRoleKey } = getServiceSupabaseEnv()
    supabase = createClient(url, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  } catch (error) {
    console.error('API auth: supabase env missing', error)
    return {
      ok: false,
      response: jsonError(500, 'server_misconfigured', 'API server is not configured. Contact the operator.'),
    }
  }

  const { data: keyRow, error } = await supabase
    .from('api_keys')
    .select('id, name, scopes, revoked_at')
    .eq('key_hash', hash)
    .maybeSingle()

  if (error) {
    console.error('API auth lookup failed', error)
    return { ok: false, response: jsonError(500, 'auth_lookup_failed', 'Could not verify API key right now.') }
  }

  if (!keyRow || keyRow.revoked_at) {
    return { ok: false, response: jsonError(401, 'invalid_token', 'API key is unknown or has been revoked.') }
  }

  const scopes = (keyRow.scopes ?? []) as ApiScope[]
  const required = options.scope
  if (required && !scopes.includes(required)) {
    return {
      ok: false,
      response: jsonError(
        403,
        'insufficient_scope',
        `This key does not have the '${required}' scope.`
      ),
    }
  }

  // Fire and forget — never block the request on this update.
  void supabase
    .from('api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', keyRow.id)

  return {
    ok: true,
    keyId: keyRow.id,
    keyName: keyRow.name,
    scopes,
    supabase,
  }
}

// Common helpers shared by route handlers.
export const apiError = jsonError

export function badRequest(message: string, details?: unknown): NextResponse {
  return NextResponse.json(
    { error: { code: 'bad_request', message, ...(details ? { details } : {}) } },
    { status: 400 }
  )
}

export function notFound(resource: string): NextResponse {
  return NextResponse.json(
    { error: { code: 'not_found', message: `${resource} not found.` } },
    { status: 404 }
  )
}

export function internalError(error: unknown): NextResponse {
  console.error('API internal error', error)
  return NextResponse.json(
    {
      error: {
        code: 'internal_error',
        message: error instanceof Error ? error.message : 'Internal server error.',
      },
    },
    { status: 500 }
  )
}

// Parse JSON body defensively. Returns null + a 400 response if invalid.
export async function readJson<T = unknown>(request: NextRequest): Promise<
  { ok: true; body: T } | { ok: false; response: NextResponse }
> {
  try {
    const body = (await request.json()) as T
    if (body === null || typeof body !== 'object') {
      return { ok: false, response: badRequest('Body must be a JSON object.') }
    }
    return { ok: true, body }
  } catch {
    return { ok: false, response: badRequest('Body must be valid JSON.') }
  }
}
