'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { addMonths, format } from 'date-fns'
import { ArrowLeft, FileText, Plus, Search, Sparkles, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { buildInvoiceDraftSummary, buildInvoiceLineItemsFromJob, buildInvoiceNotesFromJob, type InvoiceDraftMode } from '@/lib/invoice-builder'
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
import { formatCurrency, taxRatePresets } from '@/lib/utils'
import { Client, Job, LineItem, Payment } from '@/lib/supabase/types'

type JobInvoiceOption = Job & {
  clients: Client | null
  payments: Pick<Payment, 'amount' | 'gross_amount' | 'payment_type'>[]
  invoices: { id: string; total: number }[]
}

function createEmptyLineItem(): LineItem {
  return { description: '', qty: 1, unit_price: 0, line_total: 0 }
}

const invoiceModeLabels: Record<InvoiceDraftMode, string> = {
  full: 'Full invoice',
  deposit: 'Deposit request',
  balance: 'Remaining balance',
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
  const [dueDate, setDueDate] = useState(format(addMonths(new Date(), 1), 'yyyy-MM-dd'))
  const [customerName, setCustomerName] = useState('')
  const [customerAddress, setCustomerAddress] = useState('')
  const [notes, setNotes] = useState('50% deposit due. Balance due upon completion of work.')
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
          applySmartDraft(job, 'full')
        }
      }
    }

    fetchJobs()
  }, [preselectedJobId, supabase])

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
  const draftSummary = selectedJob ? buildInvoiceDraftSummary(selectedJob) : null
  const existingInvoiceValue = selectedJob
    ? selectedJob.invoices.reduce((sum, invoice) => sum + Number(invoice.total || 0), 0)
    : 0

  useEffect(() => {
    if (selectedJob) {
      applySmartDraft(selectedJob, invoiceMode)
    }
  }, [invoiceMode, selectedJob])

  function applySmartDraft(job: JobInvoiceOption, mode: InvoiceDraftMode) {
    setJobId(job.id)
    setJobSearch(job.job_name)
    setShowJobDropdown(false)
    setCustomerName((current) => job.clients?.name || current)
    setCustomerAddress(job.clients?.billing_address || job.address)
    setLineItems(buildInvoiceLineItemsFromJob(job, mode))
    setNotes(buildInvoiceNotesFromJob(job, mode))
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
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm dark:bg-dark-card"
        >
          <ArrowLeft className="h-5 w-5 text-navy-800 dark:text-dark-text" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-navy-800 dark:text-dark-text">Create Invoice</h1>
          <p className="text-sm text-navy-500 dark:text-dark-muted">Start from a job and let MetroGlassOps build the draft.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardContent className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-700 dark:text-orange-300">
                  Smart generator
                </p>
                <h2 className="mt-2 text-lg font-semibold text-navy-900 dark:text-dark-text">
                  Choose the job and invoice type
                </h2>
                <p className="mt-1 text-sm leading-6 text-navy-500 dark:text-dark-muted">
                  We will pull client info, scope, and pricing from the job so you only adjust what is unique for this invoice.
                </p>
              </div>
              <div className="rounded-2xl border border-orange-200 bg-orange-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-orange-700 dark:border-orange-900/30 dark:bg-orange-900/15 dark:text-orange-300">
                Smart Draft
              </div>
            </div>

            <div className="relative">
              <Input
                label="Job"
                placeholder="Search job by name, client, or address..."
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

            <Select
              value={invoiceMode}
              onValueChange={(value) => {
                const nextMode = value as InvoiceDraftMode
                setInvoiceMode(nextMode)
              }}
            >
              <SelectTrigger label="Invoice type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(invoiceModeLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedJob && draftSummary && (
              <div className="rounded-[28px] border border-cream-200/90 bg-cream-50/85 p-4 dark:border-dark-border dark:bg-dark-bg/50">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-navy-900 dark:text-dark-text">{selectedJob.job_name}</p>
                    <p className="mt-1 text-sm text-navy-500 dark:text-dark-muted">{selectedJob.address}</p>
                  </div>
                  <Button type="button" variant="outline" onClick={() => applySmartDraft(selectedJob, invoiceMode)}>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Refresh Draft
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                  <div className="rounded-[22px] border border-cream-200 bg-white/90 p-3 dark:border-dark-border dark:bg-dark-card/80">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-navy-500 dark:text-dark-muted">Planned</p>
                    <p className="mt-1 font-semibold text-navy-900 dark:text-dark-text">{formatCurrency(draftSummary.plannedValue)}</p>
                  </div>
                  <div className="rounded-[22px] border border-cream-200 bg-white/90 p-3 dark:border-dark-border dark:bg-dark-card/80">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-navy-500 dark:text-dark-muted">Deposit</p>
                    <p className="mt-1 font-semibold text-navy-900 dark:text-dark-text">{formatCurrency(draftSummary.suggestedDeposit)}</p>
                  </div>
                  <div className="rounded-[22px] border border-cream-200 bg-white/90 p-3 dark:border-dark-border dark:bg-dark-card/80">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-navy-500 dark:text-dark-muted">Collected</p>
                    <p className="mt-1 font-semibold text-green-600 dark:text-green-400">{formatCurrency(draftSummary.collected)}</p>
                  </div>
                  <div className="rounded-[22px] border border-cream-200 bg-white/90 p-3 dark:border-dark-border dark:bg-dark-card/80">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-navy-500 dark:text-dark-muted">Remaining</p>
                    <p className="mt-1 font-semibold text-orange-700 dark:text-orange-300">{formatCurrency(draftSummary.remainingBalance)}</p>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm text-navy-500 dark:text-dark-muted">
                  <span>{selectedJob.scope_of_work || 'No scope of work saved yet'}</span>
                  <span>{existingInvoiceValue > 0 ? `${formatCurrency(existingInvoiceValue)} already invoiced` : 'No prior invoices'}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
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
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4">
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
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-navy-800 dark:text-dark-text">Line Items</p>
                <p className="text-sm text-navy-500 dark:text-dark-muted">Start from the smart draft, then fine-tune it.</p>
              </div>
              <Button type="button" variant="outline" onClick={() => selectedJob && applySmartDraft(selectedJob, invoiceMode)} disabled={!selectedJob}>
                <FileText className="mr-2 h-4 w-4" />
                Rebuild
              </Button>
            </div>

            {lineItems.map((item, index) => (
              <div key={index} className="space-y-3 rounded-[24px] bg-cream-50 p-3 dark:bg-dark-bg/50">
                <div className="flex items-start gap-2">
                  <Input
                    placeholder="Description"
                    value={item.description}
                    onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                    className="flex-1"
                  />
                  {lineItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeLineItem(index)}
                      className="flex h-10 w-10 items-center justify-center text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <Input
                    type="number"
                    placeholder="Qty"
                    value={item.qty || ''}
                    onChange={(e) => updateLineItem(index, 'qty', e.target.value)}
                  />
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Price"
                    value={item.unit_price || ''}
                    onChange={(e) => updateLineItem(index, 'unit_price', e.target.value)}
                  />
                  <div className="flex items-center justify-end">
                    <span className="font-medium text-navy-800 dark:text-dark-text">{formatCurrency(item.line_total)}</span>
                  </div>
                </div>
              </div>
            ))}

            <Button type="button" variant="outline" onClick={addLineItem} className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              Add Line Item
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4">
            <Switch
              label="Apply Discount"
              description="Turn this on if this invoice needs a discount."
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

            <div className="border-t border-gray-100 pt-4 dark:border-dark-border">
              <Switch
                label="Apply Tax"
                description="Use this for taxable repair or service work."
                checked={taxApplied}
                onCheckedChange={setTaxApplied}
              />

              {taxApplied && (
                <div className="mt-3">
                  <Select value={taxRate.toString()} onValueChange={(value) => setTaxRate(Number(value))}>
                    <SelectTrigger label="Tax Rate">
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
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-2">
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
            <div className="flex justify-between border-t border-gray-100 pt-2 text-lg font-bold dark:border-dark-border">
              <span className="text-navy-800 dark:text-dark-text">Total</span>
              <span className="text-navy-800 dark:text-dark-text">{formatCurrency(total)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Textarea
              label="Notes"
              placeholder="Payment terms, project notes, or anything the client should see..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
            />
          </CardContent>
        </Card>

        <Button type="submit" className="w-full" size="lg" variant="primary" loading={loading}>
          Generate Invoice
        </Button>
      </form>
    </div>
  )
}
