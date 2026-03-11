import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-2xl text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 focus-visible:ring-offset-2 focus-visible:ring-offset-cream-50 dark:focus-visible:ring-offset-dark-bg disabled:pointer-events-none disabled:opacity-50 active:scale-[0.97]',
  {
    variants: {
      variant: {
        default: 'bg-navy-800 dark:bg-navy-700 text-cream-50 hover:bg-navy-700 dark:hover:bg-navy-600 shadow-soft',
        primary: 'bg-orange-500 text-white hover:bg-orange-600 shadow-soft hover:shadow-card',
        destructive: 'bg-red-500 text-white hover:bg-red-600 shadow-soft',
        outline: 'border border-cream-300 dark:border-dark-border text-navy-700 dark:text-dark-text bg-white/60 dark:bg-dark-card/60 hover:bg-cream-100 dark:hover:bg-dark-card',
        'outline-orange': 'border border-orange-300 text-orange-700 dark:text-orange-300 bg-orange-50/60 dark:bg-orange-900/10 hover:bg-orange-100 dark:hover:bg-orange-900/20',
        secondary: 'border border-cream-300 bg-cream-200/80 dark:bg-dark-card text-navy-700 dark:text-dark-text hover:bg-cream-300 dark:hover:bg-dark-border',
        ghost: 'text-navy-700 dark:text-dark-text hover:bg-cream-200/70 dark:hover:bg-dark-card',
        link: 'text-orange-700 dark:text-orange-300 underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-12 px-6 py-2',
        sm: 'h-10 rounded-xl px-4 text-xs',
        lg: 'h-14 rounded-2xl px-8 text-base',
        xl: 'h-16 rounded-3xl px-10 text-lg',
        icon: 'h-12 w-12 rounded-2xl',
        'icon-sm': 'h-10 w-10 rounded-xl',
        'icon-lg': 'h-16 w-16 rounded-3xl',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, children, disabled, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <>
            <svg
              className="mr-2 h-4 w-4 animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Loading...
          </>
        ) : (
          children
        )}
      </button>
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
