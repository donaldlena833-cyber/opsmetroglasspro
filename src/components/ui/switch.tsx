'use client'

import * as React from 'react'
import * as SwitchPrimitives from '@radix-ui/react-switch'
import { cn } from '@/lib/utils'

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root> & {
    label?: string
    description?: string
  }
>(({ className, label, description, ...props }, ref) => (
  <div className="flex items-center justify-between">
    {(label || description) && (
      <div className="flex-1 mr-3">
        {label && (
          <label className="text-sm font-medium text-navy-800 dark:text-dark-text cursor-pointer">
            {label}
          </label>
        )}
        {description && (
          <p className="text-xs text-gray-500 dark:text-dark-muted mt-0.5">{description}</p>
        )}
      </div>
    )}
    <SwitchPrimitives.Root
      className={cn(
        'peer inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-dark-card',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'data-[state=checked]:bg-orange-500 data-[state=unchecked]:bg-gray-200 dark:data-[state=unchecked]:bg-gray-600',
        className
      )}
      {...props}
      ref={ref}
    >
      <SwitchPrimitives.Thumb
        className={cn(
          'pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform',
          'data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-1'
        )}
      />
    </SwitchPrimitives.Root>
  </div>
))
Switch.displayName = SwitchPrimitives.Root.displayName

export { Switch }
