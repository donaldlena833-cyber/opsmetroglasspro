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

  const { data: invoices } = await supabase
    .from('invoices')
    .select('total, status')
    .in('job_id', (jobs || []).map(j => j.id))

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
