import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BottomNav } from '@/components/BottomNav'

export const dynamic = 'force-dynamic'

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-cream-50 dark:bg-dark-bg">
      <main className="pb-24">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
