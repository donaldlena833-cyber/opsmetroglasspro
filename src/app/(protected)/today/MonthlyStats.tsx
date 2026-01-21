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
    <div className="mb-6">
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
        {monthName} Overview
      </h2>
      <div className="grid grid-cols-3 gap-3">
        {/* Revenue */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5 text-green-600" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">Revenue</p>
          <p className="text-lg font-bold text-navy-800 mt-0.5">
            {formatCurrency(revenue)}
          </p>
        </Card>

        {/* Expenses */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center">
              <TrendingDown className="w-3.5 h-3.5 text-red-600" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">Expenses</p>
          <p className="text-lg font-bold text-navy-800 mt-0.5">
            {formatCurrency(expenses)}
          </p>
        </Card>

        {/* Net */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <div className={cn(
              'w-6 h-6 rounded-full flex items-center justify-center',
              net >= 0 ? 'bg-green-100' : 'bg-red-100'
            )}>
              <DollarSign className={cn(
                'w-3.5 h-3.5',
                net >= 0 ? 'text-green-600' : 'text-red-600'
              )} />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">Net Profit</p>
          <p className={cn(
            'text-lg font-bold mt-0.5',
            net >= 0 ? 'text-green-600' : 'text-red-600'
          )}>
            {formatCurrency(net)}
          </p>
        </Card>
      </div>
    </div>
  )
}
