'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { ArrowLeft, Plus, User, ChevronDown } from 'lucide-react'
import { jobStatusConfig } from '@/lib/utils'
import { Client, JobStatus } from '@/lib/supabase/types'

export default function NewJobPage() {
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  const [loading, setLoading] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [clientSearch, setClientSearch] = useState('')
  const [showClientDropdown, setShowClientDropdown] = useState(false)
  const [showNewClient, setShowNewClient] = useState(false)

  // Job form
  const [jobName, setJobName] = useState('')
  const [address, setAddress] = useState('')
  const [area, setArea] = useState('')
  const [status, setStatus] = useState<JobStatus>('estimate')
  const [installDate, setInstallDate] = useState('')
  const [installEndDate, setInstallEndDate] = useState('')
  const [notes, setNotes] = useState('')
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)

  // New client form
  const [newClientName, setNewClientName] = useState('')
  const [newClientEmail, setNewClientEmail] = useState('')
  const [newClientPhone, setNewClientPhone] = useState('')
  const [newClientAddress, setNewClientAddress] = useState('')

  useEffect(() => {
    async function fetchClients() {
      const { data } = await supabase
        .from('clients')
        .select('*')
        .order('name', { ascending: true })
      if (data) setClients(data)
    }
    fetchClients()
  }, [])

  const filteredClients = clients.filter(c =>
    c.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
    c.email?.toLowerCase().includes(clientSearch.toLowerCase())
  )

  const selectedClient = clients.find(c => c.id === selectedClientId)

  const handleSelectClient = (client: Client) => {
    setSelectedClientId(client.id)
    setClientSearch(client.name)
    setShowClientDropdown(false)
    setShowNewClient(false)
  }

  const handleCreateNewClient = () => {
    setShowNewClient(true)
    setShowClientDropdown(false)
    setSelectedClientId(null)
    setNewClientName(clientSearch)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      let clientId = selectedClientId

      if (showNewClient && newClientName) {
        const { data: newClient, error: clientError } = await supabase
          .from('clients')
          .insert({
            name: newClientName,
            email: newClientEmail || null,
            phone: newClientPhone || null,
            billing_address: newClientAddress || null,
          })
          .select()
          .single()

        if (clientError) throw clientError
        clientId = newClient.id
      }

      const { data: job, error: jobError } = await supabase
        .from('jobs')
        .insert({
          job_name: jobName,
          address,
          area: area || null,
          status,
          install_date: installDate || null,
          install_end_date: installEndDate || null,
          notes: notes || null,
          client_id: clientId,
        })
        .select()
        .single()

      if (jobError) throw jobError

      toast({
        title: 'Job created!',
        description: `${jobName} has been created`,
        variant: 'success',
      })

      router.push(`/jobs/${job.id}`)
      router.refresh()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create job',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-container safe-top">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-sm"
        >
          <ArrowLeft className="w-5 h-5 text-navy-800" />
        </button>
        <h1 className="text-xl font-bold text-navy-800">New Job</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardContent className="space-y-4">
            <Input
              label="Job Name *"
              placeholder="Smith Master Bath Renovation"
              value={jobName}
              onChange={(e) => setJobName(e.target.value)}
              required
            />

            <Input
              label="Address *"
              placeholder="123 Main St, Apt 4B, Manhattan"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
            />

            <Input
              label="Area"
              placeholder="Manhattan, Brooklyn, Jersey City..."
              value={area}
              onChange={(e) => setArea(e.target.value)}
            />

            <Select value={status} onValueChange={(v) => setStatus(v as JobStatus)}>
              <SelectTrigger label="Status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(jobStatusConfig).map(([value, config]) => (
                  <SelectItem key={value} value={value}>
                    {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="grid grid-cols-2 gap-3">
              <Input
                type="date"
                label="Install Date"
                value={installDate}
                onChange={(e) => setInstallDate(e.target.value)}
              />
              <Input
                type="date"
                label="End Date"
                value={installEndDate}
                onChange={(e) => setInstallEndDate(e.target.value)}
              />
            </div>

            <Textarea
              label="Notes"
              placeholder="Job details, client preferences, special requirements..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </CardContent>
        </Card>

        {/* Client Selection */}
        <Card>
          <CardContent className="space-y-4">
            <h3 className="font-semibold text-navy-800 flex items-center gap-2">
              <User className="w-4 h-4" />
              Client
            </h3>

            <div className="relative">
              <Input
                placeholder="Search or create client..."
                value={clientSearch}
                onChange={(e) => {
                  setClientSearch(e.target.value)
                  setShowClientDropdown(true)
                  if (selectedClientId) setSelectedClientId(null)
                }}
                onFocus={() => setShowClientDropdown(true)}
              />

              {showClientDropdown && clientSearch && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-auto">
                  {filteredClients.map((client) => (
                    <button
                      key={client.id}
                      type="button"
                      onClick={() => handleSelectClient(client)}
                      className="w-full px-4 py-3 text-left hover:bg-cream-50 first:rounded-t-xl last:rounded-b-xl"
                    >
                      <p className="font-medium text-navy-800">{client.name}</p>
                      {client.email && (
                        <p className="text-sm text-gray-500">{client.email}</p>
                      )}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={handleCreateNewClient}
                    className="w-full px-4 py-3 text-left hover:bg-cream-50 border-t border-gray-100 flex items-center gap-2 text-orange-600"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create "{clientSearch}"</span>
                  </button>
                </div>
              )}
            </div>

            {selectedClient && (
              <div className="p-3 bg-cream-50 rounded-xl">
                <p className="font-medium text-navy-800">{selectedClient.name}</p>
                {selectedClient.email && (
                  <p className="text-sm text-gray-500">{selectedClient.email}</p>
                )}
                {selectedClient.phone && (
                  <p className="text-sm text-gray-500">{selectedClient.phone}</p>
                )}
              </div>
            )}

            {showNewClient && (
              <div className="space-y-3 p-4 bg-orange-50 rounded-xl border border-orange-100">
                <p className="text-sm font-medium text-orange-800">New Client Details</p>
                <Input
                  placeholder="Client Name *"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                />
                <Input
                  type="email"
                  placeholder="Email"
                  value={newClientEmail}
                  onChange={(e) => setNewClientEmail(e.target.value)}
                />
                <Input
                  type="tel"
                  placeholder="Phone"
                  value={newClientPhone}
                  onChange={(e) => setNewClientPhone(e.target.value)}
                />
                <Input
                  placeholder="Billing Address"
                  value={newClientAddress}
                  onChange={(e) => setNewClientAddress(e.target.value)}
                />
              </div>
            )}
          </CardContent>
        </Card>

        <Button
          type="submit"
          className="w-full"
          size="lg"
          variant="primary"
          loading={loading}
        >
          Create Job
        </Button>
      </form>
    </div>
  )
}
