// /api/v1/dashboard
//   GET  rolled-up KPIs the bot can pull on demand: month-to-date revenue
//        (gross), expenses, net, open jobs, scheduled installs in the next
//        7 days, reminders due in the next 3 days.
//
// Auth: Bearer API key with `read` scope.

import { NextRequest, NextResponse } from 'next/server'
import { addDays, endOfMonth, format, startOfMonth, subMonths } from 'date-fns'
import { internalError, requireApiKey } from '@/lib/api-auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const auth = await requireApiKey(request, { scope: 'read' })
  if (!auth.ok) return auth.response

  const now = new Date()
  const monthStart = format(startOfMonth(now), 'yyyy-MM-dd')
  const monthEnd = format(endOfMonth(now), 'yyyy-MM-dd')
  const lastMonth = subMonths(now, 1)
  const lastMonthStart = format(startOfMonth(lastMonth), 'yyyy-MM-dd')
  const lastMonthEnd = format(endOfMonth(lastMonth), 'yyyy-MM-dd')
  const today = format(now, 'yyyy-MM-dd')
  const weekFromNow = format(addDays(now, 7), 'yyyy-MM-dd')
  const threeDaysFromNow = format(addDays(now, 3), 'yyyy-MM-dd')

  try {
    const [
      { data: monthPayments, error: monthPaymentsErr },
      { data: lastMonthPayments, error: lastMonthPaymentsErr },
      { data: monthExpenses, error: monthExpensesErr },
      { data: openJobs, error: openJobsErr },
      { data: upcomingInstalls, error: upcomingInstallsErr },
      { data: dueReminders, error: dueRemindersErr },
    ] = await Promise.all([
      auth.supabase
        .from('payments')
        .select('amount, gross_amount')
        .gte('date', monthStart)
        .lte('date', monthEnd),
      auth.supabase
        .from('payments')
        .select('amount, gross_amount')
        .gte('date', lastMonthStart)
        .lte('date', lastMonthEnd),
      auth.supabase
        .from('expenses')
        .select('amount, category')
        .gte('date', monthStart)
        .lte('date', monthEnd),
      auth.supabase.from('jobs').select('id').neq('status', 'closed'),
      auth.supabase
        .from('jobs')
        .select('id, job_name, address, install_date, install_end_date, status')
        .neq('status', 'closed')
        .gte('install_date', today)
        .lte('install_date', weekFromNow)
        .order('install_date', { ascending: true }),
      auth.supabase
        .from('reminders')
        .select('id, title, reminder_date, priority, job_id')
        .eq('done', false)
        .lte('reminder_date', threeDaysFromNow)
        .order('reminder_date', { ascending: true }),
    ])

    const firstError =
      monthPaymentsErr ||
      lastMonthPaymentsErr ||
      monthExpensesErr ||
      openJobsErr ||
      upcomingInstallsErr ||
      dueRemindersErr
    if (firstError) return internalError(firstError)

    const sumGross = (rows: { amount: number; gross_amount: number | null }[] | null) =>
      (rows ?? []).reduce((sum, p) => sum + Number(p.gross_amount ?? p.amount ?? 0), 0)
    const sumAmount = (rows: { amount: number }[] | null) =>
      (rows ?? []).reduce((sum, e) => sum + Number(e.amount ?? 0), 0)

    const revenueMtd = sumGross(monthPayments as any)
    const lastMonthRevenue = sumGross(lastMonthPayments as any)
    const expensesMtd = sumAmount(monthExpenses as any)

    const expensesByCategory: Record<string, number> = {}
    for (const expense of (monthExpenses as { amount: number; category: string }[] | null) ?? []) {
      const key = expense.category || 'other'
      expensesByCategory[key] = (expensesByCategory[key] || 0) + Number(expense.amount ?? 0)
    }

    return NextResponse.json({
      generated_at: now.toISOString(),
      window: {
        month_start: monthStart,
        month_end: monthEnd,
        today,
      },
      kpis: {
        revenue_mtd: revenueMtd,
        last_month_revenue: lastMonthRevenue,
        expenses_mtd: expensesMtd,
        net_mtd: revenueMtd - expensesMtd,
        open_jobs: openJobs?.length ?? 0,
        upcoming_installs: upcomingInstalls?.length ?? 0,
        reminders_due_soon: dueReminders?.length ?? 0,
      },
      expenses_by_category: expensesByCategory,
      upcoming_installs: upcomingInstalls ?? [],
      reminders_due_soon: dueReminders ?? [],
    })
  } catch (error) {
    return internalError(error)
  }
}
