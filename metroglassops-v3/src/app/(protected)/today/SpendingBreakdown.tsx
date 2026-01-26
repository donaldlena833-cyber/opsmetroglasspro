'use client'

import { Card } from '@/components/ui/card'
import { formatCurrency, getSpendingCategoryDisplay, cn } from '@/lib/utils'
import { ExpenseCategory } from '@/lib/supabase/types'
import { PieChart } from 'lucide-react'

interface SpendingBreakdownProps {
  expenses: Record<string, number>
  total: number
}

export function SpendingBreakdown({ expenses, total }: SpendingBreakdownProps) {
  // Sort by amount descending
  const sortedExpenses = Object.entries(expenses)
    .sort(([, a], [, b]) => b - a)

  // Combine glass categories
  const combinedExpenses: { category: string; amount: number; display: ReturnType<typeof getSpendingCategoryDisplay> }[] = []
  
  sortedExpenses.forEach(([category, amount]) => {
    const display = getSpendingCategoryDisplay(category as ExpenseCategory)
    combinedExpenses.push({ category, amount, display })
  })

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <PieChart className="w-4 h-4 text-purple-500" />
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
          Where Money is Going
        </h2>
      </div>
      <Card className="p-4">
        <div className="space-y-3">
          {combinedExpenses.map(({ category, amount, display }) => {
            const percentage = total > 0 ? (amount / total) * 100 : 0

            return (
              <div key={category} className="flex items-center gap-3">
                <div className="text-xl w-8 flex-shrink-0">
                  {display.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-navy-800">
                      {display.label}
                    </span>
                    <span className="text-sm font-semibold text-navy-800">
                      {formatCurrency(amount)}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all duration-500',
                        category === 'glass_fabrication' || category === 'mr_glass' ? 'bg-blue-500' :
                        category === 'crl' || category === 'home_depot' ? 'bg-orange-500' :
                        category === 'uhaul' || category === 'parking' || category === 'tolls' ? 'bg-purple-500' :
                        category === 'meals' ? 'bg-yellow-500' :
                        category === 'referral_payout' ? 'bg-green-500' :
                        'bg-gray-400'
                      )}
                      style={{ width: `${Math.max(percentage, 2)}%` }}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Total */}
        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-500">Total Expenses</span>
          <span className="text-lg font-bold text-navy-800">{formatCurrency(total)}</span>
        </div>
      </Card>
    </div>
  )
}
