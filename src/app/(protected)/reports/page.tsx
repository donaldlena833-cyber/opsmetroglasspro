import { createClient } from '@/lib/supabase/server'
import { format, startOfMonth, endOfMonth, subMonths, startOfQuarter, endOfQuarter, startOfYear, endOfYear } from 'date-fns'
import { ReportsDashboard } from './ReportsDashboard'

export const dynamic = 'force-dynamic'

async function getReportsData() {
  const supabase = await createClient()
  const now = new Date()
  
  // Current month
  const monthStart = startOfMonth(now)
  const monthEnd = endOfMonth(now)
  
  // Last month
  const lastMonthStart = startOfMonth(subMonths(now, 1))
  const lastMonthEnd = endOfMonth(subMonths(now, 1))
  
  // Current quarter
  const quarterStart = startOfQuarter(now)
  const quarterEnd = endOfQuarter(now)
  
  // Current year
  const yearStart = startOfYear(now)
  const yearEnd = endOfYear(now)

  // Get this month's payments
  const { data: monthPayments } = await supabase
    .from('payments')
    .select('amount, method, date')
    .gte('date', format(monthStart, 'yyyy-MM-dd'))
    .lte('date', format(monthEnd, 'yyyy-MM-dd'))

  // Get this month's expenses
  const { data: monthExpenses } = await supabase
    .from('expenses')
    .select('amount, category, date')
    .gte('date', format(monthStart, 'yyyy-MM-dd'))
    .lte('date', format(monthEnd, 'yyyy-MM-dd'))

  // Get last month's payments for comparison
  const { data: lastMonthPayments } = await supabase
    .from('payments')
    .select('amount')
    .gte('date', format(lastMonthStart, 'yyyy-MM-dd'))
    .lte('date', format(lastMonthEnd, 'yyyy-MM-dd'))

  // Get last month's expenses for comparison
  const { data: lastMonthExpenses } = await supabase
    .from('expenses')
    .select('amount')
    .gte('date', format(lastMonthStart, 'yyyy-MM-dd'))
    .lte('date', format(lastMonthEnd, 'yyyy-MM-dd'))

  // Get quarterly payments
  const { data: quarterPayments } = await supabase
    .from('payments')
    .select('amount')
    .gte('date', format(quarterStart, 'yyyy-MM-dd'))
    .lte('date', format(quarterEnd, 'yyyy-MM-dd'))

  // Get quarterly expenses
  const { data: quarterExpenses } = await supabase
    .from('expenses')
    .select('amount')
    .gte('date', format(quarterStart, 'yyyy-MM-dd'))
    .lte('date', format(quarterEnd, 'yyyy-MM-dd'))

  // Get yearly payments
  const { data: yearPayments } = await supabase
    .from('payments')
    .select('amount')
    .gte('date', format(yearStart, 'yyyy-MM-dd'))
    .lte('date', format(yearEnd, 'yyyy-MM-dd'))

  // Get yearly expenses
  const { data: yearExpenses } = await supabase
    .from('expenses')
    .select('amount')
    .gte('date', format(yearStart, 'yyyy-MM-dd'))
    .lte('date', format(yearEnd, 'yyyy-MM-dd'))

  // Get jobs with invoices for profit margin analysis
  const { data: jobsWithInvoices } = await supabase
    .from('jobs')
    .select(`
      id,
      job_name,
      status,
      invoices (total),
      expenses (amount),
      payments (amount)
    `)
    .eq('status', 'closed')
    .order('updated_at', { ascending: false })
    .limit(10)

  // Get monthly revenue trend (last 6 months)
  const monthlyTrend = []
  for (let i = 5; i >= 0; i--) {
    const m = subMonths(now, i)
    const mStart = startOfMonth(m)
    const mEnd = endOfMonth(m)
    
    const { data: mPayments } = await supabase
      .from('payments')
      .select('amount')
      .gte('date', format(mStart, 'yyyy-MM-dd'))
      .lte('date', format(mEnd, 'yyyy-MM-dd'))

    const { data: mExpenses } = await supabase
      .from('expenses')
      .select('amount')
      .gte('date', format(mStart, 'yyyy-MM-dd'))
      .lte('date', format(mEnd, 'yyyy-MM-dd'))

    monthlyTrend.push({
      month: format(m, 'MMM yyyy'),
      monthShort: format(m, 'MMM'),
      revenue: mPayments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0,
      expenses: mExpenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0,
    })
  }

  // Calculate totals
  const monthRevenue = monthPayments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0
  const monthExpenseTotal = monthExpenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0
  const lastMonthRevenue = lastMonthPayments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0
  const lastMonthExpenseTotal = lastMonthExpenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0
  const quarterRevenue = quarterPayments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0
  const quarterExpenseTotal = quarterExpenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0
  const yearRevenue = yearPayments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0
  const yearExpenseTotal = yearExpenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0

  // Group expenses by category
  const expensesByCategory = (monthExpenses || []).reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + Number(e.amount)
    return acc
  }, {} as Record<string, number>)

  // Group payments by method
  const paymentsByMethod = (monthPayments || []).reduce((acc, p) => {
    acc[p.method] = (acc[p.method] || 0) + Number(p.amount)
    return acc
  }, {} as Record<string, number>)

  // Calculate job profit margins
  const jobProfitMargins = (jobsWithInvoices || []).map(job => {
    const invoiceTotal = job.invoices?.reduce((sum: number, i: any) => sum + Number(i.total || 0), 0) || 0
    const expenseTotal = job.expenses?.reduce((sum: number, e: any) => sum + Number(e.amount || 0), 0) || 0
    const paymentTotal = job.payments?.reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0) || 0
    const profit = paymentTotal - expenseTotal
    const margin = paymentTotal > 0 ? (profit / paymentTotal) * 100 : 0
    
    return {
      id: job.id,
      job_name: job.job_name,
      invoiced: invoiceTotal,
      revenue: paymentTotal,
      costs: expenseTotal,
      profit,
      margin: Math.round(margin),
    }
  })

  return {
    month: {
      revenue: monthRevenue,
      expenses: monthExpenseTotal,
      net: monthRevenue - monthExpenseTotal,
      margin: monthRevenue > 0 ? ((monthRevenue - monthExpenseTotal) / monthRevenue) * 100 : 0,
    },
    lastMonth: {
      revenue: lastMonthRevenue,
      expenses: lastMonthExpenseTotal,
      net: lastMonthRevenue - lastMonthExpenseTotal,
    },
    quarter: {
      revenue: quarterRevenue,
      expenses: quarterExpenseTotal,
      net: quarterRevenue - quarterExpenseTotal,
    },
    year: {
      revenue: yearRevenue,
      expenses: yearExpenseTotal,
      net: yearRevenue - yearExpenseTotal,
    },
    expensesByCategory,
    paymentsByMethod,
    monthlyTrend,
    jobProfitMargins,
  }
}

export default async function ReportsPage() {
  const data = await getReportsData()

  return <ReportsDashboard data={data} />
}
