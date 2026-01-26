'use client'

import { Card } from '@/components/ui/card'
import { formatCurrency, cn } from '@/lib/utils'
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react'
import { format } from 'date-fns'

interface MonthlyStatsProps {
  revenue: number
  expenses: number
  net: number
}

export function MonthlyStats({ revenue, expenses, net }: MonthlyStatsProps) {
  const monthName = format(new Date(), 'MMMM')

  return (
    <div className="mb-8">
      <h2 className="section-title flex items-center gap-2">
        <span>📊</span> {monthName} Overview
      </h2>
      <div className="grid grid-cols-3 gap-4">
        {/* Revenue */}
        <Card className="p-5 bg-gradient-to-br from-green-50 to-white dark:from-green-900/20 dark:to-dark-card border border-green-100 dark:border-green-900/30">
          <div className="w-10 h-10 rounded-2xl bg-green-100 dark:bg-green-900/40 flex items-center justify-center mb-3">
            <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <p className="text-xs font-semibold text-gray-500 dark:text-dark-muted">Revenue</p>
          <p className="text-xl font-bold text-green-600 dark:text-green-400 mt-1">
            {formatCurrency(revenue)}
          </p>
        </Card>

        {/* Expenses */}
        <Card className="p-5 bg-gradient-to-br from-red-50 to-white dark:from-red-900/20 dark:to-dark-card border border-red-100 dark:border-red-900/30">
          <div className="w-10 h-10 rounded-2xl bg-red-100 dark:bg-red-900/40 flex items-center justify-center mb-3">
            <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
          <p className="text-xs font-semibold text-gray-500 dark:text-dark-muted">Expenses</p>
          <p className="text-xl font-bold text-red-600 dark:text-red-400 mt-1">
            {formatCurrency(expenses)}
          </p>
        </Card>

        {/* Net */}
        <Card className={cn(
          'p-5 border',
          net >= 0 
            ? 'bg-gradient-to-br from-orange-50 to-white dark:from-orange-900/20 dark:to-dark-card border-orange-100 dark:border-orange-900/30' 
            : 'bg-gradient-to-br from-gray-50 to-white dark:from-gray-900/20 dark:to-dark-card border-gray-100 dark:border-gray-800'
        )}>
          <div className={cn(
            'w-10 h-10 rounded-2xl flex items-center justify-center mb-3',
            net >= 0 ? 'bg-orange-100 dark:bg-orange-900/40' : 'bg-gray-100 dark:bg-gray-800'
          )}>
            <DollarSign className={cn(
              'w-5 h-5',
              net >= 0 ? 'text-orange-600 dark:text-orange-400' : 'text-gray-600 dark:text-gray-400'
            )} />
          </div>
          <p className="text-xs font-semibold text-gray-500 dark:text-dark-muted">Net Profit</p>
          <p className={cn(
            'text-xl font-bold mt-1',
            net >= 0 ? 'text-orange-600 dark:text-orange-400' : 'text-gray-600 dark:text-gray-400'
          )}>
            {formatCurrency(net)}
          </p>
        </Card>
      </div>
    </div>
  )
}
