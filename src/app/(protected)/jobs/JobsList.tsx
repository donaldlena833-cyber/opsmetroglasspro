'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  AlertCircle,
  ArrowUpDown,
  CalendarRange,
  ChevronRight,
  MapPin,
  Search,
  Trash2,
  User,
} from 'lucide-react'
import { formatCurrency, formatDateShort, formatRelativeDate, getJobAttentionStatus, jobStatusConfig, cn } from '@/lib/utils'
import { JobWithClient } from '@/lib/supabase/types'
import { useToast } from '@/components/ui/use-toast'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { addMonths, isBefore } from 'date-fns'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface JobsListProps {
  initialJobs: (JobWithClient & { total_invoice_value: number; invoice_count: number; total_revenue: number; total_expenses: number })[]
  totals: {
    totalRevenue: number
    totalExpenses: number
    totalNet: number
    activeJobs: number
    totalRegisteredValue: number
    totalScheduledValue: number
  }
}

type FilterType = 'all' | 'active' | 'closed' | 'archived'
type SortType = 'recent' | 'install' | 'net'

const filterOptions: { value: FilterType; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'closed', label: 'Closed' },
  { value: 'archived', label: 'Archived' },
]

const sortOptions: { value: SortType; label: string }[] = [
  { value: 'recent', label: 'Recently updated' },
  { value: 'install', label: 'Install date' },
  { value: 'net', label: 'Highest net' },
]

export function JobsList({ initialJobs, totals }: JobsListProps) {
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()
  
  const [jobs, setJobs] = useState(initialJobs)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterType>('active')
  const [sort, setSort] = useState<SortType>('recent')
  const [deleteJob, setDeleteJob] = useState<JobWithClient | null>(null)
  const [deleting, setDeleting] = useState(false)

  const getArchiveState = (job: { status: string; updated_at: string }) => {
    const threeMonthsAgo = addMonths(new Date(), -3)
    const isClosed = job.status === 'closed'
    const isArchived = isClosed && isBefore(new Date(job.updated_at), threeMonthsAgo)

    return { isClosed, isArchived }
  }

  const filteredJobs = useMemo(() => {
    const searchLower = search.trim().toLowerCase()

    return jobs
      .filter((job) => {
        const matchesSearch =
          searchLower === '' ||
        job.job_name.toLowerCase().includes(searchLower) ||
        job.address.toLowerCase().includes(searchLower) ||
        job.clients?.name?.toLowerCase().includes(searchLower)

        if (!matchesSearch) return false

        const { isClosed, isArchived } = getArchiveState(job)

        switch (filter) {
          case 'active':
            return !isClosed
          case 'closed':
            return isClosed && !isArchived
          case 'archived':
            return isArchived
          case 'all':
          default:
            return true
        }
      })
      .sort((left, right) => {
        if (sort === 'install') {
          const leftInstall = left.install_date ? new Date(left.install_date).getTime() : Number.MAX_SAFE_INTEGER
          const rightInstall = right.install_date ? new Date(right.install_date).getTime() : Number.MAX_SAFE_INTEGER
          return leftInstall - rightInstall
        }

        if (sort === 'net') {
          const leftNet = left.total_revenue - left.total_expenses
          const rightNet = right.total_revenue - right.total_expenses
          return rightNet - leftNet
        }

        return new Date(right.updated_at).getTime() - new Date(left.updated_at).getTime()
      })
  }, [jobs, search, filter, sort])

  const filterCounts = useMemo(() => {
    return jobs.reduce(
      (counts, job) => {
        const { isClosed, isArchived } = getArchiveState(job)
        counts.all += 1

        if (isArchived) {
          counts.archived += 1
        } else if (isClosed) {
          counts.closed += 1
        } else {
          counts.active += 1
        }

        return counts
      },
      { all: 0, active: 0, closed: 0, archived: 0 } satisfies Record<FilterType, number>
    )
  }, [jobs])

  const visibleSummary = useMemo(() => {
    return filteredJobs.reduce(
      (summary, job) => {
        if (job.install_date) {
          summary.scheduled += 1
        }

        if (getJobAttentionStatus(job).needsAttention) {
          summary.attention += 1
        }

        summary.net += job.total_revenue - job.total_expenses
        summary.registeredValue += job.total_invoice_value
        return summary
      },
      { scheduled: 0, attention: 0, net: 0, registeredValue: 0 }
    )
  }, [filteredJobs])

  const handleDelete = async () => {
    if (!deleteJob) return
    setDeleting(true)

    const { error } = await supabase
      .from('jobs')
      .delete()
      .eq('id', deleteJob.id)

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete job',
        variant: 'destructive',
      })
      setDeleting(false)
      return
    }

    setJobs((current) => current.filter((job) => job.id !== deleteJob.id))
    toast({
      title: 'Deleted',
      description: 'Job has been deleted',
      variant: 'success',
    })
    setDeleteJob(null)
    setDeleting(false)
  }

  return (
    <>
      <Card className="mb-6 overflow-hidden">
        <div className="p-4 sm:p-5">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0 flex-1">
                <Input
                  placeholder="Search jobs, clients, addresses..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  icon={<Search className="h-5 w-5" />}
                />
              </div>

              <div className="w-full lg:w-[230px]">
                <Select value={sort} onValueChange={(value) => setSort(value as SortType)}>
                  <SelectTrigger>
                    <div className="flex items-center gap-2">
                      <ArrowUpDown className="h-4 w-4 text-navy-400 dark:text-dark-muted" />
                      <SelectValue placeholder="Sort jobs" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {sortOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {filterOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFilter(option.value)}
                  className={cn(
                    'rounded-full border px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors',
                    filter === option.value
                      ? 'border-navy-800 bg-navy-800 text-white dark:border-orange-400 dark:bg-orange-500'
                      : 'border-cream-300 bg-white text-navy-500 hover:bg-cream-100 dark:border-dark-border dark:bg-dark-card dark:text-dark-muted dark:hover:bg-dark-border'
                  )}
                >
                  {option.label} ({filterCounts[option.value]})
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-[24px] border border-cream-200 bg-cream-50/80 p-4 dark:border-dark-border dark:bg-dark-border/70">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-navy-500 dark:text-dark-muted">
                  In View
                </p>
                <p className="mt-2 text-lg font-semibold text-navy-800 dark:text-dark-text">{filteredJobs.length}</p>
              </div>
              <div className="rounded-[24px] border border-cream-200 bg-cream-50/80 p-4 dark:border-dark-border dark:bg-dark-border/70">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-navy-500 dark:text-dark-muted">
                  Scheduled
                </p>
                <p className="mt-2 text-lg font-semibold text-navy-800 dark:text-dark-text">{visibleSummary.scheduled}</p>
              </div>
              <div className="rounded-[24px] border border-cream-200 bg-cream-50/80 p-4 dark:border-dark-border dark:bg-dark-border/70">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-navy-500 dark:text-dark-muted">
                  Registered
                </p>
                <p className="mt-2 text-lg font-semibold text-navy-800 dark:text-dark-text">
                  {formatCurrency(visibleSummary.registeredValue)}
                </p>
              </div>
              <div className="rounded-[24px] border border-cream-200 bg-cream-50/80 p-4 dark:border-dark-border dark:bg-dark-border/70">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-navy-500 dark:text-dark-muted">
                  Attention
                </p>
                <p className="mt-2 text-lg font-semibold text-navy-800 dark:text-dark-text">{visibleSummary.attention}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-navy-500 dark:text-dark-muted">
              <span>
                {formatCurrency(visibleSummary.net)} net across the current view
              </span>
              <span>
                {formatCurrency(totals.totalRegisteredValue)} registered overall
              </span>
            </div>
          </div>
        </div>
      </Card>

      {filteredJobs.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <Search className="w-full h-full" />
          </div>
          <p className="empty-state-title">No jobs found</p>
          <p className="empty-state-description">
            {search ? 'Try a different search term' : 'Create your first job to get started'}
          </p>
          {!search && (
            <Button 
              onClick={() => router.push('/jobs/new')} 
              className="mt-4"
              variant="primary"
            >
              Create Job
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4 stagger-list">
          {filteredJobs.map((job) => {
            const statusConfig = jobStatusConfig[job.status]
            const attention = getJobAttentionStatus(job)
            const net = job.total_revenue - job.total_expenses

            return (
              <Card
                key={job.id}
                onClick={() => router.push(`/jobs/${job.id}`)}
                className="cursor-pointer overflow-hidden transition-transform hover:-translate-y-0.5 active:scale-[0.99]"
              >
                <div className="p-4 sm:p-5">
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-lg font-semibold text-navy-800 dark:text-dark-text">
                              {job.job_name}
                            </h3>
                            <Badge variant={job.status as any}>{statusConfig.label}</Badge>
                          </div>

                          <div className="mt-2 flex flex-wrap gap-2">
                            {job.clients && (
                              <span className="inline-flex items-center gap-1 rounded-full border border-cream-200 bg-cream-50 px-3 py-1 text-xs font-medium text-navy-600 dark:border-dark-border dark:bg-dark-border dark:text-dark-text">
                                <User className="h-3.5 w-3.5" />
                                {job.clients.name}
                              </span>
                            )}
                            <span className="inline-flex items-center gap-1 rounded-full border border-cream-200 bg-white px-3 py-1 text-xs font-medium text-navy-500 dark:border-dark-border dark:bg-dark-card dark:text-dark-muted">
                              {job.invoice_count} invoice{job.invoice_count === 1 ? '' : 's'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation()
                              setDeleteJob(job)
                            }}
                            className="rounded-2xl border border-red-200 bg-red-50 p-2 text-red-600 transition-colors hover:bg-red-100 dark:border-red-900/40 dark:bg-red-900/15 dark:text-red-300 dark:hover:bg-red-900/25"
                            aria-label={`Delete ${job.job_name}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                          <ChevronRight className="h-5 w-5 text-navy-300 dark:text-dark-muted" />
                        </div>
                      </div>

                      <div className="mt-4 grid gap-2 text-sm">
                        <div className="flex items-center gap-2 text-navy-500 dark:text-dark-muted">
                          <MapPin className="h-4 w-4 shrink-0" />
                          <span className="line-clamp-1">{job.address}</span>
                        </div>
                        <div className="flex items-center gap-2 text-navy-500 dark:text-dark-muted">
                          <CalendarRange className="h-4 w-4 shrink-0" />
                          <span>
                            {job.install_date
                              ? `Install ${formatDateShort(job.install_date)}`
                              : 'Install date not scheduled yet'}
                          </span>
                        </div>
                      </div>

                      {attention.needsAttention && (
                        <div className="mt-4 rounded-[24px] border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-700 dark:border-orange-800 dark:bg-orange-900/20 dark:text-orange-300">
                          <div className="flex items-center gap-2 font-medium">
                            <AlertCircle className="h-4 w-4 shrink-0" />
                            {attention.message}
                          </div>
                        </div>
                      )}

                      <div className="mt-4 grid grid-cols-3 gap-2">
                        <div className="rounded-[22px] border border-cream-200 bg-cream-50/80 p-3 dark:border-dark-border dark:bg-dark-border/70">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-navy-500 dark:text-dark-muted">
                            Revenue
                          </p>
                          <p className="mt-1 font-semibold text-green-600 dark:text-green-400">
                            {formatCurrency(job.total_revenue)}
                          </p>
                        </div>
                        <div className="rounded-[22px] border border-cream-200 bg-cream-50/80 p-3 dark:border-dark-border dark:bg-dark-border/70">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-navy-500 dark:text-dark-muted">
                            Costs
                          </p>
                          <p className="mt-1 font-semibold text-red-600 dark:text-red-400">
                            {formatCurrency(job.total_expenses)}
                          </p>
                        </div>
                        <div className="rounded-[22px] border border-cream-200 bg-cream-50/80 p-3 dark:border-dark-border dark:bg-dark-border/70">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-navy-500 dark:text-dark-muted">
                            Net
                          </p>
                          <p
                            className={cn(
                              'mt-1 font-semibold',
                              net >= 0 ? 'text-navy-800 dark:text-dark-text' : 'text-red-600 dark:text-red-400'
                            )}
                          >
                            {formatCurrency(net)}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-navy-400 dark:text-dark-muted">
                        <span>Updated {formatRelativeDate(job.updated_at)}</span>
                        <span>
                          {job.total_invoice_value > 0
                            ? `${formatCurrency(job.total_invoice_value)} invoiced`
                            : 'No invoices yet'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <Dialog open={!!deleteJob} onOpenChange={() => setDeleteJob(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Job?</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {deleteJob?.job_name}? This will also delete all associated expenses, payments, and invoices. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteJob(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              loading={deleting}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
