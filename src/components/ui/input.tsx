import * as React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: React.ReactNode
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, icon, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-semibold text-navy-700 dark:text-dark-text mb-2">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-dark-muted">
              {icon}
            </div>
          )}
          <input
            type={type}
            className={cn(
              'flex h-14 w-full rounded-2xl border-2 border-cream-300 dark:border-dark-border bg-white dark:bg-dark-card px-4 py-3 text-base text-navy-700 dark:text-dark-text placeholder:text-gray-400 dark:placeholder:text-dark-muted transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-orange-400/30 focus:border-orange-400 dark:focus:border-orange-500',
              'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-cream-100 dark:disabled:bg-dark-border',
              icon && 'pl-12',
              error && 'border-red-400 focus:ring-red-400/30 focus:border-red-400',
              className
            )}
            ref={ref}
            {...props}
          />
        </div>
        {error && (
          <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
      </div>
    )
  }
)
Input.displayName = 'Input'

export { Input }
