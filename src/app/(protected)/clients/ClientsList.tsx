'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Search, ChevronRight, User, Briefcase } from 'lucide-react'
import { Client } from '@/lib/supabase/types'

interface ClientWithStats extends Client {
  jobsCount: number
  activeJobsCount: number
}

interface ClientsListProps {
  initialClients: ClientWithStats[]
}

export function ClientsList({ initialClients }: ClientsListProps) {
  const router = useRouter()
  const [search, setSearch] = useState('')

  const filteredClients = initialClients.filter((client) => {
    const searchLower = search.toLowerCase()
    return (
      search === '' ||
      client.name.toLowerCase().includes(searchLower) ||
      client.email?.toLowerCase().includes(searchLower) ||
      client.phone?.includes(search)
    )
  })

  return (
    <>
      <div className="mb-4">
        <Input
          placeholder="Search by name, email, phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          icon={<Search className="w-5 h-5" />}
        />
      </div>

      {filteredClients.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <User className="w-full h-full" />
          </div>
          <p className="empty-state-title">No clients found</p>
          <p className="empty-state-description">
            {search ? 'Try a different search' : 'Clients are created when you add jobs'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredClients.map((client) => (
            <Card
              key={client.id}
              onClick={() => router.push(`/clients/${client.id}`)}
              className="p-4 cursor-pointer active:scale-[0.99] transition-transform"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="truncate font-semibold text-navy-800 dark:text-dark-text">{client.name}</p>
                  {client.email && (
                    <p className="truncate text-sm text-gray-500 dark:text-dark-muted">{client.email}</p>
                  )}
                  {client.phone && (
                    <p className="text-sm text-gray-500 dark:text-dark-muted">{client.phone}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                      <Briefcase className="w-3 h-3" />
                      <span>{client.jobsCount} job{client.jobsCount !== 1 ? 's' : ''}</span>
                    </div>
                    {client.activeJobsCount > 0 && (
                      <Badge variant="success" className="text-xs">
                        {client.activeJobsCount} active
                      </Badge>
                    )}
                  </div>
                </div>
                <ChevronRight className="ml-2 w-5 h-5 flex-shrink-0 text-gray-400 dark:text-gray-500" />
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  )
}
