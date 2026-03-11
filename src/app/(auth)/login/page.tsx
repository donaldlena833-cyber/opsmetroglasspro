'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import { BriefcaseBusiness, CalendarClock, Eye, EyeOff, ReceiptText } from 'lucide-react'

const highlights = [
  {
    title: 'Jobs',
    description: 'Track estimates, installs, and closeouts in one flow.',
    icon: BriefcaseBusiness,
  },
  {
    title: 'Payments',
    description: 'Record deposits, balances, and Stripe fees cleanly.',
    icon: ReceiptText,
  },
  {
    title: 'Reminders',
    description: 'Keep measurements, follow-ups, and installs on time.',
    icon: CalendarClock,
  },
]

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        toast({
          title: 'Login failed',
          description: error.message,
          variant: 'destructive',
        })
        return
      }

      toast({
        title: 'Welcome back!',
        description: 'Redirecting to dashboard...',
        variant: 'success',
      })

      router.push('/today')
      router.refresh()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden px-4 py-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(184,138,82,0.16),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(59,51,45,0.08),transparent_32%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(184,138,82,0.18),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(246,241,232,0.05),transparent_24%)]" />

      <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-5xl items-center">
        <div className="grid w-full gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <section className="glass rounded-[32px] p-8 lg:p-10">
            <Image
              src="/logo.png"
              alt="MetroGlass Pro"
              width={240}
              height={60}
              className="h-12 w-auto"
              priority
            />

            <p className="mt-10 text-xs font-semibold uppercase tracking-[0.3em] text-orange-700 dark:text-orange-300">
              Operations Hub
            </p>
            <h1 className="mt-4 max-w-xl text-4xl font-semibold tracking-[-0.03em] text-navy-900 dark:text-dark-text sm:text-5xl">
              Keep installs, invoices, and follow-ups moving from one place.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-navy-500 dark:text-dark-muted">
              MetroGlassOps gives your field and office workflow one clean home, with a calmer cream-and-charcoal look that matches the main brand.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {highlights.map((highlight) => {
                const Icon = highlight.icon
                return (
                  <div
                    key={highlight.title}
                    className="rounded-[24px] border border-cream-200 bg-white/75 p-4 shadow-soft dark:border-dark-border dark:bg-dark-card/60"
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cream-100 text-navy-700 dark:bg-dark-border dark:text-dark-text">
                      <Icon className="h-5 w-5" />
                    </div>
                    <p className="mt-4 font-semibold text-navy-800 dark:text-dark-text">{highlight.title}</p>
                    <p className="mt-1 text-sm leading-6 text-navy-500 dark:text-dark-muted">{highlight.description}</p>
                  </div>
                )
              })}
            </div>
          </section>

          <Card className="w-full max-w-md lg:ml-auto">
            <CardContent className="pt-8">
              <div className="mb-8 text-center lg:text-left">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-orange-700 dark:text-orange-300">
                  Sign in
                </p>
                <h2 className="mt-3 text-2xl font-semibold tracking-[-0.02em] text-navy-800 dark:text-dark-text">
                  Welcome to MetroGlassOps
                </h2>
                <p className="mt-2 text-sm leading-6 text-navy-500 dark:text-dark-muted">
                  Access today&apos;s jobs, payments, invoices, and reminders.
                </p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <Input
                  type="email"
                  label="Email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  autoFocus
                />

                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    label="Password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-[41px] text-navy-400 transition-colors hover:text-navy-700 dark:text-dark-muted dark:hover:text-dark-text"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  loading={loading}
                >
                  Sign In
                </Button>
              </form>

              <p className="mt-8 text-center text-xs uppercase tracking-[0.18em] text-navy-400 dark:text-dark-muted">
                Internal use only
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
