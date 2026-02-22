'use client'

import { useState, useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import gsap from 'gsap'
import ProfileCard from '@/components/dashboard/ProfileCard'
import CommandBar from '@/components/dashboard/CommandBar'
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

// View configurations - where ProfileCard sits in each view
const viewConfigs = {
  '/dashboard': {
    profileCard: { x: '50%', y: '50%', scale: 1, translateX: '-50%', translateY: '-50%' },
    contentPanel: { x: '100%', opacity: 0 },
  },
  '/dashboard/memories': {
    profileCard: { x: '20px', y: '20px', scale: 0.65, translateX: '0%', translateY: '0%' },
    contentPanel: { x: '0%', opacity: 1 },
  },
  '/dashboard/contacts': {
    profileCard: { x: '20px', y: '20px', scale: 0.65, translateX: '0%', translateY: '0%' },
    contentPanel: { x: '0%', opacity: 1 },
  },
  '/dashboard/gallery': {
    profileCard: { x: '20px', y: '20px', scale: 0.65, translateX: '0%', translateY: '0%' },
    contentPanel: { x: '0%', opacity: 1 },
  },
  '/dashboard/profile': {
    profileCard: { x: '50%', y: '20px', scale: 0.8, translateX: '-50%', translateY: '0%' },
    contentPanel: { x: '0%', opacity: 1 },
  },
  '/dashboard/journalist': {
    profileCard: { x: '20px', y: '20px', scale: 0.65, translateX: '0%', translateY: '0%' },
    contentPanel: { x: '0%', opacity: 1 },
  },
  '/dashboard/postscripts': {
    profileCard: { x: '20px', y: '20px', scale: 0.65, translateX: '0%', translateY: '0%' },
    contentPanel: { x: '0%', opacity: 1 },
  },
  '/dashboard/settings': {
    profileCard: { x: '20px', y: '20px', scale: 0.65, translateX: '0%', translateY: '0%' },
    contentPanel: { x: '0%', opacity: 1 },
  },
}

type ViewKey = keyof typeof viewConfigs

function getViewConfig(pathname: string) {
  // Check exact match first
  if (pathname in viewConfigs) {
    return viewConfigs[pathname as ViewKey]
  }
  // Check if it's a sub-route (e.g., /dashboard/memories/123)
  for (const key of Object.keys(viewConfigs)) {
    if (pathname.startsWith(key) && key !== '/dashboard') {
      return viewConfigs[key as ViewKey]
    }
  }
  // Default to home
  return viewConfigs['/dashboard']
}

interface DashboardCanvasProps {
  children: React.ReactNode
}

export default function DashboardCanvas({ children }: DashboardCanvasProps) {
  const pathname = usePathname()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isHome, setIsHome] = useState(pathname === '/dashboard')
  const profileCardRef = useRef<HTMLDivElement>(null)
  const contentPanelRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  // Load profile
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
    }
    loadProfile()
  }, [])

  // Animate on route change
  useEffect(() => {
    const config = getViewConfig(pathname)
    const isHomeView = pathname === '/dashboard'
    setIsHome(isHomeView)

    // Animate ProfileCard
    if (profileCardRef.current) {
      gsap.to(profileCardRef.current, {
        left: config.profileCard.x,
        top: config.profileCard.y,
        scale: config.profileCard.scale,
        xPercent: config.profileCard.translateX === '-50%' ? -50 : 0,
        yPercent: config.profileCard.translateY === '-50%' ? -50 : 0,
        duration: 0.5,
        ease: 'power3.out',
      })
    }

    // Animate content panel
    if (contentPanelRef.current) {
      gsap.to(contentPanelRef.current, {
        xPercent: config.contentPanel.x === '100%' ? 100 : 0,
        opacity: config.contentPanel.opacity,
        duration: 0.5,
        ease: 'power3.out',
      })
    }
  }, [pathname])

  const updateProfile = async (field: string, value: unknown) => {
    if (!profile) return
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase
      .from('profiles')
      .update({ [field]: value })
      .eq('id', user.id)

    setProfile(prev => prev ? { ...prev, [field]: value } : null)
  }

  return (
    <div className="fixed inset-0 overflow-hidden">
      {/* ProfileCard - always visible, animates position */}
      <div
        ref={profileCardRef}
        className="fixed z-30 origin-top-left will-change-transform"
        style={{
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      >
        <ProfileCard 
          profile={profile}
          onUpdate={updateProfile}
          compact={!isHome}
        />
      </div>

      {/* Content Panel - slides in from right */}
      <div
        ref={contentPanelRef}
        className={`fixed inset-0 z-20 overflow-y-auto will-change-transform ${
          isHome ? 'pointer-events-none' : 'pointer-events-auto'
        }`}
        style={{
          paddingLeft: isHome ? '0' : '340px', // Space for mini profile card
          paddingTop: '80px',
          paddingBottom: '120px',
          transform: 'translateX(100%)',
          opacity: 0,
        }}
      >
        <div className="px-6 py-4">
          {children}
        </div>
      </div>

      {/* Home view widgets - only visible on home */}
      {isHome && (
        <HomeWidgets profile={profile} onUpdate={updateProfile} />
      )}

      {/* CommandBar - always at bottom */}
      <CommandBar />
    </div>
  )
}

// Home-specific widgets that animate around the ProfileCard
function HomeWidgets({ profile, onUpdate }: { profile: Profile | null, onUpdate: (field: string, value: unknown) => void }) {
  // These will be the left and right column widgets on the home view
  // They fade out when navigating away (ProfileCard handles its own animation)
  
  return (
    <>
      {/* Left Column Widgets */}
      <div className="fixed left-4 top-1/2 -translate-y-1/2 w-72 space-y-4 z-10">
        {/* Import and render left widgets here */}
      </div>

      {/* Right Column Widgets */}
      <div className="fixed right-4 top-1/2 -translate-y-1/2 w-72 space-y-4 z-10">
        {/* Import and render right widgets here */}
      </div>
    </>
  )
}
