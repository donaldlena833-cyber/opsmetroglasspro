'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/badge'
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
import { useToast } from '@/components/ui/use-toast'
import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  Copy,
  CreditCard,
  Download,
  ExternalLink,
  FileText,
  ReceiptText,
  Share2,
  Sparkles,
} from 'lucide-react'
import {
  formatCurrency,
  formatDate,
  generateInvoiceFilename,
  invoiceStatusConfig,
} from '@/lib/utils'
import { InvoiceWithJob, InvoiceStatus, LineItem, Payment } from '@/lib/supabase/types'

interface InvoiceDetailProps {
  invoice: InvoiceWithJob
}

function getCustomerPaymentAmount(payment: Payment) {
  return Number(payment.gross_amount ?? payment.amount ?? 0)
}

export function InvoiceDetail({ invoice: initialInvoice }: InvoiceDetailProps) {
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  const [invoice, setInvoice] = useState(initialInvoice)
  const [updating, setUpdating] = useState(false)
  const [creatingLink, setCreatingLink] = useState(false)
  const [paymentLinkUrl, setPaymentLinkUrl] = useState<string | null>(null)

  const lineItems = invoice.line_items_json as LineItem[]
  const statusConfig = invoiceStatusConfig[invoice.status]
  const job = invoice.jobs
  const totalPaid = (invoice.payments || []).reduce((sum, payment) => sum + getCustomerPaymentAmount(payment), 0)
  const balanceDue = Math.max(Number(invoice.total) - totalPaid, 0)

  const handleStatusChange = async (newStatus: InvoiceStatus) => {
    setUpdating(true)

    const { error } = await supabase
      .from('invoices')
      .update({ status: newStatus })
      .eq('id', invoice.id)

    if (error) {
      toast({ title: 'Error', description: 'Failed to update invoice status.', variant: 'destructive' })
      setUpdating(false)
      return
    }

    setInvoice({ ...invoice, status: newStatus })
    toast({ title: 'Updated', description: 'Invoice status updated.', variant: 'success' })
    setUpdating(false)
    router.refresh()
  }

  const handleDownload = async () => {
    if (!invoice.pdf_url) {
      toast({ title: 'No PDF yet', description: 'Generate the invoice PDF first.', variant: 'warning' })
      return
    }

    const filename = generateInvoiceFilename(
      invoice.invoice_number,
      invoice.jobs?.job_name || '',
      invoice.jobs?.address || ''
    )

    const response = await fetch(invoice.pdf_url)
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = filename
    document.body.appendChild(anchor)
    anchor.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(anchor)
  }

  const handleSharePdf = async () => {
    if (!invoice.pdf_url) {
      toast({ title: 'No PDF yet', description: 'Generate the invoice PDF first.', variant: 'warning' })
      return
    }

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Invoice #${invoice.invoice_number}`,
          text: `Invoice for ${invoice.customer_name}`,
          url: invoice.pdf_url,
        })
        return
      } catch {
        // Fall back to clipboard below.
      }
    }

    await navigator.clipboard.writeText(invoice.pdf_url)
    toast({ title: 'Copied', description: 'Invoice PDF link copied to clipboard.', variant: 'success' })
  }

  const handleCreatePaymentLink = async () => {
    setCreatingLink(true)

    try {
      const response = await fetch('/api/stripe/payment-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ invoiceId: invoice.id }),
      })

      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.error || 'Failed to create Stripe payment link.')
      }

      setPaymentLinkUrl(payload.url)

      try {
        await navigator.clipboard.writeText(payload.url)
        toast({
          title: 'Stripe link ready',
          description: 'Payment link created and copied to your clipboard.',
          variant: 'success',
        })
      } catch {
        toast({
          title: 'Stripe link ready',
          description: 'Payment link created. Copy or open it below.',
          variant: 'success',
        })
      }
    } catch (error) {
      toast({
        title: 'Stripe setup issue',
        description: error instanceof Error ? error.message : 'Failed to create Stripe payment link.',
        variant: 'destructive',
      })
    } finally {
      setCreatingLink(false)
    }
  }

  const handleCopyPaymentLink = async () => {
    if (!paymentLinkUrl) return
    await navigator.clipboard.writeText(paymentLinkUrl)
    toast({ title: 'Copied', description: 'Stripe payment link copied.', variant: 'success' })
  }

  const handleSharePaymentLink = async () => {
    if (!paymentLinkUrl) return

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Pay invoice #${invoice.invoice_number}`,
          text: `MetroGlass Pro payment link for ${invoice.customer_name}`,
          url: paymentLinkUrl,
        })
        return
      } catch {
        // Fall back to clipboard below.
      }
    }

    await handleCopyPaymentLink()
  }

  return (
    <div className="page-container safe-top pb-32">
      <section className="relative mb-6 overflow-hidden rounded-[34px] border border-cream-200/90 bg-white/88 p-6 shadow-card-lg backdrop-blur-sm dark:border-dark-border dark:bg-dark-card/90 dark:shadow-card-dark">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(184,138,82,0.18),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(59,51,45,0.08),transparent_32%)]" />

        <div className="relative">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <div className="mb-4 flex items-center gap-2">
                <Button variant="outline" size="icon-sm" onClick={() => router.back()}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-orange-700 dark:text-orange-300">
                  Invoice workspace
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-[2rem] font-semibold tracking-[-0.03em] text-navy-900 dark:text-dark-text sm:text-[2.4rem]">
                  #{invoice.invoice_number}
                </h1>
                <Badge variant={invoice.status as never} className="text-sm">
                  {statusConfig.label}
                </Badge>
                {balanceDue <= 0 && (
                  <span className="inline-flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-green-700 dark:border-green-900/30 dark:bg-green-900/20 dark:text-green-300">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Paid in full
                  </span>
                )}
              </div>

              <p className="mt-3 text-base font-medium text-navy-700 dark:text-dark-text">
                {invoice.customer_name}
              </p>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-navy-500 dark:text-dark-muted">
                Keep this invoice moving without leaving the app. Update status, download the PDF, and create a Stripe payment link for the remaining balance.
              </p>

              {job && (
                <button
                  onClick={() => router.push(`/jobs/${job.id}`)}
                  className="mt-4 inline-flex items-center gap-2 rounded-full border border-cream-200 bg-white/80 px-4 py-2 text-sm font-medium text-navy-700 transition-colors hover:bg-cream-100 dark:border-dark-border dark:bg-dark-card/80 dark:text-dark-text dark:hover:bg-dark-border"
                >
                  <ReceiptText className="h-4 w-4" />
                  {job.job_name}
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={handleSharePdf}>
                <Share2 className="mr-2 h-4 w-4" />
                Share PDF
              </Button>
              <Button onClick={handleDownload}>
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </Button>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Card className="p-4">
              <p className="stat-label">Invoice Total</p>
              <p className="stat-value">{formatCurrency(Number(invoice.total))}</p>
              <p className="mt-1 text-xs text-navy-400 dark:text-dark-muted">Full billed amount</p>
            </Card>
            <Card className="p-4">
              <p className="stat-label">Collected</p>
              <p className="stat-value">{formatCurrency(totalPaid)}</p>
              <p className="mt-1 text-xs text-navy-400 dark:text-dark-muted">Payments already recorded</p>
            </Card>
            <Card className="p-4">
              <p className="stat-label">Balance Due</p>
              <p className="stat-value">{formatCurrency(balanceDue)}</p>
              <p className="mt-1 text-xs text-navy-400 dark:text-dark-muted">What the Stripe link will charge</p>
            </Card>
            <Card className="p-4">
              <p className="stat-label">Due Date</p>
              <p className="stat-value text-[1.35rem]">{formatDate(invoice.due_date)}</p>
              <p className="mt-1 text-xs text-navy-400 dark:text-dark-muted">Invoice due date</p>
            </Card>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          <Card>
            <CardContent className="space-y-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-700 dark:text-orange-300">
                    Line items
                  </p>
                  <h2 className="mt-2 text-xl font-semibold tracking-[-0.02em] text-navy-900 dark:text-dark-text">
                    What this invoice covers
                  </h2>
                </div>
                <div className="rounded-2xl border border-cream-200 bg-cream-50 px-3 py-2 text-sm font-medium text-navy-700 dark:border-dark-border dark:bg-dark-card dark:text-dark-text">
                  {lineItems.length} items
                </div>
              </div>

              <div className="space-y-3">
                {lineItems.map((item, index) => (
                  <div
                    key={`${item.description}-${index}`}
                    className="rounded-[24px] border border-cream-200/80 bg-cream-50/70 p-4 dark:border-dark-border dark:bg-dark-bg/50"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold text-navy-800 dark:text-dark-text">{item.description}</p>
                        <p className="mt-1 text-sm text-navy-500 dark:text-dark-muted">
                          {item.qty} × {formatCurrency(item.unit_price)}
                        </p>
                      </div>
                      <p className="text-base font-semibold text-navy-900 dark:text-dark-text">
                        {formatCurrency(item.line_total)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-[28px] border border-cream-200/90 bg-white/80 p-5 dark:border-dark-border dark:bg-dark-bg/60">
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between text-navy-500 dark:text-dark-muted">
                    <span>Subtotal</span>
                    <span className="font-medium text-navy-800 dark:text-dark-text">
                      {formatCurrency(Number(invoice.subtotal))}
                    </span>
                  </div>
                  {invoice.discount_applied && (
                    <div className="flex items-center justify-between text-navy-500 dark:text-dark-muted">
                      <span>Discount ({invoice.discount_percent}%)</span>
                      <span className="font-medium text-red-600 dark:text-red-400">
                        -{formatCurrency(Number(invoice.discount_amount))}
                      </span>
                    </div>
                  )}
                  {invoice.tax_applied && (
                    <div className="flex items-center justify-between text-navy-500 dark:text-dark-muted">
                      <span>Tax ({invoice.tax_rate}%)</span>
                      <span className="font-medium text-navy-800 dark:text-dark-text">
                        {formatCurrency(Number(invoice.tax))}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between border-t border-cream-200 pt-3 text-base font-semibold text-navy-900 dark:border-dark-border dark:text-dark-text">
                    <span>Total</span>
                    <span>{formatCurrency(Number(invoice.total))}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {invoice.notes && (
            <Card>
              <CardContent>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-700 dark:text-orange-300">
                  Notes
                </p>
                <p className="mt-3 whitespace-pre-line text-sm leading-7 text-navy-600 dark:text-dark-muted">
                  {invoice.notes}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardContent className="space-y-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-700 dark:text-orange-300">
                  Collect payment
                </p>
                <h2 className="mt-2 text-xl font-semibold tracking-[-0.02em] text-navy-900 dark:text-dark-text">
                  Create a Stripe payment link
                </h2>
                <p className="mt-2 text-sm leading-7 text-navy-500 dark:text-dark-muted">
                  Generate a hosted Stripe payment link for the current balance due, then copy or share it with the client.
                </p>
              </div>

              <div className="rounded-[28px] border border-orange-200 bg-orange-50/75 p-4 dark:border-orange-900/30 dark:bg-orange-900/10">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-orange-700 dark:bg-dark-card dark:text-orange-300">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-orange-800 dark:text-orange-200">
                      Stripe link amount: {formatCurrency(balanceDue)}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-orange-700/85 dark:text-orange-300/90">
                      The link uses the remaining invoice balance based on payments already recorded in MetroGlassOps.
                    </p>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleCreatePaymentLink}
                loading={creatingLink}
                className="w-full"
                size="lg"
                disabled={balanceDue <= 0}
              >
                <CreditCard className="mr-2 h-4 w-4" />
                {paymentLinkUrl ? 'Create fresh Stripe link' : 'Create Stripe link'}
              </Button>

              {balanceDue <= 0 ? (
                <div className="rounded-[24px] border border-green-200 bg-green-50/80 p-4 text-sm leading-7 text-green-700 dark:border-green-900/30 dark:bg-green-900/15 dark:text-green-300">
                  This invoice already looks fully paid. No Stripe link is needed unless you record more charges.
                </div>
              ) : (
                <div className="space-y-3">
                  <Input
                    label="Stripe payment link"
                    value={paymentLinkUrl || ''}
                    readOnly
                    placeholder="Create a link to show it here"
                  />

                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    <Button
                      variant="outline"
                      onClick={handleCopyPaymentLink}
                      disabled={!paymentLinkUrl}
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      Copy
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleSharePaymentLink}
                      disabled={!paymentLinkUrl}
                    >
                      <Share2 className="mr-2 h-4 w-4" />
                      Share
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => paymentLinkUrl && window.open(paymentLinkUrl, '_blank', 'noopener,noreferrer')}
                      disabled={!paymentLinkUrl}
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Open
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-700 dark:text-orange-300">
                  Invoice controls
                </p>
                <h2 className="mt-2 text-xl font-semibold tracking-[-0.02em] text-navy-900 dark:text-dark-text">
                  Status, dates, and files
                </h2>
              </div>

              <Select
                value={invoice.status}
                onValueChange={(value) => handleStatusChange(value as InvoiceStatus)}
                disabled={updating}
              >
                <SelectTrigger label="Invoice status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(invoiceStatusConfig).map(([value, config]) => (
                    <SelectItem key={value} value={value}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="grid gap-3">
                <div className="rounded-[24px] border border-cream-200/80 bg-cream-50/70 p-4 dark:border-dark-border dark:bg-dark-bg/50">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-navy-700 shadow-soft dark:bg-dark-card dark:text-dark-text">
                      <CalendarClock className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-navy-500 dark:text-dark-muted">
                        Invoice date
                      </p>
                      <p className="mt-1 font-semibold text-navy-900 dark:text-dark-text">
                        {formatDate(invoice.invoice_date)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-[24px] border border-cream-200/80 bg-cream-50/70 p-4 dark:border-dark-border dark:bg-dark-bg/50">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-navy-700 shadow-soft dark:bg-dark-card dark:text-dark-text">
                      <ReceiptText className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-navy-500 dark:text-dark-muted">
                        Bill to
                      </p>
                      <p className="mt-1 font-semibold text-navy-900 dark:text-dark-text">
                        {invoice.customer_name}
                      </p>
                      {invoice.customer_address && (
                        <p className="mt-1 whitespace-pre-line text-sm text-navy-500 dark:text-dark-muted">
                          {invoice.customer_address}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <Button variant="outline" onClick={handleSharePdf}>
                  <Share2 className="mr-2 h-4 w-4" />
                  Share PDF
                </Button>
                <Button onClick={handleDownload}>
                  <Download className="mr-2 h-4 w-4" />
                  Download PDF
                </Button>
              </div>

              {invoice.pdf_url && (
                <a
                  href={invoice.pdf_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 rounded-[24px] border border-cream-200/80 bg-white/80 p-4 transition-colors hover:bg-cream-50 dark:border-dark-border dark:bg-dark-bg/50 dark:hover:bg-dark-bg"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-navy-900 dark:text-dark-text">Invoice PDF</p>
                    <p className="text-sm text-navy-500 dark:text-dark-muted">Open the latest PDF in a new tab</p>
                  </div>
                  <ExternalLink className="h-4 w-4 text-navy-400 dark:text-dark-muted" />
                </a>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
