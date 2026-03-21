'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { format } from 'date-fns'
import {
  AlertTriangle,
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  FileText,
  MapPin,
  Plus,
  Search,
  Sparkles,
  Trash2,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import {
  buildInvoiceDraftInsights,
  buildInvoiceDraftSummary,
  buildInvoiceLineItemsFromJob,
  buildInvoiceNotesFromJob,
  getInvoiceDraftAmountForMode,
  getRecommendedInvoiceDueDate,
  type InvoiceDraftInsight,
  type InvoiceDraftMode,
} from '@/lib/invoice-builder'
import { PageHero } from '@/components/PageHero'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import { cn, formatCurrency, taxRatePresets } from '@/lib/utils'
import { Client, Job, LineItem, Payment } from '@/lib/supabase/types'

type JobInvoiceOption = Job & {
  clients: Client | null
  payments: Pick<Payment, 'amount' | 'gross_amount' | 'payment_type'>[]
  invoices: { id: string; total: number }[]
}

function createEmptyLineItem(): LineItem {
  return { description: '', qty: 1, unit_price: 0, line_total: 0 }
}

const invoiceModeConfig: Record<
  InvoiceDraftMode,
  {
    label: string
    description: string
    helper: string
  }
> = {
  full: {
    label: 'Full invoice',
    description: 'Best for one-shot billing or change orders.',
    helper: 'Uses the saved quoted total as the draft amount.',
  },
  deposit: {
    label: 'Deposit request',
    description: 'Best when you need approval money up front.',
    helper: 'Uses the job deposit or 50% of the quoted total.',
  },
  balance: {
    label: 'Remaining balance',
    description: 'Best after deposits or staged payments are in.',
    helper: 'Subtracts collected payments from the planned job value.',
  },
}

const insightToneStyles: Record<InvoiceDraftInsight['tone'], { card: string; icon: string }> = {
  info: {
    card: 'border-cream-200 bg-white/80 dark:border-dark-border dark:bg-dark-card/70',
    icon: 'text-orange-600 dark:text-orange-300',
  },
  warning: {
    card: 'border-red-200 bg-red-50/80 dark:border-red-900/40 dark:bg-red-950/30',
    icon: 'text-red-600 dark:text-red-300',
  },
  success: {
    card: 'border-green-200 bg-green-50/80 dark:border-green-900/40 dark:bg-green-950/30',
    icon: 'text-green-600 dark:text-green-300',
  },
}

export default function NewInvoicePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedJobId = searchParams.get('jobId')
  const { toast } = useToast()
  const [supabase] = useState(() => createClient())

  const [loading, setLoading] = useState(false)
  const [jobs, setJobs] = useState<JobInvoiceOption[]>([])
  const [jobSearch, setJobSearch] = useState('')
  const [showJobDropdown, setShowJobDropdown] = useState(false)
  const [invoiceMode, setInvoiceMode] = useState<InvoiceDraftMode>('full')

  const [jobId, setJobId] = useState<string | null>(preselectedJobId)
  const [invoiceDate, setInvoiceDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [dueDate, setDueDate] = useState(getRecommendedInvoiceDueDate(new Date(), 'full'))
  const [dueDateTouched, setDueDateTouched] = useState(false)
  const [customerName, setCustomerName] = useState('')
  const [customerAddress, setCustomerAddress] = useState('')
  const [notes, setNotes] = useState('Thank you for choosing MetroGlass Pro. Please review the project scope below.')
  const [lineItems, setLineItems] = useState<LineItem[]>([createEmptyLineItem()])
  const [discountApplied, setDiscountApplied] = useState(false)
  const [discountPercent, setDiscountPercent] = useState(10)
  const [taxApplied, setTaxApplied] = useState(false)
  const [taxRate, setTaxRate] = useState(8.875)

  useEffect(() => {
    async function fetchJobs() {
      const { data } = await supabase
        .from('jobs')
        .select('*, clients(*), payments(amount, gross_amount, payment_type), invoices(id, total)')
        .order('created_at', { ascending: false })

      if (!data) return

      setJobs(data)

      if (preselectedJobId) {
        const job = data.find((item) => item.id === preselectedJobId)
        if (job) {
          setJobId(job.id)
          setJobSearch(job.job_name)
          setShowJobDropdown(false)
          setCustomerName(job.clients?.name || '')
          setCustomerAddress(job.clients?.billing_address || job.address)
          setLineItems(buildInvoiceLineItemsFromJob(job, 'full'))
          setNotes(buildInvoiceNotesFromJob(job, 'full'))
          setDueDateTouched(false)
        }
      }
    }

    fetchJobs()
  }, [preselectedJobId, supabase])

  useEffect(() => {
    if (!dueDateTouched) {
      setDueDate(getRecommendedInvoiceDueDate(invoiceDate, invoiceMode))
    }
  }, [invoiceDate, invoiceMode, dueDateTouched])

  const selectedJob = jobs.find((job) => job.id === jobId)
  const filteredJobs = jobs.filter((job) =>
    job.job_name.toLowerCase().includes(jobSearch.toLowerCase()) ||
    job.address.toLowerCase().includes(jobSearch.toLowerCase()) ||
    job.clients?.name?.toLowerCase().includes(jobSearch.toLowerCase())
  )

  const subtotal = lineItems.reduce((sum, item) => sum + item.line_total, 0)
  const discountAmount = discountApplied ? subtotal * (discountPercent / 100) : 0
  const afterDiscount = subtotal - discountAmount
  const taxAmount = taxApplied ? afterDiscount * (taxRate / 100) : 0
  const total = afterDiscount + taxAmount
  const activeLineItemsCount = lineItems.filter((item) => item.description.trim()).length

  const draftSummary = selectedJob ? buildInvoiceDraftSummary(selectedJob) : null
  const existingInvoiceValue = selectedJob
    ? selectedJob.invoices.reduce((sum, invoice) => sum + Number(invoice.total || 0), 0)
    : 0

  const draftPresetAmounts = selectedJob
    ? {
        full: getInvoiceDraftAmountForMode(selectedJob, 'full'),
        deposit: getInvoiceDraftAmountForMode(selectedJob, 'deposit'),
        balance: getInvoiceDraftAmountForMode(selectedJob, 'balance'),
      }
    : null

  const projectedInvoicedValue = selectedJob ? existingInvoiceValue + total : 0
  const remainingAfterThisDraft =
    draftSummary && draftSummary.plannedValue > 0
      ? Math.max(draftSummary.plannedValue - projectedInvoicedValue, 0)
      : 0

  const plannedCoveragePercent =
    draftSummary && draftSummary.plannedValue > 0
      ? Math.min((projectedInvoicedValue / draftSummary.plannedValue) * 100, 100)
      : 0

  const smartInsights = useMemo(() => {
    const insights: InvoiceDraftInsight[] = selectedJob
      ? [...buildInvoiceDraftInsights(selectedJob, invoiceMode)]
      : []

    if (selectedJob && selectedJob.invoices.length > 0) {
      insights.push({
        tone: 'info',
        label: 'Existing invoices found',
        detail: `${formatCurrency(existingInvoiceValue)} has already been invoiced across ${selectedJob.invoices.length} invoice(s).`,
      })
    }

    if (draftSummary?.plannedValue) {
      if (projectedInvoicedValue > draftSummary.plannedValue + 0.01) {
        insights.unshift({
          tone: 'warning',
          label: 'This draft goes over the planned value',
          detail: `Sending this as-is would put invoiced total at ${formatCurrency(projectedInvoicedValue)} against a planned ${formatCurrency(draftSummary.plannedValue)}.`,
        })
      } else if (total > 0 && remainingAfterThisDraft === 0) {
        insights.push({
          tone: 'success',
          label: 'This draft closes the planned balance',
          detail: 'If the scope is unchanged, this invoice would fully cover the planned job value.',
        })
      }
    }

    if (selectedJob && insights.length === 0) {
      insights.push({
        tone: 'success',
        label: 'Draft looks ready',
        detail: 'Job pricing, billing info, and scope all look clean for a fast invoice send.',
      })
    }

    return insights.slice(0, 4)
  }, [
    draftSummary?.plannedValue,
    existingInvoiceValue,
    invoiceMode,
    projectedInvoicedValue,
    remainingAfterThisDraft,
    selectedJob,
    total,
  ])

  useEffect(() => {
    if (selectedJob) {
      setJobId(selectedJob.id)
      setJobSearch(selectedJob.job_name)
      setShowJobDropdown(false)
      setCustomerName(selectedJob.clients?.name || '')
      setCustomerAddress(selectedJob.clients?.billing_address || selectedJob.address)
      setLineItems(buildInvoiceLineItemsFromJob(selectedJob, invoiceMode))
      setNotes(buildInvoiceNotesFromJob(selectedJob, invoiceMode))
      setDueDateTouched(false)
    }
  }, [invoiceMode, selectedJob])

  function applySmartDraft(job: JobInvoiceOption, mode: InvoiceDraftMode) {
    setJobId(job.id)
    setJobSearch(job.job_name)
    setShowJobDropdown(false)
    setCustomerName(job.clients?.name || '')
    setCustomerAddress(job.clients?.billing_address || job.address)
    setLineItems(buildInvoiceLineItemsFromJob(job, mode))
    setNotes(buildInvoiceNotesFromJob(job, mode))
    setDueDateTouched(false)
    setDueDate(getRecommendedInvoiceDueDate(invoiceDate, mode))
  }

  function handleSelectJob(job: JobInvoiceOption) {
    applySmartDraft(job, invoiceMode)
  }

  function updateLineItem(index: number, field: keyof LineItem, value: string | number) {
    const updated = [...lineItems]

    if (field === 'description') {
      updated[index].description = value as string
    } else if (field === 'qty') {
      updated[index].qty = Number(value) || 0
      updated[index].line_total = updated[index].qty * updated[index].unit_price
    } else if (field === 'unit_price') {
      updated[index].unit_price = Number(value) || 0
      updated[index].line_total = updated[index].qty * updated[index].unit_price
    }

    setLineItems(updated)
  }

  function addLineItem() {
    setLineItems([...lineItems, createEmptyLineItem()])
  }

  function removeLineItem(index: number) {
    if (lineItems.length === 1) return
    setLineItems(lineItems.filter((_, lineIndex) => lineIndex !== index))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!jobId) {
      toast({ title: 'Error', description: 'Please select a job first.', variant: 'destructive' })
      return
    }

    if (!customerName) {
      toast({ title: 'Error', description: 'Customer name is required.', variant: 'destructive' })
      return
    }

    if (lineItems.every((item) => !item.description.trim())) {
      toast({ title: 'Error', description: 'Add at least one line item.', variant: 'destructive' })
      return
    }

    setLoading(true)

    try {
      const { data: invoiceNum, error: seqError } = await supabase.rpc('get_next_invoice_number')
      if (seqError) throw seqError

      const validLineItems = lineItems
        .filter((item) => item.description.trim())
        .map((item) => ({
          ...item,
          qty: Number(item.qty) || 0,
          unit_price: Number(item.unit_price) || 0,
          line_total: Number(item.line_total) || 0,
        }))

      const { data: invoice, error } = await supabase
        .from('invoices')
        .insert({
          job_id: jobId,
          invoice_number: invoiceNum,
          invoice_date: invoiceDate,
          due_date: dueDate,
          customer_name: customerName,
          customer_address: customerAddress || null,
          notes: notes || null,
          line_items_json: validLineItems,
          subtotal,
          discount_applied: discountApplied,
          discount_percent: discountPercent,
          discount_amount: discountAmount,
          tax_applied: taxApplied,
          tax_rate: taxRate,
          tax: taxAmount,
          total,
          status: 'sent',
        })
        .select()
        .single()

      if (error) throw error

      const pdfResponse = await fetch('/api/invoice/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceId: invoice.id }),
      })

      if (!pdfResponse.ok) {
        console.error('PDF generation failed')
      }

      toast({
        title: 'Invoice created',
        description: `Invoice #${invoiceNum} is ready.`,
        variant: 'success',
      })
      router.push(`/invoices/${invoice.id}`)
      router.refresh()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create invoice.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-container safe-top pb-32">
      <PageHero
        eyebrow="Invoice Studio"
        title={selectedJob ? `Draft ${invoiceModeConfig[invoiceMode].label.toLowerCase()}` : 'Create Invoice'}
        description={
          selectedJob
            ? `We pulled the billing profile, pricing, and scope from ${selectedJob.job_name}. Review the draft, adjust anything unique, and generate the branded PDF.`
            : 'Choose a job and MetroGlassOps will build the draft from saved client details, pricing, and scope so you can invoice faster.'
        }
        actions={
          <Button variant="outline" size="icon-sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
        }
        stats={[
          {
            label: 'Draft Total',
            value: formatCurrency(total),
            hint: `${activeLineItemsCount} active item${activeLineItemsCount === 1 ? '' : 's'}`,
          },
          {
            label: 'Planned Value',
            value: formatCurrency(draftSummary?.plannedValue || 0),
            hint: selectedJob ? 'Saved on the job' : 'Select a job',
          },
          {
            label: 'Already Invoiced',
            value: formatCurrency(existingInvoiceValue),
            hint: selectedJob ? `${selectedJob.invoices.length} invoice(s)` : 'No job selected',
          },
          {
            label: 'After This Draft',
            value: selectedJob && draftSummary?.plannedValue ? formatCurrency(remainingAfterThisDraft) : '—',
            hint:
              selectedJob && draftSummary?.plannedValue
                ? projectedInvoicedValue > draftSummary.plannedValue
                  ? 'Over planned value'
                  : 'Remaining planned balance'
                : 'Choose a job',
          },
        ]}
      />

      <form onSubmit={handleSubmit} className="space-y-5">
        <Card>
          <CardContent className="space-y-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-700 dark:text-orange-300">
                  Smart generator
                </p>
                <h2 className="mt-2 text-lg font-semibold text-navy-900 dark:text-dark-text">
                  Pick the job, then choose the invoice style
                </h2>
                <p className="mt-1 text-sm leading-6 text-navy-500 dark:text-dark-muted">
                  The app will guide the amount, customer info, due date, and notes based on the job you select.
                </p>
              </div>
              {selectedJob && (
                <Button type="button" variant="outline" onClick={() => applySmartDraft(selectedJob, invoiceMode)}>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Rebuild From Job
                </Button>
              )}
            </div>

            <div className="relative">
              <Input
                label="Job"
                placeholder="Search by job, client, or address..."
                value={jobSearch}
                onChange={(e) => {
                  setJobSearch(e.target.value)
                  setShowJobDropdown(true)
                  if (jobId) setJobId(null)
                }}
                onFocus={() => setShowJobDropdown(true)}
                icon={<Search className="h-5 w-5" />}
              />

              {showJobDropdown && jobSearch && (
                <div className="absolute z-20 mt-1 max-h-72 w-full overflow-auto rounded-[24px] border border-cream-200 bg-white shadow-card dark:border-dark-border dark:bg-dark-card">
                  {filteredJobs.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-navy-500 dark:text-dark-muted">
                      No matching jobs
                    </div>
                  ) : (
                    filteredJobs.map((job) => {
                      const plannedValue = Number(job.quoted_price || 0)
                      return (
                        <button
                          key={job.id}
                          type="button"
                          onClick={() => handleSelectJob(job)}
                          className="w-full border-b border-cream-100 px-4 py-3 text-left last:border-b-0 hover:bg-cream-50 dark:border-dark-border dark:hover:bg-dark-bg/50"
                        >
                          <p className="font-medium text-navy-800 dark:text-dark-text">{job.job_name}</p>
                          <p className="mt-1 text-sm text-navy-500 dark:text-dark-muted">
                            {job.clients?.name || job.address}
                          </p>
                          <p className="mt-1 text-xs font-medium text-orange-700 dark:text-orange-300">
                            {plannedValue > 0 ? `${formatCurrency(plannedValue)} planned` : 'No planned value yet'}
                          </p>
                        </button>
                      )
                    })
                  )}
                </div>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {(Object.keys(invoiceModeConfig) as InvoiceDraftMode[]).map((mode) => {
                const config = invoiceModeConfig[mode]
                const isActive = invoiceMode === mode

                return (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setInvoiceMode(mode)}
                    className={cn(
                      'rounded-[26px] border p-4 text-left transition-all',
                      isActive
                        ? 'border-orange-300 bg-orange-50 shadow-soft dark:border-orange-700 dark:bg-orange-900/20'
                        : 'border-cream-200 bg-white/75 hover:border-orange-200 hover:bg-cream-50 dark:border-dark-border dark:bg-dark-card/75 dark:hover:bg-dark-bg/70'
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-navy-900 dark:text-dark-text">{config.label}</p>
                        <p className="mt-1 text-xs leading-5 text-navy-500 dark:text-dark-muted">
                          {config.description}
                        </p>
                      </div>
                      <span
                        className={cn(
                          'rounded-full px-2.5 py-1 text-xs font-semibold',
                          isActive
                            ? 'bg-orange-500 text-white'
                            : 'bg-cream-100 text-navy-600 dark:bg-dark-border dark:text-dark-text'
                        )}
                      >
                        {selectedJob ? formatCurrency(draftPresetAmounts?.[mode] || 0) : '—'}
                      </span>
                    </div>
                    <p className="mt-3 text-xs text-navy-500 dark:text-dark-muted">{config.helper}</p>
                  </button>
                )
              })}
            </div>

            {selectedJob && draftSummary && (
              <div className="rounded-[30px] border border-cream-200/90 bg-cream-50/85 p-5 dark:border-dark-border dark:bg-dark-bg/55">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="font-semibold text-navy-900 dark:text-dark-text">{selectedJob.job_name}</p>
                    <div className="mt-1 flex items-center gap-1.5 text-sm text-navy-500 dark:text-dark-muted">
                      <MapPin className="h-4 w-4" />
                      <span>{selectedJob.address}</span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-navy-500 dark:text-dark-muted">
                      {selectedJob.scope_of_work || 'No scope of work saved yet on this job.'}
                    </p>
                  </div>

                  <div className="rounded-[22px] border border-cream-200 bg-white/85 px-4 py-3 text-sm text-navy-600 dark:border-dark-border dark:bg-dark-card/80 dark:text-dark-muted">
                    <p className="font-semibold text-navy-900 dark:text-dark-text">
                      Smart due date: {dueDate}
                    </p>
                    <p className="mt-1">
                      Suggested from the current invoice type so you can move faster.
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-[22px] border border-cream-200 bg-white/90 p-3 dark:border-dark-border dark:bg-dark-card/80">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-navy-500 dark:text-dark-muted">Planned</p>
                    <p className="mt-1 font-semibold text-navy-900 dark:text-dark-text">{formatCurrency(draftSummary.plannedValue)}</p>
                  </div>
                  <div className="rounded-[22px] border border-cream-200 bg-white/90 p-3 dark:border-dark-border dark:bg-dark-card/80">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-navy-500 dark:text-dark-muted">Collected</p>
                    <p className="mt-1 font-semibold text-green-600 dark:text-green-400">{formatCurrency(draftSummary.collected)}</p>
                  </div>
                  <div className="rounded-[22px] border border-cream-200 bg-white/90 p-3 dark:border-dark-border dark:bg-dark-card/80">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-navy-500 dark:text-dark-muted">This Draft</p>
                    <p className="mt-1 font-semibold text-orange-700 dark:text-orange-300">{formatCurrency(total)}</p>
                  </div>
                  <div className="rounded-[22px] border border-cream-200 bg-white/90 p-3 dark:border-dark-border dark:bg-dark-card/80">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-navy-500 dark:text-dark-muted">Remaining After Send</p>
                    <p className="mt-1 font-semibold text-navy-900 dark:text-dark-text">{formatCurrency(remainingAfterThisDraft)}</p>
                  </div>
                </div>

                {draftSummary.plannedValue > 0 && (
                  <div className="mt-4">
                    <div className="mb-2 flex items-center justify-between gap-3 text-xs font-semibold uppercase tracking-[0.16em] text-navy-500 dark:text-dark-muted">
                      <span>Planned Value Coverage</span>
                      <span
                        className={cn(
                          projectedInvoicedValue > draftSummary.plannedValue
                            ? 'text-red-600 dark:text-red-300'
                            : 'text-orange-700 dark:text-orange-300'
                        )}
                      >
                        {formatCurrency(projectedInvoicedValue)} of {formatCurrency(draftSummary.plannedValue)}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-cream-200 dark:bg-dark-border">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all',
                          projectedInvoicedValue > draftSummary.plannedValue ? 'bg-red-500' : 'bg-orange-500'
                        )}
                        style={{
                          width: `${Math.max(
                            Math.min(plannedCoveragePercent, 100),
                            total > 0 ? 8 : 0
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                )}

                <div className="mt-4 grid gap-3">
                  {smartInsights.map((insight) => {
                    const tone = insightToneStyles[insight.tone]
                    const InsightIcon = insight.tone === 'warning' ? AlertTriangle : insight.tone === 'success' ? CheckCircle2 : Sparkles

                    return (
                      <div
                        key={`${insight.tone}-${insight.label}`}
                        className={cn('rounded-[22px] border p-3', tone.card)}
                      >
                        <div className="flex items-start gap-3">
                          <InsightIcon className={cn('mt-0.5 h-4 w-4 flex-shrink-0', tone.icon)} />
                          <div>
                            <p className="font-medium text-navy-900 dark:text-dark-text">{insight.label}</p>
                            <p className="mt-1 text-sm leading-6 text-navy-500 dark:text-dark-muted">{insight.detail}</p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
          <div className="space-y-5">
            <Card>
              <CardContent className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-navy-800 dark:text-dark-text">Billing & schedule</p>
                    <p className="text-sm text-navy-500 dark:text-dark-muted">
                      Keep this tight. Most invoices only need dates and the bill-to cleaned up.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setDueDateTouched(false)
                      setDueDate(getRecommendedInvoiceDueDate(invoiceDate, invoiceMode))
                    }}
                  >
                    <CalendarClock className="mr-2 h-4 w-4" />
                    Reset due date
                  </Button>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <Input
                    type="date"
                    label="Invoice Date"
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                  />
                  <Input
                    type="date"
                    label="Due Date"
                    value={dueDate}
                    onChange={(e) => {
                      setDueDate(e.target.value)
                      setDueDateTouched(true)
                    }}
                  />
                </div>

                <div className="rounded-[22px] border border-cream-200 bg-cream-50/80 px-4 py-3 dark:border-dark-border dark:bg-dark-bg/50">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-navy-500 dark:text-dark-muted">
                    Due Date Logic
                  </p>
                  <p className="mt-1 text-sm text-navy-600 dark:text-dark-muted">
                    Deposit drafts default to 7 days, balance drafts to 10 days, and full invoices to 14 days unless you override them.
                  </p>
                </div>

                <div className="grid gap-3">
                  <Input
                    label="Customer Name"
                    placeholder="Bill to..."
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    required
                  />
                  <Textarea
                    label="Customer Address"
                    placeholder="Billing address..."
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-medium text-navy-800 dark:text-dark-text">Line items</p>
                    <p className="text-sm text-navy-500 dark:text-dark-muted">
                      Start from the smart draft, then only touch what is unique for this invoice.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => selectedJob && applySmartDraft(selectedJob, invoiceMode)}
                      disabled={!selectedJob}
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      Rebuild
                    </Button>
                    <Button type="button" variant="outline" onClick={addLineItem}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Line
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  {lineItems.map((item, index) => (
                    <div
                      key={index}
                      className="rounded-[26px] border border-cream-200 bg-cream-50/85 p-4 dark:border-dark-border dark:bg-dark-bg/50"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-sm font-semibold text-navy-800 shadow-soft dark:bg-dark-card dark:text-dark-text">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium text-navy-900 dark:text-dark-text">Line item {index + 1}</p>
                            <p className="text-sm text-navy-500 dark:text-dark-muted">
                              {item.description.trim() ? 'Included in invoice subtotal.' : 'Add a clean description for the customer PDF.'}
                            </p>
                          </div>
                        </div>

                        {lineItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeLineItem(index)}
                            className="flex h-10 w-10 items-center justify-center rounded-2xl text-red-500 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>

                      <div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1.7fr)_120px_160px_140px]">
                        <Input
                          label="Description"
                          placeholder="Description"
                          value={item.description}
                          onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                        />
                        <Input
                          type="number"
                          label="Qty"
                          placeholder="Qty"
                          value={item.qty || ''}
                          onChange={(e) => updateLineItem(index, 'qty', e.target.value)}
                        />
                        <Input
                          type="number"
                          step="0.01"
                          label="Unit Price"
                          placeholder="Price"
                          value={item.unit_price || ''}
                          onChange={(e) => updateLineItem(index, 'unit_price', e.target.value)}
                        />
                        <div className="rounded-[22px] border border-cream-200 bg-white/90 px-4 py-3 dark:border-dark-border dark:bg-dark-card/80">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-navy-500 dark:text-dark-muted">
                            Line Total
                          </p>
                          <p className="mt-2 text-lg font-semibold text-navy-900 dark:text-dark-text">
                            {formatCurrency(item.line_total)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-5 xl:sticky xl:top-6 xl:self-start">
            <Card>
              <CardContent className="space-y-5">
                <div>
                  <p className="text-sm font-medium text-navy-800 dark:text-dark-text">Finalize & generate</p>
                  <p className="text-sm text-navy-500 dark:text-dark-muted">
                    Keep the math and notes here so the top of the page stays focused on the draft itself.
                  </p>
                </div>

                <div className="space-y-4 rounded-[26px] border border-cream-200 bg-cream-50/70 p-4 dark:border-dark-border dark:bg-dark-bg/50">
                  <Switch
                    label="Apply discount"
                    description="Turn this on if the client gets a discount on this invoice."
                    checked={discountApplied}
                    onCheckedChange={setDiscountApplied}
                  />
                  {discountApplied && (
                    <Input
                      type="number"
                      label="Discount %"
                      value={discountPercent}
                      onChange={(e) => setDiscountPercent(Number(e.target.value))}
                    />
                  )}

                  <div className="border-t border-cream-200 pt-4 dark:border-dark-border">
                    <Switch
                      label="Apply tax"
                      description="Use this for taxable repair or service work."
                      checked={taxApplied}
                      onCheckedChange={setTaxApplied}
                    />

                    {taxApplied && (
                      <div className="mt-3">
                        <Select value={taxRate.toString()} onValueChange={(value) => setTaxRate(Number(value))}>
                          <SelectTrigger label="Tax rate">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {taxRatePresets.map((preset) => (
                              <SelectItem key={preset.value} value={preset.value.toString()}>
                                {preset.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                </div>

                <Textarea
                  label="Notes"
                  placeholder="Payment terms, project notes, or anything the client should see..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={5}
                />

                <div className="rounded-[28px] border border-cream-200 bg-white/85 p-5 dark:border-dark-border dark:bg-dark-card/80">
                  <div className="mb-4 flex items-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cream-100 text-navy-700 dark:bg-dark-border dark:text-dark-text">
                      <Sparkles className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-navy-900 dark:text-dark-text">Invoice summary</p>
                      <p className="text-sm text-navy-500 dark:text-dark-muted">This is what will be saved and turned into the PDF.</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 dark:text-dark-muted">Subtotal</span>
                      <span className="text-navy-800 dark:text-dark-text">{formatCurrency(subtotal)}</span>
                    </div>
                    {discountApplied && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500 dark:text-dark-muted">Discount ({discountPercent}%)</span>
                        <span className="text-red-600 dark:text-red-400">-{formatCurrency(discountAmount)}</span>
                      </div>
                    )}
                    {taxApplied && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500 dark:text-dark-muted">Tax ({taxRate}%)</span>
                        <span className="text-navy-800 dark:text-dark-text">{formatCurrency(taxAmount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between border-t border-cream-200 pt-3 text-lg font-bold dark:border-dark-border">
                      <span className="text-navy-800 dark:text-dark-text">Total</span>
                      <span className="text-navy-800 dark:text-dark-text">{formatCurrency(total)}</span>
                    </div>
                  </div>

                  <div className="mt-4 rounded-[22px] border border-cream-200 bg-cream-50/80 px-4 py-3 dark:border-dark-border dark:bg-dark-bg/50">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-navy-500 dark:text-dark-muted">
                      What happens next
                    </p>
                    <p className="mt-1 text-sm leading-6 text-navy-600 dark:text-dark-muted">
                      We save the invoice, generate the branded PDF, then open the invoice detail page so you can share or collect payment right away.
                    </p>
                  </div>
                </div>

                <Button type="submit" className="w-full" size="lg" variant="primary" loading={loading}>
                  Generate Invoice
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  )
}
