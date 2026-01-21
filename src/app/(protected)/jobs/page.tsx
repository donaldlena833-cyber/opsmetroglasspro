import { createClient } from '@/lib/supabase/server'
import { JobsList } from './JobsList'

export const dynamic = 'force-dynamic'

async function getJobs() {
  const supabase = await createClient()

  const { data: jobs, error } = await supabase
    .from('jobs')
    .select(`
      *,
      clients (id, name, email, phone)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching jobs:', error)
    return []
  }

  return jobs || []
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
