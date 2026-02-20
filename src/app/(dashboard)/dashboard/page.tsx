'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import ProfileCard from '@/components/dashboard/ProfileCard'
import InterestsWidget from '@/components/dashboard/InterestsWidget'
import SkillsWidget from '@/components/dashboard/SkillsWidget'
import PersonalityWidget from '@/components/dashboard/PersonalityWidget'
import CredoWidget from '@/components/dashboard/CredoWidget'
import LifeGoalsWidget from '@/components/dashboard/LifeGoalsWidget'
import ContactsWidget from '@/components/dashboard/ContactsWidget'
import GenderWidget from '@/components/dashboard/GenderWidget'
import ReligionWidget from '@/components/dashboard/ReligionWidget'
import AddressWidget from '@/components/dashboard/AddressWidget'
import CommandBar from '@/components/dashboard/CommandBar'
import { Upload } from 'lucide-react'

const backgrounds = [
  '/backgrounds/mountains.jpg',
  '/backgrounds/desert.jpg',
  '/backgrounds/ocean.jpg',
  '/backgrounds/forest.jpg',
  '/backgrounds/space.jpg',
]

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

export default function DashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeWidget, setActiveWidget] = useState<string | null>(null)
  const [backgroundIndex, setBackgroundIndex] = useState(0)
  const supabase = createClient()

  useEffect(() => {
    loadProfile()
  }, [])

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

  const calculateCompletion = () => {
    if (!profile) return 0
    const fields = [
      profile.full_name,
      profile.date_of_birth,
      profile.biography,
      profile.personal_motto,
      profile.occupation,
      profile.interests?.length > 0,
      profile.skills?.length > 0,
      profile.personality_traits?.length > 0,
      profile.life_goals?.length > 0,
      profile.gender,
      profile.religions?.length > 0,
      profile.city || profile.country,
    ]
    return Math.round((fields.filter(Boolean).length / fields.length) * 100)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  const completion = calculateCompletion()

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition-all duration-1000"
        style={{ 
          backgroundImage: `url(${backgrounds[backgroundIndex]})`,
          filter: 'brightness(0.7)'
        }}
      />
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/50" />

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Top Bar */}
        <header className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <span className="text-white/70 text-sm">Completed by</span>
            <div className="w-48 h-2 bg-white/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full transition-all"
                style={{ width: `${completion}%` }}
              />
            </div>
            <span className="text-white/70 text-sm">{completion}%</span>
          </div>

          {/* Logo */}
          <div className="absolute left-1/2 -translate-x-1/2 text-center">
            <h1 className="text-white text-3xl font-bold tracking-wider">YOURS</h1>
            <p className="text-white text-2xl font-script -mt-2 italic">Truly</p>
          </div>

          <button className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-lg text-white/80 hover:bg-white/20 transition-colors border border-white/20">
            <Upload size={16} />
            Upload Cover
          </button>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex items-center justify-center p-4 gap-6">
          {/* Left Sidebar */}
          <div className={`flex flex-col gap-4 w-64 transition-all duration-500 ${activeWidget && activeWidget !== 'interests' && activeWidget !== 'skills' && activeWidget !== 'personality' && activeWidget !== 'credo' && activeWidget !== 'lifegoals' ? '-translate-x-full opacity-0' : ''}`}>
            <InterestsWidget 
              interests={profile?.interests || []}
              onUpdate={(v) => updateProfile('interests', v)}
              isActive={activeWidget === 'interests'}
              onToggle={() => setActiveWidget(activeWidget === 'interests' ? null : 'interests')}
            />
            <SkillsWidget 
              skills={profile?.skills || []}
              onUpdate={(v) => updateProfile('skills', v)}
              isActive={activeWidget === 'skills'}
              onToggle={() => setActiveWidget(activeWidget === 'skills' ? null : 'skills')}
            />
            <PersonalityWidget 
              traits={profile?.personality_traits || []}
              onUpdate={(v) => updateProfile('personality_traits', v)}
              isActive={activeWidget === 'personality'}
              onToggle={() => setActiveWidget(activeWidget === 'personality' ? null : 'personality')}
            />
            <CredoWidget 
              credo={profile?.personal_motto || ''}
              onUpdate={(v) => updateProfile('personal_motto', v)}
              isActive={activeWidget === 'credo'}
              onToggle={() => setActiveWidget(activeWidget === 'credo' ? null : 'credo')}
            />
            <LifeGoalsWidget 
              goals={profile?.life_goals || []}
              onUpdate={(v) => updateProfile('life_goals', v)}
              isActive={activeWidget === 'lifegoals'}
              onToggle={() => setActiveWidget(activeWidget === 'lifegoals' ? null : 'lifegoals')}
            />
          </div>

          {/* Center Profile Card */}
          <ProfileCard 
            profile={profile}
            onUpdate={updateProfile}
          />

          {/* Right Sidebar */}
          <div className={`flex flex-col gap-4 w-64 transition-all duration-500 ${activeWidget && activeWidget !== 'contacts' && activeWidget !== 'gender' && activeWidget !== 'religion' && activeWidget !== 'address' ? 'translate-x-full opacity-0' : ''}`}>
            <ContactsWidget />
            <div className="flex gap-4">
              <GenderWidget 
                gender={profile?.gender || ''}
                onUpdate={(v) => updateProfile('gender', v)}
              />
              <ReligionWidget 
                religions={profile?.religions || []}
                onUpdate={(v) => updateProfile('religions', v)}
              />
            </div>
            <AddressWidget 
              address={profile?.address || ''}
              city={profile?.city || ''}
              state={profile?.state || ''}
              country={profile?.country || ''}
              onUpdate={updateProfile}
            />
          </div>
        </main>

        {/* Command Bar */}
        <CommandBar />
      </div>
    </div>
  )
}
