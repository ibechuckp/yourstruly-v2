'use client'

import { ReactNode } from 'react'
import TopNav from '@/components/TopNav'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

export default function MarketplaceLayout({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const supabase = createClient()

  useEffect(() => {
    const loadUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, avatar_url')
          .eq('id', user.id)
          .single()
        setProfile(profile)
      }
    }
    loadUser()
  }, [])

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  return (
    <div className="min-h-screen">
      <TopNav user={user} profile={profile} />
      <div className="pt-14">
        {children}
      </div>
    </div>
  )
}
