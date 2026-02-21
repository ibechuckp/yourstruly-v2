'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import DraggableCanvas from '@/components/dashboard/DraggableCanvas'
import InterestsWidget from '@/components/dashboard/InterestsWidget'
import SkillsWidget from '@/components/dashboard/SkillsWidget'
import PersonalityWidget from '@/components/dashboard/PersonalityWidget'
import CredoWidget from '@/components/dashboard/CredoWidget'
import LifeGoalsWidget from '@/components/dashboard/LifeGoalsWidget'
import ContactsWidget from '@/components/dashboard/ContactsWidget'
import GenderWidget from '@/components/dashboard/GenderWidget'
import ReligionWidget from '@/components/dashboard/ReligionWidget'
import AddressWidget from '@/components/dashboard/AddressWidget'
import OnThisDayWidget from '@/components/dashboard/OnThisDayWidget'

interface Profile {
  id: string
  interests: string[]
  skills: string[]
  personality_traits: string[]
  life_goals: string[]
  religions: string[]
  gender: string
  personal_motto: string
  address: string
  city: string
  state: string
  country: string
}

export default function DashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('profiles')
      .select('id, interests, skills, personality_traits, life_goals, religions, gender, personal_motto, address, city, state, country')
      .eq('id', user.id)
      .single()

    if (data) {
      setProfile({
        ...data,
        id: data.id,
        interests: data.interests || [],
        skills: data.skills || [],
        personality_traits: data.personality_traits || [],
        life_goals: data.life_goals || [],
        religions: data.religions || [],
      })
    }
    setLoading(false)
  }

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
    return null
  }

  // Define all widgets with their default positions (balanced spacing)
  const widgets = [
    {
      id: 'interests',
      defaultPosition: { x: 32, y: 72 },
      component: (
        <InterestsWidget 
          interests={profile?.interests || []}
          onUpdate={(v) => updateProfile('interests', v)}
        />
      ),
    },
    {
      id: 'skills',
      defaultPosition: { x: 24, y: 230 },
      component: (
        <SkillsWidget 
          skills={profile?.skills || []}
          onUpdate={(v) => updateProfile('skills', v)}
        />
      ),
    },
    {
      id: 'personality',
      defaultPosition: { x: 24, y: 380 },
      component: (
        <PersonalityWidget 
          traits={profile?.personality_traits || []}
          onUpdate={(v) => updateProfile('personality_traits', v)}
        />
      ),
    },
    {
      id: 'credo',
      defaultPosition: { x: 24, y: 490 },
      component: (
        <CredoWidget 
          credo={profile?.personal_motto || ''}
          onUpdate={(v) => updateProfile('personal_motto', v)}
        />
      ),
    },
    {
      id: 'lifeGoals',
      defaultPosition: { x: 24, y: 590 },
      component: (
        <LifeGoalsWidget 
          goals={profile?.life_goals || []}
          onUpdate={(v) => updateProfile('life_goals', v)}
        />
      ),
    },
    {
      id: 'contacts',
      defaultPosition: { x: -320, y: 80 },
      component: <ContactsWidget />,
    },
    {
      id: 'onThisDay',
      defaultPosition: { x: -320, y: 260 },
      component: <OnThisDayWidget />,
    },
    {
      id: 'gender',
      defaultPosition: { x: -320, y: 420 },
      component: (
        <GenderWidget 
          gender={profile?.gender || ''}
          onUpdate={(v) => updateProfile('gender', v)}
        />
      ),
    },
    {
      id: 'religion',
      defaultPosition: { x: -320, y: 510 },
      component: (
        <ReligionWidget 
          religions={profile?.religions || []}
          onUpdate={(v) => updateProfile('religions', v)}
        />
      ),
    },
    {
      id: 'address',
      defaultPosition: { x: -320, y: 600 },
      component: (
        <AddressWidget 
          address={profile?.address || ''}
          city={profile?.city || ''}
          state={profile?.state || ''}
          country={profile?.country || ''}
          onUpdate={updateProfile}
        />
      ),
    },
  ]

  return (
    <>
      {/* Desktop: Draggable Canvas */}
      <div className="hidden lg:block">
        <DraggableCanvas widgets={widgets}>
          {/* ProfileCard is rendered by DashboardShell */}
        </DraggableCanvas>
      </div>

      {/* Mobile/Tablet Layout - Stack vertically */}
      <div className="lg:hidden px-4 py-6 space-y-4 mt-48">
        <InterestsWidget 
          interests={profile?.interests || []}
          onUpdate={(v) => updateProfile('interests', v)}
        />
        <SkillsWidget 
          skills={profile?.skills || []}
          onUpdate={(v) => updateProfile('skills', v)}
        />
        <PersonalityWidget 
          traits={profile?.personality_traits || []}
          onUpdate={(v) => updateProfile('personality_traits', v)}
        />
        <CredoWidget 
          credo={profile?.personal_motto || ''}
          onUpdate={(v) => updateProfile('personal_motto', v)}
        />
        <LifeGoalsWidget 
          goals={profile?.life_goals || []}
          onUpdate={(v) => updateProfile('life_goals', v)}
        />
        <OnThisDayWidget />
        <ContactsWidget />
        <GenderWidget 
          gender={profile?.gender || ''}
          onUpdate={(v) => updateProfile('gender', v)}
        />
        <ReligionWidget 
          religions={profile?.religions || []}
          onUpdate={(v) => updateProfile('religions', v)}
        />
        <AddressWidget 
          address={profile?.address || ''}
          city={profile?.city || ''}
          state={profile?.state || ''}
          country={profile?.country || ''}
          onUpdate={updateProfile}
        />
      </div>
    </>
  )
}
