'use client'

import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Calendar, ChevronRight, MapPin } from 'lucide-react'
import { formatRelativeDate, truncate } from '@/lib/utils'
import { Job, Client } from '@/lib/supabase/types'

interface UpcomingInstallsProps {
  installs: any[]
}

export function UpcomingInstalls({ installs }: UpcomingInstallsProps) {
  const router = useRouter()

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Calendar className="w-4 h-4 text-blue-500" />
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
          Upcoming Installs
        </h2>
      </div>
      <Card className="divide-y divide-gray-100">
        {installs.map((install) => (
          <div
            key={install.id}
            onClick={() => router.push(`/jobs/${install.id}`)}
            className="p-4 cursor-pointer hover:bg-cream-50 active:bg-cream-100 transition-colors first:rounded-t-2xl last:rounded-b-2xl"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-blue-600">
                    {formatRelativeDate(install.install_date!)}
                  </span>
                  {install.install_end_date && install.install_end_date !== install.install_date && (
                    <span className="text-xs text-gray-400">
                      → {formatRelativeDate(install.install_end_date)}
                    </span>
                  )}
                </div>
                <h3 className="font-medium text-navy-800 mt-1 truncate">
                  {install.job_name}
                </h3>
                <div className="flex items-center gap-1 mt-0.5 text-sm text-gray-500">
                  <MapPin className="w-3.5 h-3.5" />
                  <span className="truncate">{truncate(install.address, 35)}</span>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 ml-2" />
            </div>
          </div>
        ))}
      </Card>
    </div>
  )
}
