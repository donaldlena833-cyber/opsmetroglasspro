'use client'

import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, ChevronRight } from 'lucide-react'
import { JobWithRelations } from '@/lib/supabase/types'
import { jobStatusConfig } from '@/lib/utils'

interface JobsAttentionProps {
  jobs: (JobWithRelations & { clients: { name: string } | null })[]
}

export function JobsAttention({ jobs }: JobsAttentionProps) {
  const router = useRouter()

  const getAttentionMessage = (job: JobsAttentionProps['jobs'][0]) => {
    const hasDeposit = job.payments?.some(p => p.payment_type === 'deposit')
    const hasGlassExpense = job.expenses?.some(e => 
      e.category === 'glass_fabrication' || e.category === 'mr_glass'
    )
    const hasFinalPayment = job.payments?.some(p => p.payment_type === 'final')

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
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="w-4 h-4 text-orange-500" />
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
          Needs Attention
        </h2>
      </div>
      <div className="space-y-2">
        {jobs.map((job) => {
          const statusConfig = jobStatusConfig[job.status]
          const attentionMessage = getAttentionMessage(job)

          return (
            <Card
              key={job.id}
              onClick={() => router.push(`/jobs/${job.id}`)}
              className="p-4 cursor-pointer active:scale-[0.99] transition-transform"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-navy-800 truncate">
                      {job.job_name}
                    </h3>
                    <Badge variant={job.status as any} className="flex-shrink-0">
                      {statusConfig.label}
                    </Badge>
                  </div>
                  {job.clients && (
                    <p className="text-sm text-gray-500 mt-0.5 truncate">
                      {job.clients.name}
                    </p>
                  )}
                  <p className="text-sm text-orange-600 font-medium mt-1">
                    {attentionMessage}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 ml-2" />
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
