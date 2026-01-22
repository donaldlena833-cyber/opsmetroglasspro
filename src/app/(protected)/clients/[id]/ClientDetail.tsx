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
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-sm"
        >
          <ArrowLeft className="w-5 h-5 text-navy-800" />
        </button>
        <Button variant="outline" size="sm" onClick={() => setEditing(!editing)}>
          <Edit className="w-4 h-4 mr-1" />
          {editing ? 'Cancel' : 'Edit'}
        </Button>
      </div>

      <h1 className="text-xl font-bold text-navy-800 mb-4">{client.name}</h1>

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
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-navy-800">{client.email}</span>
                </a>
              )}
              {client.phone && (
                <a href={`tel:${client.phone}`} className="flex items-center gap-3 text-sm">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="text-navy-800">{client.phone}</span>
                </a>
              )}
              {client.billing_address && (
                <div className="flex items-start gap-3 text-sm">
                  <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                  <span className="text-navy-800">{client.billing_address}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {client.notes && (
            <Card className="mb-4">
              <CardContent>
                <p className="text-xs text-gray-500 uppercase mb-2">Notes</p>
                <p className="text-sm text-navy-800">{client.notes}</p>
              </CardContent>
            </Card>
          )}
        </>
      )}

      <Card className="mb-4">
        <CardContent>
          <h3 className="font-semibold text-navy-800 mb-3 flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Total Business
          </h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs text-gray-500">Jobs</p>
              <p className="text-lg font-bold text-navy-800">{data.stats.jobsCount}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Invoiced</p>
              <p className="text-lg font-bold text-navy-800">{formatCurrency(data.stats.totalInvoiced)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Paid</p>
              <p className="text-lg font-bold text-green-600">{formatCurrency(data.stats.totalPaid)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <h3 className="font-semibold text-navy-800 mb-3 flex items-center gap-2">
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
                  className="w-full p-3 bg-cream-50 rounded-xl text-left hover:bg-cream-100 flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-navy-800">{job.job_name}</p>
                      <Badge variant={job.status as any} className="text-xs">{statusConfig.label}</Badge>
                    </div>
                    <p className="text-sm text-gray-500">{job.address}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </button>
              )
            })}
            {data.jobs.length === 0 && <p className="text-sm text-gray-500 text-center py-4">No jobs yet</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
