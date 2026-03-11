'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/components/ui/use-toast'
import { useTheme } from '@/lib/theme-context'
import { PageHero } from '@/components/PageHero'
import {
  ArrowUpRight,
  BarChart3,
  Building2,
  Download,
  Info,
  LogOut,
  Mail,
  Moon,
  Sun,
  Palette,
  Phone,
  Receipt,
  Smartphone,
  User,
  Users,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

export default function SettingsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()
  const { theme, setTheme } = useTheme()
  const [loggingOut, setLoggingOut] = useState(false)

  const shortcuts = [
    {
      href: '/reports',
      title: 'Reports',
      description: 'Revenue, expenses, trends, and job margins.',
      icon: BarChart3,
    },
    {
      href: '/clients',
      title: 'Clients',
      description: 'Open client history, balances, and project context.',
      icon: Users,
    },
    {
      href: '/expenses',
      title: 'Expenses',
      description: 'Review spend history and receipt files quickly.',
      icon: Receipt,
    },
  ]

  const handleLogout = async () => {
    setLoggingOut(true)
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const handleInstallPWA = () => {
    toast({
      title: 'Add to Home Screen',
      description: 'Tap the share button in Safari, then "Add to Home Screen"',
    })
  }

  return (
    <div className="page-container safe-top">
      <PageHero
        eyebrow="Settings"
        title="Dial in the workspace."
        description="Handle appearance, install preferences, and the main back-office shortcuts from one clean place instead of hunting through the app."
      />

      <Card className="mb-6 overflow-hidden">
        <CardContent className="p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-[28px] border border-cream-200 bg-white shadow-soft dark:border-dark-border dark:bg-dark-card">
              <Image
                src="/logo.png"
                alt="MetroGlass Pro"
                width={72}
                height={72}
                className="object-contain"
              />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-700 dark:text-orange-300">
                Company
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-navy-900 dark:text-dark-text">
                MetroGlass Pro Inc
              </h2>
              <p className="mt-2 text-sm leading-6 text-navy-500 dark:text-dark-muted">
                Custom shower glass operations across NYC, New Jersey, and Connecticut.
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-[24px] border border-cream-200 bg-cream-50/80 p-4 dark:border-dark-border dark:bg-dark-border/70">
              <Mail className="h-4 w-4 text-orange-600 dark:text-orange-300" />
              <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-navy-500 dark:text-dark-muted">
                Email
              </p>
              <p className="mt-1 text-sm font-medium text-navy-800 dark:text-dark-text">
                operations@metroglasspro.com
              </p>
            </div>
            <div className="rounded-[24px] border border-cream-200 bg-cream-50/80 p-4 dark:border-dark-border dark:bg-dark-border/70">
              <Phone className="h-4 w-4 text-orange-600 dark:text-orange-300" />
              <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-navy-500 dark:text-dark-muted">
                Phones
              </p>
              <p className="mt-1 text-sm font-medium text-navy-800 dark:text-dark-text">
                332-999-3846
              </p>
              <p className="text-sm font-medium text-navy-800 dark:text-dark-text">
                646-520-5412
              </p>
            </div>
            <div className="rounded-[24px] border border-cream-200 bg-cream-50/80 p-4 dark:border-dark-border dark:bg-dark-border/70">
              <Building2 className="h-4 w-4 text-orange-600 dark:text-orange-300" />
              <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-navy-500 dark:text-dark-muted">
                Coverage
              </p>
              <p className="mt-1 text-sm font-medium text-navy-800 dark:text-dark-text">NYC / NJ / CT</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <section className="mb-6">
        <div className="mb-3">
          <h2 className="section-title mb-1">Workspace shortcuts</h2>
          <p className="page-subtitle">Quick links to the screens you will reach for most from settings.</p>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {shortcuts.map((shortcut) => {
            const Icon = shortcut.icon

            return (
              <Link key={shortcut.href} href={shortcut.href}>
                <Card className="h-full overflow-hidden transition-transform hover:-translate-y-0.5">
                  <CardContent className="p-5">
                    <div className="flex h-12 w-12 items-center justify-center rounded-[20px] bg-cream-100 text-navy-800 dark:bg-dark-border dark:text-dark-text">
                      <Icon className="h-5 w-5" />
                    </div>
                    <p className="mt-4 font-semibold text-navy-800 dark:text-dark-text">{shortcut.title}</p>
                    <p className="mt-2 text-sm leading-6 text-navy-500 dark:text-dark-muted">
                      {shortcut.description}
                    </p>
                    <div className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-navy-600 dark:text-orange-300">
                      Open
                      <ArrowUpRight className="h-4 w-4" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
        <Card className="overflow-hidden">
          <CardContent className="p-5">
            <h3 className="flex items-center gap-2 font-semibold text-navy-800 dark:text-dark-text">
              <Palette className="h-4 w-4" />
              Appearance
            </h3>

            <div className="mt-4 rounded-[26px] border border-cream-200 bg-cream-50/80 p-4 dark:border-dark-border dark:bg-dark-border/70">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  {theme === 'dark' ? (
                    <Moon className="h-5 w-5 text-orange-500" />
                  ) : (
                    <Sun className="h-5 w-5 text-orange-500" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-navy-800 dark:text-dark-text">Dark Mode</p>
                    <p className="text-xs text-navy-500 dark:text-dark-muted">
                      {theme === 'dark' ? 'Warm charcoal mode is on' : 'Cream mode is on'}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={theme === 'dark'}
                  onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                />
              </div>
            </div>

            <div className="mt-4 rounded-[26px] border border-cream-200 bg-white/80 p-4 dark:border-dark-border dark:bg-dark-card/75">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cream-100 text-navy-800 dark:bg-dark-border dark:text-dark-text">
                  <Smartphone className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-navy-800 dark:text-dark-text">Install app</p>
                  <p className="mt-1 text-sm leading-6 text-navy-500 dark:text-dark-muted">
                    Add MetroGlassOps to the home screen for faster field access.
                  </p>
                </div>
              </div>

              <Button onClick={handleInstallPWA} variant="outline" className="mt-4 w-full">
                <Download className="mr-2 h-4 w-4" />
                Add to Home Screen
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="overflow-hidden">
            <CardContent className="p-5">
              <h3 className="flex items-center gap-2 font-semibold text-navy-800 dark:text-dark-text">
                <User className="h-4 w-4" />
                Account
              </h3>
              <p className="mt-3 text-sm leading-6 text-navy-500 dark:text-dark-muted">
                Logged in as a MetroGlass Pro operations user.
              </p>

              <Button
                onClick={handleLogout}
                variant="outline"
                className="mt-4 w-full"
                loading={loggingOut}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <CardContent className="p-5">
              <h3 className="flex items-center gap-2 font-semibold text-navy-800 dark:text-dark-text">
                <Info className="h-4 w-4" />
                About
              </h3>
              <div className="mt-4 space-y-3 text-sm text-navy-500 dark:text-dark-muted">
                <div className="flex items-center justify-between gap-4">
                  <span>Version</span>
                  <span className="font-medium text-navy-800 dark:text-dark-text">2.1.0</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span>Platform</span>
                  <span className="font-medium text-navy-800 dark:text-dark-text">Next.js + Supabase</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span>Theme</span>
                  <span className="font-medium text-navy-800 dark:text-dark-text">
                    {theme === 'dark' ? 'Charcoal' : 'Cream'}
                  </span>
                </div>
              </div>

              <p className="mt-5 text-xs uppercase tracking-[0.18em] text-navy-400 dark:text-dark-muted">
                © 2026 MetroGlass Pro Inc
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
