'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useToast } from '@/components/ui/use-toast'
import {
  Search,
  Plus,
  TrendingUp,
  TrendingDown,
  Calendar,
  Trash2,
  Receipt,
  Filter,
} from 'lucide-react'
import {
  formatCurrency,
  formatDateShort,
  expenseCategoryConfig,
  paymentMethodConfig,
  getSpendingCategoryDisplay,
  cn,
} from '@/lib/utils'
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns'

interface ExpensesDashboardProps {
  data: {
    expenses: any[]
    thisMonthTotal: number
    lastMonthTotal: number
    categoryBreakdown: Record<string, number>
    percentChange: number
  }
}

type TimeFilter = 'this_month' | 'last_month' | 'last_3_months' | 'all'
type CategoryFilter = 'all' | string

export function ExpensesDashboard({ data }: ExpensesDashboardProps) {
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  const [expenses, setExpenses] = useState(data.expenses)
  const [search, setSearch] = useState('')
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('this_month')
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all')
  const [deleteExpenseId, setDeleteExpenseId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Filter expenses
  const filteredExpenses = expenses.filter((expense) => {
    // Search filter
    const searchLower = search.toLowerCase()
    const matchesSearch = search === '' ||
      expense.vendor.toLowerCase().includes(searchLower) ||
      expense.jobs?.job_name?.toLowerCase().includes(searchLower)

    if (!matchesSearch) return false

    // Category filter
    if (categoryFilter !== 'all' && expense.category !== categoryFilter) {
      return false
    }

    // Time filter
    const expenseDate = new Date(expense.date)
    const now = new Date()
    
    switch (timeFilter) {
      case 'this_month':
        return expenseDate >= startOfMonth(now) && expenseDate <= endOfMonth(now)
      case 'last_month':
        const lastMonth = subMonths(now, 1)
        return expenseDate >= startOfMonth(lastMonth) && expenseDate <= endOfMonth(lastMonth)
      case 'last_3_months':
        const threeMonthsAgo = subMonths(now, 3)
        return expenseDate >= startOfMonth(threeMonthsAgo)
      case 'all':
      default:
        return true
    }
  })

  const filteredTotal = filteredExpenses.reduce((sum, e) => sum + Number(e.amount), 0)

  const handleDelete = async () => {
    if (!deleteExpenseId) return
    setDeleting(true)

    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', deleteExpenseId)

    if (error) {
      toast({ title: 'Error', description: 'Failed to delete expense', variant: 'destructive' })
      setDeleting(false)
      return
    }

    setExpenses(expenses.filter(e => e.id !== deleteExpenseId))
    toast({ title: 'Deleted', description: 'Expense removed', variant: 'success' })
    setDeleteExpenseId(null)
    setDeleting(false)
  }

  return (
    <div className="page-container safe-top">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">Expenses</h1>
        <p className="page-subtitle">{format(new Date(), 'MMMM yyyy')}</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Card className="p-4">
          <p className="text-xs text-gray-500 mb-1">This Month</p>
          <p className="text-xl font-bold text-navy-800">{formatCurrency(data.thisMonthTotal)}</p>
          <div className={cn(
            'flex items-center gap-1 text-xs mt-1',
            data.percentChange > 0 ? 'text-red-500' : 'text-green-500'
          )}>
            {data.percentChange > 0 ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            <span>{Math.abs(data.percentChange).toFixed(0)}% vs last month</span>
          </div>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-gray-500 mb-1">Filtered Total</p>
          <p className="text-xl font-bold text-navy-800">{formatCurrency(filteredTotal)}</p>
          <p className="text-xs text-gray-400 mt-1">{filteredExpenses.length} expenses</p>
        </Card>
      </div>

      {/* Category Breakdown */}
      {Object.keys(data.categoryBreakdown).length > 0 && (
        <Card className="mb-6">
          <CardContent>
            <h3 className="text-sm font-semibold text-navy-800 mb-3">This Month by Category</h3>
            <div className="space-y-2">
              {Object.entries(data.categoryBreakdown)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5)
                .map(([category, amount]) => {
                  const display = getSpendingCategoryDisplay(category as any)
                  const percentage = (amount / data.thisMonthTotal) * 100

                  return (
                    <div key={category} className="flex items-center gap-2">
                      <span className="text-lg w-6">{display.icon}</span>
                      <div className="flex-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">{display.label}</span>
                          <span className="font-medium text-navy-800">{formatCurrency(amount)}</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full mt-1">
                          <div
                            className="h-full bg-orange-500 rounded-full"
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

      {/* Filters */}
      <div className="space-y-3 mb-4">
        <Input
          placeholder="Search vendor or job..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          icon={<Search className="w-5 h-5" />}
        />

        <div className="flex gap-2">
          <Select value={timeFilter} onValueChange={(v) => setTimeFilter(v as TimeFilter)}>
            <SelectTrigger className="flex-1">
              <Calendar className="w-4 h-4 mr-2 text-gray-400" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="this_month">This Month</SelectItem>
              <SelectItem value="last_month">Last Month</SelectItem>
              <SelectItem value="last_3_months">Last 3 Months</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>

          <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v)}>
            <SelectTrigger className="flex-1">
              <Filter className="w-4 h-4 mr-2 text-gray-400" />
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {Object.entries(expenseCategoryConfig).map(([value, config]) => (
                <SelectItem key={value} value={value}>
                  {config.icon} {config.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Expenses List */}
      {filteredExpenses.length === 0 ? (
        <div className="empty-state py-12">
          <Receipt className="empty-state-icon w-12 h-12" />
          <p className="empty-state-title">No expenses found</p>
          <p className="empty-state-description">
            {search || categoryFilter !== 'all' ? 'Try different filters' : 'Add your first expense'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredExpenses.map((expense) => {
            const categoryConfig = expenseCategoryConfig[expense.category as keyof typeof expenseCategoryConfig]
            const methodConfig = paymentMethodConfig[expense.payment_method as keyof typeof paymentMethodConfig]

            return (
              <Card key={expense.id} className="p-4 relative group">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    {expense.receipt_image_url ? (
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                        <img
                          src={expense.receipt_image_url}
                          alt="Receipt"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-xl">{categoryConfig?.icon || '📋'}</span>
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-navy-800">{expense.vendor}</p>
                      <p className="text-sm text-gray-500">{categoryConfig?.label || expense.category}</p>
                      {expense.jobs && (
                        <button
                          onClick={() => router.push(`/jobs/${expense.jobs.id}`)}
                          className="text-xs text-navy-600 hover:underline"
                        >
                          {expense.jobs.job_name}
                        </button>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-400">{formatDateShort(expense.date)}</span>
                        <span className="text-xs text-gray-300">•</span>
                        <span className="text-xs text-gray-400">{methodConfig?.label || expense.payment_method}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <p className="font-semibold text-navy-800">{formatCurrency(expense.amount)}</p>
                    <button
                      onClick={() => setDeleteExpenseId(expense.id)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-opacity"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Add Expense FAB */}
      <Button
        onClick={() => router.push('/jobs/expense/quick')}
        variant="primary"
        size="icon-lg"
        className="fixed right-4 bottom-24 shadow-lg"
      >
        <Plus className="w-6 h-6" />
      </Button>

      {/* Delete Dialog */}
      <Dialog open={!!deleteExpenseId} onOpenChange={() => setDeleteExpenseId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Expense?</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this expense? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteExpenseId(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} loading={deleting}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
