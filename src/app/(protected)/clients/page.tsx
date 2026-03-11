import { createClient } from '@/lib/supabase/server'
import { ClientsList } from './ClientsList'

export const dynamic = 'force-dynamic'

async function getClients() {
  const supabase = await createClient()

  const { data: clients, error } = await supabase
    .from('clients')
    .select(`
      *,
      jobs (id, status)
    `)
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching clients:', error)
    return []
  }

  return (clients || []).map(client => ({
    ...client,
    jobsCount: client.jobs?.length || 0,
    activeJobsCount: client.jobs?.filter((j: any) => j.status !== 'closed').length || 0,
  }))
}

export default async function ClientsPage() {
  const clients = await getClients()

  return (
    <div className="page-container safe-top">
      <div className="page-header">
        <h1 className="page-title">Clients</h1>
        <p className="page-subtitle">{clients.length} clients</p>
      </div>

      <ClientsList initialClients={clients} />
    </div>
  )
}
