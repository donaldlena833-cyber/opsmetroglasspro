'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { ArrowLeft, Copy, Eye, KeyRound, Plus, ShieldCheck, ShieldOff } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/components/ui/use-toast'

interface ApiKeyRow {
  id: string
  name: string
  key_prefix: string
  scopes: string[]
  created_at: string
  last_used_at: string | null
  revoked_at: string | null
}

export default function ApiKeysPage() {
  const supabase = createClient()
  const { toast } = useToast()
  const [keys, setKeys] = useState<ApiKeyRow[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [revoking, setRevoking] = useState<string | null>(null)

  const [newName, setNewName] = useState('')
  const [allowWrite, setAllowWrite] = useState(true)
  const [issuedToken, setIssuedToken] = useState<string | null>(null)
  const [issuedFor, setIssuedFor] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    const { data, error } = await supabase
      .from('api_keys')
      .select('id, name, key_prefix, scopes, created_at, last_used_at, revoked_at')
      .order('created_at', { ascending: false })

    if (error) {
      toast({ title: 'Could not load keys', description: error.message, variant: 'destructive' })
      setLoading(false)
      return
    }
    setKeys((data ?? []) as ApiKeyRow[])
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleIssue() {
    const name = newName.trim()
    if (!name) {
      toast({ title: 'Name required', description: 'Give the key a label so you can find it later.', variant: 'destructive' })
      return
    }
    setCreating(true)
    const scopes = allowWrite ? ['read', 'write'] : ['read']
    const { data, error } = await supabase.rpc('issue_api_key', {
      p_name: name,
      p_scopes: scopes,
    })

    if (error) {
      toast({ title: 'Could not issue key', description: error.message, variant: 'destructive' })
      setCreating(false)
      return
    }

    const row = Array.isArray(data) ? data[0] : data
    if (row?.token) {
      setIssuedToken(row.token as string)
      setIssuedFor(name)
    }
    setNewName('')
    setAllowWrite(true)
    setCreating(false)
    void load()
  }

  async function handleRevoke(id: string) {
    if (!confirm('Revoke this key? Any bot using it will start getting 401s.')) return
    setRevoking(id)
    const { error } = await supabase.rpc('revoke_api_key', { p_id: id })
    if (error) {
      toast({ title: 'Revoke failed', description: error.message, variant: 'destructive' })
      setRevoking(null)
      return
    }
    toast({ title: 'Key revoked', variant: 'success' })
    setRevoking(null)
    void load()
  }

  async function copyToken() {
    if (!issuedToken) return
    try {
      await navigator.clipboard.writeText(issuedToken)
      toast({ title: 'Copied', description: 'Paste it into your bot env now — it will not be shown again.' })
    } catch {
      toast({ title: 'Copy failed', description: 'Select the token manually and copy it.', variant: 'destructive' })
    }
  }

  return (
    <div className="page-container safe-top">
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/settings"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm dark:bg-dark-card"
        >
          <ArrowLeft className="h-5 w-5 text-navy-700 dark:text-dark-text" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-navy-800 dark:text-dark-text">API Keys</h1>
          <p className="text-sm text-navy-500 dark:text-dark-muted">
            Bearer tokens for /api/v1/* — see <code className="rounded bg-cream-100 px-1 dark:bg-dark-border">docs/API.md</code> for endpoints.
          </p>
        </div>
      </div>

      {issuedToken && (
        <Card className="mb-6 border-orange-300 bg-orange-50 dark:border-orange-700 dark:bg-orange-900/20">
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-orange-800 dark:text-orange-200">
              <Eye className="h-4 w-4" />
              <p className="text-sm font-semibold">
                Copy this token now — it will not be shown again.
              </p>
            </div>
            <p className="text-xs text-navy-600 dark:text-dark-muted">
              For: <strong>{issuedFor}</strong>
            </p>
            <div className="flex items-center gap-2 rounded-xl border border-orange-200 bg-white p-3 dark:border-orange-800 dark:bg-dark-card">
              <code className="flex-1 break-all font-mono text-xs text-navy-800 dark:text-dark-text">
                {issuedToken}
              </code>
              <Button type="button" size="sm" variant="primary" onClick={copyToken}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                setIssuedToken(null)
                setIssuedFor(null)
              }}
            >
              I&apos;ve saved it
            </Button>
          </CardContent>
        </Card>
      )}

      <Card className="mb-6">
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 text-navy-800 dark:text-dark-text">
            <Plus className="h-4 w-4" />
            <p className="text-sm font-semibold">Issue a new key</p>
          </div>
          <Input
            label="Label"
            placeholder="e.g. permit-pulse bot"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <Switch
            label="Allow write access"
            description="Off = the key can only read (dashboard, lists, GETs). On = the key can also create jobs, expenses, payments, and reminders."
            checked={allowWrite}
            onCheckedChange={setAllowWrite}
          />
          <Button
            type="button"
            variant="primary"
            onClick={handleIssue}
            disabled={creating}
          >
            {creating ? 'Issuing…' : 'Issue Key'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 text-navy-800 dark:text-dark-text">
            <KeyRound className="h-4 w-4" />
            <p className="text-sm font-semibold">Existing keys</p>
          </div>

          {loading && <p className="text-sm text-navy-500 dark:text-dark-muted">Loading…</p>}

          {!loading && keys.length === 0 && (
            <p className="text-sm text-navy-500 dark:text-dark-muted">No keys yet. Issue one above.</p>
          )}

          {!loading && keys.length > 0 && (
            <div className="space-y-2">
              {keys.map((key) => {
                const isRevoked = !!key.revoked_at
                return (
                  <div
                    key={key.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-cream-200 bg-white/85 p-3 dark:border-dark-border dark:bg-dark-card/80"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-navy-800 dark:text-dark-text">{key.name}</p>
                        {isRevoked ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-gray-600 dark:bg-dark-border dark:text-dark-muted">
                            <ShieldOff className="h-3 w-3" /> Revoked
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-green-700 dark:bg-green-900/30 dark:text-green-300">
                            <ShieldCheck className="h-3 w-3" /> Active
                          </span>
                        )}
                      </div>
                      <p className="mt-1 font-mono text-xs text-navy-500 dark:text-dark-muted">
                        {key.key_prefix}…
                      </p>
                      <p className="mt-1 text-xs text-navy-400 dark:text-dark-muted">
                        Scopes: {key.scopes.join(', ')} · Created{' '}
                        {format(new Date(key.created_at), 'MMM d, yyyy')}
                        {key.last_used_at
                          ? ` · Last used ${format(new Date(key.last_used_at), 'MMM d, yyyy h:mm a')}`
                          : ' · Never used'}
                        {isRevoked
                          ? ` · Revoked ${format(new Date(key.revoked_at!), 'MMM d, yyyy')}`
                          : ''}
                      </p>
                    </div>
                    {!isRevoked && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => handleRevoke(key.id)}
                        disabled={revoking === key.id}
                      >
                        {revoking === key.id ? 'Revoking…' : 'Revoke'}
                      </Button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
