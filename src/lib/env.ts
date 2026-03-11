const missingEnvHelp = 'Add it to `.env.local` for local development and your deployment environment before starting the app.'

const envValues = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY,
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
} as const

function getFirstAvailableEnv(name: string, fallbacks: string[] = []) {
  const candidates = [name, ...fallbacks]

  for (const candidate of candidates) {
    const value = envValues[candidate as keyof typeof envValues]
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

function getOptionalEnv(name: string, fallbacks: string[] = []) {
  return getFirstAvailableEnv(name, fallbacks)
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

export function getStripeEnv() {
  return {
    secretKey: getOptionalEnv('STRIPE_SECRET_KEY'),
    webhookSecret: getOptionalEnv('STRIPE_WEBHOOK_SECRET'),
  }
}
