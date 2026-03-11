const missingEnvHelp = 'Add it to `.env.local` for local development and your deployment environment before starting the app.'

function getRequiredEnv(name: 'NEXT_PUBLIC_SUPABASE_URL' | 'NEXT_PUBLIC_SUPABASE_ANON_KEY' | 'SUPABASE_SERVICE_ROLE_KEY') {
  const value = process.env[name]

  if (!value) {
    throw new Error(`Missing environment variable: ${name}. ${missingEnvHelp}`)
  }

  return value
}

export function getPublicSupabaseEnv() {
  return {
    url: getRequiredEnv('NEXT_PUBLIC_SUPABASE_URL'),
    anonKey: getRequiredEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
  }
}

export function getServiceSupabaseEnv() {
  return {
    ...getPublicSupabaseEnv(),
    serviceRoleKey: getRequiredEnv('SUPABASE_SERVICE_ROLE_KEY'),
  }
}
