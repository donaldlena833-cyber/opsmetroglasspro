'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Home, Briefcase, Plus, FileText, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import { QuickActionsSheet } from './QuickActionsSheet'

const navItems = [
  { href: '/today', label: 'Today', icon: Home },
  { href: '/jobs', label: 'Jobs', icon: Briefcase },
  { href: '#add', label: 'Add', icon: Plus, isAction: true },
  { href: '/invoices', label: 'Invoices', icon: FileText },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export function BottomNav() {
  const pathname = usePathname()
  const [showQuickActions, setShowQuickActions] = useState(false)

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 safe-bottom">
        <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname.startsWith(item.href) && !item.isAction

            if (item.isAction) {
              return (
                <button
                  key={item.href}
                  onClick={() => setShowQuickActions(true)}
                  className="flex flex-col items-center justify-center w-16 h-14 -mt-6"
                >
                  <div className="flex items-center justify-center w-14 h-14 rounded-full bg-orange-500 text-white shadow-lg transition-transform active:scale-95">
                    <Icon className="h-7 w-7" />
                  </div>
                </button>
              )
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center justify-center w-16 h-14 transition-colors',
                  isActive ? 'text-navy-800' : 'text-gray-400'
                )}
              >
                <Icon className={cn('h-6 w-6', isActive && 'text-orange-500')} />
                <span className={cn(
                  'text-xs mt-1 font-medium',
                  isActive ? 'text-navy-800' : 'text-gray-400'
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
