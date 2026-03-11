'use client'

import { PieChart } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { ExpenseCategory } from '@/lib/supabase/types'
import { formatCurrency, getSpendingCategoryDisplay } from '@/lib/utils'

interface SpendingBreakdownProps {
  expenses: Record<string, number>
  total: number
}

const barTones = [
  'bg-navy-700',
  'bg-orange-500',
  'bg-green-600',
  'bg-amber-500',
  'bg-navy-400',
]

export function SpendingBreakdown({ expenses, total }: SpendingBreakdownProps) {
  const combinedExpenses = Object.entries(expenses)
    .sort(([, left], [, right]) => right - left)
    .map(([category, amount]) => ({
      category,
      amount,
      display: getSpendingCategoryDisplay(category as ExpenseCategory),
    }))

  return (
    <div className="mb-6">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cream-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300">
            <PieChart className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-navy-500 dark:text-dark-muted">
              Where Money Is Going
            </h2>
            <p className="text-xs text-navy-400 dark:text-dark-muted">A live view of this month&apos;s spend mix.</p>
          </div>
        </div>
        <span className="pill-badge bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300">
          {formatCurrency(total)}
        </span>
      </div>

      <Card className="p-4">
        <div className="space-y-4">
          {combinedExpenses.map(({ category, amount, display }, index) => {
            const percentage = total > 0 ? (amount / total) * 100 : 0

            return (
              <div key={category} className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-cream-100 text-xl dark:bg-dark-border">
                  {display.icon}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center justify-between gap-3">
                    <span className="truncate text-sm font-medium text-navy-700 dark:text-dark-text">
                      {display.label}
                    </span>
                    <span className="text-sm font-semibold text-navy-800 dark:text-dark-text">
                      {formatCurrency(amount)}
                    </span>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-cream-200 dark:bg-dark-border">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${barTones[index % barTones.length]}`}
                      style={{ width: `${Math.max(percentage, 4)}%` }}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-cream-200 pt-4 dark:border-dark-border">
          <span className="text-sm font-medium text-navy-500 dark:text-dark-muted">Month-to-date expenses</span>
          <span className="text-lg font-semibold text-navy-800 dark:text-dark-text">{formatCurrency(total)}</span>
        </div>
      </Card>
    </div>
  )
}
