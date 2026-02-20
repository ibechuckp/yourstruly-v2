import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import DashboardShell from '@/components/DashboardShell'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get profile for sidebar
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, avatar_url')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen w-full relative overflow-x-hidden">
      {/* Scenic Background - persists across all pages */}
      <div 
        className="fixed inset-0 w-full h-full bg-cover bg-center pointer-events-none"
        style={{ 
          backgroundImage: 'url(/backgrounds/sunset.jpg)',
          filter: 'brightness(0.7)',
        }}
      />
      <div 
        className="fixed inset-0 w-full h-full bg-gradient-to-b from-black/30 via-transparent to-black/50 pointer-events-none"
      />
      
      <Sidebar user={user} profile={profile} />
      <DashboardShell>
        {children}
      </DashboardShell>
    </div>
  )
}
