'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import {
  LogOut,
  Building2,
  Mail,
  Phone,
  User,
  Smartphone,
  Info,
} from 'lucide-react'
import Image from 'next/image'

export default function SettingsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()
  const [loggingOut, setLoggingOut] = useState(false)

  const handleLogout = async () => {
    setLoggingOut(true)
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const handleInstallPWA = () => {
    toast({
      title: 'Add to Home Screen',
      description: 'Tap the share button in Safari, then "Add to Home Screen"',
    })
  }

  return (
    <div className="page-container safe-top">
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
      </div>

      {/* Company Info */}
      <Card className="mb-4">
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-xl bg-white border border-gray-200 flex items-center justify-center overflow-hidden">
              <Image
                src="/logo.png"
                alt="MetroGlass Pro"
                width={60}
                height={60}
                className="object-contain"
              />
            </div>
            <div>
              <h2 className="font-semibold text-navy-800">MetroGlass Pro Inc</h2>
              <p className="text-sm text-gray-500">Custom Shower Glass</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <Mail className="w-4 h-4 text-gray-400" />
              <span className="text-navy-800">operations@metroglasspro.com</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Phone className="w-4 h-4 text-gray-400" />
              <span className="text-navy-800">332-999-3846 | 646-520-5412</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Building2 className="w-4 h-4 text-gray-400" />
              <span className="text-navy-800">NYC / NJ / CT</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account */}
      <Card className="mb-4">
        <CardContent>
          <h3 className="font-semibold text-navy-800 mb-3 flex items-center gap-2">
            <User className="w-4 h-4" />
            Account
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Logged in as MetroGlass Pro user
          </p>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full"
            loading={loggingOut}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </CardContent>
      </Card>

      {/* Install PWA */}
      <Card className="mb-4">
        <CardContent>
          <h3 className="font-semibold text-navy-800 mb-3 flex items-center gap-2">
            <Smartphone className="w-4 h-4" />
            Install App
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Add MetroGlassOps to your home screen for quick access
          </p>
          <Button onClick={handleInstallPWA} variant="outline" className="w-full">
            Add to Home Screen
          </Button>
        </CardContent>
      </Card>

      {/* About */}
      <Card>
        <CardContent>
          <h3 className="font-semibold text-navy-800 mb-3 flex items-center gap-2">
            <Info className="w-4 h-4" />
            About
          </h3>
          <div className="text-sm text-gray-500 space-y-1">
            <p>MetroGlassOps v1.0.0</p>
            <p>Internal operations system</p>
            <p className="text-xs text-gray-400 mt-2">
              © 2025 MetroGlass Pro Inc
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
