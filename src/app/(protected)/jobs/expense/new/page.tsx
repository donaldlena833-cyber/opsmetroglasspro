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
import { ArrowLeft, Upload, X, Search, Camera } from 'lucide-react'
import { expenseCategoryConfig, paymentMethodConfig } from '@/lib/utils'
import { ExpenseCategory, PaymentMethod, Job } from '@/lib/supabase/types'

export default function NewExpensePage() {
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
  const [amount, setAmount] = useState('')
  const [vendor, setVendor] = useState('')
  const [category, setCategory] = useState<ExpenseCategory>('other')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('stripe')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [note, setNote] = useState('')
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null)
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null)

  useEffect(() => {
    async function fetchJobs() {
      const { data } = await supabase
        .from('jobs')
        .select('id, job_name, address, status')
        .neq('status', 'closed')
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setReceiptPreview(URL.createObjectURL(file))

    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}.${fileExt}`
    const filePath = `receipts/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('receipts')
      .upload(filePath, file)

    if (uploadError) {
      toast({ title: 'Upload failed', description: uploadError.message, variant: 'destructive' })
      setUploading(false)
      setReceiptPreview(null)
      return
    }

    const { data: { publicUrl } } = supabase.storage
      .from('receipts')
      .getPublicUrl(filePath)

    setReceiptUrl(publicUrl)
    setUploading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || !vendor) {
      toast({ title: 'Error', description: 'Amount and vendor are required', variant: 'destructive' })
      return
    }

    setLoading(true)

    const { error } = await supabase.from('expenses').insert({
      job_id: jobId,
      amount: parseFloat(amount),
      vendor,
      category,
      payment_method: paymentMethod,
      date,
      note: note || null,
      receipt_image_url: receiptUrl,
    })

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
      setLoading(false)
      return
    }

    toast({ title: 'Expense added!', variant: 'success' })

    if (jobId) {
      router.push(`/jobs/${jobId}`)
    } else {
      router.push('/today')
    }
    router.refresh()
  }

  return (
    <div className="page-container safe-top">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white dark:bg-dark-card shadow-sm"
        >
          <ArrowLeft className="w-5 h-5 text-navy-700 dark:text-dark-text" />
        </button>
        <h1 className="text-xl font-bold text-navy-700 dark:text-dark-text">Add Expense</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Receipt Upload - V3: Multiple options */}
        <Card>
          <CardContent>
            <p className="text-sm font-semibold text-navy-700 dark:text-dark-text mb-3">Receipt Image</p>
            {receiptPreview ? (
              <div className="relative">
                <img
                  src={receiptPreview}
                  alt="Receipt preview"
                  className="w-full h-48 object-cover rounded-2xl"
                />
                <button
                  type="button"
                  onClick={() => {
                    setReceiptPreview(null)
                    setReceiptUrl(null)
                  }}
                  className="absolute top-2 right-2 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center text-white"
                >
                  <X className="w-4 h-4" />
                </button>
                {uploading && (
                  <div className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center">
                    <div className="loading-spinner" />
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {/* Option 1: Choose from library/files */}
                <label className="block">
                  <div className="border-2 border-dashed border-cream-300 dark:border-dark-border rounded-2xl p-6 text-center cursor-pointer hover:border-orange-400 transition-colors relative">
                    <Upload className="w-8 h-8 text-orange-500 mx-auto mb-2" />
                    <p className="text-sm font-medium text-navy-700 dark:text-dark-text">Choose from Photos or Files</p>
                    <p className="text-xs text-gray-500 dark:text-dark-muted mt-1">Screenshots, PDFs, saved images</p>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleImageUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </div>
                </label>
                
                {/* Option 2: Take a photo */}
                <label className="block">
                  <div className="border-2 border-cream-300 dark:border-dark-border rounded-2xl p-4 text-center cursor-pointer hover:border-orange-400 hover:bg-cream-50 dark:hover:bg-dark-card transition-colors relative flex items-center justify-center gap-3">
                    <Camera className="w-5 h-5 text-gray-500 dark:text-dark-muted" />
                    <p className="text-sm text-gray-600 dark:text-dark-muted">Take a Photo</p>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleImageUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </div>
                </label>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Job Selection */}
        <Card>
          <CardContent>
            <p className="text-sm font-semibold text-navy-700 dark:text-dark-text mb-2">Attach to Job</p>
            <div className="relative">
              <Input
                placeholder="Search job or leave empty for general expense"
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
                      onClick={() => {
                        setJobId(job.id)
                        setJobSearch(job.job_name)
                        setShowJobDropdown(false)
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-cream-50"
                    >
                      <p className="font-medium text-navy-800">{job.job_name}</p>
                      <p className="text-sm text-gray-500">{job.address}</p>
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setJobId(null)
                      setJobSearch('')
                      setShowJobDropdown(false)
                    }}
                    className="w-full px-4 py-3 text-left hover:bg-cream-50 border-t border-gray-100 text-gray-500"
                  >
                    General Expense (no job)
                  </button>
                </div>
              )}
            </div>
            {selectedJob && (
              <p className="text-sm text-gray-500 mt-2">
                Selected: {selectedJob.job_name}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Expense Details */}
        <Card>
          <CardContent className="space-y-4">
            <Input
              type="number"
              inputMode="decimal"
              step="0.01"
              label="Amount *"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />

            <Input
              label="Vendor *"
              placeholder="Glass supplier, hardware store, gas station..."
              value={vendor}
              onChange={(e) => setVendor(e.target.value)}
              required
            />

            {/* V2: Grouped expense categories */}
            <Select value={category} onValueChange={(v) => setCategory(v as ExpenseCategory)}>
              <SelectTrigger label="Category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 dark:text-dark-muted">Job Costs</div>
                <SelectItem value="glass">🚿 Glass</SelectItem>
                <SelectItem value="hardware">🔧 Hardware</SelectItem>
                <SelectItem value="consumables">🧴 Consumables</SelectItem>
                <SelectItem value="subcontractor">👷 Subcontractor</SelectItem>
                <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 dark:text-dark-muted border-t border-gray-100 dark:border-dark-border mt-1 pt-2">Business Expenses</div>
                <SelectItem value="gas_fuel">⛽ Gas/Fuel</SelectItem>
                <SelectItem value="vehicle">🚗 Vehicle</SelectItem>
                <SelectItem value="tools_equipment">🛠️ Tools & Equipment</SelectItem>
                <SelectItem value="office_admin">📋 Office/Admin</SelectItem>
                <SelectItem value="food_meals">🍔 Food/Meals</SelectItem>
                <SelectItem value="other">📦 Other</SelectItem>
              </SelectContent>
            </Select>

            <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}>
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

        <Button type="submit" className="w-full" size="lg" variant="primary" loading={loading}>
          Save Expense
        </Button>
      </form>
    </div>
  )
}
