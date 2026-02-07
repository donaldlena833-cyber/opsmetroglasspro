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
      invoices (id, total)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching jobs:', error)
    return []
  }

  // V2: Calculate total invoice value for each job
  return (jobs || []).map(job => ({
    ...job,
    total_invoice_value: job.invoices?.reduce((sum: number, inv: any) => sum + Number(inv.total || 0), 0) || 0,
    invoice_count: job.invoices?.length || 0,
  }))
}

export default async function JobsPage() {
  const jobs = await getJobs()

  return (
    <div className="page-container safe-top">
      <div className="page-header">
        <h1 className="page-title">Jobs</h1>
        <p className="page-subtitle">{jobs.length} total jobs</p>
      </div>

      <JobsList initialJobs={jobs} />
    </div>
  )
}
