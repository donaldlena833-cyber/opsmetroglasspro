'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
  ArrowUpRight,
  FileText,
  Filter,
  ImageIcon,
  Plus,
  Receipt,
  Search,
  Trash2,
} from 'lucide-react'
import {
  formatCurrency,
  formatDate,
  formatDateShort,
  expenseCategoryConfig,
  paymentMethodConfig,
  getSpendingCategoryDisplay,
  cn,
} from '@/lib/utils'
import { ExpenseCategory, ExpenseWithJob } from '@/lib/supabase/types'
import { endOfMonth, format, startOfMonth, subMonths } from 'date-fns'

type ExpenseRecord = ExpenseWithJob & {
  jobs: { id: string; job_name: string } | null
}

interface ExpensesDashboardProps {
  data: {
    expenses: ExpenseRecord[]
    thisMonthTotal: number
    lastMonthTotal: number
    categoryBreakdown: Record<string, number>
    percentChange: number
  }
}

type TimeFilter = 'this_month' | 'last_month' | 'last_3_months' | 'all'
type CategoryFilter = 'all' | string
type ViewMode = 'history' | 'receipts'

const timeFilterOptions: { value: TimeFilter; label: string }[] = [
  { value: 'all', label: 'All Time' },
  { value: 'this_month', label: 'This Month' },
  { value: 'last_month', label: 'Last Month' },
  { value: 'last_3_months', label: 'Last 3 Months' },
]

const viewModeOptions: { value: ViewMode; label: string }[] = [
  { value: 'history', label: 'History' },
  { value: 'receipts', label: 'Receipts' },
]

function isDocumentUrl(url: string | null) {
  return !!url && /\.pdf(\?|$)/i.test(url)
}

export function ExpensesDashboard({ data }: ExpensesDashboardProps) {
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  const [expenses, setExpenses] = useState(data.expenses)
  const [search, setSearch] = useState('')
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all')
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all')
  const [viewMode, setViewMode] = useState<ViewMode>('history')
  const [deleteExpenseId, setDeleteExpenseId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [activeReceipt, setActiveReceipt] = useState<ExpenseRecord | null>(null)

  const allTimeTotal = useMemo(
    () => expenses.reduce((sum, expense) => sum + Number(expense.amount), 0),
    [expenses]
  )

  const receiptsOnFile = useMemo(
    () => expenses.filter((expense) => !!expense.receipt_image_url).length,
    [expenses]
  )

  const linkedJobExpenses = useMemo(
    () => expenses.filter((expense) => !!expense.jobs).length,
    [expenses]
  )

  const filteredExpenses = useMemo(() => {
    const now = new Date()
    const lastMonth = subMonths(now, 1)
    const threeMonthsAgo = subMonths(now, 3)
    const searchLower = search.trim().toLowerCase()

    return expenses.filter((expense) => {
      const matchesSearch =
        searchLower === '' ||
        expense.vendor.toLowerCase().includes(searchLower) ||
        expense.jobs?.job_name?.toLowerCase().includes(searchLower) ||
        expense.note?.toLowerCase().includes(searchLower)

      if (!matchesSearch) return false

      if (categoryFilter !== 'all' && expense.category !== categoryFilter) {
        return false
      }

      const expenseDate = new Date(expense.date)

      switch (timeFilter) {
        case 'this_month':
          return expenseDate >= startOfMonth(now) && expenseDate <= endOfMonth(now)
        case 'last_month':
          return expenseDate >= startOfMonth(lastMonth) && expenseDate <= endOfMonth(lastMonth)
        case 'last_3_months':
          return expenseDate >= startOfMonth(threeMonthsAgo)
        case 'all':
        default:
          return true
      }
    })
  }, [categoryFilter, expenses, search, timeFilter])

  const filteredTotal = useMemo(
    () => filteredExpenses.reduce((sum, expense) => sum + Number(expense.amount), 0),
    [filteredExpenses]
  )

  const filteredReceipts = useMemo(
    () => filteredExpenses.filter((expense) => !!expense.receipt_image_url),
    [filteredExpenses]
  )

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

    setExpenses((current) => current.filter((expense) => expense.id !== deleteExpenseId))
    toast({ title: 'Deleted', description: 'Expense removed', variant: 'success' })
    setDeleteExpenseId(null)
    setDeleting(false)
  }

  const openReceiptInNewTab = (url: string | null) => {
    if (!url) return
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const activeReceiptIsDocument = isDocumentUrl(activeReceipt?.receipt_image_url ?? null)

  return (
    <div className="page-container safe-top">
      <div className="page-header gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-orange-700 dark:text-orange-300">
            Expense Center
          </p>
          <h1 className="page-title">All expenses</h1>
          <p className="page-subtitle max-w-2xl">
            Browse every expense ever registered, with receipt files, filters, and job context in one place.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => router.push('/jobs/expense/new')}>
            Detailed
          </Button>
          <Button variant="primary" onClick={() => router.push('/jobs/expense/quick')}>
            <Plus className="mr-2 h-4 w-4" />
            Quick Expense
          </Button>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Card className="p-4">
          <p className="stat-label">All Time</p>
          <p className="stat-value">{formatCurrency(allTimeTotal)}</p>
          <p className="mt-1 text-xs text-navy-400 dark:text-dark-muted">{expenses.length} total expenses</p>
        </Card>

        <Card className="p-4">
          <p className="stat-label">This Month</p>
          <p className="stat-value">{formatCurrency(data.thisMonthTotal)}</p>
          <p
            className={cn(
              'mt-1 text-xs font-medium',
              data.percentChange > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
            )}
          >
            {Math.abs(data.percentChange).toFixed(0)}% vs last month
          </p>
        </Card>

        <Card className="p-4">
          <p className="stat-label">Receipts</p>
          <p className="stat-value">{receiptsOnFile}</p>
          <p className="mt-1 text-xs text-navy-400 dark:text-dark-muted">Files available to review</p>
        </Card>

        <Card className="p-4">
          <p className="stat-label">Linked Jobs</p>
          <p className="stat-value">{linkedJobExpenses}</p>
          <p className="mt-1 text-xs text-navy-400 dark:text-dark-muted">{formatCurrency(filteredTotal)} in current view</p>
        </Card>
      </div>

      {Object.keys(data.categoryBreakdown).length > 0 && (
        <Card className="mb-6 overflow-hidden">
          <CardContent className="p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-navy-500 dark:text-dark-muted">
                  This Month
                </p>
                <h3 className="mt-1 text-lg font-semibold text-navy-800 dark:text-dark-text">
                  Spend by category
                </h3>
              </div>
              <Badge variant="secondary">{formatCurrency(data.thisMonthTotal)}</Badge>
            </div>

            <div className="space-y-3">
              {Object.entries(data.categoryBreakdown)
                .sort(([, a], [, b]) => b - a)
                .map(([category, amount]) => {
                  const display = getSpendingCategoryDisplay(category as ExpenseCategory)
                  const percentage = data.thisMonthTotal > 0 ? (amount / data.thisMonthTotal) * 100 : 0

                  return (
                    <div key={category} className="flex items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-cream-100 text-xl dark:bg-dark-border">
                        {display.icon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                          <span className="font-medium text-navy-700 dark:text-dark-text">{display.label}</span>
                          <span className="font-semibold text-navy-800 dark:text-dark-text">
                            {formatCurrency(amount)}
                          </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-cream-200 dark:bg-dark-border">
                          <div
                            className="h-full rounded-full bg-orange-500"
                            style={{ width: `${Math.max(percentage, 4)}%` }}
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

      <Card className="mb-6 overflow-hidden">
        <CardContent className="p-4 sm:p-5">
          <div className="space-y-4">
            <Input
              placeholder="Search vendor, note, or job..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              icon={<Search className="h-5 w-5" />}
            />

            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex flex-wrap gap-2">
                {timeFilterOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setTimeFilter(option.value)}
                    className={cn(
                      'rounded-full border px-4 py-2 text-sm font-medium transition-colors',
                      timeFilter === option.value
                        ? 'border-navy-800 bg-navy-800 text-white dark:border-orange-400 dark:bg-orange-500 dark:text-white'
                        : 'border-cream-300 bg-cream-100 text-navy-600 hover:bg-cream-200 dark:border-dark-border dark:bg-dark-card dark:text-dark-text dark:hover:bg-dark-border'
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="flex gap-2">
                  {viewModeOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setViewMode(option.value)}
                      className={cn(
                        'rounded-full border px-4 py-2 text-sm font-medium transition-colors',
                        viewMode === option.value
                          ? 'border-orange-300 bg-orange-50 text-orange-700 dark:border-orange-700 dark:bg-orange-900/20 dark:text-orange-300'
                          : 'border-cream-300 bg-white text-navy-500 hover:bg-cream-100 dark:border-dark-border dark:bg-dark-card dark:text-dark-muted dark:hover:bg-dark-border'
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>

                <div className="min-w-[220px]">
                  <Select value={categoryFilter} onValueChange={(value) => setCategoryFilter(value)}>
                    <SelectTrigger>
                      <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 text-navy-400 dark:text-dark-muted" />
                        <SelectValue placeholder="Category" />
                      </div>
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
            </div>
          </div>
        </CardContent>
      </Card>

      {filteredExpenses.length === 0 ? (
        <div className="empty-state py-12">
          <Receipt className="empty-state-icon w-12 h-12" />
          <p className="empty-state-title">No expenses found</p>
          <p className="empty-state-description">
            Try different filters or add a new expense.
          </p>
        </div>
      ) : viewMode === 'receipts' ? (
        filteredReceipts.length === 0 ? (
          <div className="empty-state py-12">
            <ImageIcon className="empty-state-icon w-12 h-12" />
            <p className="empty-state-title">No receipts in this view</p>
            <p className="empty-state-description">
              Switch filters or add receipt images when logging expenses.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
            {filteredReceipts.map((expense) => (
              <Card key={expense.id} className="overflow-hidden">
                <button
                  type="button"
                  onClick={() => setActiveReceipt(expense)}
                  className="block w-full text-left"
                >
                  <div className="relative aspect-[4/5] overflow-hidden bg-cream-100 dark:bg-dark-border">
                    {isDocumentUrl(expense.receipt_image_url) ? (
                      <div className="flex h-full flex-col items-center justify-center gap-3 px-4 text-center">
                        <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-white text-navy-700 shadow-soft dark:bg-dark-card dark:text-dark-text">
                          <FileText className="h-7 w-7" />
                        </div>
                        <p className="text-sm font-medium text-navy-700 dark:text-dark-text">Open receipt file</p>
                      </div>
                    ) : (
                      <img
                        src={expense.receipt_image_url!}
                        alt={`Receipt for ${expense.vendor}`}
                        className="h-full w-full object-cover"
                      />
                    )}

                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent p-3">
                      <p className="text-sm font-semibold text-white">{expense.vendor}</p>
                      <p className="text-xs text-white/80">{formatDateShort(expense.date)}</p>
                    </div>
                  </div>
                </button>

                <div className="space-y-2 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <Badge variant="secondary">{expenseCategoryConfig[expense.category]?.label || expense.category}</Badge>
                    <span className="text-sm font-semibold text-navy-800 dark:text-dark-text">
                      {formatCurrency(expense.amount)}
                    </span>
                  </div>

                  {expense.jobs ? (
                    <button
                      type="button"
                      onClick={() => router.push(`/jobs/${expense.jobs!.id}`)}
                      className="flex items-center gap-1 text-sm font-medium text-navy-600 hover:text-navy-800 dark:text-orange-300 dark:hover:text-orange-200"
                    >
                      {expense.jobs.job_name}
                      <ArrowUpRight className="h-4 w-4" />
                    </button>
                  ) : (
                    <p className="text-sm text-navy-400 dark:text-dark-muted">General business expense</p>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )
      ) : (
        <div className="space-y-3">
          {filteredExpenses.map((expense) => {
            const categoryConfig = expenseCategoryConfig[expense.category]
            const methodConfig = paymentMethodConfig[expense.payment_method]
            const hasReceipt = !!expense.receipt_image_url

            return (
              <Card key={expense.id} className="overflow-hidden">
                <div className="p-4 sm:p-5">
                  <div className="flex items-start gap-4">
                    {hasReceipt ? (
                      <button
                        type="button"
                        onClick={() => setActiveReceipt(expense)}
                        className="h-20 w-20 shrink-0 overflow-hidden rounded-[22px] border border-cream-200 bg-cream-100 shadow-soft dark:border-dark-border dark:bg-dark-border"
                      >
                        {isDocumentUrl(expense.receipt_image_url) ? (
                          <div className="flex h-full items-center justify-center">
                            <FileText className="h-7 w-7 text-navy-600 dark:text-dark-text" />
                          </div>
                        ) : (
                          <img
                            src={expense.receipt_image_url!}
                            alt={`Receipt for ${expense.vendor}`}
                            className="h-full w-full object-cover"
                          />
                        )}
                      </button>
                    ) : (
                      <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[22px] border border-cream-200 bg-cream-100 text-3xl shadow-soft dark:border-dark-border dark:bg-dark-border">
                        {categoryConfig?.icon || '📋'}
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-lg font-semibold text-navy-800 dark:text-dark-text">
                              {expense.vendor}
                            </h3>
                            <Badge variant="default">{categoryConfig?.label || expense.category}</Badge>
                            {hasReceipt && <Badge variant="secondary">Receipt attached</Badge>}
                          </div>

                          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-navy-500 dark:text-dark-muted">
                            <span>{formatDateShort(expense.date)}</span>
                            <span className="text-navy-300 dark:text-dark-border">•</span>
                            <span>{methodConfig?.label || expense.payment_method}</span>
                            {expense.jobs && (
                              <>
                                <span className="text-navy-300 dark:text-dark-border">•</span>
                                <button
                                  type="button"
                                  onClick={() => router.push(`/jobs/${expense.jobs!.id}`)}
                                  className="font-medium text-navy-700 hover:text-navy-900 dark:text-orange-300 dark:hover:text-orange-200"
                                >
                                  {expense.jobs.job_name}
                                </button>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="flex items-start justify-between gap-3 sm:flex-col sm:items-end">
                          <p className="text-lg font-semibold text-navy-800 dark:text-dark-text">
                            {formatCurrency(expense.amount)}
                          </p>
                          <button
                            type="button"
                            onClick={() => setDeleteExpenseId(expense.id)}
                            className="rounded-2xl border border-red-200 bg-red-50 p-2 text-red-600 transition-colors hover:bg-red-100 dark:border-red-900/50 dark:bg-red-900/15 dark:text-red-300 dark:hover:bg-red-900/25"
                            aria-label={`Delete expense from ${expense.vendor}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {expense.note && (
                        <p className="mt-3 line-clamp-2 text-sm leading-6 text-navy-500 dark:text-dark-muted">
                          {expense.note}
                        </p>
                      )}

                      <div className="mt-4 flex flex-wrap gap-2">
                        {hasReceipt && (
                          <button
                            type="button"
                            onClick={() => setActiveReceipt(expense)}
                            className="rounded-full border border-orange-200 bg-orange-50 px-3 py-2 text-sm font-medium text-orange-700 transition-colors hover:bg-orange-100 dark:border-orange-800 dark:bg-orange-900/20 dark:text-orange-300 dark:hover:bg-orange-900/30"
                          >
                            View receipt
                          </button>
                        )}

                        {expense.jobs ? (
                          <button
                            type="button"
                            onClick={() => router.push(`/jobs/${expense.jobs!.id}`)}
                            className="rounded-full border border-cream-300 bg-white px-3 py-2 text-sm font-medium text-navy-700 transition-colors hover:bg-cream-100 dark:border-dark-border dark:bg-dark-card dark:text-dark-text dark:hover:bg-dark-border"
                          >
                            Open job
                          </button>
                        ) : (
                          <span className="rounded-full border border-cream-300 bg-cream-100 px-3 py-2 text-sm text-navy-500 dark:border-dark-border dark:bg-dark-border dark:text-dark-muted">
                            Not linked to a job
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <Button
        onClick={() => router.push('/jobs/expense/quick')}
        variant="primary"
        size="icon-lg"
        className="fixed bottom-24 right-4 shadow-lg"
      >
        <Plus className="h-6 w-6" />
      </Button>

      <Dialog open={!!activeReceipt} onOpenChange={(open) => !open && setActiveReceipt(null)}>
        <DialogContent className="max-w-3xl">
          {activeReceipt && (
            <>
              <DialogHeader>
                <DialogTitle>{activeReceipt.vendor}</DialogTitle>
                <DialogDescription>
                  {formatDate(activeReceipt.date)} · {formatCurrency(activeReceipt.amount)}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {activeReceipt.receipt_image_url && !activeReceiptIsDocument ? (
                  <div className="overflow-hidden rounded-[28px] border border-cream-200 bg-cream-50 dark:border-dark-border dark:bg-dark-border">
                    <img
                      src={activeReceipt.receipt_image_url}
                      alt={`Receipt for ${activeReceipt.vendor}`}
                      className="max-h-[70vh] w-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="rounded-[28px] border border-cream-200 bg-cream-50 p-10 text-center dark:border-dark-border dark:bg-dark-border">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-white text-navy-700 shadow-soft dark:bg-dark-card dark:text-dark-text">
                      <FileText className="h-8 w-8" />
                    </div>
                    <p className="mt-4 text-base font-semibold text-navy-800 dark:text-dark-text">
                      Receipt file ready to open
                    </p>
                    <p className="mt-2 text-sm text-navy-500 dark:text-dark-muted">
                      This receipt was uploaded as a document instead of an image preview.
                    </p>
                  </div>
                )}

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-3xl border border-cream-200 bg-cream-50 p-4 dark:border-dark-border dark:bg-dark-border">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-navy-500 dark:text-dark-muted">
                      Category
                    </p>
                    <p className="mt-2 font-semibold text-navy-800 dark:text-dark-text">
                      {expenseCategoryConfig[activeReceipt.category]?.label || activeReceipt.category}
                    </p>
                  </div>
                  <div className="rounded-3xl border border-cream-200 bg-cream-50 p-4 dark:border-dark-border dark:bg-dark-border">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-navy-500 dark:text-dark-muted">
                      Payment Method
                    </p>
                    <p className="mt-2 font-semibold text-navy-800 dark:text-dark-text">
                      {paymentMethodConfig[activeReceipt.payment_method]?.label || activeReceipt.payment_method}
                    </p>
                  </div>
                  <div className="rounded-3xl border border-cream-200 bg-cream-50 p-4 dark:border-dark-border dark:bg-dark-border">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-navy-500 dark:text-dark-muted">
                      Job
                    </p>
                    <p className="mt-2 font-semibold text-navy-800 dark:text-dark-text">
                      {activeReceipt.jobs?.job_name || 'General business expense'}
                    </p>
                  </div>
                  <div className="rounded-3xl border border-cream-200 bg-cream-50 p-4 dark:border-dark-border dark:bg-dark-border">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-navy-500 dark:text-dark-muted">
                      Note
                    </p>
                    <p className="mt-2 text-sm leading-6 text-navy-600 dark:text-dark-muted">
                      {activeReceipt.note || 'No extra note added.'}
                    </p>
                  </div>
                </div>
              </div>

              <DialogFooter className="gap-2">
                {activeReceipt.receipt_image_url && (
                  <Button variant="outline" onClick={() => openReceiptInNewTab(activeReceipt.receipt_image_url)}>
                    Open original
                  </Button>
                )}
                {activeReceipt.jobs && (
                  <Button variant="primary" onClick={() => router.push(`/jobs/${activeReceipt.jobs!.id}`)}>
                    Open job
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteExpenseId} onOpenChange={() => setDeleteExpenseId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete expense?</DialogTitle>
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
