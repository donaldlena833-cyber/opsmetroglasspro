'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { format, isPast, isToday, isTomorrow } from 'date-fns'
import { AlertCircle, Bell, Check, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { cn, reminderPriorityConfig } from '@/lib/utils'
import { ReminderWithJob } from '@/lib/supabase/types'
import { useToast } from '@/components/ui/use-toast'

interface ReminderBannersProps {
  reminders: ReminderWithJob[]
}

export function ReminderBanners({ reminders }: ReminderBannersProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [dismissing, setDismissing] = useState<string | null>(null)
  const supabase = createClient()

  const handleMarkDone = async (id: string, event: React.MouseEvent) => {
    event.stopPropagation()
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
      title: 'Done',
      description: 'Reminder marked as complete',
      variant: 'success',
    })

    router.refresh()
  }

  const getDateLabel = (date: string) => {
    const parsed = new Date(date)
    if (isPast(parsed) && !isToday(parsed)) return 'Overdue'
    if (isToday(parsed)) return 'Today'
    if (isTomorrow(parsed)) return 'Tomorrow'
    return format(parsed, 'MMM d')
  }

  const sortedReminders = [...reminders].sort((left, right) => {
    const priorityOrder = { high: 0, moderate: 1, low: 2 }
    if (priorityOrder[left.priority] !== priorityOrder[right.priority]) {
      return priorityOrder[left.priority] - priorityOrder[right.priority]
    }

    return new Date(left.reminder_date).getTime() - new Date(right.reminder_date).getTime()
  })

  return (
    <div className="space-y-3">
      {sortedReminders.map((reminder) => {
        const config = reminderPriorityConfig[reminder.priority]
        const dateLabel = getDateLabel(reminder.reminder_date)
        const isOverdue = isPast(new Date(reminder.reminder_date)) && !isToday(new Date(reminder.reminder_date))
        const badgeVariant =
          reminder.priority === 'high'
            ? 'danger'
            : reminder.priority === 'moderate'
              ? 'secondary'
              : 'success'

        return (
          <Card
            key={reminder.id}
            onClick={() => reminder.jobs?.id && router.push(`/jobs/${reminder.jobs.id}`)}
            className={cn(
              'overflow-hidden border-l-4 p-4 transition-all',
              reminder.priority === 'high'
                ? 'border-l-red-500'
                : reminder.priority === 'moderate'
                  ? 'border-l-orange-500'
                  : 'border-l-green-500',
              dismissing === reminder.id && 'opacity-50',
              reminder.jobs?.id && 'cursor-pointer active:scale-[0.99]'
            )}
          >
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl',
                  config.bgColor
                )}
              >
                {reminder.priority === 'high' ? (
                  <AlertCircle className="h-5 w-5 text-red-600" />
                ) : reminder.priority === 'moderate' ? (
                  <Clock className="h-5 w-5 text-orange-600" />
                ) : (
                  <Bell className="h-5 w-5 text-green-600" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-navy-800 dark:text-dark-text">{reminder.title}</p>
                  <Badge variant={badgeVariant as any}>{config.label}</Badge>
                  <span
                    className={cn(
                      'rounded-full px-2.5 py-1 text-xs font-medium',
                      isOverdue
                        ? 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300'
                        : 'bg-cream-100 text-navy-600 dark:bg-dark-border dark:text-dark-muted'
                    )}
                  >
                    {dateLabel}
                  </span>
                </div>

                {reminder.jobs && (
                  <p className="mt-1 text-sm text-navy-500 dark:text-dark-muted">
                    {reminder.jobs.job_name}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={(event) => handleMarkDone(reminder.id, event)}
                disabled={dismissing === reminder.id}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-cream-200 bg-white text-navy-700 transition-colors hover:bg-cream-100 dark:border-dark-border dark:bg-dark-card dark:text-dark-text dark:hover:bg-dark-border"
                aria-label={`Mark ${reminder.title} as done`}
              >
                <Check className="h-5 w-5" />
              </button>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
