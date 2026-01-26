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
    description: 'Snap a receipt',
    icon: Camera,
    href: '/jobs/expense/quick',
    color: 'bg-orange-500',
  },
  {
    label: 'New Job',
    description: 'Create a new job',
    icon: Briefcase,
    href: '/jobs/new',
    color: 'bg-navy-800',
  },
  {
    label: 'Add Expense',
    description: 'Log an expense',
    icon: Receipt,
    href: '/jobs/expense/new',
    color: 'bg-purple-500',
  },
  {
    label: 'Add Payment',
    description: 'Record a payment',
    icon: CreditCard,
    href: '/jobs/payment/new',
    color: 'bg-green-500',
  },
  {
    label: 'Create Invoice',
    description: 'Generate an invoice',
    icon: FileText,
    href: '/invoices/new',
    color: 'bg-red-500',
  },
  {
    label: 'Add Reminder',
    description: 'Set a reminder',
    icon: Bell,
    href: '/jobs/reminder/new',
    color: 'bg-blue-500',
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
        <SheetHeader>
          <SheetTitle>Quick Actions</SheetTitle>
        </SheetHeader>
        
        <div className="px-4 py-4 space-y-2">
          {quickActions.map((action) => {
            const Icon = action.icon
            return (
              <button
                key={action.href}
                onClick={() => handleAction(action.href)}
                className="flex items-center w-full p-4 rounded-xl bg-white border border-gray-100 shadow-sm transition-all active:scale-[0.98] hover:shadow-md"
              >
                <div className={cn(
                  'flex items-center justify-center w-12 h-12 rounded-xl text-white',
                  action.color
                )}>
                  <Icon className="h-6 w-6" />
                </div>
                <div className="ml-4 text-left">
                  <p className="font-medium text-navy-800">{action.label}</p>
                  <p className="text-sm text-gray-500">{action.description}</p>
                </div>
              </button>
            )
          })}
        </div>

        <div className="px-4 pb-4">
          <SheetClose asChild>
            <button className="w-full py-3 text-center text-gray-500 font-medium">
              Cancel
            </button>
          </SheetClose>
        </div>
      </SheetContent>
    </Sheet>
  )
}
