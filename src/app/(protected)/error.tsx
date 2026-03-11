'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, RefreshCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export default function ProtectedError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="page-container safe-top flex min-h-[70vh] items-center justify-center">
      <Card className="w-full max-w-xl overflow-hidden">
        <CardContent className="p-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[28px] bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300">
            <AlertTriangle className="h-8 w-8" />
          </div>
          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.24em] text-orange-700 dark:text-orange-300">
            Workspace Error
          </p>
          <h1 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-navy-900 dark:text-dark-text">
            This part of the app needs another try.
          </h1>
          <p className="mt-3 text-sm leading-7 text-navy-500 dark:text-dark-muted">
            Retry first. If the error keeps coming back, check the Supabase connection and the latest deployment config.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button onClick={reset}>
              <RefreshCcw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
            <Link href="/today" className="inline-flex">
              <Button variant="outline" className="w-full">
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
