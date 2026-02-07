'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { ArrowLeft, Camera, Loader2, Sparkles, Search, Upload } from 'lucide-react'
import { expenseCategoryConfig, paymentMethodConfig } from '@/lib/utils'
import { ExpenseCategory, PaymentMethod, Job } from '@/lib/supabase/types'

export default function QuickExpensePage() {
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [step, setStep] = useState<'camera' | 'form'>('camera')
  const [loading, setLoading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [jobs, setJobs] = useState<any[]>([])
  const [jobSearch, setJobSearch] = useState('')
  const [showJobDropdown, setShowJobDropdown] = useState(false)

  // Form state
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null)
  const [jobId, setJobId] = useState<string | null>(null)
  const [amount, setAmount] = useState('')
  const [vendor, setVendor] = useState('')
  const [category, setCategory] = useState<ExpenseCategory>('other')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('stripe')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])

  useEffect(() => {
    async function fetchJobs() {
      const { data } = await supabase
        .from('jobs')
        .select('id, job_name, address, status')
        .neq('status', 'closed')
        .order('created_at', { ascending: false })
      if (data) setJobs(data)
    }
    fetchJobs()

    // Auto-open camera on mount
    if (step === 'camera') {
      setTimeout(() => fileInputRef.current?.click(), 100)
    }
  }, [])

  const filteredJobs = jobs.filter(j =>
    j.job_name.toLowerCase().includes(jobSearch.toLowerCase()) ||
    j.address.toLowerCase().includes(jobSearch.toLowerCase())
  )

  const selectedJob = jobs.find(j => j.id === jobId)

  const analyzeReceipt = async (imageUrl: string) => {
    setAnalyzing(true)
    try {
      const response = await fetch('/api/ai/extract-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl }),
      })

      if (!response.ok) throw new Error('Failed to analyze receipt')

      const data = await response.json()

      if (data.amount) setAmount(data.amount.toString())
      if (data.vendor) setVendor(data.vendor)
      if (data.category) setCategory(data.category as ExpenseCategory)
      if (data.date) setDate(data.date)

      toast({
        title: 'Receipt analyzed!',
        description: 'Please verify the extracted information',
        variant: 'success',
      })
    } catch (error) {
      toast({
        title: 'Analysis failed',
        description: 'Please enter details manually',
        variant: 'warning',
      })
    } finally {
      setAnalyzing(false)
    }
  }

  const handleImageCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) {
      router.back()
      return
    }

    setUploading(true)
    setImagePreview(URL.createObjectURL(file))
    setStep('form')

    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}.${fileExt}`
    const filePath = `receipts/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('receipts')
      .upload(filePath, file)

    if (uploadError) {
      toast({ title: 'Upload failed', description: uploadError.message, variant: 'destructive' })
      setUploading(false)
      return
    }

    const { data: { publicUrl } } = supabase.storage
      .from('receipts')
      .getPublicUrl(filePath)

    setReceiptUrl(publicUrl)
    setUploading(false)

    // Analyze with AI
    analyzeReceipt(publicUrl)
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
      receipt_image_url: receiptUrl,
    })

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
      setLoading(false)
      return
    }

    toast({ title: 'Expense saved!', variant: 'success' })

    // Ask if want to add another
    if (window.confirm('Add another expense?')) {
      setImagePreview(null)
      setReceiptUrl(null)
      setAmount('')
      setVendor('')
      setCategory('other')
      setJobId(null)
      setJobSearch('')
      setStep('camera')
      setTimeout(() => fileInputRef.current?.click(), 100)
    } else {
      router.push('/today')
      router.refresh()
    }
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
        <h1 className="text-xl font-bold text-navy-700 dark:text-dark-text">Quick Expense</h1>
      </div>

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleImageCapture}
        className="hidden"
        id="camera-input"
      />
      <input
        type="file"
        accept="image/*,.pdf"
        onChange={handleImageCapture}
        className="hidden"
        id="library-input"
      />

      {step === 'camera' && (
        <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-6">
          {/* Take Photo Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-32 h-32 rounded-3xl bg-orange-500 text-white flex flex-col items-center justify-center shadow-float active:scale-95 transition-transform"
          >
            <Camera className="w-10 h-10 mb-1" />
            <span className="text-xs font-medium">Take Photo</span>
          </button>
          
          {/* Or choose from library */}
          <div className="text-center">
            <p className="text-gray-400 dark:text-dark-muted text-sm mb-3">or</p>
            <label htmlFor="library-input" className="cursor-pointer">
              <span className="px-6 py-3 rounded-2xl border-2 border-cream-300 dark:border-dark-border text-navy-700 dark:text-dark-text font-medium text-sm hover:border-orange-400 transition-colors inline-block">
                Choose from Photos / Files
              </span>
            </label>
          </div>
          
          <p className="text-gray-500 dark:text-dark-muted text-center text-sm mt-4">
            Upload a receipt screenshot, PDF, or snap a photo
          </p>
        </div>
      )}

      {step === 'form' && (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Receipt Preview */}
          {imagePreview && (
            <div className="relative rounded-xl overflow-hidden">
              <img src={imagePreview} alt="Receipt" className="w-full h-48 object-cover" />
              {(uploading || analyzing) && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div className="text-center text-white">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                    <p className="text-sm">{uploading ? 'Uploading...' : 'Analyzing with AI...'}</p>
                  </div>
                </div>
              )}
              {!uploading && !analyzing && (
                <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  AI Extracted
                </div>
              )}
            </div>
          )}

          {/* Job Selection */}
          <Card>
            <CardContent>
              <p className="text-sm font-medium text-navy-800 mb-2">Attach to Job</p>
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
                {showJobDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-auto">
                    {filteredJobs.slice(0, 5).map((job) => (
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
                        <p className="font-medium text-navy-800 text-sm">{job.job_name}</p>
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        setJobId(null)
                        setJobSearch('')
                        setShowJobDropdown(false)
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-cream-50 border-t text-gray-500 text-sm"
                    >
                      General Expense
                    </button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Details */}
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
                placeholder="Mr Glass, U-Haul..."
                value={vendor}
                onChange={(e) => setVendor(e.target.value)}
                required
              />

              <Select value={category} onValueChange={(v) => setCategory(v as ExpenseCategory)}>
                <SelectTrigger label="Category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(expenseCategoryConfig).map(([value, config]) => (
                    <SelectItem key={value} value={value}>
                      {config.icon} {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}>
                <SelectTrigger label="Paid with">
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
            </CardContent>
          </Card>

          <Button type="submit" className="w-full" size="lg" variant="primary" loading={loading}>
            Save Expense
          </Button>
        </form>
      )}
    </div>
  )
}
