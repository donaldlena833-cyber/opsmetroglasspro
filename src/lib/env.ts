const missingEnvHelp = 'Add it to `.env.local` for local development and your deployment environment before starting the app.'

function getFirstAvailableEnv(name: string, fallbacks: string[] = []) {
  const candidates = [name, ...fallbacks]

  for (const candidate of candidates) {
    const value = process.env[candidate]
    if (value) {
      return value
    }
  }

  return null
}

function getRequiredEnv(name: string, fallbacks: string[] = []) {
  const value = getFirstAvailableEnv(name, fallbacks)

  if (!value) {
    const acceptedNames = [name, ...fallbacks].join(' or ')
    throw new Error(`Missing environment variable: ${acceptedNames}. ${missingEnvHelp}`)
  }

  return value
}

export function getPublicSupabaseEnv() {
  return {
    url: getRequiredEnv('NEXT_PUBLIC_SUPABASE_URL'),
    anonKey: getRequiredEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', ['NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY']),
  }
}

export function getServiceSupabaseEnv() {
  return {
    ...getPublicSupabaseEnv(),
    serviceRoleKey: getRequiredEnv('SUPABASE_SERVICE_ROLE_KEY', ['SUPABASE_SECRET_KEY']),
  }
}
