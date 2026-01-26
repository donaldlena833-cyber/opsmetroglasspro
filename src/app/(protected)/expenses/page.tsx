import { createClient } from '@/lib/supabase/server'
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns'
import { ExpensesDashboard } from './ExpensesDashboard'

export const dynamic = 'force-dynamic'

async function getExpensesData() {
  const supabase = await createClient()
  const now = new Date()
  const thisMonthStart = startOfMonth(now)
  const thisMonthEnd = endOfMonth(now)
  const lastMonthStart = startOfMonth(subMonths(now, 1))
  const lastMonthEnd = endOfMonth(subMonths(now, 1))

  // Get all expenses
  const { data: allExpenses } = await supabase
    .from('expenses')
    .select(`
      *,
      jobs (id, job_name)
    `)
    .order('date', { ascending: false })

  // Get this month's expenses
  const { data: thisMonthExpenses } = await supabase
    .from('expenses')
    .select('amount, category')
    .gte('date', format(thisMonthStart, 'yyyy-MM-dd'))
    .lte('date', format(thisMonthEnd, 'yyyy-MM-dd'))

  // Get last month's expenses for comparison
  const { data: lastMonthExpenses } = await supabase
    .from('expenses')
    .select('amount')
    .gte('date', format(lastMonthStart, 'yyyy-MM-dd'))
    .lte('date', format(lastMonthEnd, 'yyyy-MM-dd'))

  const thisMonthTotal = thisMonthExpenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0
  const lastMonthTotal = lastMonthExpenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0
  
  // Category breakdown for this month
  const categoryBreakdown = thisMonthExpenses?.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + Number(e.amount)
    return acc
  }, {} as Record<string, number>) || {}

  return {
    expenses: allExpenses || [],
    thisMonthTotal,
    lastMonthTotal,
    categoryBreakdown,
    percentChange: lastMonthTotal > 0 
      ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100 
      : 0,
  }
}

export default async function ExpensesPage() {
  const data = await getExpensesData()

  return <ExpensesDashboard data={data} />
}
