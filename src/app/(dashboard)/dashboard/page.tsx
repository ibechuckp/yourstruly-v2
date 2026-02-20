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

// Background themes based on personality/interests
const BACKGROUNDS = {
  mountains: { url: '/backgrounds/mountains.jpg', keywords: ['hiking', 'nature', 'adventure', 'climbing', 'outdoor', 'travel'] },
  ocean: { url: '/backgrounds/ocean.jpg', keywords: ['beach', 'swimming', 'surfing', 'water', 'calm', 'relaxed', 'peaceful'] },
  forest: { url: '/backgrounds/forest.jpg', keywords: ['nature', 'trees', 'green', 'meditation', 'spiritual', 'peaceful', 'gardening'] },
  desert: { url: '/backgrounds/desert.jpg', keywords: ['warm', 'adventure', 'photography', 'minimalist', 'travel', 'exploring'] },
  space: { url: '/backgrounds/space.jpg', keywords: ['technology', 'science', 'coding', 'futuristic', 'gaming', 'curious', 'analytical'] },
  city: { url: '/backgrounds/city.jpg', keywords: ['urban', 'business', 'networking', 'social', 'nightlife', 'ambitious', 'career'] },
  sunset: { url: '/backgrounds/sunset.jpg', keywords: ['romantic', 'creative', 'art', 'music', 'photography', 'optimistic', 'cheerful'] },
}

// Select background based on user profile
function selectBackground(profile: Profile | null): string {
  if (!profile) return BACKGROUNDS.mountains.url
  
  const userKeywords = [
    ...(profile.interests || []),
    ...(profile.personality_traits || []),
    ...(profile.skills || []),
  ].map(k => k.toLowerCase())

  let bestMatch = 'mountains'
  let bestScore = 0

  for (const [theme, data] of Object.entries(BACKGROUNDS)) {
    const score = data.keywords.filter(kw => 
      userKeywords.some(uk => uk.includes(kw) || kw.includes(uk))
    ).length
    if (score > bestScore) {
      bestScore = score
      bestMatch = theme
    }
  }

  return BACKGROUNDS[bestMatch as keyof typeof BACKGROUNDS].url
}

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
  const supabase = createClient()
  
  // AI-selected background based on profile
  const backgroundUrl = selectBackground(profile)

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
      {/* Background Image - AI selected based on profile */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition-all duration-1000"
        style={{ 
          backgroundImage: `url(${backgroundUrl})`,
          filter: 'brightness(0.7)'
        }}
      />
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/50" />

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Top Bar */}
        <header className="flex items-center justify-between p-4">
          {/* Progress - hidden on mobile */}
          <div className="hidden md:flex items-center gap-4">
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
          <div className="md:absolute md:left-1/2 md:-translate-x-1/2 text-center">
            <h1 className="text-white text-2xl md:text-3xl font-bold tracking-wider">YOURS</h1>
            <p className="text-white text-xl md:text-2xl font-script -mt-2 italic">Truly</p>
          </div>

          {/* Mobile progress indicator */}
          <div className="md:hidden flex items-center gap-2">
            <div className="w-12 h-2 bg-white/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full"
                style={{ width: `${completion}%` }}
              />
            </div>
            <span className="text-white/70 text-xs">{completion}%</span>
          </div>

          <button className="hidden md:flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-lg text-white/80 transition-colors border border-white/20">
            <Upload size={16} />
            Upload Cover
          </button>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-4 overflow-y-auto">
          {/* Mobile Layout */}
          <div className="lg:hidden flex flex-col items-center gap-4 max-w-sm mx-auto pb-20">
            <ProfileCard 
              profile={profile}
              onUpdate={updateProfile}
            />
            <div className="w-full space-y-3">
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
          </div>

          {/* Desktop Layout */}
          <div className="hidden lg:flex items-start justify-center gap-12 isolate">
            <div className="flex flex-col gap-4 w-72 isolate">
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
            </div>

            <div className="isolate">
              <ProfileCard 
                profile={profile}
                onUpdate={updateProfile}
              />
            </div>

            <div className="flex flex-col gap-4 w-72 isolate">
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
          </div>
        </main>

        {/* Command Bar */}
        <CommandBar />
      </div>
    </div>
  )
}
