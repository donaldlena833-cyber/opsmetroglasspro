'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { ArrowLeft, Plus, Trash2, Search } from 'lucide-react'
import { formatCurrency, taxRatePresets } from '@/lib/utils'
import { Job, Client, LineItem } from '@/lib/supabase/types'
import { addMonths, format } from 'date-fns'

export default function NewInvoicePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedJobId = searchParams.get('jobId')
  const { toast } = useToast()
  const supabase = createClient()

  const [loading, setLoading] = useState(false)
  const [jobs, setJobs] = useState<(Job & { clients: Client | null })[]>([])
  const [jobSearch, setJobSearch] = useState('')
  const [showJobDropdown, setShowJobDropdown] = useState(false)

  // Form state
  const [jobId, setJobId] = useState<string | null>(preselectedJobId)
  const [invoiceDate, setInvoiceDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [dueDate, setDueDate] = useState(format(addMonths(new Date(), 1), 'yyyy-MM-dd'))
  const [customerName, setCustomerName] = useState('')
  const [customerAddress, setCustomerAddress] = useState('')
  const [notes, setNotes] = useState('50% deposit due. Balance due upon completion of work.')
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { description: '', qty: 1, unit_price: 0, line_total: 0 }
  ])
  const [discountApplied, setDiscountApplied] = useState(false)
  const [discountPercent, setDiscountPercent] = useState(10)
  const [taxApplied, setTaxApplied] = useState(false)
  const [taxRate, setTaxRate] = useState(8.875)

  useEffect(() => {
    async function fetchJobs() {
      const { data } = await supabase
        .from('jobs')
        .select('*, clients(*)')
        .order('created_at', { ascending: false })
      if (data) setJobs(data)

      if (preselectedJobId && data) {
        const job = data.find(j => j.id === preselectedJobId)
        if (job) {
          setJobSearch(job.job_name)
          if (job.clients) {
            setCustomerName(job.clients.name)
            setCustomerAddress(job.clients.billing_address || job.address)
          }
        }
      }
    }
    fetchJobs()
  }, [preselectedJobId])

  const filteredJobs = jobs.filter(j =>
    j.job_name.toLowerCase().includes(jobSearch.toLowerCase()) ||
    j.address.toLowerCase().includes(jobSearch.toLowerCase())
  )

  const selectedJob = jobs.find(j => j.id === jobId)

  // Calculate totals
  const subtotal = lineItems.reduce((sum, item) => sum + item.line_total, 0)
  const discountAmount = discountApplied ? subtotal * (discountPercent / 100) : 0
  const afterDiscount = subtotal - discountAmount
  const taxAmount = taxApplied ? afterDiscount * (taxRate / 100) : 0
  const total = afterDiscount + taxAmount

  const handleSelectJob = (job: typeof jobs[0]) => {
    setJobId(job.id)
    setJobSearch(job.job_name)
    setShowJobDropdown(false)
    if (job.clients) {
      setCustomerName(job.clients.name)
      setCustomerAddress(job.clients.billing_address || job.address)
    }
  }

  const updateLineItem = (index: number, field: keyof LineItem, value: string | number) => {
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

  const addLineItem = () => {
    setLineItems([...lineItems, { description: '', qty: 1, unit_price: 0, line_total: 0 }])
  }

  const removeLineItem = (index: number) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((_, i) => i !== index))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!jobId) {
      toast({ title: 'Error', description: 'Please select a job', variant: 'destructive' })
      return
    }
    if (!customerName) {
      toast({ title: 'Error', description: 'Customer name is required', variant: 'destructive' })
      return
    }
    if (lineItems.every(item => !item.description)) {
      toast({ title: 'Error', description: 'Add at least one line item', variant: 'destructive' })
      return
    }

    setLoading(true)

    try {
      // Get next invoice number from server
      const { data: invoiceNum, error: seqError } = await supabase.rpc('get_next_invoice_number')
      if (seqError) throw seqError

      const validLineItems = lineItems.filter(item => item.description)

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

      // Generate PDF
      const pdfResponse = await fetch('/api/invoice/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceId: invoice.id }),
      })

      if (!pdfResponse.ok) {
        console.error('PDF generation failed')
      }

      toast({ title: 'Invoice created!', description: `Invoice #${invoiceNum}`, variant: 'success' })
      router.push(`/invoices/${invoice.id}`)
      router.refresh()
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-container safe-top">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-sm"
        >
          <ArrowLeft className="w-5 h-5 text-navy-800" />
        </button>
        <h1 className="text-xl font-bold text-navy-800">Create Invoice</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Job Selection */}
        <Card>
          <CardContent>
            <p className="text-sm font-medium text-navy-800 mb-2">Job *</p>
            <div className="relative">
              <Input
                placeholder="Search job..."
                value={jobSearch}
                onChange={(e) => {
                  setJobSearch(e.target.value)
                  setShowJobDropdown(true)
                  if (jobId) setJobId(null)
                }}
                onFocus={() => setShowJobDropdown(true)}
                icon={<Search className="w-5 h-5" />}
              />
              {showJobDropdown && jobSearch && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-auto">
                  {filteredJobs.map((job) => (
                    <button
                      key={job.id}
                      type="button"
                      onClick={() => handleSelectJob(job)}
                      className="w-full px-4 py-3 text-left hover:bg-cream-50"
                    >
                      <p className="font-medium text-navy-800">{job.job_name}</p>
                      <p className="text-sm text-gray-500">{job.clients?.name || job.address}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Dates */}
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

        {/* Customer Info */}
        <Card>
          <CardContent className="space-y-4">
            <Input
              label="Customer Name *"
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

        {/* Line Items */}
        <Card>
          <CardContent className="space-y-4">
            <p className="text-sm font-medium text-navy-800">Line Items</p>
            
            {lineItems.map((item, index) => (
              <div key={index} className="p-3 bg-cream-50 rounded-xl space-y-3">
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
                      className="w-10 h-10 flex items-center justify-center text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
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
                    <span className="font-medium text-navy-800">
                      {formatCurrency(item.line_total)}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            <Button type="button" variant="outline" onClick={addLineItem} className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Add Line Item
            </Button>
          </CardContent>
        </Card>

        {/* Discount & Tax */}
        <Card>
          <CardContent className="space-y-4">
            <Switch
              label="Apply Discount"
              description="10% regular customer discount"
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

            <div className="border-t border-gray-100 pt-4">
              <Switch
                label="Apply Tax"
                description="For repair work"
                checked={taxApplied}
                onCheckedChange={setTaxApplied}
              />
              {taxApplied && (
                <div className="mt-3">
                  <Select value={taxRate.toString()} onValueChange={(v) => setTaxRate(Number(v))}>
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

        {/* Totals */}
        <Card>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Subtotal</span>
              <span className="text-navy-800">{formatCurrency(subtotal)}</span>
            </div>
            {discountApplied && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Discount ({discountPercent}%)</span>
                <span className="text-red-600">-{formatCurrency(discountAmount)}</span>
              </div>
            )}
            {taxApplied && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Tax ({taxRate}%)</span>
                <span className="text-navy-800">{formatCurrency(taxAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-100">
              <span className="text-navy-800">Total</span>
              <span className="text-navy-800">{formatCurrency(total)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardContent>
            <Textarea
              label="Notes"
              placeholder="Payment terms, special instructions..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
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
