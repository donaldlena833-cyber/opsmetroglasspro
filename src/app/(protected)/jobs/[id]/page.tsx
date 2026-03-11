import { createClient } from '@/lib/supabase/server'
import { signExpenseReceiptUrls } from '@/lib/storage'
import { notFound } from 'next/navigation'
import { JobDetail } from './JobDetail'

export const dynamic = 'force-dynamic'

interface Props {
  params: { id: string }
}

async function getJob(id: string) {
  const supabase = await createClient()

  const { data: job, error } = await supabase
    .from('jobs')
    .select(`
      *,
      clients (*),
      expenses (*),
      payments (*, invoices (id, invoice_number)),
      invoices (*)
    `)
    .eq('id', id)
    .single()

  if (error || !job) return null

  return {
    ...job,
    expenses: await signExpenseReceiptUrls(supabase, job.expenses || []),
  }
}

export default async function JobDetailPage({ params }: Props) {
  const job = await getJob(params.id)

  if (!job) {
    notFound()
  }

  return <JobDetail job={job} />
}
