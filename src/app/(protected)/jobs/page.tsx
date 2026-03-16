import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHero } from '@/components/PageHero'
import { getRegisteredJobValue } from '@/lib/invoice-builder'
import { formatCurrency } from '@/lib/utils'
import { JobsList } from './JobsList'

export const dynamic = 'force-dynamic'

async function getJobs() {
  const supabase = await createClient()

  const { data: jobs, error } = await supabase
    .from('jobs')
    .select(`
      *,
      clients (id, name, email, phone),
      invoices (id, total),
      payments (id, amount),
      expenses (id, amount)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching jobs:', error)
    return {
      jobs: [],
      totals: {
        totalRevenue: 0,
        totalExpenses: 0,
        totalNet: 0,
        activeJobs: 0,
        totalRegisteredValue: 0,
        totalScheduledValue: 0,
      },
    }
  }

  const mappedJobs = (jobs || []).map(job => ({
    ...job,
    total_invoice_value: job.invoices?.reduce((sum: number, inv: any) => sum + Number(inv.total || 0), 0) || 0,
    invoice_count: job.invoices?.length || 0,
    total_revenue: job.payments?.reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0) || 0,
    total_expenses: job.expenses?.reduce((sum: number, e: any) => sum + Number(e.amount || 0), 0) || 0,
    registered_job_value: getRegisteredJobValue(
      job.quoted_price,
      job.invoices?.reduce((sum: number, inv: any) => sum + Number(inv.total || 0), 0) || 0
    ),
  }))

  // Calculate global totals from active (non-closed) jobs
  const activeJobs = mappedJobs.filter(j => j.status !== 'closed')
  const scheduledJobs = activeJobs.filter((job) => !!job.install_date)
  const totals = {
    totalRevenue: mappedJobs.reduce((sum, j) => sum + j.total_revenue, 0),
    totalExpenses: mappedJobs.reduce((sum, j) => sum + j.total_expenses, 0),
    totalNet: mappedJobs.reduce((sum, j) => sum + (j.total_revenue - j.total_expenses), 0),
    activeJobs: activeJobs.length,
    totalRegisteredValue: mappedJobs.reduce((sum, j) => sum + j.registered_job_value, 0),
    totalScheduledValue: scheduledJobs.reduce((sum, job) => sum + job.registered_job_value, 0),
  }

  return { jobs: mappedJobs, totals }
}

export default async function JobsPage() {
  const { jobs, totals } = await getJobs()
  const scheduledInstalls = jobs.filter((job) => job.status !== 'closed' && !!job.install_date).length
  const closedJobs = jobs.filter((job) => job.status === 'closed').length

  return (
    <div className="page-container safe-top">
      <PageHero
        eyebrow="Job Tracker"
        title="Keep the install pipeline moving."
        description="Monitor active work, catch jobs that need a deposit or glass order, and keep installs organized without bouncing between screens."
        actions={
          <>
            <Link href="/reports">
              <Button variant="outline">
                Reports
                <ArrowUpRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/jobs/new">
              <Button variant="primary">
                New Job
                <ArrowUpRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </>
        }
        stats={[
          {
            label: 'Active Jobs',
            value: totals.activeJobs.toString(),
            hint: `${closedJobs} closed jobs on file`,
          },
          {
            label: 'Scheduled Installs',
            value: scheduledInstalls.toString(),
            hint: `${formatCurrency(totals.totalScheduledValue)} on the calendar`,
          },
          {
            label: 'Registered Value',
            value: formatCurrency(totals.totalRegisteredValue),
            hint: 'Invoice totals across all jobs',
          },
          {
            label: 'Tracked Net',
            value: formatCurrency(totals.totalNet),
            hint: 'Revenue minus logged job costs',
          },
        ]}
      />

      <JobsList initialJobs={jobs} totals={totals} />
    </div>
  )
}
