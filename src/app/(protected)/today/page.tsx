import { createClient } from '@/lib/supabase/server'
import { format, startOfMonth, endOfMonth, addDays, subMonths } from 'date-fns'
import { ReminderBanners } from './ReminderBanners'
import { JobsAttention } from './JobsAttention'
import { UpcomingInstalls } from './UpcomingInstalls'
import { MonthlyStats } from './MonthlyStats'
import { SpendingBreakdown } from './SpendingBreakdown'
import { getGreeting, getMotivationalMessage } from '@/lib/utils'

export const dynamic = 'force-dynamic'

async function getDashboardData() {
  const supabase = await createClient()
  const now = new Date()
  const monthStart = startOfMonth(now)
  const monthEnd = endOfMonth(now)
  const weekFromNow = addDays(now, 7)
  const threeDaysFromNow = addDays(now, 3)
  
  // V2: Get last month's data for comparison
  const lastMonthStart = startOfMonth(subMonths(now, 1))
  const lastMonthEnd = endOfMonth(subMonths(now, 1))

  // Get reminders (due today + next 3 days, not done)
  const { data: reminders } = await supabase
    .from('reminders')
    .select(`
      *,
      jobs (id, job_name, address)
    `)
    .eq('done', false)
    .lte('reminder_date', format(threeDaysFromNow, 'yyyy-MM-dd'))
    .order('reminder_date', { ascending: true })

  // Get jobs for attention check (not closed)
  const { data: jobsForAttention } = await supabase
    .from('jobs')
    .select(`
      *,
      clients (name),
      payments (id, payment_type),
      expenses (id, category)
    `)
    .neq('status', 'closed')
    .order('created_at', { ascending: false })

  // Get upcoming installs (next 7 days)
  const { data: upcomingInstalls } = await supabase
    .from('jobs')
    .select(`
      id,
      job_name,
      address,
      install_date,
      install_end_date,
      status,
      clients (name)
    `)
    .neq('status', 'closed')
    .gte('install_date', format(now, 'yyyy-MM-dd'))
    .lte('install_date', format(weekFromNow, 'yyyy-MM-dd'))
    .order('install_date', { ascending: true })

  // Get month-to-date payments (revenue)
  const { data: payments } = await supabase
    .from('payments')
    .select('amount')
    .gte('date', format(monthStart, 'yyyy-MM-dd'))
    .lte('date', format(monthEnd, 'yyyy-MM-dd'))

  // Get month-to-date expenses
  const { data: expenses } = await supabase
    .from('expenses')
    .select('amount, category')
    .gte('date', format(monthStart, 'yyyy-MM-dd'))
    .lte('date', format(monthEnd, 'yyyy-MM-dd'))
    
  // V2: Get last month's revenue for comparison
  const { data: lastMonthPayments } = await supabase
    .from('payments')
    .select('amount')
    .gte('date', format(lastMonthStart, 'yyyy-MM-dd'))
    .lte('date', format(lastMonthEnd, 'yyyy-MM-dd'))

  // Get user info for greeting
  const { data: { user } } = await supabase.auth.getUser()

  return {
    reminders: reminders || [],
    jobsForAttention: jobsForAttention || [],
    upcomingInstalls: upcomingInstalls || [],
    payments: payments || [],
    expenses: expenses || [],
    lastMonthPayments: lastMonthPayments || [],
    userName: user?.email?.split('@')[0] || 'there',
  }
}

export default async function TodayPage() {
  const data = await getDashboardData()
  const now = new Date()

  // Calculate monthly totals
  const monthlyRevenue = data.payments.reduce((sum, p) => sum + Number(p.amount), 0)
  const monthlyExpenses = data.expenses.reduce((sum, e) => sum + Number(e.amount), 0)
  const monthlyNet = monthlyRevenue - monthlyExpenses
  
  // V2: Calculate last month revenue for comparison
  const lastMonthRevenue = data.lastMonthPayments.reduce((sum, p) => sum + Number(p.amount), 0)
  const motivationalMessage = getMotivationalMessage(monthlyRevenue, lastMonthRevenue)

  // Group expenses by category for spending breakdown
  const expensesByCategory = data.expenses.reduce((acc, e) => {
    const category = e.category
    acc[category] = (acc[category] || 0) + Number(e.amount)
    return acc
  }, {} as Record<string, number>)

  // Filter jobs needing attention
  const jobsNeedingAttention = data.jobsForAttention.filter(job => {
    const hasDeposit = job.payments?.some((p: any) => p.payment_type === 'deposit')
    const hasGlassExpense = job.expenses?.some((e: any) => 
      e.category === 'glass_fabrication' || e.category === 'mr_glass' || e.category === 'glass'
    )
    const hasFinalPayment = job.payments?.some((p: any) => p.payment_type === 'final')

    // Status is deposit_received or later but no deposit payment
    if (['deposit_received', 'measured', 'ordered', 'installed'].includes(job.status) && !hasDeposit) {
      return true
    }
    // Status is measured/ordered but no glass expense
    if (['measured', 'ordered'].includes(job.status) && !hasGlassExpense) {
      return true
    }
    // Status is installed but no final payment
    if (job.status === 'installed' && !hasFinalPayment) {
      return true
    }
    return false
  }).slice(0, 5) // Show max 5

  // Get greeting based on time
  const greeting = getGreeting()

  // Format name nicely
  const displayName = data.userName.charAt(0).toUpperCase() + data.userName.slice(1)

  return (
    <div className="page-container safe-top">
      {/* Header - V2: Centered */}
      <div className="page-header text-center">
        <h1 className="text-2xl font-bold text-navy-800 dark:text-dark-text">
          {greeting}, {displayName} 👋
        </h1>
        <p className="text-sm text-gray-500 dark:text-dark-muted mt-1">
          {format(now, 'EEEE, MMMM d')}
        </p>
        {/* V2: Motivational message */}
        {motivationalMessage && (
          <p className="motivational-message">{motivationalMessage}</p>
        )}
      </div>

      {/* Reminders */}
      {data.reminders.length > 0 && (
        <ReminderBanners reminders={data.reminders} />
      )}

      {/* Monthly Stats */}
      <MonthlyStats 
        revenue={monthlyRevenue}
        expenses={monthlyExpenses}
        net={monthlyNet}
      />

      {/* Jobs Needing Attention */}
      {jobsNeedingAttention.length > 0 && (
        <JobsAttention jobs={jobsNeedingAttention} />
      )}

      {/* Upcoming Installs */}
      {data.upcomingInstalls.length > 0 && (
        <UpcomingInstalls installs={data.upcomingInstalls} />
      )}

      {/* Spending Breakdown */}
      {Object.keys(expensesByCategory).length > 0 && (
        <SpendingBreakdown expenses={expensesByCategory} total={monthlyExpenses} />
      )}
    </div>
  )
}
