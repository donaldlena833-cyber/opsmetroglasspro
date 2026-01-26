'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
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
import { ArrowLeft, Search, Bell, AlertCircle, Clock } from 'lucide-react'
import { reminderPriorityConfig } from '@/lib/utils'
import { ReminderPriority, Job } from '@/lib/supabase/types'

const priorityOptions = [
  { value: 'high', label: 'Payment Collection', icon: AlertCircle, description: 'High priority - shows in red' },
  { value: 'moderate', label: 'Order / Schedule', icon: Clock, description: 'Medium priority - shows in orange' },
  { value: 'low', label: 'Follow-up', icon: Bell, description: 'Low priority - shows in green' },
]

export default function NewReminderPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedJobId = searchParams.get('jobId')
  const { toast } = useToast()
  const supabase = createClient()

  const [loading, setLoading] = useState(false)
  const [jobs, setJobs] = useState<any[]>([])
  const [jobSearch, setJobSearch] = useState('')
  const [showJobDropdown, setShowJobDropdown] = useState(false)

  // Form state
  const [title, setTitle] = useState('')
  const [jobId, setJobId] = useState<string | null>(preselectedJobId)
  const [reminderDate, setReminderDate] = useState(new Date().toISOString().split('T')[0])
  const [priority, setPriority] = useState<ReminderPriority>('moderate')

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title) {
      toast({ title: 'Error', description: 'Title is required', variant: 'destructive' })
      return
    }

    setLoading(true)

    const { error } = await supabase.from('reminders').insert({
      title,
      job_id: jobId,
      reminder_date: reminderDate,
      priority,
    })

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
      setLoading(false)
      return
    }

    toast({ title: 'Reminder set!', variant: 'success' })
    router.push('/today')
    router.refresh()
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
        <h1 className="text-xl font-bold text-navy-800">Add Reminder</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardContent className="space-y-4">
            <Input
              label="Reminder Title *"
              placeholder="e.g., Collect final payment from Smith"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />

            <Input
              type="date"
              label="Due Date *"
              value={reminderDate}
              onChange={(e) => setReminderDate(e.target.value)}
              required
            />
          </CardContent>
        </Card>

        {/* Priority Selection */}
        <Card>
          <CardContent>
            <p className="text-sm font-medium text-navy-800 mb-3">Priority Type</p>
            <div className="space-y-2">
              {priorityOptions.map((option) => {
                const Icon = option.icon
                const config = reminderPriorityConfig[option.value as ReminderPriority]
                const isSelected = priority === option.value

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setPriority(option.value as ReminderPriority)}
                    className={`w-full p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${
                      isSelected
                        ? `${config.borderColor} ${config.bgColor}`
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      isSelected ? config.bgColor : 'bg-gray-100'
                    }`}>
                      <Icon className={`w-5 h-5 ${isSelected ? config.color : 'text-gray-400'}`} />
                    </div>
                    <div className="text-left">
                      <p className={`font-medium ${isSelected ? config.color : 'text-navy-800'}`}>
                        {option.label}
                      </p>
                      <p className="text-xs text-gray-500">{option.description}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Job Selection (Optional) */}
        <Card>
          <CardContent>
            <p className="text-sm font-medium text-navy-800 mb-2">Link to Job (optional)</p>
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
                    No job (general reminder)
                  </button>
                </div>
              )}
            </div>
            {selectedJob && (
              <p className="text-sm text-gray-500 mt-2">
                Linked to: {selectedJob.job_name}
              </p>
            )}
          </CardContent>
        </Card>

        <Button type="submit" className="w-full" size="lg" variant="primary" loading={loading}>
          Set Reminder
        </Button>
      </form>
    </div>
  )
}
