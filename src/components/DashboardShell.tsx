'use client'

import { usePathname } from 'next/navigation'
import { useRef, useEffect, useState } from 'react'
import gsap from 'gsap'
import CommandBar from '@/components/dashboard/CommandBar'
import ProfileCard from '@/components/dashboard/ProfileCard'
import { createClient } from '@/lib/supabase/client'

interface Profile {
  id: string
  full_name: string
  date_of_birth: string
  gender: string
  biography: string
  personal_motto: string
  occupation: string
  interests: string[]
  skills: string[]
  personality_traits: string[]
  life_goals: string[]
  religions: string[]
  address: string
  city: string
  state: string
  country: string
  avatar_url: string
  cover_image_url: string
}

interface DashboardShellProps {
  children: React.ReactNode
}

export default function DashboardShell({ children }: DashboardShellProps) {
  const pathname = usePathname()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  
  const profileCardRef = useRef<HTMLDivElement>(null)
  
  const supabase = createClient()
  const isHome = pathname === '/dashboard'

  useEffect(() => {
    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (data) {
        setProfile({
          ...data,
          interests: data.interests || [],
          skills: data.skills || [],
          personality_traits: data.personality_traits || [],
          life_goals: data.life_goals || [],
          religions: data.religions || [],
        })
      }
      setLoading(false)
    }
    loadProfile()
  }, [])

  useEffect(() => {
    if (!loading && profileCardRef.current) {
      gsap.set(profileCardRef.current, {
        left: '16px',
        top: '72px',
        xPercent: 0,
        yPercent: 0,
        scale: 0.8,
      })
    }
  }, [loading])

  const updateProfile = async (field: string, value: unknown) => {
    if (!profile) return
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase
      .from('profiles')
      .update({ [field]: value })
      .eq('id', user.id)

    setProfile(prev => prev ? { ...prev, [field]: value } as Profile : null)
  }

  if (loading) {
    return (
      <div className="pt-14 min-h-screen flex items-center justify-center">
        <div className="text-white/60">Loading...</div>
      </div>
    )
  }

  return (
    <div className="pt-14 min-h-screen relative">
      {/* ProfileCard - fixed top-left */}
      <div
        ref={profileCardRef}
        className="fixed z-30 origin-top-left will-change-transform pointer-events-auto hidden lg:block"
      >
        <ProfileCard 
          profile={profile}
          onUpdate={updateProfile}
          compact={true}
        />
      </div>

      {/* Page Content */}
      {isHome ? (
        // Home: Center content in full viewport (above command bar)
        <div className="fixed inset-0 top-14 bottom-24 flex items-center justify-center">
          {children}
        </div>
      ) : (
        // Other pages: offset for profile card
        <div className="min-h-[calc(100vh-56px)] lg:pl-[260px] px-6 pb-32">
          {children}
        </div>
      )}

      <CommandBar />
    </div>
  )
}
