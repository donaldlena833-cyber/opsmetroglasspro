'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { format, isToday, isPast, isTomorrow } from 'date-fns'
import { Check, AlertCircle, Clock, Bell } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ReminderPriority, ReminderWithJob } from '@/lib/supabase/types'
import { reminderPriorityConfig } from '@/lib/utils'
import { useToast } from '@/components/ui/use-toast'

interface ReminderBannersProps {
  reminders: ReminderWithJob[]
}

export function ReminderBanners({ reminders }: ReminderBannersProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [dismissing, setDismissing] = useState<string | null>(null)
  const supabase = createClient()

  const handleMarkDone = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setDismissing(id)

    const { error } = await supabase
      .from('reminders')
      .update({ done: true })
      .eq('id', id)

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to mark reminder as done',
        variant: 'destructive',
      })
      setDismissing(null)
      return
    }

    toast({
      title: 'Done!',
      description: 'Reminder marked as complete',
      variant: 'success',
    })

    router.refresh()
  }

  const getDateLabel = (date: string) => {
    const d = new Date(date)
    if (isPast(d) && !isToday(d)) return 'Overdue'
    if (isToday(d)) return 'Today'
    if (isTomorrow(d)) return 'Tomorrow'
    return format(d, 'MMM d')
  }

  // Sort reminders: high first, then by date
  const sortedReminders = [...reminders].sort((a, b) => {
    const priorityOrder = { high: 0, moderate: 1, low: 2 }
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority]
    }
    return new Date(a.reminder_date).getTime() - new Date(b.reminder_date).getTime()
  })

  return (
    <div className="mb-6 space-y-2">
      {sortedReminders.map((reminder) => {
        const config = reminderPriorityConfig[reminder.priority]
        const dateLabel = getDateLabel(reminder.reminder_date)
        const isOverdue = isPast(new Date(reminder.reminder_date)) && !isToday(new Date(reminder.reminder_date))

        return (
          <div
            key={reminder.id}
            onClick={() => reminder.jobs?.id && router.push(`/jobs/${reminder.jobs.id}`)}
            className={cn(
              'flex items-center justify-between p-4 rounded-xl border transition-all',
              config.bgColor,
              config.borderColor,
              dismissing === reminder.id && 'opacity-50',
              reminder.jobs?.id && 'cursor-pointer active:scale-[0.99]'
            )}
          >
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className={cn(
                'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
                reminder.priority === 'high' ? 'bg-red-100' :
                reminder.priority === 'moderate' ? 'bg-orange-100' : 'bg-green-100'
              )}>
                {reminder.priority === 'high' ? (
                  <AlertCircle className="w-4 h-4 text-red-600" />
                ) : reminder.priority === 'moderate' ? (
                  <Clock className="w-4 h-4 text-orange-600" />
                ) : (
                  <Bell className="w-4 h-4 text-green-600" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn('font-medium text-sm', config.color)}>
                  {reminder.title}
                </p>
                {reminder.jobs && (
                  <p className="text-xs text-gray-500 mt-0.5 truncate">
                    {reminder.jobs.job_name}
                  </p>
                )}
                <p className={cn(
                  'text-xs mt-1',
                  isOverdue ? 'text-red-600 font-medium' : 'text-gray-500'
                )}>
                  {dateLabel}
                </p>
              </div>
            </div>
            <button
              onClick={(e) => handleMarkDone(reminder.id, e)}
              disabled={dismissing === reminder.id}
              className={cn(
                'flex-shrink-0 ml-3 w-10 h-10 rounded-full flex items-center justify-center transition-colors',
                'bg-white/50 hover:bg-white active:scale-95',
                config.color
              )}
            >
              <Check className="w-5 h-5" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
