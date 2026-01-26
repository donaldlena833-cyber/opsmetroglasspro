'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Receipt,
  PieChart,
  BarChart3,
  ChevronRight,
  Download,
} from 'lucide-react'
import {
  formatCurrency,
  formatPercentChange,
  getSpendingCategoryDisplay,
  paymentMethodConfig,
  cn,
} from '@/lib/utils'
import { format } from 'date-fns'

interface ReportsDashboardProps {
  data: {
    month: { revenue: number; expenses: number; net: number; margin: number }
    lastMonth: { revenue: number; expenses: number; net: number }
    quarter: { revenue: number; expenses: number; net: number }
    year: { revenue: number; expenses: number; net: number }
    expensesByCategory: Record<string, number>
    paymentsByMethod: Record<string, number>
    monthlyTrend: { month: string; monthShort: string; revenue: number; expenses: number }[]
    jobProfitMargins: { id: string; job_name: string; invoiced: number; revenue: number; costs: number; profit: number; margin: number }[]
  }
}

type Period = 'month' | 'quarter' | 'year'

export function ReportsDashboard({ data }: ReportsDashboardProps) {
  const router = useRouter()
  const [period, setPeriod] = useState<Period>('month')

  const currentData = period === 'month' ? data.month : period === 'quarter' ? data.quarter : data.year
  
  // Calculate changes vs last month
  const revenueChange = data.lastMonth.revenue > 0 
    ? ((data.month.revenue - data.lastMonth.revenue) / data.lastMonth.revenue) * 100 
    : 0

  // Find max for bar chart scaling
  const maxTrendValue = Math.max(...data.monthlyTrend.map(m => Math.max(m.revenue, m.expenses)), 1)

  return (
    <div className="page-container safe-top">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white dark:bg-dark-card shadow-sm"
        >
          <ArrowLeft className="w-5 h-5 text-navy-800 dark:text-dark-text" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-navy-800 dark:text-dark-text">Reports</h1>
          <p className="text-sm text-gray-500 dark:text-dark-muted">{format(new Date(), 'MMMM yyyy')}</p>
        </div>
      </div>

      {/* Period Selector */}
      <div className="flex gap-2 mb-6">
        {(['month', 'quarter', 'year'] as Period[]).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={cn(
              'flex-1 py-2 px-4 rounded-xl text-sm font-medium transition-colors',
              period === p
                ? 'bg-navy-800 text-white dark:bg-orange-500'
                : 'bg-white dark:bg-dark-card text-gray-600 dark:text-dark-muted'
            )}
          >
            {p === 'month' ? 'This Month' : p === 'quarter' ? 'Quarter' : 'Year'}
          </button>
        ))}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="w-4 h-4 text-green-500" />
            <span className="text-xs text-gray-500 dark:text-dark-muted">Revenue</span>
          </div>
          <p className="text-xl font-bold text-navy-800 dark:text-dark-text">{formatCurrency(currentData.revenue)}</p>
          {period === 'month' && (
            <div className={cn(
              'flex items-center gap-1 text-xs mt-1',
              revenueChange >= 0 ? 'text-green-500' : 'text-red-500'
            )}>
              {revenueChange >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              <span>{formatPercentChange(revenueChange)} vs last month</span>
            </div>
          )}
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <Receipt className="w-4 h-4 text-red-500" />
            <span className="text-xs text-gray-500 dark:text-dark-muted">Expenses</span>
          </div>
          <p className="text-xl font-bold text-navy-800 dark:text-dark-text">{formatCurrency(currentData.expenses)}</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="w-4 h-4 text-blue-500" />
            <span className="text-xs text-gray-500 dark:text-dark-muted">Net Profit</span>
          </div>
          <p className={cn(
            'text-xl font-bold',
            currentData.net >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
          )}>
            {formatCurrency(currentData.net)}
          </p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <PieChart className="w-4 h-4 text-orange-500" />
            <span className="text-xs text-gray-500 dark:text-dark-muted">Profit Margin</span>
          </div>
          <p className={cn(
            'text-xl font-bold',
            data.month.margin >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
          )}>
            {data.month.margin.toFixed(1)}%
          </p>
        </Card>
      </div>

      {/* 6-Month Trend */}
      <Card className="mb-6">
        <CardContent>
          <h3 className="font-semibold text-navy-800 dark:text-dark-text mb-4">6-Month Trend</h3>
          <div className="flex items-end justify-between gap-2 h-32">
            {data.monthlyTrend.map((m) => (
              <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex flex-col gap-0.5" style={{ height: '100px' }}>
                  <div 
                    className="w-full bg-green-400 dark:bg-green-500 rounded-t transition-all"
                    style={{ height: `${(m.revenue / maxTrendValue) * 100}%` }}
                  />
                  <div 
                    className="w-full bg-red-400 dark:bg-red-500 rounded-b transition-all"
                    style={{ height: `${(m.expenses / maxTrendValue) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500 dark:text-dark-muted">{m.monthShort}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-center gap-6 mt-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-400 rounded" />
              <span className="text-xs text-gray-500 dark:text-dark-muted">Revenue</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-400 rounded" />
              <span className="text-xs text-gray-500 dark:text-dark-muted">Expenses</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Expenses by Category */}
      {Object.keys(data.expensesByCategory).length > 0 && (
        <Card className="mb-6">
          <CardContent>
            <h3 className="font-semibold text-navy-800 dark:text-dark-text mb-4">Expenses by Category</h3>
            <div className="space-y-3">
              {Object.entries(data.expensesByCategory)
                .sort(([, a], [, b]) => b - a)
                .map(([category, amount]) => {
                  const display = getSpendingCategoryDisplay(category as any)
                  const percentage = (amount / data.month.expenses) * 100

                  return (
                    <div key={category} className="flex items-center gap-3">
                      <span className="text-lg w-6">{display.icon}</span>
                      <div className="flex-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-dark-muted">{display.label}</span>
                          <span className="font-medium text-navy-800 dark:text-dark-text">{formatCurrency(amount)}</span>
                        </div>
                        <div className="h-2 bg-gray-100 dark:bg-dark-border rounded-full mt-1">
                          <div
                            className="h-full bg-orange-500 rounded-full transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payments by Method */}
      {Object.keys(data.paymentsByMethod).length > 0 && (
        <Card className="mb-6">
          <CardContent>
            <h3 className="font-semibold text-navy-800 dark:text-dark-text mb-4">Revenue by Payment Method</h3>
            <div className="space-y-2">
              {Object.entries(data.paymentsByMethod)
                .sort(([, a], [, b]) => b - a)
                .map(([method, amount]) => {
                  const config = paymentMethodConfig[method as keyof typeof paymentMethodConfig]
                  const percentage = (amount / data.month.revenue) * 100

                  return (
                    <div key={method} className="flex items-center justify-between py-2">
                      <span className="text-sm text-gray-600 dark:text-dark-muted">{config?.label || method}</span>
                      <div className="flex items-center gap-3">
                        <div className="w-24 h-2 bg-gray-100 dark:bg-dark-border rounded-full">
                          <div
                            className="h-full bg-green-500 rounded-full"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="font-medium text-navy-800 dark:text-dark-text w-20 text-right">{formatCurrency(amount)}</span>
                      </div>
                    </div>
                  )
                })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Job Profit Margins */}
      {data.jobProfitMargins.length > 0 && (
        <Card className="mb-6">
          <CardContent>
            <h3 className="font-semibold text-navy-800 dark:text-dark-text mb-4">Recent Job Margins</h3>
            <div className="space-y-3">
              {data.jobProfitMargins.slice(0, 5).map((job) => (
                <button
                  key={job.id}
                  onClick={() => router.push(`/jobs/${job.id}`)}
                  className="w-full flex items-center justify-between p-3 bg-cream-50 dark:bg-dark-border rounded-xl hover:bg-cream-100 dark:hover:bg-dark-card transition-colors text-left"
                >
                  <div>
                    <p className="font-medium text-navy-800 dark:text-dark-text text-sm">{job.job_name}</p>
                    <p className="text-xs text-gray-500 dark:text-dark-muted">
                      Revenue: {formatCurrency(job.revenue)} | Costs: {formatCurrency(job.costs)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={cn(
                      'font-bold',
                      job.margin >= 30 ? 'text-green-600 dark:text-green-400' : 
                      job.margin >= 15 ? 'text-orange-600 dark:text-orange-400' : 
                      'text-red-600 dark:text-red-400'
                    )}>
                      {job.margin}%
                    </p>
                    <p className={cn(
                      'text-xs',
                      job.profit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                    )}>
                      {formatCurrency(job.profit)}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      <Card>
        <CardContent>
          <h3 className="font-semibold text-navy-800 dark:text-dark-text mb-4">Quick Comparison</h3>
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-gray-100 dark:border-dark-border">
              <span className="text-gray-500 dark:text-dark-muted">This Month</span>
              <span className="font-medium text-navy-800 dark:text-dark-text">{formatCurrency(data.month.net)}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100 dark:border-dark-border">
              <span className="text-gray-500 dark:text-dark-muted">Last Month</span>
              <span className="font-medium text-navy-800 dark:text-dark-text">{formatCurrency(data.lastMonth.net)}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100 dark:border-dark-border">
              <span className="text-gray-500 dark:text-dark-muted">This Quarter</span>
              <span className="font-medium text-navy-800 dark:text-dark-text">{formatCurrency(data.quarter.net)}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-500 dark:text-dark-muted">Year to Date</span>
              <span className="font-bold text-navy-800 dark:text-dark-text">{formatCurrency(data.year.net)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
