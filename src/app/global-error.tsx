'use client'

import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  console.error(error)

  return (
    <html lang="en">
      <body className="min-h-screen bg-cream-50 text-navy-700 dark:bg-dark-bg dark:text-dark-text">
        <div className="page-container safe-top flex min-h-screen items-center justify-center">
          <div className="w-full max-w-xl rounded-[34px] border border-cream-200/90 bg-white/90 p-8 text-center shadow-card-lg dark:border-dark-border dark:bg-dark-card/90 dark:shadow-card-dark">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[28px] bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300">
              <AlertTriangle className="h-8 w-8" />
            </div>
            <p className="mt-6 text-xs font-semibold uppercase tracking-[0.24em] text-orange-700 dark:text-orange-300">
              App Error
            </p>
            <h1 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-navy-900 dark:text-dark-text">
              MetroGlassOps ran into a problem.
            </h1>
            <p className="mt-3 text-sm leading-7 text-navy-500 dark:text-dark-muted">
              Retry the page first. If that fails, verify the environment variables and deployment state.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button onClick={reset}>Try Again</Button>
              <Link href="/" className="inline-flex">
                <Button variant="outline" className="w-full">
                  Go Home
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
