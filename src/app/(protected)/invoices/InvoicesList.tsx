'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ArrowUpDown, CalendarRange, ChevronRight, FileText, Search } from 'lucide-react'
import { formatCurrency, formatDateShort, formatRelativeDate, invoiceStatusConfig, cn } from '@/lib/utils'
import { InvoiceWithJob, InvoiceStatus } from '@/lib/supabase/types'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface InvoicesListProps {
  initialInvoices: InvoiceWithJob[]
}

type StatusFilter = 'all' | InvoiceStatus
type SortType = 'recent' | 'oldest' | 'highest' | 'due'

const statusFilterOptions: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'sent', label: 'Sent' },
  { value: 'deposit_paid', label: 'Deposit Paid' },
  { value: 'paid', label: 'Paid' },
]

const sortOptions: { value: SortType; label: string }[] = [
  { value: 'recent', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'highest', label: 'Highest value' },
  { value: 'due', label: 'Due date' },
]

export function InvoicesList({ initialInvoices }: InvoicesListProps) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [sort, setSort] = useState<SortType>('recent')

  const filteredInvoices = useMemo(() => {
    const searchLower = search.trim().toLowerCase()

    return initialInvoices
      .filter((invoice) => {
        const matchesSearch =
          searchLower === '' ||
          invoice.invoice_number.toString().includes(searchLower) ||
          invoice.customer_name.toLowerCase().includes(searchLower) ||
          invoice.jobs?.job_name?.toLowerCase().includes(searchLower)

        const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter

        return matchesSearch && matchesStatus
      })
      .sort((left, right) => {
        if (sort === 'oldest') {
          return Number(left.invoice_number) - Number(right.invoice_number)
        }

        if (sort === 'highest') {
          return Number(right.total) - Number(left.total)
        }

        if (sort === 'due') {
          const leftDue = left.due_date ? new Date(left.due_date).getTime() : Number.MAX_SAFE_INTEGER
          const rightDue = right.due_date ? new Date(right.due_date).getTime() : Number.MAX_SAFE_INTEGER
          return leftDue - rightDue
        }

        return Number(right.invoice_number) - Number(left.invoice_number)
      })
  }, [initialInvoices, search, sort, statusFilter])

  const statusCounts = useMemo(() => {
    return initialInvoices.reduce(
      (counts, invoice) => {
        counts.all += 1
        counts[invoice.status] += 1
        return counts
      },
      { all: 0, sent: 0, deposit_paid: 0, paid: 0 } satisfies Record<StatusFilter, number>
    )
  }, [initialInvoices])

  const currentViewSummary = useMemo(() => {
    return filteredInvoices.reduce(
      (summary, invoice) => {
        summary.total += Number(invoice.total)

        if (invoice.status !== 'paid') {
          summary.outstanding += Number(invoice.total)
        }

        return summary
      },
      { total: 0, outstanding: 0 }
    )
  }, [filteredInvoices])

  return (
    <>
      <Card className="mb-6 overflow-hidden">
        <div className="p-4 sm:p-5">
          <div className="space-y-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0 flex-1">
                <Input
                  placeholder="Search by invoice #, client, or job..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  icon={<Search className="h-5 w-5" />}
                />
              </div>

              <div className="w-full lg:w-[230px]">
                <Select value={sort} onValueChange={(value) => setSort(value as SortType)}>
                  <SelectTrigger>
                    <div className="flex items-center gap-2">
                      <ArrowUpDown className="h-4 w-4 text-navy-400 dark:text-dark-muted" />
                      <SelectValue placeholder="Sort invoices" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {sortOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {statusFilterOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setStatusFilter(option.value)}
                  className={cn(
                    'rounded-full border px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors',
                    statusFilter === option.value
                      ? 'border-navy-800 bg-navy-800 text-white dark:border-orange-400 dark:bg-orange-500'
                      : 'border-cream-300 bg-white text-navy-500 hover:bg-cream-100 dark:border-dark-border dark:bg-dark-card dark:text-dark-muted dark:hover:bg-dark-border'
                  )}
                >
                  {option.label} ({statusCounts[option.value]})
                </button>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-[24px] border border-cream-200 bg-cream-50/80 p-4 dark:border-dark-border dark:bg-dark-border/70">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-navy-500 dark:text-dark-muted">
                  In View
                </p>
                <p className="mt-2 text-lg font-semibold text-navy-800 dark:text-dark-text">{filteredInvoices.length}</p>
              </div>
              <div className="rounded-[24px] border border-cream-200 bg-cream-50/80 p-4 dark:border-dark-border dark:bg-dark-border/70">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-navy-500 dark:text-dark-muted">
                  Total
                </p>
                <p className="mt-2 text-lg font-semibold text-navy-800 dark:text-dark-text">
                  {formatCurrency(currentViewSummary.total)}
                </p>
              </div>
              <div className="rounded-[24px] border border-cream-200 bg-cream-50/80 p-4 dark:border-dark-border dark:bg-dark-border/70">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-navy-500 dark:text-dark-muted">
                  Outstanding
                </p>
                <p className="mt-2 text-lg font-semibold text-navy-800 dark:text-dark-text">
                  {formatCurrency(currentViewSummary.outstanding)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {filteredInvoices.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <FileText className="w-full h-full" />
          </div>
          <p className="empty-state-title">No invoices found</p>
          <p className="empty-state-description">
            {search ? 'Try a different search' : 'Create your first invoice'}
          </p>
          {!search && (
            <Button
              onClick={() => router.push('/invoices/new')}
              className="mt-4"
              variant="primary"
            >
              Create Invoice
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredInvoices.map((invoice) => {
            const statusConfig = invoiceStatusConfig[invoice.status]
            const isPastDue =
              invoice.status !== 'paid' &&
              !!invoice.due_date &&
              new Date(invoice.due_date).getTime() < Date.now()

            return (
              <Card
                key={invoice.id}
                onClick={() => router.push(`/invoices/${invoice.id}`)}
                className="cursor-pointer overflow-hidden transition-transform hover:-translate-y-0.5 active:scale-[0.99]"
              >
                <div className="p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-lg font-semibold text-navy-800 dark:text-dark-text">
                          #{invoice.invoice_number}
                        </span>
                        <Badge variant={invoice.status as any}>{statusConfig.label}</Badge>
                        {isPastDue && <Badge variant="danger">Past due</Badge>}
                      </div>

                      <p className="mt-3 text-base font-semibold text-navy-800 dark:text-dark-text">
                        {invoice.customer_name}
                      </p>

                      <div className="mt-2 space-y-2 text-sm text-navy-500 dark:text-dark-muted">
                        {invoice.jobs && (
                          <p className="line-clamp-1">
                            {invoice.jobs.job_name}
                            {invoice.jobs.address ? ` · ${invoice.jobs.address}` : ''}
                          </p>
                        )}
                        <div className="flex items-center gap-2">
                          <CalendarRange className="h-4 w-4 shrink-0" />
                          <span>
                            Sent {formatDateShort(invoice.invoice_date)}
                            {invoice.due_date ? ` · Due ${formatDateShort(invoice.due_date)}` : ''}
                          </span>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-navy-400 dark:text-dark-muted">
                        <span>
                          {invoice.due_date ? `Due ${formatRelativeDate(invoice.due_date)}` : 'No due date set'}
                        </span>
                        {invoice.jobs && <span>Linked job</span>}
                      </div>
                    </div>

                    <div className="ml-2 text-right">
                      <p className="text-lg font-semibold text-navy-800 dark:text-dark-text">
                        {formatCurrency(invoice.total)}
                      </p>
                      <ChevronRight className="ml-auto mt-3 h-5 w-5 text-navy-300 dark:text-dark-muted" />
                    </div>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </>
  )
}
