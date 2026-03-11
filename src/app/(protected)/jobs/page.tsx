import { createClient } from '@/lib/supabase/server'
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
    return { jobs: [], totals: { totalRevenue: 0, totalExpenses: 0, totalNet: 0, activeJobs: 0 } }
  }

  const mappedJobs = (jobs || []).map(job => ({
    ...job,
    total_invoice_value: job.invoices?.reduce((sum: number, inv: any) => sum + Number(inv.total || 0), 0) || 0,
    invoice_count: job.invoices?.length || 0,
    total_revenue: job.payments?.reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0) || 0,
    total_expenses: job.expenses?.reduce((sum: number, e: any) => sum + Number(e.amount || 0), 0) || 0,
  }))

  // Calculate global totals from active (non-closed) jobs
  const activeJobs = mappedJobs.filter(j => j.status !== 'closed')
  const totals = {
    totalRevenue: mappedJobs.reduce((sum, j) => sum + j.total_revenue, 0),
    totalExpenses: mappedJobs.reduce((sum, j) => sum + j.total_expenses, 0),
    totalNet: mappedJobs.reduce((sum, j) => sum + (j.total_revenue - j.total_expenses), 0),
    activeJobs: activeJobs.length,
  }

  return { jobs: mappedJobs, totals }
}

export default async function JobsPage() {
  const { jobs, totals } = await getJobs()

  return (
    <div className="page-container safe-top">
      <div className="page-header">
        <h1 className="page-title">Jobs</h1>
        <p className="page-subtitle">{jobs.length} total jobs</p>
      </div>

      <JobsList initialJobs={jobs} totals={totals} />
    </div>
  )
}
