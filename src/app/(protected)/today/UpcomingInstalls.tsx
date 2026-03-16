'use client'

import { useRouter } from 'next/navigation'
import { Calendar, ChevronRight, MapPin } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { formatCurrency, formatRelativeDate, truncate } from '@/lib/utils'

interface UpcomingInstallsProps {
  installs: any[]
  totalValue: number
}

export function UpcomingInstalls({ installs, totalValue }: UpcomingInstallsProps) {
  const router = useRouter()

  return (
    <div className="mb-6">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-navy-50 text-navy-700 dark:bg-navy-900/20 dark:text-navy-200">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-navy-500 dark:text-dark-muted">
              Upcoming Installs
            </h2>
            <p className="text-xs text-navy-400 dark:text-dark-muted">What is coming up in the next week.</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <span className="pill-badge bg-cream-100 text-navy-700 dark:bg-dark-border dark:text-dark-text">
            {formatCurrency(totalValue)}
          </span>
          <span className="pill-badge bg-navy-50 text-navy-700 dark:bg-navy-900/20 dark:text-navy-200">
            {installs.length}
          </span>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="divide-y divide-cream-200 dark:divide-dark-border">
          {installs.map((install) => (
            <button
              key={install.id}
              type="button"
              onClick={() => router.push(`/jobs/${install.id}`)}
              className="flex w-full items-start gap-3 p-4 text-left transition-colors hover:bg-cream-50 dark:hover:bg-dark-border/60"
            >
              <div className="rounded-2xl bg-cream-100 px-3 py-2 text-center dark:bg-dark-border">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-navy-500 dark:text-dark-muted">
                  Install
                </p>
                <p className="mt-1 text-sm font-semibold text-navy-800 dark:text-dark-text">
                  {formatRelativeDate(install.install_date!)}
                </p>
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold text-navy-800 dark:text-dark-text">{install.job_name}</h3>
                  {install.install_end_date && install.install_end_date !== install.install_date && (
                    <span className="text-xs text-navy-400 dark:text-dark-muted">
                      through {formatRelativeDate(install.install_end_date)}
                    </span>
                  )}
                </div>

                {install.clients?.name && (
                  <p className="mt-1 text-sm text-navy-500 dark:text-dark-muted">{install.clients.name}</p>
                )}

                <div className="mt-2 flex items-center gap-1 text-sm text-navy-500 dark:text-dark-muted">
                  <MapPin className="h-3.5 w-3.5" />
                  <span className="truncate">{truncate(install.address, 42)}</span>
                </div>

                <p className="mt-3 text-sm font-medium text-navy-700 dark:text-orange-300">
                  {install.total_registered_value > 0
                    ? `${formatCurrency(install.total_registered_value)} registered`
                    : 'No job value registered yet'}
                </p>
              </div>

              <ChevronRight className="mt-2 h-5 w-5 shrink-0 text-navy-300 dark:text-dark-muted" />
            </button>
          ))}
        </div>
      </Card>
    </div>
  )
}
