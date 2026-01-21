'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { 
  Search, 
  ChevronRight, 
  MapPin, 
  Calendar, 
  Plus,
  Trash2,
  User
} from 'lucide-react'
import { formatDateShort, jobStatusConfig, cn, truncate } from '@/lib/utils'
import { JobWithClient, JobStatus } from '@/lib/supabase/types'
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

interface JobsListProps {
  initialJobs: JobWithClient[]
}

type FilterType = 'all' | 'active' | 'closed' | 'archived'

const filterOptions: { value: FilterType; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'closed', label: 'Closed' },
  { value: 'archived', label: 'Archived' },
]

export function JobsList({ initialJobs }: JobsListProps) {
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()
  
  const [jobs, setJobs] = useState(initialJobs)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterType>('active')
  const [deleteJob, setDeleteJob] = useState<JobWithClient | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [swipedJobId, setSwipedJobId] = useState<string | null>(null)

  // Filter and search logic
  const filteredJobs = useMemo(() => {
    const threeMonthsAgo = addMonths(new Date(), -3)

    return jobs.filter((job) => {
      // Search filter
      const searchLower = search.toLowerCase()
      const matchesSearch = search === '' || 
        job.job_name.toLowerCase().includes(searchLower) ||
        job.address.toLowerCase().includes(searchLower) ||
        job.clients?.name?.toLowerCase().includes(searchLower)

      if (!matchesSearch) return false

      // Status filter
      const isClosed = job.status === 'closed'
      const isArchived = isClosed && isBefore(new Date(job.updated_at), threeMonthsAgo)

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
  }, [jobs, search, filter])

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

    setJobs(jobs.filter(j => j.id !== deleteJob.id))
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
      {/* Search and Filter */}
      <div className="mb-4 space-y-3">
        <Input
          placeholder="Search jobs, clients, addresses..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          icon={<Search className="w-5 h-5" />}
        />
        
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {filterOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setFilter(option.value)}
              className={cn(
                'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
                filter === option.value
                  ? 'bg-navy-800 text-white'
                  : 'bg-white text-gray-600 border border-gray-200'
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Jobs List */}
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
              <Plus className="w-4 h-4 mr-2" />
              New Job
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredJobs.map((job) => {
            const statusConfig = jobStatusConfig[job.status]

            return (
              <div
                key={job.id}
                className="relative overflow-hidden rounded-xl"
              >
                {/* Delete button (shown on swipe/long press) */}
                <div 
                  className={cn(
                    'absolute inset-y-0 right-0 flex items-center justify-end bg-red-500 transition-all',
                    swipedJobId === job.id ? 'w-20' : 'w-0'
                  )}
                >
                  <button
                    onClick={() => setDeleteJob(job)}
                    className="w-full h-full flex items-center justify-center text-white"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>

                {/* Job Card */}
                <Card
                  onClick={() => router.push(`/jobs/${job.id}`)}
                  onContextMenu={(e) => {
                    e.preventDefault()
                    setSwipedJobId(swipedJobId === job.id ? null : job.id)
                  }}
                  className={cn(
                    'p-4 cursor-pointer active:scale-[0.99] transition-all',
                    swipedJobId === job.id && '-translate-x-20'
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-navy-800 truncate">
                          {job.job_name}
                        </h3>
                        <Badge variant={job.status as any} className="flex-shrink-0">
                          {statusConfig.label}
                        </Badge>
                      </div>

                      <div className="mt-2 space-y-1">
                        <div className="flex items-center gap-1.5 text-sm text-gray-500">
                          <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="truncate">{truncate(job.address, 40)}</span>
                        </div>

                        {job.clients && (
                          <div className="flex items-center gap-1.5 text-sm text-gray-500">
                            <User className="w-3.5 h-3.5 flex-shrink-0" />
                            <span className="truncate">{job.clients.name}</span>
                          </div>
                        )}

                        {job.install_date && (
                          <div className="flex items-center gap-1.5 text-sm text-gray-500">
                            <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                            <span>Install: {formatDateShort(job.install_date)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 ml-2" />
                  </div>
                </Card>
              </div>
            )
          })}
        </div>
      )}

      {/* New Job FAB */}
      <Button
        onClick={() => router.push('/jobs/new')}
        variant="primary"
        size="icon-lg"
        className="fixed right-4 bottom-24 shadow-lg"
      >
        <Plus className="w-6 h-6" />
      </Button>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteJob} onOpenChange={() => setDeleteJob(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Job?</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deleteJob?.job_name}"? This will also delete all associated expenses, payments, and invoices. This action cannot be undone.
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
