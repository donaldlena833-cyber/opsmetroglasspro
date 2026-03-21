'use client'

import type { MouseEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, CreditCard, FileText, Receipt } from 'lucide-react'
import { AttentionReason, cn } from '@/lib/utils'

interface JobActionButtonsProps {
  jobId: string
  attentionReason?: AttentionReason
  compact?: boolean
  className?: string
}

interface JobAction {
  label: string
  shortLabel: string
  href: string
  icon: typeof FileText
  tone?: 'primary' | 'secondary'
}

function getJobActions(jobId: string, attentionReason?: AttentionReason) {
  const actions = {
    invoice: {
      label: 'Create Invoice',
      shortLabel: 'Invoice',
      href: `/invoices/new?jobId=${jobId}`,
      icon: FileText,
      tone: 'secondary' as const,
    },
    payment: {
      label: 'Record Payment',
      shortLabel: 'Payment',
      href: `/jobs/payment/new?jobId=${jobId}`,
      icon: CreditCard,
      tone: 'secondary' as const,
    },
    expense: {
      label: 'Add Cost',
      shortLabel: 'Cost',
      href: `/jobs/expense/new?jobId=${jobId}`,
      icon: Receipt,
      tone: 'secondary' as const,
    },
    reminder: {
      label: 'Add Reminder',
      shortLabel: 'Reminder',
      href: `/jobs/reminder/new?jobId=${jobId}`,
      icon: Bell,
      tone: 'secondary' as const,
    },
  }

  if (attentionReason === 'waiting_deposit') {
    return [
      {
        ...actions.payment,
        label: 'Record Deposit',
        shortLabel: 'Deposit',
        tone: 'primary' as const,
      },
      actions.invoice,
      actions.reminder,
    ]
  }

  if (attentionReason === 'need_glass_order') {
    return [
      {
        ...actions.expense,
        label: 'Add Glass Cost',
        shortLabel: 'Glass',
        tone: 'primary' as const,
      },
      actions.payment,
      actions.reminder,
    ]
  }

  if (attentionReason === 'collect_final') {
    return [
      {
        ...actions.payment,
        label: 'Record Final Payment',
        shortLabel: 'Final',
        tone: 'primary' as const,
      },
      actions.invoice,
      actions.reminder,
    ]
  }

  return [
    {
      ...actions.invoice,
      tone: 'primary' as const,
    },
    actions.payment,
    actions.expense,
  ]
}

export function JobActionButtons({ jobId, attentionReason, compact = false, className }: JobActionButtonsProps) {
  const router = useRouter()
  const [primaryAction, ...secondaryActions] = getJobActions(jobId, attentionReason)

  const handleAction = (event: MouseEvent<HTMLButtonElement>, href: string) => {
    event.stopPropagation()
    router.push(href)
  }

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      <button
        type="button"
        onClick={(event) => handleAction(event, primaryAction.href)}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-2xl px-4 font-semibold transition-all active:scale-[0.98]',
          compact ? 'h-11 text-sm' : 'h-12 text-sm',
          'bg-navy-800 text-white hover:bg-navy-700 dark:bg-orange-500 dark:text-navy-900 dark:hover:bg-orange-400'
        )}
      >
        <primaryAction.icon className="h-4 w-4" />
        <span>{compact ? primaryAction.shortLabel : primaryAction.label}</span>
      </button>

      {secondaryActions.map((action) => (
        <button
          key={action.href}
          type="button"
          onClick={(event) => handleAction(event, action.href)}
          className={cn(
            'inline-flex items-center justify-center gap-2 rounded-2xl border border-cream-200 bg-white/85 px-3 font-medium text-navy-700 transition-all hover:bg-cream-50 active:scale-[0.98] dark:border-dark-border dark:bg-dark-card/85 dark:text-dark-text dark:hover:bg-dark-border',
            compact ? 'h-11 text-sm' : 'h-12 text-sm'
          )}
        >
          <action.icon className="h-4 w-4" />
          <span>{compact ? action.shortLabel : action.label}</span>
        </button>
      ))}
    </div>
  )
}
