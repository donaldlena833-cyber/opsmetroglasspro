import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHero } from '@/components/PageHero'
import { formatCurrency } from '@/lib/utils'
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
  const totalValue = invoices.reduce((sum, invoice) => sum + Number(invoice.total), 0)
  const outstandingValue = invoices
    .filter((invoice) => invoice.status !== 'paid')
    .reduce((sum, invoice) => sum + Number(invoice.total), 0)
  const paidCount = invoices.filter((invoice) => invoice.status === 'paid').length
  const linkedJobs = invoices.filter((invoice) => !!invoice.jobs).length

  return (
    <div className="page-container safe-top">
      <PageHero
        eyebrow="Billing"
        title="Stay on top of every invoice."
        description="Review what has been sent, what is still outstanding, and which jobs already have billing attached before customers need a follow-up."
        actions={
          <>
            <Link href="/reports">
              <Button variant="outline">
                Reports
                <ArrowUpRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/invoices/new">
              <Button variant="primary">
                Create Invoice
                <ArrowUpRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </>
        }
        stats={[
          {
            label: 'Total Invoices',
            value: invoices.length.toString(),
            hint: `${linkedJobs} linked to jobs`,
          },
          {
            label: 'Invoiced Value',
            value: formatCurrency(totalValue),
            hint: 'Total issued across all invoices',
          },
          {
            label: 'Outstanding',
            value: formatCurrency(outstandingValue),
            hint: 'Still waiting on payment',
          },
          {
            label: 'Paid',
            value: paidCount.toString(),
            hint: 'Invoices fully collected',
          },
        ]}
      />

      <InvoicesList initialInvoices={invoices} />
    </div>
  )
}
