'use client'

import { useRouter } from 'next/navigation'
import { AlertTriangle, ChevronRight } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { JobWithRelations } from '@/lib/supabase/types'
import { jobStatusConfig } from '@/lib/utils'

interface JobsAttentionProps {
  jobs: (JobWithRelations & { clients: { name: string } | null })[]
}

export function JobsAttention({ jobs }: JobsAttentionProps) {
  const router = useRouter()

  const getAttentionMessage = (job: JobsAttentionProps['jobs'][0]) => {
    const hasDeposit = job.payments?.some((payment) => payment.payment_type === 'deposit')
    const hasGlassExpense = job.expenses?.some(
      (expense) =>
        expense.category === 'glass_fabrication' ||
        expense.category === 'mr_glass' ||
        expense.category === 'glass'
    )
    const hasFinalPayment = job.payments?.some((payment) => payment.payment_type === 'final')

    if (['deposit_received', 'measured', 'ordered', 'installed'].includes(job.status) && !hasDeposit) {
      return 'Waiting for deposit'
    }
    if (['measured', 'ordered'].includes(job.status) && !hasGlassExpense) {
      return 'Need to order glass'
    }
    if (job.status === 'installed' && !hasFinalPayment) {
      return 'Collect final payment'
    }
    return ''
  }

  return (
    <div className="mb-6">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-navy-500 dark:text-dark-muted">
              Needs Attention
            </h2>
            <p className="text-xs text-navy-400 dark:text-dark-muted">Jobs with a blocker or missing next step.</p>
          </div>
        </div>
        <span className="pill-badge bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300">
          {jobs.length}
        </span>
      </div>

      <div className="space-y-3">
        {jobs.map((job) => {
          const statusConfig = jobStatusConfig[job.status]
          const attentionMessage = getAttentionMessage(job)

          return (
            <Card
              key={job.id}
              onClick={() => router.push(`/jobs/${job.id}`)}
              className="cursor-pointer p-4 transition-transform active:scale-[0.99]"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-cream-100 text-navy-700 dark:bg-dark-border dark:text-dark-text">
                  <AlertTriangle className="h-5 w-5" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-navy-800 dark:text-dark-text">{job.job_name}</h3>
                    <Badge variant={job.status as any}>{statusConfig.label}</Badge>
                  </div>
                  {job.clients && (
                    <p className="mt-1 text-sm text-navy-500 dark:text-dark-muted">{job.clients.name}</p>
                  )}
                  <div className="mt-3 inline-flex rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700 dark:bg-orange-900/20 dark:text-orange-300">
                    {attentionMessage}
                  </div>
                </div>

                <ChevronRight className="mt-1 h-5 w-5 shrink-0 text-navy-300 dark:text-dark-muted" />
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
