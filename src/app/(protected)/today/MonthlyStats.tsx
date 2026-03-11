'use client'

import { format } from 'date-fns'
import { DollarSign, TrendingDown, TrendingUp } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { cn, formatCurrency } from '@/lib/utils'

interface MonthlyStatsProps {
  revenue: number
  expenses: number
  net: number
}

export function MonthlyStats({ revenue, expenses, net }: MonthlyStatsProps) {
  const monthName = format(new Date(), 'MMMM')

  return (
    <div className="mb-6">
      <div className="mb-3">
        <h2 className="section-title mb-1">Month to date</h2>
        <p className="page-subtitle">{monthName} revenue, spend, and net at a glance.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="p-5 border border-green-100 bg-white/92 dark:border-green-900/30 dark:bg-dark-card/92">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl border border-green-100 bg-green-50 dark:border-green-900/40 dark:bg-green-900/25">
            <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-navy-500 dark:text-dark-muted">
            Revenue
          </p>
          <p className="mt-1 text-xl font-bold text-green-600 dark:text-green-400">
            {formatCurrency(revenue)}
          </p>
        </Card>

        <Card className="p-5 border border-red-100 bg-white/92 dark:border-red-900/30 dark:bg-dark-card/92">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl border border-red-100 bg-red-50 dark:border-red-900/40 dark:bg-red-900/25">
            <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-navy-500 dark:text-dark-muted">
            Expenses
          </p>
          <p className="mt-1 text-xl font-bold text-red-600 dark:text-red-400">
            {formatCurrency(expenses)}
          </p>
        </Card>

        <Card
          className={cn(
            'p-5 border',
            net >= 0
              ? 'border-orange-200 bg-orange-50/85 dark:border-orange-900/30 dark:bg-orange-900/15'
              : 'border-gray-200 bg-white/92 dark:border-gray-800 dark:bg-dark-card/92'
          )}
        >
          <div
            className={cn(
              'mb-3 flex h-10 w-10 items-center justify-center rounded-2xl border',
              net >= 0
                ? 'border-orange-200 bg-orange-100 dark:border-orange-800 dark:bg-orange-900/30'
                : 'border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-800'
            )}
          >
            <DollarSign
              className={cn(
                'h-5 w-5',
                net >= 0 ? 'text-orange-600 dark:text-orange-400' : 'text-gray-600 dark:text-gray-400'
              )}
            />
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-navy-500 dark:text-dark-muted">
            Net Profit
          </p>
          <p
            className={cn(
              'mt-1 text-xl font-bold',
              net >= 0 ? 'text-orange-600 dark:text-orange-400' : 'text-gray-600 dark:text-gray-400'
            )}
          >
            {formatCurrency(net)}
          </p>
        </Card>
      </div>
    </div>
  )
}
