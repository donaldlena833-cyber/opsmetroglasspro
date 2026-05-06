import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { ClientDetail } from './ClientDetail'

export const dynamic = 'force-dynamic'

interface Props {
  params: { id: string }
}

async function getClient(id: string) {
  const supabase = await createClient()

  const { data: client, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !client) return null

  const { data: jobs } = await supabase
    .from('jobs')
    .select('*')
    .eq('client_id', id)
    .order('created_at', { ascending: false })

  const jobIds = (jobs || []).map(j => j.id)

  // Skip the .in() call when there are no jobs — PostgREST rejects an
  // empty IN list with a 400 and we'd just collapse to zeros anyway.
  const invoices = jobIds.length > 0
    ? (await supabase.from('invoices').select('total, status').in('job_id', jobIds)).data
    : []

  const totalInvoiced = invoices?.reduce((sum, i) => sum + Number(i.total), 0) || 0
  const totalPaid = invoices?.filter(i => i.status === 'paid').reduce((sum, i) => sum + Number(i.total), 0) || 0

  return {
    client,
    jobs: jobs || [],
    stats: {
      jobsCount: jobs?.length || 0,
      totalInvoiced,
      totalPaid,
    }
  }
}

export default async function ClientDetailPage({ params }: Props) {
  const data = await getClient(params.id)

  if (!data) {
    notFound()
  }

  return <ClientDetail data={data} />
}
