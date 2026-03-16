import { Client, GlassThickness, GlassType, HardwareFinish, Job, LineItem, Payment } from '@/lib/supabase/types'
import { glassThicknessConfig, glassTypeConfig, hardwareFinishConfig } from '@/lib/utils'

export type InvoiceDraftMode = 'full' | 'deposit' | 'balance'

export type JobInvoiceDraftSource = Pick<
  Job,
  | 'job_name'
  | 'address'
  | 'quoted_price'
  | 'deposit_amount'
  | 'scope_of_work'
  | 'configuration'
  | 'dimensions'
  | 'glass_type'
  | 'glass_thickness'
  | 'hardware_finish'
> & {
  clients?: Client | null
  payments?: Pick<Payment, 'amount' | 'gross_amount' | 'payment_type'>[]
}

function roundCurrency(amount: number) {
  return Math.round(amount * 100) / 100
}

function getSpecLabel<T extends string>(
  value: T | null | undefined,
  config: Record<T, { label: string }>
) {
  if (!value) return null
  return config[value]?.label || value
}

export function getCollectedForJob(job: JobInvoiceDraftSource) {
  return roundCurrency(
    (job.payments || []).reduce((sum, payment) => sum + Number(payment.gross_amount ?? payment.amount ?? 0), 0)
  )
}

export function getSuggestedDeposit(job: JobInvoiceDraftSource) {
  const explicitDeposit = Number(job.deposit_amount ?? 0)

  if (explicitDeposit > 0) {
    return roundCurrency(explicitDeposit)
  }

  const quotedPrice = Number(job.quoted_price ?? 0)
  if (quotedPrice > 0) {
    return roundCurrency(quotedPrice * 0.5)
  }

  return 0
}

export function getRegisteredJobValue(quotedPrice: number | null | undefined, invoiceTotal: number) {
  return invoiceTotal > 0 ? roundCurrency(invoiceTotal) : roundCurrency(Number(quotedPrice ?? 0))
}

export function buildJobInvoiceDescription(job: JobInvoiceDraftSource) {
  const detailParts = [
    job.configuration || null,
    getSpecLabel<GlassType>(job.glass_type, glassTypeConfig),
    getSpecLabel<GlassThickness>(job.glass_thickness, glassThicknessConfig),
    getSpecLabel<HardwareFinish>(job.hardware_finish, hardwareFinishConfig),
    job.dimensions || null,
  ].filter(Boolean)

  const baseDescription = job.scope_of_work?.trim() || `Custom glass work for ${job.job_name}`

  if (detailParts.length === 0) {
    return baseDescription
  }

  return `${baseDescription} (${detailParts.join(' • ')})`
}

export function buildInvoiceDraftSummary(job: JobInvoiceDraftSource) {
  const plannedValue = roundCurrency(Number(job.quoted_price ?? 0))
  const suggestedDeposit = getSuggestedDeposit(job)
  const collected = getCollectedForJob(job)
  const remainingBalance = plannedValue > 0 ? roundCurrency(Math.max(plannedValue - collected, 0)) : 0

  return {
    plannedValue,
    suggestedDeposit,
    collected,
    remainingBalance,
  }
}

export function buildInvoiceNotesFromJob(job: JobInvoiceDraftSource, mode: InvoiceDraftMode) {
  const opening =
    mode === 'deposit'
      ? 'Deposit requested to begin fabrication and scheduling.'
      : mode === 'balance'
        ? 'Final balance due upon completion of work.'
        : 'Thank you for choosing MetroGlass Pro.'

  const scopeLine = job.scope_of_work?.trim()
    ? `Scope: ${job.scope_of_work.trim()}`
    : `Project: ${job.job_name} at ${job.address}`

  return `${opening}\n${scopeLine}`
}

export function buildInvoiceLineItemsFromJob(job: JobInvoiceDraftSource, mode: InvoiceDraftMode): LineItem[] {
  const quoteValue = roundCurrency(Number(job.quoted_price ?? 0))
  const suggestedDeposit = getSuggestedDeposit(job)
  const collected = getCollectedForJob(job)
  const defaultDescription = buildJobInvoiceDescription(job)

  let unitPrice = quoteValue
  let description = defaultDescription

  if (mode === 'deposit') {
    unitPrice = suggestedDeposit
    description = `Deposit for ${job.job_name}`
  }

  if (mode === 'balance') {
    const remainingBalance =
      quoteValue > 0
        ? roundCurrency(Math.max(quoteValue - (collected > 0 ? collected : suggestedDeposit), 0))
        : 0

    unitPrice = remainingBalance
    description = `Remaining balance for ${job.job_name}`
  }

  return [
    {
      description,
      qty: 1,
      unit_price: unitPrice,
      line_total: unitPrice,
    },
  ]
}
