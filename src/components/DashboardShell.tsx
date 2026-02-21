'use client'

import { usePathname, useRouter } from 'next/navigation'
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
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  
  const profileCardRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const prevPathRef = useRef(pathname)
  const isAnimating = useRef(false)
  
  const supabase = createClient()
  const isHome = pathname === '/dashboard'

  // Load profile once
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

  // Animate ProfileCard and content on route change (after initial mount)
  useEffect(() => {
    // Skip if not initialized yet or same path
    if (!hasInitialized.current || prevPathRef.current === pathname) {
      return
    }

    const wasHome = prevPathRef.current === '/dashboard'
    const goingHome = pathname === '/dashboard'
    prevPathRef.current = pathname

    // ProfileCard animation - only animate if transitioning to/from home
    if (profileCardRef.current && (wasHome || goingHome)) {
      if (goingHome) {
        // Animate ProfileCard back to center - smooth and visible
        gsap.to(profileCardRef.current, {
          left: '50%',
          top: '50%',
          xPercent: -50,
          yPercent: -50,
          scale: 1,
          duration: 0.7,
          ease: 'power2.inOut',
        })
      } else if (wasHome) {
        // Animate ProfileCard to top-left corner (20% smaller)
        gsap.to(profileCardRef.current, {
          left: '16px',
          top: '72px',
          xPercent: 0,
          yPercent: 0,
          scale: 0.8,
          duration: 0.7,
          ease: 'power2.inOut',
        })
      }
    }

    // Content animation
    if (contentRef.current) {
      if (goingHome) {
        gsap.to(contentRef.current, {
          x: 80,
          opacity: 0,
          duration: 0.4,
          ease: 'power2.in',
        })
      } else {
        gsap.fromTo(contentRef.current, 
          { x: wasHome ? 80 : 40, opacity: 0 },
          { x: 0, opacity: 1, duration: 0.5, ease: 'power2.out', delay: wasHome ? 0.2 : 0 }
        )
      }
    }

  }, [pathname])

  // Track if initial mount has been done
  const hasInitialized = useRef(false)

  // Initial position on mount - runs ONCE when loading becomes false
  useEffect(() => {
    if (!loading && !hasInitialized.current && profileCardRef.current) {
      hasInitialized.current = true
      const currentIsHome = pathname === '/dashboard'
      prevPathRef.current = pathname
      
      if (currentIsHome) {
        gsap.set(profileCardRef.current, {
          left: '50%',
          top: '50%',
          xPercent: -50,
          yPercent: -50,
          scale: 1,
        })
      } else {
        gsap.set(profileCardRef.current, {
          left: '16px',
          top: '72px',
          xPercent: 0,
          yPercent: 0,
          scale: 0.8,
        })
      }
      
      if (contentRef.current && !currentIsHome) {
        gsap.set(contentRef.current, { x: 0, opacity: 1 })
      }
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
      <div className="mt-14 min-h-screen flex items-center justify-center">
        <div className="text-white/60">Loading...</div>
      </div>
    )
  }

  return (
    <div className="pt-14 h-screen relative overflow-hidden">
      {/* ProfileCard - fixed position, GSAP controls all positioning */}
      <div
        ref={profileCardRef}
        className="fixed z-30 origin-top-left will-change-transform pointer-events-auto"
      >
        <ProfileCard 
          profile={profile}
          onUpdate={updateProfile}
          compact={!isHome}
        />
      </div>

      {/* Page Content - slides in/out */}
      <div
        ref={contentRef}
        className={`will-change-transform ${isHome ? 'opacity-0 pointer-events-none' : ''}`}
        style={{
          marginLeft: isHome ? '0' : '280px', // Space for profile card at 0.8 scale
          paddingLeft: '24px',
          paddingRight: '24px',
          paddingBottom: '120px',
        }}
      >
        {/* Only render children if not home (home has its own layout) */}
        {!isHome && children}
      </div>

      {/* Home content (widgets around profile card) */}
      {isHome && (
        <div className="pointer-events-auto h-full overflow-hidden">
          {children}
        </div>
      )}

      <CommandBar />
    </div>
  )
}
