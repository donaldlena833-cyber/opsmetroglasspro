'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Home, Briefcase, Plus, Receipt, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import { QuickActionsSheet } from './QuickActionsSheet'

const navItems = [
  { href: '/today', label: 'Today', icon: Home },
  { href: '/jobs', label: 'Jobs', icon: Briefcase },
  { href: '#add', label: 'Add', icon: Plus, isAction: true },
  { href: '/expenses', label: 'Expenses', icon: Receipt },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export function BottomNav() {
  const pathname = usePathname()
  const [showQuickActions, setShowQuickActions] = useState(false)

  return (
    <>
      <nav className="fixed bottom-4 left-1/2 z-40 w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 rounded-[30px] border border-cream-200/80 bg-white/88 shadow-float backdrop-blur-xl dark:border-dark-border dark:bg-dark-card/90 dark:shadow-card-dark safe-bottom">
        <div className="flex h-20 items-center justify-around px-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = !item.isAction && (pathname === item.href || pathname.startsWith(`${item.href}/`))

            if (item.isAction) {
              return (
                <button
                  key={item.href}
                  onClick={() => setShowQuickActions(true)}
                  className="flex h-16 w-16 flex-col items-center justify-center -mt-10"
                  aria-label="Open quick actions"
                >
                  <div className="flex h-16 w-16 items-center justify-center rounded-[26px] border-4 border-cream-50 bg-navy-800 text-cream-50 shadow-float transition-all duration-200 active:scale-95 hover:bg-navy-700 dark:border-dark-card">
                    <Icon className="h-7 w-7" strokeWidth={2.5} />
                  </div>
                </button>
              )
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex h-16 w-16 flex-col items-center justify-center rounded-2xl transition-all duration-300 ease-out',
                  isActive ? 'text-navy-800 dark:text-dark-text' : 'text-navy-400 dark:text-dark-muted hover:text-navy-600 dark:hover:text-gray-300'
                )}
              >
                <div className={cn(
                  'rounded-2xl p-2.5 transition-all',
                  isActive && 'border border-cream-200 bg-cream-100 shadow-soft dark:border-dark-border dark:bg-dark-border'
                )}>
                  <Icon className="h-6 w-6" strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className={cn(
                  'mt-1 text-[10px] font-semibold uppercase tracking-[0.12em]',
                  isActive ? 'text-navy-700 dark:text-dark-text' : 'text-navy-400 dark:text-dark-muted'
                )}>
                  {item.label}
                </span>
              </Link>
            )
          })}
        </div>
      </nav>

      <QuickActionsSheet 
        open={showQuickActions} 
        onOpenChange={setShowQuickActions} 
      />
    </>
  )
}
