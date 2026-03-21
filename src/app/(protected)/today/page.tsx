import Link from 'next/link'
import { addDays, endOfMonth, format, startOfMonth, subMonths } from 'date-fns'
import { ArrowUpRight, BriefcaseBusiness, FileText, Receipt, Sparkles, BarChart3, CreditCard, Bell, Camera } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { getRegisteredJobValue } from '@/lib/invoice-builder'
import { ReminderBanners } from './ReminderBanners'
import { JobsAttention } from './JobsAttention'
import { UpcomingInstalls } from './UpcomingInstalls'
import { SpendingBreakdown } from './SpendingBreakdown'
import { formatCurrency, getGreeting, getMotivationalMessage } from '@/lib/utils'

export const dynamic = 'force-dynamic'

async function getDashboardData() {
  const supabase = await createClient()
  const now = new Date()
  const monthStart = startOfMonth(now)
  const monthEnd = endOfMonth(now)
  const weekFromNow = addDays(now, 7)
  const threeDaysFromNow = addDays(now, 3)
  const lastMonthStart = startOfMonth(subMonths(now, 1))
  const lastMonthEnd = endOfMonth(subMonths(now, 1))

  const { data: reminders } = await supabase
    .from('reminders')
    .select(`
      *,
      jobs (id, job_name, address)
    `)
    .eq('done', false)
    .lte('reminder_date', format(threeDaysFromNow, 'yyyy-MM-dd'))
    .order('reminder_date', { ascending: true })

  const { data: jobsForAttention } = await supabase
    .from('jobs')
    .select(`
      *,
      clients (name),
      payments (id, payment_type),
      expenses (id, category),
      invoices (id, total)
    `)
    .neq('status', 'closed')
    .order('created_at', { ascending: false })

  const { data: upcomingInstalls } = await supabase
    .from('jobs')
    .select(`
      id,
      job_name,
      address,
      quoted_price,
      install_date,
      install_end_date,
      status,
      clients (name),
      invoices (id, total)
    `)
    .neq('status', 'closed')
    .gte('install_date', format(now, 'yyyy-MM-dd'))
    .lte('install_date', format(weekFromNow, 'yyyy-MM-dd'))
    .order('install_date', { ascending: true })

  const { data: payments } = await supabase
    .from('payments')
    .select('amount')
    .gte('date', format(monthStart, 'yyyy-MM-dd'))
    .lte('date', format(monthEnd, 'yyyy-MM-dd'))

  const { data: expenses } = await supabase
    .from('expenses')
    .select('amount, category')
    .gte('date', format(monthStart, 'yyyy-MM-dd'))
    .lte('date', format(monthEnd, 'yyyy-MM-dd'))

  const { data: lastMonthPayments } = await supabase
    .from('payments')
    .select('amount')
    .gte('date', format(lastMonthStart, 'yyyy-MM-dd'))
    .lte('date', format(lastMonthEnd, 'yyyy-MM-dd'))

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

const quickLinks = [
  {
    href: '/jobs',
    label: 'Jobs',
    description: 'Open active work, clients, and schedules.',
    icon: BriefcaseBusiness,
    tone: 'from-navy-100 to-white dark:from-navy-900/30 dark:to-dark-card',
  },
  {
    href: '/expenses',
    label: 'Expenses',
    description: 'See every expense and every receipt image.',
    icon: Receipt,
    tone: 'from-orange-50 to-white dark:from-orange-900/20 dark:to-dark-card',
  },
  {
    href: '/invoices/new',
    label: 'New Invoice',
    description: 'Create and send a fresh invoice quickly.',
    icon: FileText,
    tone: 'from-cream-100 to-white dark:from-dark-border dark:to-dark-card',
  },
  {
    href: '/reports',
    label: 'Reports',
    description: 'Review monthly performance and trends.',
    icon: BarChart3,
    tone: 'from-green-50 to-white dark:from-green-900/20 dark:to-dark-card',
  },
]

const workflowShortcuts = [
  {
    href: '/jobs/expense/quick',
    label: 'Quick Expense',
    icon: Camera,
  },
  {
    href: '/jobs/payment/new',
    label: 'Record Payment',
    icon: CreditCard,
  },
  {
    href: '/invoices/new',
    label: 'Create Invoice',
    icon: FileText,
  },
  {
    href: '/jobs/reminder/new',
    label: 'Add Reminder',
    icon: Bell,
  },
]

export default async function TodayPage() {
  const data = await getDashboardData()
  const now = new Date()

  const monthlyRevenue = data.payments.reduce((sum, payment) => sum + Number(payment.amount), 0)
  const monthlyExpenses = data.expenses.reduce((sum, expense) => sum + Number(expense.amount), 0)
  const monthlyNet = monthlyRevenue - monthlyExpenses
  const lastMonthRevenue = data.lastMonthPayments.reduce((sum, payment) => sum + Number(payment.amount), 0)
  const motivationalMessage = getMotivationalMessage(monthlyRevenue, lastMonthRevenue)

  const expensesByCategory = data.expenses.reduce((accumulator, expense) => {
    accumulator[expense.category] = (accumulator[expense.category] || 0) + Number(expense.amount)
    return accumulator
  }, {} as Record<string, number>)

  const jobsNeedingAttention = data.jobsForAttention
    .filter((job) => {
      const hasDeposit = job.payments?.some((payment: any) => payment.payment_type === 'deposit')
      const hasGlassExpense = job.expenses?.some(
        (expense: any) =>
          expense.category === 'glass_fabrication' || expense.category === 'mr_glass' || expense.category === 'glass'
      )
      const hasFinalPayment = job.payments?.some((payment: any) => payment.payment_type === 'final')

      if (['deposit_received', 'measured', 'ordered', 'installed'].includes(job.status) && !hasDeposit) {
        return true
      }
      if (['measured', 'ordered'].includes(job.status) && !hasGlassExpense) {
        return true
      }
      if (job.status === 'installed' && !hasFinalPayment) {
        return true
      }
      return false
    })
    .slice(0, 5)

  const greeting = getGreeting()
  const displayName = data.userName.charAt(0).toUpperCase() + data.userName.slice(1)
  const activeJobCount = data.jobsForAttention.length
  const activeRegisteredValue = data.jobsForAttention.reduce((sum, job) => {
    const jobValue = job.invoices?.reduce((invoiceSum: number, invoice: any) => invoiceSum + Number(invoice.total || 0), 0) || 0
    return sum + getRegisteredJobValue(job.quoted_price, jobValue)
  }, 0)
  const upcomingInstalls = data.upcomingInstalls.map((install) => ({
    ...install,
    total_registered_value: getRegisteredJobValue(
      install.quoted_price,
      install.invoices?.reduce((sum: number, invoice: any) => sum + Number(invoice.total || 0), 0) || 0
    ),
  }))
  const upcomingInstallValue = upcomingInstalls.reduce((sum, install) => sum + Number(install.total_registered_value || 0), 0)

  return (
    <div className="page-container safe-top">
      <section className="relative mb-6 overflow-hidden rounded-[34px] border border-cream-200/90 bg-white/88 p-6 shadow-card-lg backdrop-blur-sm dark:border-dark-border dark:bg-dark-card/90 dark:shadow-card-dark">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(184,138,82,0.18),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(59,51,45,0.08),transparent_32%)]" />

        <div className="relative">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-orange-700 dark:text-orange-300">
                {format(now, 'EEEE, MMMM d')}
              </p>
              <h1 className="mt-4 text-[2rem] font-semibold tracking-[-0.03em] text-navy-900 dark:text-dark-text sm:text-[2.5rem]">
                {greeting}, {displayName}.
              </h1>
              <p className="mt-3 text-sm leading-7 text-navy-500 dark:text-dark-muted sm:text-base">
                See what needs attention, what is getting installed, and how money is moving without digging through the app.
              </p>

              {motivationalMessage && (
                <div className="mt-5 inline-flex max-w-full items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-medium text-orange-700 dark:border-orange-800 dark:bg-orange-900/20 dark:text-orange-300">
                  <Sparkles className="h-4 w-4 shrink-0" />
                  <span>{motivationalMessage}</span>
                </div>
              )}
            </div>

            <Link
              href="/jobs/new"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-navy-800 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-navy-700 dark:bg-orange-500 dark:hover:bg-orange-600"
            >
              New Job
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Card className="p-4">
              <p className="stat-label">Revenue</p>
              <p className="stat-value">{formatCurrency(monthlyRevenue)}</p>
              <p className="mt-1 text-xs text-navy-400 dark:text-dark-muted">Month to date</p>
            </Card>
            <Card className="p-4">
              <p className="stat-label">Net</p>
              <p className="stat-value">{formatCurrency(monthlyNet)}</p>
              <p className="mt-1 text-xs text-navy-400 dark:text-dark-muted">After expenses</p>
            </Card>
            <Card className="p-4">
              <p className="stat-label">Open Jobs</p>
              <p className="stat-value">{activeJobCount}</p>
              <p className="mt-1 text-xs text-navy-400 dark:text-dark-muted">Currently active</p>
            </Card>
            <Card className="p-4">
              <p className="stat-label">Registered Value</p>
              <p className="stat-value">{formatCurrency(activeRegisteredValue)}</p>
              <p className="mt-1 text-xs text-navy-400 dark:text-dark-muted">Across active jobs</p>
            </Card>
          </div>
        </div>
      </section>

      <section className="mb-6">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h2 className="section-title mb-1">Fast Lane</h2>
            <p className="page-subtitle">One-tap actions for the workflows you open most.</p>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {workflowShortcuts.map((shortcut) => {
            const Icon = shortcut.icon

            return (
              <Link
                key={shortcut.href}
                href={shortcut.href}
                className="inline-flex min-w-fit items-center gap-2 rounded-2xl border border-cream-200 bg-white/85 px-4 py-3 text-sm font-semibold text-navy-700 shadow-soft transition-all hover:-translate-y-0.5 hover:bg-cream-50 dark:border-dark-border dark:bg-dark-card/85 dark:text-dark-text dark:hover:bg-dark-border"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-cream-100 text-navy-700 dark:bg-dark-border dark:text-dark-text">
                  <Icon className="h-4 w-4" />
                </div>
                <span>{shortcut.label}</span>
              </Link>
            )
          })}
        </div>
      </section>

      <section className="mb-6">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h2 className="section-title mb-1">Jump back in</h2>
            <p className="page-subtitle">The main actions you will reach for on a phone.</p>
          </div>
          <Link
            href="/reports"
            className="hidden items-center gap-1 text-sm font-medium text-navy-600 hover:text-navy-800 dark:text-orange-300 dark:hover:text-orange-200 sm:inline-flex"
          >
            Reports
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {quickLinks.map((link) => {
            const Icon = link.icon

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`group overflow-hidden rounded-[28px] border border-cream-200/90 bg-gradient-to-br ${link.tone} p-4 shadow-card transition-transform hover:-translate-y-0.5 dark:border-dark-border`}
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/90 text-navy-800 shadow-soft dark:bg-dark-card dark:text-dark-text">
                  <Icon className="h-5 w-5" />
                </div>
                <p className="mt-4 font-semibold text-navy-800 dark:text-dark-text">{link.label}</p>
                <p className="mt-1 text-sm leading-6 text-navy-500 dark:text-dark-muted">{link.description}</p>
                <div className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-navy-600 transition-transform group-hover:translate-x-0.5 dark:text-orange-300">
                  Open
                  <ArrowUpRight className="h-4 w-4" />
                </div>
              </Link>
            )
          })}
        </div>
      </section>

      {data.reminders.length > 0 && (
        <section className="mb-6">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h2 className="section-title mb-1">Due soon</h2>
              <p className="page-subtitle">Follow-ups, reminders, and near-term tasks.</p>
            </div>
            <span className="pill-badge bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300">
              {data.reminders.length}
            </span>
          </div>
          <ReminderBanners reminders={data.reminders} />
        </section>
      )}
        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div>
          {jobsNeedingAttention.length > 0 && <JobsAttention jobs={jobsNeedingAttention} />}
          {upcomingInstalls.length > 0 && (
            <UpcomingInstalls installs={upcomingInstalls} totalValue={upcomingInstallValue} />
          )}
        </div>

        <div>
          {Object.keys(expensesByCategory).length > 0 && (
            <SpendingBreakdown expenses={expensesByCategory} total={monthlyExpenses} />
          )}
        </div>
      </div>
    </div>
  )
}
