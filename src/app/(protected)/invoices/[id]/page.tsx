import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { InvoiceDetail } from './InvoiceDetail'

export const dynamic = 'force-dynamic'

interface Props {
  params: { id: string }
}

async function getInvoice(id: string) {
  const supabase = await createClient()

  const { data: invoice, error } = await supabase
    .from('invoices')
    .select(`
      *,
      jobs (id, job_name, address, clients (*))
    `)
    .eq('id', id)
    .single()

  if (error || !invoice) return null
  return invoice
}

export default async function InvoiceDetailPage({ params }: Props) {
  const invoice = await getInvoice(params.id)

  if (!invoice) {
    notFound()
  }

  return <InvoiceDetail invoice={invoice} />
}
