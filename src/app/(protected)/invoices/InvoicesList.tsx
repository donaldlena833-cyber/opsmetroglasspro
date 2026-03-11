'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, Plus, ChevronRight, FileText } from 'lucide-react'
import { formatCurrency, formatDateShort, invoiceStatusConfig, cn } from '@/lib/utils'
import { InvoiceWithJob, InvoiceStatus } from '@/lib/supabase/types'

interface InvoicesListProps {
  initialInvoices: InvoiceWithJob[]
}

type StatusFilter = 'all' | InvoiceStatus

const statusFilterOptions: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'sent', label: 'Sent' },
  { value: 'deposit_paid', label: 'Deposit Paid' },
  { value: 'paid', label: 'Paid' },
]

export function InvoicesList({ initialInvoices }: InvoicesListProps) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

  const filteredInvoices = initialInvoices.filter((invoice) => {
    const searchLower = search.toLowerCase()
    const matchesSearch =
      search === '' ||
      invoice.invoice_number.toString().includes(search) ||
      invoice.customer_name.toLowerCase().includes(searchLower) ||
      invoice.jobs?.job_name?.toLowerCase().includes(searchLower)

    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter

    return matchesSearch && matchesStatus
  })

  return (
    <>
      {/* Search & Filter */}
      <div className="mb-4 space-y-3">
        <Input
          placeholder="Search by invoice #, client, job..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          icon={<Search className="w-5 h-5" />}
        />

        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {statusFilterOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setStatusFilter(option.value)}
              className={cn(
                'px-4 py-2 rounded-2xl text-sm font-semibold whitespace-nowrap transition-all',
                statusFilter === option.value
                  ? 'bg-orange-500 text-white shadow-soft'
                  : 'bg-white dark:bg-dark-card text-gray-600 dark:text-dark-muted border-2 border-cream-200 dark:border-dark-border'
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Invoices List */}
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
              <Plus className="w-4 h-4 mr-2" />
              Create Invoice
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredInvoices.map((invoice) => {
            const statusConfig = invoiceStatusConfig[invoice.status]

            return (
              <Card
                key={invoice.id}
                onClick={() => router.push(`/invoices/${invoice.id}`)}
                className="p-4 cursor-pointer active:scale-[0.99] transition-transform"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-navy-800">#{invoice.invoice_number}</span>
                      <Badge variant={invoice.status as any}>{statusConfig.label}</Badge>
                    </div>
                    <p className="text-sm font-medium text-navy-800 mt-1 truncate">
                      {invoice.customer_name}
                    </p>
                    {invoice.jobs && (
                      <p className="text-sm text-gray-500 truncate">
                        {invoice.jobs.job_name}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDateShort(invoice.invoice_date)}
                    </p>
                  </div>
                  <div className="text-right ml-4">
                    <p className="font-bold text-navy-800">{formatCurrency(invoice.total)}</p>
                    <ChevronRight className="w-5 h-5 text-gray-400 ml-auto mt-1" />
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Create Invoice FAB */}
      <Button
        onClick={() => router.push('/invoices/new')}
        variant="primary"
        size="icon-lg"
        className="fixed right-4 bottom-24 shadow-lg"
      >
        <Plus className="w-6 h-6" />
      </Button>
    </>
  )
}
