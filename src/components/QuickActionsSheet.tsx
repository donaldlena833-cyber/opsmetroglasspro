'use client'

import { useRouter } from 'next/navigation'
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle,
  SheetClose 
} from '@/components/ui/sheet'
import { 
  Camera, 
  Briefcase, 
  Receipt, 
  CreditCard, 
  Bell,
  ChevronRight,
  FileText 
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface QuickActionsSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const quickActions = [
  {
    label: 'Quick Expense',
    description: 'Capture a receipt and file it fast',
    icon: Camera,
    href: '/jobs/expense/quick',
    tone: 'border border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-800 dark:bg-orange-900/20 dark:text-orange-300',
  },
  {
    label: 'New Job',
    description: 'Start a new estimate or active project',
    icon: Briefcase,
    href: '/jobs/new',
    tone: 'border border-navy-200 bg-navy-50 text-navy-700 dark:border-navy-700 dark:bg-navy-900/20 dark:text-navy-200',
  },
  {
    label: 'Add Expense',
    description: 'Log an expense',
    icon: Receipt,
    href: '/jobs/expense/new',
    tone: 'border border-cream-300 bg-cream-100 text-navy-700 dark:border-dark-border dark:bg-dark-border dark:text-dark-text',
  },
  {
    label: 'Add Payment',
    description: 'Record a payment',
    icon: CreditCard,
    href: '/jobs/payment/new',
    tone: 'border border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-300',
  },
  {
    label: 'Create Invoice',
    description: 'Generate an invoice',
    icon: FileText,
    href: '/invoices/new',
    tone: 'border border-cream-300 bg-white text-navy-700 dark:border-dark-border dark:bg-dark-card dark:text-dark-text',
  },
  {
    label: 'Add Reminder',
    description: 'Set a reminder for follow-up or install',
    icon: Bell,
    href: '/jobs/reminder/new',
    tone: 'border border-cream-300 bg-cream-100 text-navy-700 dark:border-dark-border dark:bg-dark-border dark:text-dark-text',
  },
]

export function QuickActionsSheet({ open, onOpenChange }: QuickActionsSheetProps) {
  const router = useRouter()

  const handleAction = (href: string) => {
    onOpenChange(false)
    router.push(href)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="px-0">
        <SheetHeader className="px-4 text-left sm:text-left">
          <SheetTitle>Quick Actions</SheetTitle>
          <p className="text-sm text-navy-500 dark:text-dark-muted">
            Jump straight into the workflows you use most.
          </p>
        </SheetHeader>
        
        <div className="space-y-3 px-4 py-4">
          {quickActions.map((action) => {
            const Icon = action.icon
            return (
              <button
                key={action.href}
                onClick={() => handleAction(action.href)}
                className="group flex w-full items-center gap-4 rounded-[26px] border border-cream-200 bg-white/85 p-4 text-left shadow-soft transition-all hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-card active:scale-[0.98] dark:border-dark-border dark:bg-dark-card/80"
              >
                <div className={cn(
                  'flex h-12 w-12 items-center justify-center rounded-2xl',
                  action.tone
                )}>
                  <Icon className="h-6 w-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-navy-800 dark:text-dark-text">{action.label}</p>
                  <p className="text-sm text-navy-500 dark:text-dark-muted">{action.description}</p>
                </div>
                <ChevronRight className="h-5 w-5 text-navy-300 transition-transform group-hover:translate-x-0.5 dark:text-dark-muted" />
              </button>
            )
          })}
        </div>

        <div className="px-4 pb-4">
          <SheetClose asChild>
            <button className="w-full rounded-2xl border border-cream-200 bg-cream-100 px-4 py-3 text-center font-medium text-navy-600 transition-colors hover:bg-cream-200 dark:border-dark-border dark:bg-dark-border dark:text-dark-text dark:hover:bg-dark-card">
              Cancel
            </button>
          </SheetClose>
        </div>
      </SheetContent>
    </Sheet>
  )
}
