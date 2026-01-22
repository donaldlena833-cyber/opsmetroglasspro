import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow, isToday, isTomorrow, isYesterday, isPast, addDays, startOfMonth, endOfMonth, subMonths, startOfQuarter, endOfQuarter, startOfYear, endOfYear } from 'date-fns'
import { JobStatus, ExpenseCategory, PaymentMethod, PaymentType, InvoiceStatus, ReminderPriority, GlassType, GlassThickness, HardwareFinish } from './supabase/types'

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

// V2: Get date ranges for reporting
export function getDateRangeForPeriod(period: 'month' | 'quarter' | 'year', date?: Date) {
  const d = date || new Date()
  switch (period) {
    case 'month':
      return { start: startOfMonth(d), end: endOfMonth(d) }
    case 'quarter':
      return { start: startOfQuarter(d), end: endOfQuarter(d) }
    case 'year':
      return { start: startOfYear(d), end: endOfYear(d) }
  }
}

// Get previous period for comparison
export function getPreviousPeriodRange(period: 'month' | 'quarter' | 'year') {
  const now = new Date()
  switch (period) {
    case 'month':
      const prevMonth = subMonths(now, 1)
      return { start: startOfMonth(prevMonth), end: endOfMonth(prevMonth) }
    case 'quarter':
      const prevQuarter = subMonths(now, 3)
      return { start: startOfQuarter(prevQuarter), end: endOfQuarter(prevQuarter) }
    case 'year':
      const prevYear = subMonths(now, 12)
      return { start: startOfYear(prevYear), end: endOfYear(prevYear) }
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

// V2: Expanded expense category display info
export const expenseCategoryConfig: Record<ExpenseCategory, { label: string; icon: string; group: 'job' | 'business' }> = {
  // Job costs (linked to specific jobs)
  glass: { label: 'Glass', icon: '🚿', group: 'job' },
  hardware: { label: 'Hardware', icon: '🔧', group: 'job' },
  consumables: { label: 'Consumables', icon: '🧴', group: 'job' },
  subcontractor: { label: 'Subcontractor', icon: '👷', group: 'job' },
  // Business expenses (general)
  gas_fuel: { label: 'Gas/Fuel', icon: '⛽', group: 'business' },
  vehicle: { label: 'Vehicle', icon: '🚗', group: 'business' },
  tools_equipment: { label: 'Tools & Equipment', icon: '🛠️', group: 'business' },
  office_admin: { label: 'Office/Admin', icon: '📋', group: 'business' },
  food_meals: { label: 'Food/Meals', icon: '🍔', group: 'business' },
  other: { label: 'Other', icon: '📦', group: 'business' },
  // Legacy categories (for backwards compatibility)
  crl: { label: 'C.R. Laurence', icon: '🔧', group: 'job' },
  glass_fabrication: { label: 'Glass Fabrication', icon: '🚿', group: 'job' },
  mr_glass: { label: 'Mr Glass', icon: '🚿', group: 'job' },
  home_depot: { label: 'Home Depot', icon: '🏠', group: 'job' },
  uhaul: { label: 'U-Haul', icon: '🚗', group: 'business' },
  parking: { label: 'Parking', icon: '🅿️', group: 'business' },
  tolls: { label: 'Tolls', icon: '🛣️', group: 'business' },
  tools: { label: 'Tools', icon: '🛠️', group: 'business' },
  meals: { label: 'Meals', icon: '🍔', group: 'business' },
  referral_payout: { label: 'Referral Payout', icon: '🤝', group: 'business' },
}

// V2: Get grouped expense categories for dropdowns
export function getExpenseCategoriesByGroup() {
  const jobCosts: { value: ExpenseCategory; label: string; icon: string }[] = []
  const businessExpenses: { value: ExpenseCategory; label: string; icon: string }[] = []
  
  // Only include new V2 categories, not legacy ones
  const v2Categories: ExpenseCategory[] = ['glass', 'hardware', 'consumables', 'subcontractor', 'gas_fuel', 'vehicle', 'tools_equipment', 'office_admin', 'food_meals', 'other']
  
  v2Categories.forEach(cat => {
    const config = expenseCategoryConfig[cat]
    const item = { value: cat, label: config.label, icon: config.icon }
    if (config.group === 'job') {
      jobCosts.push(item)
    } else {
      businessExpenses.push(item)
    }
  })
  
  return { jobCosts, businessExpenses }
}

// Get spending category icon and color for dashboard
export function getSpendingCategoryDisplay(category: ExpenseCategory): { icon: string; label: string; color: string } {
  const displays: Record<ExpenseCategory, { icon: string; label: string; color: string }> = {
    // V2 categories
    glass: { icon: '🚿', label: 'Glass', color: 'text-blue-600' },
    hardware: { icon: '🔧', label: 'Hardware', color: 'text-orange-600' },
    consumables: { icon: '🧴', label: 'Consumables', color: 'text-teal-600' },
    subcontractor: { icon: '👷', label: 'Subcontractor', color: 'text-indigo-600' },
    gas_fuel: { icon: '⛽', label: 'Gas/Fuel', color: 'text-red-600' },
    vehicle: { icon: '🚗', label: 'Vehicle', color: 'text-purple-600' },
    tools_equipment: { icon: '🛠️', label: 'Tools', color: 'text-gray-600' },
    office_admin: { icon: '📋', label: 'Office', color: 'text-slate-600' },
    food_meals: { icon: '🍔', label: 'Meals', color: 'text-yellow-600' },
    other: { icon: '📦', label: 'Other', color: 'text-gray-500' },
    // Legacy categories
    glass_fabrication: { icon: '🚿', label: 'Glass', color: 'text-blue-600' },
    mr_glass: { icon: '🚿', label: 'Mr Glass', color: 'text-blue-600' },
    crl: { icon: '🔧', label: 'Hardware', color: 'text-orange-600' },
    home_depot: { icon: '🏠', label: 'Home Depot', color: 'text-orange-500' },
    uhaul: { icon: '🚗', label: 'Transport', color: 'text-purple-600' },
    parking: { icon: '🅿️', label: 'Parking', color: 'text-purple-500' },
    tolls: { icon: '🛣️', label: 'Tolls', color: 'text-purple-400' },
    tools: { icon: '🛠️', label: 'Tools', color: 'text-gray-600' },
    meals: { icon: '🍔', label: 'Meals', color: 'text-yellow-600' },
    referral_payout: { icon: '🤝', label: 'Referrals', color: 'text-green-600' },
  }
  return displays[category] || displays.other
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

// V2: Glass type options
export const glassTypeConfig: Record<GlassType, { label: string }> = {
  clear: { label: 'Clear' },
  low_iron: { label: 'Low Iron (Starphire)' },
  frosted: { label: 'Frosted' },
  rain: { label: 'Rain' },
  tinted_gray: { label: 'Tinted Gray' },
  tinted_bronze: { label: 'Tinted Bronze' },
  other: { label: 'Other' },
}

// V2: Glass thickness options
export const glassThicknessConfig: Record<GlassThickness, { label: string }> = {
  '1/4"': { label: '1/4"' },
  '5/16"': { label: '5/16"' },
  '3/8"': { label: '3/8"' },
  '1/2"': { label: '1/2"' },
  '5/8"': { label: '5/8"' },
  '3/4"': { label: '3/4"' },
}

// V2: Hardware finish options
export const hardwareFinishConfig: Record<HardwareFinish, { label: string }> = {
  chrome: { label: 'Chrome' },
  brushed_nickel: { label: 'Brushed Nickel' },
  matte_black: { label: 'Matte Black' },
  oil_rubbed_bronze: { label: 'Oil Rubbed Bronze' },
  polished_brass: { label: 'Polished Brass' },
  satin_brass: { label: 'Satin Brass' },
  gold: { label: 'Gold' },
  other: { label: 'Other' },
}

// V2: Common door configurations
export const doorConfigurations = [
  'Inline (Single Door)',
  'Inline (Door + Panel)',
  '90° Corner',
  'Neo-Angle',
  'French Door',
  'Sliding Door',
  'Sliding Both Sides',
  'Fixed Panel Only',
  'Barn Door Style',
  'Other',
]

// Tax rate presets
export const taxRatePresets = [
  { label: 'NYC (8.875%)', value: 8.875 },
  { label: 'NJ (6.625%)', value: 6.625 },
  { label: 'CT (6.35%)', value: 6.35 },
]

// V2: Stripe fee calculation (2.9% + $0.30)
export function calculateStripeFee(grossAmount: number): { fee: number; netAmount: number } {
  const fee = (grossAmount * 0.029) + 0.30
  const netAmount = grossAmount - fee
  return {
    fee: Math.round(fee * 100) / 100,
    netAmount: Math.round(netAmount * 100) / 100,
  }
}

// V2: Calculate gross from net (reverse calculation)
export function calculateGrossFromNet(netAmount: number): { grossAmount: number; fee: number } {
  // If net = gross - (gross * 0.029 + 0.30)
  // net = gross - 0.029*gross - 0.30
  // net + 0.30 = gross * (1 - 0.029)
  // gross = (net + 0.30) / 0.971
  const grossAmount = (netAmount + 0.30) / 0.971
  const fee = grossAmount - netAmount
  return {
    grossAmount: Math.round(grossAmount * 100) / 100,
    fee: Math.round(fee * 100) / 100,
  }
}

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
    e.category === 'glass_fabrication' || e.category === 'mr_glass' || e.category === 'glass'
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
  margin: number
} {
  const revenue = payments.reduce((sum, p) => sum + Number(p.amount), 0)
  const costs = expenses.reduce((sum, e) => sum + Number(e.amount), 0)
  const net = revenue - costs
  const margin = revenue > 0 ? (net / revenue) * 100 : 0
  return {
    revenue,
    costs,
    net,
    margin: Math.round(margin * 10) / 10,
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

// V2: Get greeting based on time of day
export function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

// V2: Format percentage change with sign
export function formatPercentChange(value: number): string {
  const sign = value >= 0 ? '+' : ''
  return `${sign}${value.toFixed(1)}%`
}

// V2: Get motivational message based on performance
export function getMotivationalMessage(currentRevenue: number, previousRevenue: number): string | null {
  if (previousRevenue === 0) return null
  
  const diff = currentRevenue - previousRevenue
  const percentChange = (diff / previousRevenue) * 100
  
  if (diff > 0) {
    return `You're ${formatCurrency(diff)} ahead of last month! 🎉`
  } else if (diff < 0 && percentChange > -10) {
    return `Almost there - just ${formatCurrency(Math.abs(diff))} behind last month`
  }
  return null
}
