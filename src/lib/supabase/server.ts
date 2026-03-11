import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getPublicSupabaseEnv, getServiceSupabaseEnv } from '@/lib/env'

export async function createClient() {
  const cookieStore = await cookies()
  const { url, anonKey } = getPublicSupabaseEnv()

  return createServerClient(
    url,
    anonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

export async function createServiceClient() {
  const cookieStore = await cookies()
  const { url, serviceRoleKey } = getServiceSupabaseEnv()

  return createServerClient(
    url,
    serviceRoleKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Ignore
          }
        },
      },
    }
  )
}
