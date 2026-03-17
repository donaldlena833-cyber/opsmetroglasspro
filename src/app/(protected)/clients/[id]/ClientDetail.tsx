'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Edit,
  ChevronRight,
  Briefcase,
  DollarSign,
} from 'lucide-react'
import { formatCurrency, jobStatusConfig } from '@/lib/utils'
import { Client, Job } from '@/lib/supabase/types'

interface ClientDetailProps {
  data: {
    client: Client
    jobs: Job[]
    stats: {
      jobsCount: number
      totalInvoiced: number
      totalPaid: number
    }
  }
}

export function ClientDetail({ data }: ClientDetailProps) {
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  const [client, setClient] = useState(data.client)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  const [editName, setEditName] = useState(client.name)
  const [editEmail, setEditEmail] = useState(client.email || '')
  const [editPhone, setEditPhone] = useState(client.phone || '')
  const [editAddress, setEditAddress] = useState(client.billing_address || '')
  const [editNotes, setEditNotes] = useState(client.notes || '')

  const handleSave = async () => {
    setSaving(true)
    const { error } = await supabase
      .from('clients')
      .update({
        name: editName,
        email: editEmail || null,
        phone: editPhone || null,
        billing_address: editAddress || null,
        notes: editNotes || null,
      })
      .eq('id', client.id)

    if (error) {
      toast({ title: 'Error', description: 'Failed to update', variant: 'destructive' })
      setSaving(false)
      return
    }

    setClient({
      ...client,
      name: editName,
      email: editEmail || null,
      phone: editPhone || null,
      billing_address: editAddress || null,
      notes: editNotes || null,
    })
    setEditing(false)
    setSaving(false)
    toast({ title: 'Saved', variant: 'success' })
  }

  return (
    <div className="page-container safe-top">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-sm dark:bg-dark-card dark:shadow-card-dark"
        >
          <ArrowLeft className="w-5 h-5 text-navy-800 dark:text-dark-text" />
        </button>
        <Button variant="outline" size="sm" onClick={() => setEditing(!editing)}>
          <Edit className="w-4 h-4 mr-1" />
          {editing ? 'Cancel' : 'Edit'}
        </Button>
      </div>

      <h1 className="mb-4 text-xl font-bold text-navy-800 dark:text-dark-text">{client.name}</h1>

      {editing ? (
        <Card className="mb-4">
          <CardContent className="space-y-4">
            <Input label="Name" value={editName} onChange={(e) => setEditName(e.target.value)} />
            <Input type="email" label="Email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
            <Input type="tel" label="Phone" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} />
            <Textarea label="Billing Address" value={editAddress} onChange={(e) => setEditAddress(e.target.value)} rows={2} />
            <Textarea label="Notes" value={editNotes} onChange={(e) => setEditNotes(e.target.value)} rows={3} />
            <Button onClick={handleSave} loading={saving} className="w-full">Save</Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="mb-4">
            <CardContent className="space-y-3">
              {client.email && (
                <a href={`mailto:${client.email}`} className="flex items-center gap-3 text-sm">
                  <Mail className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                  <span className="text-navy-800 dark:text-dark-text">{client.email}</span>
                </a>
              )}
              {client.phone && (
                <a href={`tel:${client.phone}`} className="flex items-center gap-3 text-sm">
                  <Phone className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                  <span className="text-navy-800 dark:text-dark-text">{client.phone}</span>
                </a>
              )}
              {client.billing_address && (
                <div className="flex items-start gap-3 text-sm">
                  <MapPin className="mt-0.5 w-4 h-4 text-gray-400 dark:text-gray-500" />
                  <span className="text-navy-800 dark:text-dark-text">{client.billing_address}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {client.notes && (
            <Card className="mb-4">
              <CardContent>
                <p className="mb-2 text-xs uppercase text-gray-500 dark:text-dark-muted">Notes</p>
                <p className="text-sm text-navy-800 dark:text-dark-text">{client.notes}</p>
              </CardContent>
            </Card>
          )}
        </>
      )}

      <Card className="mb-4">
        <CardContent>
          <h3 className="mb-3 flex items-center gap-2 font-semibold text-navy-800 dark:text-dark-text">
            <DollarSign className="w-4 h-4" />
            Total Business
          </h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs text-gray-500 dark:text-dark-muted">Jobs</p>
              <p className="text-lg font-bold text-navy-800 dark:text-dark-text">{data.stats.jobsCount}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-dark-muted">Invoiced</p>
              <p className="text-lg font-bold text-navy-800 dark:text-dark-text">{formatCurrency(data.stats.totalInvoiced)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-dark-muted">Paid</p>
              <p className="text-lg font-bold text-green-600">{formatCurrency(data.stats.totalPaid)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <h3 className="mb-3 flex items-center gap-2 font-semibold text-navy-800 dark:text-dark-text">
            <Briefcase className="w-4 h-4" />
            Jobs ({data.jobs.length})
          </h3>
          <div className="space-y-2">
            {data.jobs.map((job) => {
              const statusConfig = jobStatusConfig[job.status]
              return (
                <button
                  key={job.id}
                  onClick={() => router.push(`/jobs/${job.id}`)}
                  className="flex w-full items-center justify-between rounded-xl bg-cream-50 p-3 text-left hover:bg-cream-100 dark:bg-dark-bg/60 dark:hover:bg-dark-border"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-navy-800 dark:text-dark-text">{job.job_name}</p>
                      <Badge variant={job.status as any} className="text-xs">{statusConfig.label}</Badge>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-dark-muted">{job.address}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                </button>
              )
            })}
            {data.jobs.length === 0 && <p className="py-4 text-center text-sm text-gray-500 dark:text-dark-muted">No jobs yet</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
