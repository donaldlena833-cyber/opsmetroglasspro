'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import * as Tabs from '@radix-ui/react-tabs'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useToast } from '@/components/ui/use-toast'
import {
  ArrowLeft,
  MapPin,
  User,
  Calendar,
  Edit,
  Trash2,
  Plus,
  Receipt,
  CreditCard,
  FileText,
  DollarSign,
  ChevronRight,
  Image as ImageIcon,
} from 'lucide-react'
import {
  formatCurrency,
  formatDate,
  formatDateShort,
  jobStatusConfig,
  expenseCategoryConfig,
  paymentMethodConfig,
  paymentTypeConfig,
  invoiceStatusConfig,
  calculateJobNet,
  cn,
} from '@/lib/utils'
import { JobWithRelations, JobStatus, PaymentMethod, PaymentType } from '@/lib/supabase/types'

interface JobDetailProps {
  job: JobWithRelations
}

export function JobDetail({ job: initialJob }: JobDetailProps) {
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  const [job, setJob] = useState(initialJob)
  const [activeTab, setActiveTab] = useState('overview')
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  // Edit form state
  const [editStatus, setEditStatus] = useState<JobStatus>(job.status)
  const [editInstallDate, setEditInstallDate] = useState(job.install_date || '')
  const [editInstallEndDate, setEditInstallEndDate] = useState(job.install_end_date || '')
  const [editNotes, setEditNotes] = useState(job.notes || '')

  const statusConfig = jobStatusConfig[job.status]
  const { revenue, costs, net } = calculateJobNet(job.payments || [], job.expenses || [])

  const handleStatusChange = async (newStatus: JobStatus) => {
    const { error } = await supabase
      .from('jobs')
      .update({ status: newStatus })
      .eq('id', job.id)

    if (error) {
      toast({ title: 'Error', description: 'Failed to update status', variant: 'destructive' })
      return
    }

    setJob({ ...job, status: newStatus })
    setEditStatus(newStatus)
    toast({ title: 'Updated', description: 'Job status updated', variant: 'success' })
  }

  const handleSaveEdit = async () => {
    setEditing(true)
    const { error } = await supabase
      .from('jobs')
      .update({
        status: editStatus,
        install_date: editInstallDate || null,
        install_end_date: editInstallEndDate || null,
        notes: editNotes || null,
      })
      .eq('id', job.id)

    if (error) {
      toast({ title: 'Error', description: 'Failed to update job', variant: 'destructive' })
      setEditing(false)
      return
    }

    setJob({
      ...job,
      status: editStatus,
      install_date: editInstallDate || null,
      install_end_date: editInstallEndDate || null,
      notes: editNotes || null,
    })
    setEditing(false)
    toast({ title: 'Saved', description: 'Job details updated', variant: 'success' })
    router.refresh()
  }

  const handleDelete = async () => {
    setDeleting(true)
    const { error } = await supabase.from('jobs').delete().eq('id', job.id)

    if (error) {
      toast({ title: 'Error', description: 'Failed to delete job', variant: 'destructive' })
      setDeleting(false)
      return
    }

    toast({ title: 'Deleted', description: 'Job has been deleted', variant: 'success' })
    router.push('/jobs')
    router.refresh()
  }

  return (
    <div className="page-container safe-top pb-32">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-sm"
        >
          <ArrowLeft className="w-5 h-5 text-navy-800" />
        </button>
        <div className="flex gap-2">
          <button
            onClick={() => setShowDeleteDialog(true)}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-sm text-red-500"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Job Title & Status */}
      <div className="mb-4">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-xl font-bold text-navy-800">{job.job_name}</h1>
          <Badge variant={job.status as any} className="flex-shrink-0">
            {statusConfig.label}
          </Badge>
        </div>
        <div className="mt-2 space-y-1">
          <div className="flex items-center gap-1.5 text-sm text-gray-500">
            <MapPin className="w-4 h-4" />
            <span>{job.address}</span>
          </div>
          {job.clients && (
            <button
              onClick={() => router.push(`/clients/${job.clients!.id}`)}
              className="flex items-center gap-1.5 text-sm text-navy-600 hover:text-navy-800"
            >
              <User className="w-4 h-4" />
              <span>{job.clients.name}</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          )}
          {job.install_date && (
            <div className="flex items-center gap-1.5 text-sm text-gray-500">
              <Calendar className="w-4 h-4" />
              <span>
                Install: {formatDateShort(job.install_date)}
                {job.install_end_date && job.install_end_date !== job.install_date && (
                  <> → {formatDateShort(job.install_end_date)}</>
                )}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Net Profit Card */}
      <Card className="mb-4">
        <CardContent className="py-4">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-xs text-gray-500">Revenue</p>
              <p className="text-lg font-bold text-green-600">{formatCurrency(revenue)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Costs</p>
              <p className="text-lg font-bold text-red-600">{formatCurrency(costs)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Net</p>
              <p className={cn('text-lg font-bold', net >= 0 ? 'text-navy-800' : 'text-red-600')}>
                {formatCurrency(net)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
        <Tabs.List className="flex gap-1 bg-white rounded-xl p-1 mb-4 shadow-sm">
          {['overview', 'costs', 'payments', 'invoices'].map((tab) => (
            <Tabs.Trigger
              key={tab}
              value={tab}
              className={cn(
                'flex-1 py-2.5 px-3 rounded-lg text-sm font-medium transition-colors capitalize',
                activeTab === tab
                  ? 'bg-navy-800 text-white'
                  : 'text-gray-500 hover:text-navy-800'
              )}
            >
              {tab}
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        {/* Overview Tab */}
        <Tabs.Content value="overview" className="space-y-4">
          <Card>
            <CardContent className="space-y-4">
              <Select value={editStatus} onValueChange={(v) => handleStatusChange(v as JobStatus)}>
                <SelectTrigger label="Status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(jobStatusConfig).map(([value, config]) => (
                    <SelectItem key={value} value={value}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  type="date"
                  label="Install Date"
                  value={editInstallDate}
                  onChange={(e) => setEditInstallDate(e.target.value)}
                />
                <Input
                  type="date"
                  label="End Date"
                  value={editInstallEndDate}
                  onChange={(e) => setEditInstallEndDate(e.target.value)}
                />
              </div>

              <Textarea
                label="Notes"
                placeholder="Job notes..."
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                rows={4}
              />

              <Button onClick={handleSaveEdit} loading={editing} className="w-full">
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </Tabs.Content>

        {/* Costs Tab */}
        <Tabs.Content value="costs" className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-500">
              Total: {formatCurrency(costs)}
            </p>
            <Button
              size="sm"
              variant="outline-orange"
              onClick={() => router.push(`/jobs/expense/new?jobId=${job.id}`)}
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Cost
            </Button>
          </div>

          {(!job.expenses || job.expenses.length === 0) ? (
            <div className="empty-state py-8">
              <Receipt className="empty-state-icon w-12 h-12" />
              <p className="empty-state-title">No costs yet</p>
              <p className="empty-state-description">Add expenses for this job</p>
            </div>
          ) : (
            <div className="space-y-2">
              {job.expenses.map((expense) => {
                const categoryConfig = expenseCategoryConfig[expense.category]
                return (
                  <Card key={expense.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        {expense.receipt_image_url ? (
                          <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                            <img
                              src={expense.receipt_image_url}
                              alt="Receipt"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-xl">{categoryConfig.icon}</span>
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-navy-800">{expense.vendor}</p>
                          <p className="text-sm text-gray-500">{categoryConfig.label}</p>
                          <p className="text-xs text-gray-400 mt-1">{formatDateShort(expense.date)}</p>
                        </div>
                      </div>
                      <p className="font-semibold text-navy-800">{formatCurrency(expense.amount)}</p>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </Tabs.Content>

        {/* Payments Tab */}
        <Tabs.Content value="payments" className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-500">
              Total: {formatCurrency(revenue)}
            </p>
            <Button
              size="sm"
              variant="outline-orange"
              onClick={() => router.push(`/jobs/payment/new?jobId=${job.id}`)}
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Payment
            </Button>
          </div>

          {(!job.payments || job.payments.length === 0) ? (
            <div className="empty-state py-8">
              <CreditCard className="empty-state-icon w-12 h-12" />
              <p className="empty-state-title">No payments yet</p>
              <p className="empty-state-description">Record payments for this job</p>
            </div>
          ) : (
            <div className="space-y-2">
              {job.payments.map((payment: any) => {
                const typeConfig = paymentTypeConfig[payment.payment_type as PaymentType]
                const methodConfig = paymentMethodConfig[payment.method as PaymentMethod]
                return (
                  <Card key={payment.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-navy-800">{typeConfig.label}</p>
                          <span className="text-xs text-gray-400">via {methodConfig.label}</span>
                        </div>
                        {payment.invoices && (
                          <p className="text-sm text-gray-500">
                            Invoice #{payment.invoices.invoice_number}
                          </p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">{formatDateShort(payment.date)}</p>
                      </div>
                      <p className="font-semibold text-green-600">+{formatCurrency(payment.amount)}</p>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </Tabs.Content>

        {/* Invoices Tab */}
        <Tabs.Content value="invoices" className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-500">
              {job.invoices?.length || 0} invoice(s)
            </p>
            <Button
              size="sm"
              variant="outline-orange"
              onClick={() => router.push(`/invoices/new?jobId=${job.id}`)}
            >
              <Plus className="w-4 h-4 mr-1" />
              Create Invoice
            </Button>
          </div>

          {(!job.invoices || job.invoices.length === 0) ? (
            <div className="empty-state py-8">
              <FileText className="empty-state-icon w-12 h-12" />
              <p className="empty-state-title">No invoices yet</p>
              <p className="empty-state-description">Create an invoice for this job</p>
            </div>
          ) : (
            <div className="space-y-2">
              {job.invoices.map((invoice) => {
                const statusConfig = invoiceStatusConfig[invoice.status]
                return (
                  <Card
                    key={invoice.id}
                    onClick={() => router.push(`/invoices/${invoice.id}`)}
                    className="p-4 cursor-pointer active:scale-[0.99]"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-navy-800">#{invoice.invoice_number}</p>
                          <Badge variant={invoice.status as any}>{statusConfig.label}</Badge>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">{formatDateShort(invoice.invoice_date)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-navy-800">{formatCurrency(invoice.total)}</p>
                        <ChevronRight className="w-5 h-5 text-gray-400 ml-auto" />
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </Tabs.Content>
      </Tabs.Root>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Job?</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{job.job_name}"? This will also delete all associated expenses, payments, and invoices. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} loading={deleting}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
