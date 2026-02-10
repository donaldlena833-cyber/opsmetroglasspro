import * as React from 'react'
import { cn } from '@/lib/utils'

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-navy-800 dark:text-dark-text mb-1.5">
            {label}
          </label>
        )}
        <textarea
          className={cn(
            'flex min-h-[100px] w-full rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card px-4 py-3 text-base text-navy-800 dark:text-dark-text placeholder:text-gray-400 dark:placeholder:text-dark-muted transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent',
            'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-50 dark:disabled:bg-dark-border',
            'resize-none',
            error && 'border-red-500 focus:ring-red-500',
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
      </div>
    )
  }
)
Textarea.displayName = 'Textarea'

export { Textarea }
