import { createClient } from '@/lib/supabase/server'
import { InvoicesList } from './InvoicesList'

export const dynamic = 'force-dynamic'

async function getInvoices() {
  const supabase = await createClient()

  const { data: invoices, error } = await supabase
    .from('invoices')
    .select(`
      *,
      jobs (id, job_name, address, clients (name))
    `)
    .order('invoice_number', { ascending: false })

  if (error) {
    console.error('Error fetching invoices:', error)
    return []
  }

  return invoices || []
}

export default async function InvoicesPage() {
  const invoices = await getInvoices()

  return (
    <div className="page-container safe-top">
      <div className="page-header">
        <h1 className="page-title">Invoices</h1>
        <p className="page-subtitle">{invoices.length} invoices</p>
      </div>

      <InvoicesList initialInvoices={invoices} />
    </div>
  )
}
