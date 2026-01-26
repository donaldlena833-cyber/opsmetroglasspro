import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-xl px-3 py-1 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-cream-200 dark:bg-dark-border text-navy-600 dark:text-dark-muted',
        primary: 'bg-navy-100 dark:bg-navy-900/50 text-navy-700 dark:text-navy-300',
        secondary: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400',
        success: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
        warning: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
        danger: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
        info: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
        purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
        // Job status variants - V3: softer, more colorful
        estimate: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
        deposit_received: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
        measured: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
        ordered: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
        installed: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
        closed: 'bg-cream-200 dark:bg-dark-border text-gray-500 dark:text-gray-400',
        // Invoice status variants
        sent: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
        deposit_paid: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
        paid: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
