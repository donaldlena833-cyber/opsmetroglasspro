import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow, isToday, isTomorrow, isYesterday, isPast, addDays, startOfMonth, endOfMonth } from 'date-fns'
import { JobStatus, ExpenseCategory, PaymentMethod, PaymentType, InvoiceStatus, ReminderPriority } from './supabase/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format currency
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

// Format date for display
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return format(d, 'MMM d, yyyy')
}

// Format date short
export function formatDateShort(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return format(d, 'MMM d')
}

// Format relative date
export function formatRelativeDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  if (isToday(d)) return 'Today'
  if (isTomorrow(d)) return 'Tomorrow'
  if (isYesterday(d)) return 'Yesterday'
  if (isPast(d)) return formatDistanceToNow(d, { addSuffix: true })
  return format(d, 'MMM d')
}

// Get date range for current month
export function getCurrentMonthRange() {
  const now = new Date()
  return {
    start: startOfMonth(now),
    end: endOfMonth(now),
  }
}

// Job status display info
export const jobStatusConfig: Record<JobStatus, { label: string; color: string; bgColor: string }> = {
  estimate: { label: 'Estimate', color: 'text-gray-600', bgColor: 'bg-gray-100' },
  deposit_received: { label: 'Deposit Received', color: 'text-blue-600', bgColor: 'bg-blue-50' },
  measured: { label: 'Measured', color: 'text-purple-600', bgColor: 'bg-purple-50' },
  ordered: { label: 'Ordered', color: 'text-orange-600', bgColor: 'bg-orange-50' },
  installed: { label: 'Installed', color: 'text-green-600', bgColor: 'bg-green-50' },
  closed: { label: 'Closed', color: 'text-gray-500', bgColor: 'bg-gray-100' },
}

// Expense category display info
export const expenseCategoryConfig: Record<ExpenseCategory, { label: string; icon: string }> = {
  crl: { label: 'C.R. Laurence', icon: '🔧' },
  glass_fabrication: { label: 'Glass Fabrication', icon: '🚿' },
  mr_glass: { label: 'Mr Glass', icon: '🚿' },
  home_depot: { label: 'Home Depot', icon: '🏠' },
  uhaul: { label: 'U-Haul', icon: '🚗' },
  parking: { label: 'Parking', icon: '🅿️' },
  tolls: { label: 'Tolls', icon: '🛣️' },
  tools: { label: 'Tools', icon: '🛠️' },
  meals: { label: 'Meals', icon: '🍔' },
  referral_payout: { label: 'Referral Payout', icon: '🤝' },
  other: { label: 'Other', icon: '📦' },
}

// Get spending category icon and color for dashboard
export function getSpendingCategoryDisplay(category: ExpenseCategory): { icon: string; label: string; color: string } {
  const displays: Record<ExpenseCategory, { icon: string; label: string; color: string }> = {
    glass_fabrication: { icon: '🚿', label: 'Glass', color: 'text-blue-600' },
    mr_glass: { icon: '🚿', label: 'Mr Glass', color: 'text-blue-600' },
    crl: { icon: '🔧', label: 'Hardware', color: 'text-orange-600' },
    home_depot: { icon: '🏠', label: 'Home Depot', color: 'text-orange-500' },
    uhaul: { icon: '🚗', label: 'Transport', color: 'text-purple-600' },
    parking: { icon: '🚗', label: 'Parking', color: 'text-purple-500' },
    tolls: { icon: '🚗', label: 'Tolls', color: 'text-purple-400' },
    tools: { icon: '🛠️', label: 'Tools', color: 'text-gray-600' },
    meals: { icon: '🍔', label: 'Meals', color: 'text-yellow-600' },
    referral_payout: { icon: '🤝', label: 'Referrals', color: 'text-green-600' },
    other: { icon: '📦', label: 'Other', color: 'text-gray-500' },
  }
  return displays[category]
}

// Payment method display
export const paymentMethodConfig: Record<PaymentMethod, { label: string }> = {
  stripe: { label: 'Stripe' },
  check: { label: 'Check' },
  zelle: { label: 'Zelle' },
  venmo: { label: 'Venmo' },
  cashapp: { label: 'Cash App' },
  cash: { label: 'Cash' },
  other: { label: 'Other' },
}

// Payment type display
export const paymentTypeConfig: Record<PaymentType, { label: string; color: string }> = {
  deposit: { label: 'Deposit', color: 'text-blue-600' },
  final: { label: 'Final', color: 'text-green-600' },
  other: { label: 'Other', color: 'text-gray-600' },
}

// Invoice status display
export const invoiceStatusConfig: Record<InvoiceStatus, { label: string; color: string; bgColor: string }> = {
  sent: { label: 'Sent', color: 'text-blue-600', bgColor: 'bg-blue-50' },
  deposit_paid: { label: 'Deposit Paid', color: 'text-orange-600', bgColor: 'bg-orange-50' },
  paid: { label: 'Paid', color: 'text-green-600', bgColor: 'bg-green-50' },
}

// Reminder priority display
export const reminderPriorityConfig: Record<ReminderPriority, { label: string; color: string; bgColor: string; borderColor: string }> = {
  high: { label: 'High', color: 'text-red-700', bgColor: 'bg-red-50', borderColor: 'border-red-200' },
  moderate: { label: 'Moderate', color: 'text-orange-700', bgColor: 'bg-orange-50', borderColor: 'border-orange-200' },
  low: { label: 'Low', color: 'text-green-700', bgColor: 'bg-green-50', borderColor: 'border-green-200' },
}

// Tax rate presets
export const taxRatePresets = [
  { label: 'NYC (8.875%)', value: 8.875 },
  { label: 'NJ (6.625%)', value: 6.625 },
  { label: 'CT (6.35%)', value: 6.35 },
]

// Generate invoice PDF filename
export function generateInvoiceFilename(invoiceNumber: number, jobName: string, address: string): string {
  const cleanJobName = jobName.replace(/[^a-zA-Z0-9]/g, '')
  const cleanAddress = address.split(',')[0].replace(/[^a-zA-Z0-9]/g, '')
  return `MetroGlass_INV${invoiceNumber}_${cleanJobName}_${cleanAddress}.pdf`
}

// Check if job needs attention
export type AttentionReason = 'waiting_deposit' | 'need_glass_order' | 'collect_final'

export function getJobAttentionStatus(job: {
  status: JobStatus
  payments?: { payment_type: PaymentType }[]
  expenses?: { category: ExpenseCategory }[]
}): { needsAttention: boolean; reason?: AttentionReason; message?: string } {
  const hasDeposit = job.payments?.some(p => p.payment_type === 'deposit')
  const hasGlassExpense = job.expenses?.some(e => 
    e.category === 'glass_fabrication' || e.category === 'mr_glass'
  )
  const hasFinalPayment = job.payments?.some(p => p.payment_type === 'final')

  // Status is deposit_received or later but no deposit payment
  if (['deposit_received', 'measured', 'ordered', 'installed'].includes(job.status) && !hasDeposit) {
    return { needsAttention: true, reason: 'waiting_deposit', message: 'Waiting for deposit' }
  }

  // Status is measured/ordered but no glass expense
  if (['measured', 'ordered'].includes(job.status) && !hasGlassExpense) {
    return { needsAttention: true, reason: 'need_glass_order', message: 'Need to order glass' }
  }

  // Status is installed but no final payment
  if (job.status === 'installed' && !hasFinalPayment) {
    return { needsAttention: true, reason: 'collect_final', message: 'Collect final payment' }
  }

  return { needsAttention: false }
}

// Calculate net profit for a job
export function calculateJobNet(payments: { amount: number }[], expenses: { amount: number }[]): {
  revenue: number
  costs: number
  net: number
} {
  const revenue = payments.reduce((sum, p) => sum + Number(p.amount), 0)
  const costs = expenses.reduce((sum, e) => sum + Number(e.amount), 0)
  return {
    revenue,
    costs,
    net: revenue - costs,
  }
}

// Format phone number
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
  }
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `(${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`
  }
  return phone
}

// Truncate text
export function truncate(str: string, length: number): string {
  if (str.length <= length) return str
  return str.slice(0, length) + '...'
}
