import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-gray-100 text-gray-800',
        primary: 'bg-navy-100 text-navy-800',
        secondary: 'bg-orange-100 text-orange-800',
        success: 'bg-green-50 text-green-700',
        warning: 'bg-orange-50 text-orange-700',
        danger: 'bg-red-50 text-red-700',
        info: 'bg-blue-50 text-blue-700',
        purple: 'bg-purple-50 text-purple-700',
        // Job status variants
        estimate: 'bg-gray-100 text-gray-600',
        deposit_received: 'bg-blue-50 text-blue-600',
        measured: 'bg-purple-50 text-purple-600',
        ordered: 'bg-orange-50 text-orange-600',
        installed: 'bg-green-50 text-green-600',
        closed: 'bg-gray-100 text-gray-500',
        // Invoice status variants
        sent: 'bg-blue-50 text-blue-600',
        deposit_paid: 'bg-orange-50 text-orange-600',
        paid: 'bg-green-50 text-green-600',
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
