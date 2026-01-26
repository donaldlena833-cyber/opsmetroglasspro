'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Home, Briefcase, Plus, Receipt, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import { QuickActionsSheet } from './QuickActionsSheet'

const navItems = [
  { href: '/today', label: 'Home', icon: Home },
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
      {/* V3: Floating bottom nav with rounded corners */}
      <nav className="fixed bottom-4 left-4 right-4 z-40 bg-white dark:bg-dark-card rounded-3xl shadow-float dark:shadow-card-dark safe-bottom">
        <div className="flex items-center justify-around h-18 max-w-lg mx-auto px-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname.startsWith(item.href) && !item.isAction

            if (item.isAction) {
              return (
                <button
                  key={item.href}
                  onClick={() => setShowQuickActions(true)}
                  className="flex flex-col items-center justify-center w-16 h-16 -mt-8"
                >
                  <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-orange-500 text-white shadow-float transition-all duration-200 active:scale-95 hover:bg-orange-600">
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
                  'flex flex-col items-center justify-center w-16 h-16 transition-all duration-200 rounded-2xl',
                  isActive ? 'text-orange-500' : 'text-gray-400 dark:text-dark-muted hover:text-gray-600 dark:hover:text-gray-300'
                )}
              >
                <div className={cn(
                  'p-2 rounded-xl transition-colors',
                  isActive && 'bg-orange-100 dark:bg-orange-900/30'
                )}>
                  <Icon className="h-6 w-6" strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className={cn(
                  'text-[10px] mt-0.5 font-semibold',
                  isActive ? 'text-orange-600 dark:text-orange-400' : 'text-gray-400 dark:text-dark-muted'
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
