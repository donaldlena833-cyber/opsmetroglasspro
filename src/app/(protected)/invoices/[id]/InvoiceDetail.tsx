'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
  Download,
  Share2,
  Edit,
  FileText,
} from 'lucide-react'
import {
  formatCurrency,
  formatDate,
  invoiceStatusConfig,
  generateInvoiceFilename,
} from '@/lib/utils'
import { InvoiceWithJob, InvoiceStatus, LineItem } from '@/lib/supabase/types'

interface InvoiceDetailProps {
  invoice: InvoiceWithJob
}

export function InvoiceDetail({ invoice: initialInvoice }: InvoiceDetailProps) {
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  const [invoice, setInvoice] = useState(initialInvoice)
  const [updating, setUpdating] = useState(false)

  const statusConfig = invoiceStatusConfig[invoice.status]
  const lineItems = invoice.line_items_json as LineItem[]

  const handleStatusChange = async (newStatus: InvoiceStatus) => {
    setUpdating(true)
    const { error } = await supabase
      .from('invoices')
      .update({ status: newStatus })
      .eq('id', invoice.id)

    if (error) {
      toast({ title: 'Error', description: 'Failed to update status', variant: 'destructive' })
      setUpdating(false)
      return
    }

    setInvoice({ ...invoice, status: newStatus })
    toast({ title: 'Updated', description: 'Invoice status updated', variant: 'success' })
    setUpdating(false)
    router.refresh()
  }

  const handleDownload = async () => {
    if (invoice.pdf_url) {
      const filename = generateInvoiceFilename(
        invoice.invoice_number,
        invoice.jobs?.job_name || '',
        invoice.jobs?.address || ''
      )
      
      const response = await fetch(invoice.pdf_url)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } else {
      toast({ title: 'No PDF', description: 'PDF not generated yet', variant: 'warning' })
    }
  }

  const handleShare = async () => {
    if (navigator.share && invoice.pdf_url) {
      try {
        await navigator.share({
          title: `Invoice #${invoice.invoice_number}`,
          text: `Invoice for ${invoice.customer_name}`,
          url: invoice.pdf_url,
        })
      } catch (err) {
        // User cancelled
      }
    } else if (invoice.pdf_url) {
      await navigator.clipboard.writeText(invoice.pdf_url)
      toast({ title: 'Copied!', description: 'PDF link copied to clipboard', variant: 'success' })
    }
  }

  return (
    <div className="page-container safe-top">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-sm"
        >
          <ArrowLeft className="w-5 h-5 text-navy-800" />
        </button>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={handleShare}>
            <Share2 className="w-5 h-5" />
          </Button>
          <Button variant="primary" size="icon" onClick={handleDownload}>
            <Download className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl font-bold text-navy-800">#{invoice.invoice_number}</h1>
          <Badge variant={invoice.status as any} className="text-sm">
            {statusConfig.label}
          </Badge>
        </div>
        <p className="text-gray-500">{invoice.customer_name}</p>
        {invoice.jobs && (
          <button
            onClick={() => router.push(`/jobs/${invoice.jobs!.id}`)}
            className="text-sm text-navy-600 hover:underline"
          >
            {invoice.jobs.job_name}
          </button>
        )}
      </div>

      <Card className="mb-4">
        <CardContent>
          <Select
            value={invoice.status}
            onValueChange={(v) => handleStatusChange(v as InvoiceStatus)}
            disabled={updating}
          >
            <SelectTrigger label="Invoice Status">
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
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Invoice Date</p>
              <p className="font-medium text-navy-800">{formatDate(invoice.invoice_date)}</p>
            </div>
            <div>
              <p className="text-gray-500">Due Date</p>
              <p className="font-medium text-navy-800">{formatDate(invoice.due_date)}</p>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Bill To</p>
            <p className="font-medium text-navy-800">{invoice.customer_name}</p>
            {invoice.customer_address && (
              <p className="text-sm text-gray-500 whitespace-pre-line">{invoice.customer_address}</p>
            )}
          </div>

          <div className="pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-3">Items</p>
            <div className="space-y-3">
              {lineItems.map((item, index) => (
                <div key={index} className="flex justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-navy-800">{item.description}</p>
                    <p className="text-xs text-gray-500">
                      {item.qty} × {formatCurrency(item.unit_price)}
                    </p>
                  </div>
                  <p className="font-medium text-navy-800">{formatCurrency(item.line_total)}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Subtotal</span>
              <span className="text-navy-800">{formatCurrency(invoice.subtotal)}</span>
            </div>
            {invoice.discount_applied && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Discount ({invoice.discount_percent}%)</span>
                <span className="text-red-600">-{formatCurrency(invoice.discount_amount)}</span>
              </div>
            )}
            {invoice.tax_applied && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Tax ({invoice.tax_rate}%)</span>
                <span className="text-navy-800">{formatCurrency(invoice.tax)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-100">
              <span className="text-navy-800">Total</span>
              <span className="text-navy-800">{formatCurrency(invoice.total)}</span>
            </div>
          </div>

          {invoice.notes && (
            <div className="pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Notes</p>
              <p className="text-sm text-gray-600 whitespace-pre-line">{invoice.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {invoice.pdf_url && (
        <Card>
          <CardContent>
            <button
              onClick={handleDownload}
              className="flex items-center gap-3 w-full text-left"
            >
              <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center">
                <FileText className="w-6 h-6 text-red-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-navy-800">Invoice PDF</p>
                <p className="text-sm text-gray-500">Tap to download</p>
              </div>
              <Download className="w-5 h-5 text-gray-400" />
            </button>
          </CardContent>
        </Card>
      )}

      <Button
        onClick={() => router.push(`/invoices/${invoice.id}/edit`)}
        variant="outline"
        className="w-full mt-4"
      >
        <Edit className="w-4 h-4 mr-2" />
        Edit Invoice
      </Button>
    </div>
  )
}
