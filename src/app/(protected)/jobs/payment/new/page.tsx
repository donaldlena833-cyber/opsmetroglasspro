'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { ArrowLeft, Search, Upload, X, Info } from 'lucide-react'
import { paymentMethodConfig, paymentTypeConfig, formatCurrency, calculateStripeFee } from '@/lib/utils'
import { PaymentMethod, PaymentType, Job, Invoice } from '@/lib/supabase/types'

export default function NewPaymentPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedJobId = searchParams.get('jobId')
  const { toast } = useToast()
  const supabase = createClient()

  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [jobs, setJobs] = useState<any[]>([])
  const [jobSearch, setJobSearch] = useState('')
  const [showJobDropdown, setShowJobDropdown] = useState(false)

  // Form state
  const [jobId, setJobId] = useState<string | null>(preselectedJobId)
  const [invoiceId, setInvoiceId] = useState<string | null>(null)
  const [grossAmount, setGrossAmount] = useState('') // V2: Amount charged to client
  const [paymentType, setPaymentType] = useState<PaymentType>('deposit')
  const [method, setMethod] = useState<PaymentMethod>('stripe')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [note, setNote] = useState('')
  const [confirmationUrl, setConfirmationUrl] = useState<string | null>(null)
  const [confirmationPreview, setConfirmationPreview] = useState<string | null>(null)

  // V2: Calculate Stripe fees automatically
  const grossAmountNum = parseFloat(grossAmount) || 0
  const stripeFeeCalc = method === 'stripe' ? calculateStripeFee(grossAmountNum) : { fee: 0, netAmount: grossAmountNum }

  useEffect(() => {
    async function fetchJobs() {
      const { data } = await supabase
        .from('jobs')
        .select('*, invoices(*)')
        .order('created_at', { ascending: false })
      if (data) setJobs(data)

      if (preselectedJobId && data) {
        const job = data.find(j => j.id === preselectedJobId)
        if (job) setJobSearch(job.job_name)
      }
    }
    fetchJobs()
  }, [preselectedJobId])

  const filteredJobs = jobs.filter(j =>
    j.job_name.toLowerCase().includes(jobSearch.toLowerCase()) ||
    j.address.toLowerCase().includes(jobSearch.toLowerCase())
  )

  const selectedJob = jobs.find(j => j.id === jobId)
  const jobInvoices = selectedJob?.invoices || []
  const selectedInvoice = jobInvoices.find((i: any) => i.id === invoiceId)

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setConfirmationPreview(URL.createObjectURL(file))

    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}.${fileExt}`
    const filePath = `receipts/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('receipts')
      .upload(filePath, file)

    if (uploadError) {
      toast({ title: 'Upload failed', description: uploadError.message, variant: 'destructive' })
      setUploading(false)
      setConfirmationPreview(null)
      return
    }

    const { data: { publicUrl } } = supabase.storage
      .from('receipts')
      .getPublicUrl(filePath)

    setConfirmationUrl(publicUrl)
    setUploading(false)
  }

  const handleQuickAmount = (percentage: number) => {
    if (selectedInvoice) {
      const invoiceAmount = Number(selectedInvoice.total)
      setGrossAmount((invoiceAmount * percentage).toFixed(2))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!jobId || !grossAmount) {
      toast({ title: 'Error', description: 'Job and amount are required', variant: 'destructive' })
      return
    }

    setLoading(true)

    // V2: Store gross amount, calculate fee, store net amount
    const paymentData: any = {
      job_id: jobId,
      invoice_id: invoiceId,
      amount: stripeFeeCalc.netAmount, // Net amount (what you actually receive)
      payment_type: paymentType,
      method,
      date,
      note: note || null,
      confirmation_image_url: confirmationUrl,
    }

    // V2: Add Stripe-specific fields if using Stripe
    if (method === 'stripe') {
      paymentData.gross_amount = grossAmountNum
      paymentData.stripe_fee = stripeFeeCalc.fee
    } else {
      paymentData.gross_amount = grossAmountNum
      paymentData.stripe_fee = 0
    }

    const { error } = await supabase.from('payments').insert(paymentData)

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
      setLoading(false)
      return
    }

    toast({ title: 'Payment recorded!', variant: 'success' })
    router.push(`/jobs/${jobId}`)
    router.refresh()
  }

  return (
    <div className="page-container safe-top">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white dark:bg-dark-card shadow-sm"
        >
          <ArrowLeft className="w-5 h-5 text-navy-800 dark:text-dark-text" />
        </button>
        <h1 className="text-xl font-bold text-navy-800 dark:text-dark-text">Add Payment</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Job Selection */}
        <Card>
          <CardContent>
            <p className="text-sm font-medium text-navy-800 dark:text-dark-text mb-2">Job *</p>
            <div className="relative">
              <Input
                placeholder="Search job..."
                value={jobSearch}
                onChange={(e) => {
                  setJobSearch(e.target.value)
                  setShowJobDropdown(true)
                  if (jobId) {
                    setJobId(null)
                    setInvoiceId(null)
                  }
                }}
                onFocus={() => setShowJobDropdown(true)}
                icon={<Search className="w-5 h-5" />}
                required
              />
              {showJobDropdown && jobSearch && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-xl shadow-lg max-h-60 overflow-auto">
                  {filteredJobs.map((job) => (
                    <button
                      key={job.id}
                      type="button"
                      onClick={() => {
                        setJobId(job.id)
                        setJobSearch(job.job_name)
                        setShowJobDropdown(false)
                        setInvoiceId(null)
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-cream-50 dark:hover:bg-dark-border"
                    >
                      <p className="font-medium text-navy-800 dark:text-dark-text">{job.job_name}</p>
                      <p className="text-sm text-gray-500 dark:text-dark-muted">{job.address}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Invoice Selection (if job has invoices) */}
        {selectedJob && jobInvoices.length > 0 && (
          <Card>
            <CardContent>
              <Select value={invoiceId || 'none'} onValueChange={(v) => setInvoiceId(v === 'none' ? null : v)}>
                <SelectTrigger label="Link to Invoice (optional)">
                  <SelectValue placeholder="Select invoice..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No invoice</SelectItem>
                  {jobInvoices.map((invoice: any) => (
                    <SelectItem key={invoice.id} value={invoice.id}>
                      #{invoice.invoice_number} - {formatCurrency(invoice.total)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Quick amount buttons */}
              {selectedInvoice && (
                <div className="mt-3 space-y-2">
                  <p className="text-xs text-gray-500 dark:text-dark-muted">Quick fill:</p>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => handleQuickAmount(0.5)}
                    >
                      50% ({formatCurrency(Number(selectedInvoice.total) * 0.5)})
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => handleQuickAmount(1)}
                    >
                      Full ({formatCurrency(Number(selectedInvoice.total))})
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Payment Details */}
        <Card>
          <CardContent className="space-y-4">
            <Input
              type="number"
              inputMode="decimal"
              step="0.01"
              label="Amount Charged to Client *"
              placeholder="0.00"
              value={grossAmount}
              onChange={(e) => setGrossAmount(e.target.value)}
              required
            />

            <Select value={paymentType} onValueChange={(v) => setPaymentType(v as PaymentType)}>
              <SelectTrigger label="Payment Type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(paymentTypeConfig).map(([value, config]) => (
                  <SelectItem key={value} value={value}>
                    {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={method} onValueChange={(v) => setMethod(v as PaymentMethod)}>
              <SelectTrigger label="Payment Method">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(paymentMethodConfig).map(([value, config]) => (
                  <SelectItem key={value} value={value}>
                    {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* V2: Stripe Fee Breakdown */}
            {method === 'stripe' && grossAmountNum > 0 && (
              <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-3 space-y-1">
                <div className="flex items-center gap-1 text-xs text-orange-700 dark:text-orange-400 font-medium mb-2">
                  <Info className="w-3 h-3" />
                  <span>Stripe Fee Breakdown (2.9% + $0.30)</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-dark-muted">Charged:</span>
                  <span className="font-medium text-navy-800 dark:text-dark-text">{formatCurrency(grossAmountNum)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-dark-muted">Stripe Fee:</span>
                  <span className="font-medium text-red-600 dark:text-red-400">-{formatCurrency(stripeFeeCalc.fee)}</span>
                </div>
                <div className="flex justify-between text-sm pt-1 border-t border-orange-200 dark:border-orange-800">
                  <span className="text-gray-600 dark:text-dark-muted">You Receive:</span>
                  <span className="font-bold text-green-600 dark:text-green-400">{formatCurrency(stripeFeeCalc.netAmount)}</span>
                </div>
              </div>
            )}

            <Input
              type="date"
              label="Date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />

            <Textarea
              label="Note"
              placeholder="Optional note..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
            />
          </CardContent>
        </Card>

        {/* Confirmation Screenshot */}
        <Card>
          <CardContent>
            <label className="block">
              <p className="text-sm font-medium text-navy-800 dark:text-dark-text mb-2">Confirmation Screenshot</p>
              {confirmationPreview ? (
                <div className="relative">
                  <img
                    src={confirmationPreview}
                    alt="Confirmation"
                    className="w-full h-32 object-cover rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setConfirmationPreview(null)
                      setConfirmationUrl(null)
                    }}
                    className="absolute top-2 right-2 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  {uploading && (
                    <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center">
                      <div className="loading-spinner" />
                    </div>
                  )}
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-200 dark:border-dark-border rounded-xl p-6 text-center cursor-pointer hover:border-orange-300 transition-colors relative">
                  <Upload className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                  <p className="text-xs text-gray-500 dark:text-dark-muted">Upload Zelle/Stripe confirmation</p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>
              )}
            </label>
          </CardContent>
        </Card>

        <Button type="submit" className="w-full" size="lg" variant="primary" loading={loading}>
          Record Payment
        </Button>
      </form>
    </div>
  )
}
