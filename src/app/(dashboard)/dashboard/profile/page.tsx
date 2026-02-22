'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  User, Calendar, MapPin, Heart, Briefcase, BookOpen, 
  Music, Film, Utensils, Target, Sparkles, Camera, 
  ChevronLeft, ChevronRight, Check, Upload, X, Loader2,
  Brain, Star, GraduationCap
} from 'lucide-react'
import Link from 'next/link'
import '@/styles/home.css'

interface Profile {
  full_name: string
  avatar_url: string
  date_of_birth: string
  gender: string
  phone: string
  address: string
  city: string
  state: string
  country: string
  zipcode: string
  biography: string
  personal_motto: string
  personality_type: string
  personality_traits: string[]
  interests: string[]
  skills: string[]
  hobbies: string[]
  life_goals: string[]
  religions: string[]
  occupation: string
  company: string
  education_level: string
  school_name: string
  degree: string
  favorite_quote: string
  favorite_books: string[]
  favorite_movies: string[]
  favorite_music: string[]
  favorite_foods: string[]
}

const PERSONALITY_TYPES = [
  'INTJ - Architect', 'INTP - Logician', 'ENTJ - Commander', 'ENTP - Debater',
  'INFJ - Advocate', 'INFP - Mediator', 'ENFJ - Protagonist', 'ENFP - Campaigner',
  'ISTJ - Logistician', 'ISFJ - Defender', 'ESTJ - Executive', 'ESFJ - Consul',
  'ISTP - Virtuoso', 'ISFP - Adventurer', 'ESTP - Entrepreneur', 'ESFP - Entertainer',
  'Not sure / Don\'t know'
]

const GENDER_OPTIONS = ['Male', 'Female', 'Non-binary', 'Prefer not to say']

const STEPS = [
  { id: 'basics', title: 'The Basics', icon: User, description: 'Your name and photo' },
  { id: 'birth', title: 'Birthday', icon: Calendar, description: 'When were you born?' },
  { id: 'location', title: 'Location', icon: MapPin, description: 'Where do you live?' },
  { id: 'work', title: 'Work', icon: Briefcase, description: 'What do you do?' },
  { id: 'education', title: 'Education', icon: GraduationCap, description: 'Your background' },
  { id: 'personality', title: 'Personality', icon: Brain, description: 'Who are you?' },
  { id: 'interests', title: 'Interests', icon: Heart, description: 'What do you love?' },
  { id: 'favorites', title: 'Favorites', icon: Star, description: 'Your top picks' },
  { id: 'goals', title: 'Life Goals', icon: Target, description: 'Your dreams' },
]

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile>({
    full_name: '', avatar_url: '', date_of_birth: '', gender: '', phone: '',
    address: '', city: '', state: '', country: '', zipcode: '',
    biography: '', personal_motto: '', personality_type: '',
    personality_traits: [], interests: [], skills: [], hobbies: [], life_goals: [],
    religions: [], occupation: '', company: '', education_level: '', school_name: '', degree: '',
    favorite_quote: '', favorite_books: [], favorite_movies: [], favorite_music: [], favorite_foods: [],
  })
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [tagInput, setTagInput] = useState('')
  const [currentTagField, setCurrentTagField] = useState<keyof Profile | null>(null)
  const supabase = createClient()

  useEffect(() => { loadProfile() }, [])

  const loadProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    if (data) {
      setProfile(prev => ({
        ...prev,
        ...data,
        personality_traits: data.personality_traits || [],
        interests: data.interests || [],
        skills: data.skills || [],
        hobbies: data.hobbies || [],
        life_goals: data.life_goals || [],
        religions: data.religions || [],
        favorite_books: data.favorite_books || [],
        favorite_movies: data.favorite_movies || [],
        favorite_music: data.favorite_music || [],
        favorite_foods: data.favorite_foods || [],
      }))
    }
    setLoading(false)
  }

  const saveProfile = async () => {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('profiles').update(profile).eq('id', user.id)
    setSaving(false)
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    setUploading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}-${Date.now()}.${fileExt}`
    
    const { error } = await supabase.storage.from('avatars').upload(fileName, file, { upsert: true })
    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName)
      setProfile(p => ({ ...p, avatar_url: publicUrl }))
    }
    setUploading(false)
  }

  const addTag = (field: keyof Profile) => {
    if (!tagInput.trim()) return
    const current = profile[field] as string[]
    if (!current.includes(tagInput.trim())) {
      setProfile(p => ({ ...p, [field]: [...current, tagInput.trim()] }))
    }
    setTagInput('')
  }

  const removeTag = (field: keyof Profile, tag: string) => {
    const current = profile[field] as string[]
    setProfile(p => ({ ...p, [field]: current.filter(t => t !== tag) }))
  }

  const renderStep = () => {
    const stepId = STEPS[step].id

    switch (stepId) {
      case 'basics':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-[#406A56]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8 text-[#406A56]" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900">What's your name?</h2>
              <p className="text-gray-500 mt-2">This is how you'll appear in your legacy</p>
            </div>
            
            <div className="flex justify-center mb-6">
              {profile.avatar_url ? (
                <div className="relative">
                  <img src={profile.avatar_url} alt="Profile" className="w-28 h-28 rounded-full object-cover border-4 border-[#406A56]/20" />
                  <label className="absolute bottom-0 right-0 w-9 h-9 bg-[#406A56] text-white rounded-full flex items-center justify-center cursor-pointer hover:bg-[#355a48]">
                    <Camera size={16} />
                    <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" disabled={uploading} />
                  </label>
                </div>
              ) : (
                <label className="w-28 h-28 rounded-full border-4 border-dashed border-[#406A56]/30 flex flex-col items-center justify-center cursor-pointer hover:border-[#406A56]/50 transition-all">
                  {uploading ? <Loader2 className="w-8 h-8 text-[#406A56] animate-spin" /> : (
                    <>
                      <Upload className="w-8 h-8 text-[#406A56]/50" />
                      <span className="text-xs text-[#406A56]/50 mt-1">Add photo</span>
                    </>
                  )}
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" disabled={uploading} />
                </label>
              )}
            </div>

            <input
              type="text"
              value={profile.full_name}
              onChange={e => setProfile(p => ({ ...p, full_name: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl bg-white/50 border border-[#406A56]/20 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#406A56]/30 text-center text-lg"
              placeholder="Enter your full name"
            />
          </div>
        )

      case 'birth':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-[#406A56]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-[#406A56]" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900">When were you born?</h2>
              <p className="text-gray-500 mt-2">Your birthday will be remembered</p>
            </div>
            
            <input
              type="date"
              value={profile.date_of_birth}
              onChange={e => setProfile(p => ({ ...p, date_of_birth: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl bg-white/50 border border-[#406A56]/20 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#406A56]/30 text-center"
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 text-center">Gender (optional)</label>
              <div className="flex flex-wrap justify-center gap-2">
                {GENDER_OPTIONS.map(g => (
                  <button
                    key={g}
                    onClick={() => setProfile(p => ({ ...p, gender: g }))}
                    className={`px-4 py-2 rounded-full text-sm transition-all ${
                      profile.gender === g 
                        ? 'bg-[#406A56] text-white' 
                        : 'bg-white/50 text-gray-600 border border-gray-200 hover:border-[#406A56]/30'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )

      case 'location':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-[#406A56]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8 text-[#406A56]" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900">Where do you live?</h2>
              <p className="text-gray-500 mt-2">Your home base</p>
            </div>
            
            <input
              type="text"
              value={profile.city}
              onChange={e => setProfile(p => ({ ...p, city: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl bg-white/50 border border-[#406A56]/20 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#406A56]/30"
              placeholder="City"
            />
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                value={profile.state}
                onChange={e => setProfile(p => ({ ...p, state: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl bg-white/50 border border-[#406A56]/20 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#406A56]/30"
                placeholder="State/Province"
              />
              <input
                type="text"
                value={profile.country}
                onChange={e => setProfile(p => ({ ...p, country: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl bg-white/50 border border-[#406A56]/20 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#406A56]/30"
                placeholder="Country"
              />
            </div>
            <input
              type="text"
              value={profile.address}
              onChange={e => setProfile(p => ({ ...p, address: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl bg-white/50 border border-[#406A56]/20 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#406A56]/30"
              placeholder="Full address (optional)"
            />
          </div>
        )

      case 'work':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-[#406A56]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Briefcase className="w-8 h-8 text-[#406A56]" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900">What do you do?</h2>
              <p className="text-gray-500 mt-2">Your profession or calling</p>
            </div>
            
            <input
              type="text"
              value={profile.occupation}
              onChange={e => setProfile(p => ({ ...p, occupation: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl bg-white/50 border border-[#406A56]/20 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#406A56]/30"
              placeholder="Job title or role"
            />
            <input
              type="text"
              value={profile.company}
              onChange={e => setProfile(p => ({ ...p, company: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl bg-white/50 border border-[#406A56]/20 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#406A56]/30"
              placeholder="Company or organization (optional)"
            />
          </div>
        )

      case 'education':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-[#406A56]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <GraduationCap className="w-8 h-8 text-[#406A56]" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900">Your education</h2>
              <p className="text-gray-500 mt-2">Where did you study?</p>
            </div>
            
            <input
              type="text"
              value={profile.school_name || ''}
              onChange={e => setProfile(p => ({ ...p, school_name: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl bg-white/50 border border-[#406A56]/20 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#406A56]/30"
              placeholder="School or University"
            />
            <input
              type="text"
              value={profile.degree || ''}
              onChange={e => setProfile(p => ({ ...p, degree: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl bg-white/50 border border-[#406A56]/20 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#406A56]/30"
              placeholder="Degree or certification (optional)"
            />
          </div>
        )

      case 'personality':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-[#406A56]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Brain className="w-8 h-8 text-[#406A56]" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900">Your personality</h2>
              <p className="text-gray-500 mt-2">What's your type?</p>
            </div>
            
            <select
              value={profile.personality_type}
              onChange={e => setProfile(p => ({ ...p, personality_type: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl bg-white/50 border border-[#406A56]/20 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#406A56]/30"
            >
              <option value="">Select your personality type</option>
              {PERSONALITY_TYPES.map(pt => (
                <option key={pt} value={pt}>{pt}</option>
              ))}
            </select>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Personal Motto or Life Philosophy</label>
              <textarea
                value={profile.personal_motto}
                onChange={e => setProfile(p => ({ ...p, personal_motto: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl bg-white/50 border border-[#406A56]/20 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#406A56]/30"
                placeholder="What do you live by?"
                rows={2}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Personality Traits</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {profile.personality_traits.map(trait => (
                  <span key={trait} className="px-3 py-1 bg-[#406A56]/10 text-[#406A56] rounded-full text-sm flex items-center gap-1">
                    {trait}
                    <button onClick={() => removeTag('personality_traits', trait)} className="hover:text-red-500"><X size={14} /></button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={currentTagField === 'personality_traits' ? tagInput : ''}
                  onFocus={() => setCurrentTagField('personality_traits')}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag('personality_traits'))}
                  className="flex-1 px-4 py-2 rounded-xl bg-white/50 border border-[#406A56]/20 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#406A56]/30"
                  placeholder="Add a trait (e.g., Creative, Loyal)"
                />
              </div>
            </div>
          </div>
        )

      case 'interests':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-[#406A56]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-[#406A56]" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900">What do you love?</h2>
              <p className="text-gray-500 mt-2">Your hobbies and interests</p>
            </div>
            
            {(['hobbies', 'interests'] as const).map(field => (
              <div key={field}>
                <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">{field}</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {(profile[field] as string[]).map(item => (
                    <span key={item} className="px-3 py-1 bg-[#D9C61A]/20 text-[#8B7B0A] rounded-full text-sm flex items-center gap-1">
                      {item}
                      <button onClick={() => removeTag(field, item)} className="hover:text-red-500"><X size={14} /></button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={currentTagField === field ? tagInput : ''}
                    onFocus={() => setCurrentTagField(field)}
                    onChange={e => setTagInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag(field))}
                    className="flex-1 px-4 py-2 rounded-xl bg-white/50 border border-[#406A56]/20 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#406A56]/30"
                    placeholder={`Add ${field === 'hobbies' ? 'a hobby' : 'an interest'}`}
                  />
                </div>
              </div>
            ))}
          </div>
        )

      case 'favorites':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-[#406A56]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-[#406A56]" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900">Your favorites</h2>
              <p className="text-gray-500 mt-2">The things that bring you joy</p>
            </div>
            
            {([
              { field: 'favorite_books' as const, label: 'Books', icon: BookOpen, placeholder: 'Add a book' },
              { field: 'favorite_movies' as const, label: 'Movies & Shows', icon: Film, placeholder: 'Add a movie' },
              { field: 'favorite_music' as const, label: 'Music', icon: Music, placeholder: 'Add an artist or song' },
              { field: 'favorite_foods' as const, label: 'Foods', icon: Utensils, placeholder: 'Add a favorite food' },
            ]).map(({ field, label, icon: Icon, placeholder }) => (
              <div key={field}>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Icon size={14} className="text-[#406A56]" /> {label}
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {(profile[field] as string[]).map(item => (
                    <span key={item} className="px-3 py-1 bg-[#C35F33]/10 text-[#C35F33] rounded-full text-sm flex items-center gap-1">
                      {item}
                      <button onClick={() => removeTag(field, item)} className="hover:text-red-500"><X size={14} /></button>
                    </span>
                  ))}
                </div>
                <input
                  type="text"
                  value={currentTagField === field ? tagInput : ''}
                  onFocus={() => setCurrentTagField(field)}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag(field))}
                  className="w-full px-4 py-2 rounded-xl bg-white/50 border border-[#406A56]/20 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#406A56]/30"
                  placeholder={placeholder}
                />
              </div>
            ))}
          </div>
        )

      case 'goals':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-[#406A56]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-[#406A56]" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900">Your life goals</h2>
              <p className="text-gray-500 mt-2">Dreams and aspirations</p>
            </div>
            
            <div>
              <div className="flex flex-wrap gap-2 mb-2">
                {profile.life_goals.map(goal => (
                  <span key={goal} className="px-3 py-1 bg-[#4A3552]/10 text-[#4A3552] rounded-full text-sm flex items-center gap-1">
                    {goal}
                    <button onClick={() => removeTag('life_goals', goal)} className="hover:text-red-500"><X size={14} /></button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                value={currentTagField === 'life_goals' ? tagInput : ''}
                onFocus={() => setCurrentTagField('life_goals')}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag('life_goals'))}
                className="w-full px-4 py-2 rounded-xl bg-white/50 border border-[#406A56]/20 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#406A56]/30"
                placeholder="Add a life goal"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Favorite Quote</label>
              <textarea
                value={profile.favorite_quote}
                onChange={e => setProfile(p => ({ ...p, favorite_quote: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl bg-white/50 border border-[#406A56]/20 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#406A56]/30"
                placeholder="A quote that inspires you..."
                rows={2}
              />
            </div>
          </div>
        )

      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen home-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#406A56]" />
      </div>
    )
  }

  return (
    <div className="min-h-screen home-background">
      <div className="home-blob home-blob-1" />
      <div className="home-blob home-blob-2" />
      
      <div className="relative z-10 p-4 max-w-xl mx-auto">
        {/* Header */}
        <header className="flex items-center gap-4 mb-6">
          <Link href="/dashboard" className="p-2 bg-white/80 backdrop-blur-sm rounded-xl text-gray-600 hover:text-gray-900 border border-gray-200">
            <ChevronLeft size={20} />
          </Link>
          <h1 className="text-xl font-semibold text-gray-900">Edit Profile</h1>
        </header>

        {/* Step Navigation */}
        <div className="flex items-center gap-1 mb-6 overflow-x-auto pb-2">
          {STEPS.map((s, i) => (
            <button
              key={s.id}
              onClick={() => { saveProfile(); setStep(i) }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-all ${
                step === i 
                  ? 'bg-[#406A56] text-white' 
                  : 'bg-white/50 text-gray-500 hover:bg-white/80'
              }`}
            >
              <s.icon size={14} />
              {s.title}
            </button>
          ))}
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2 text-sm">
            <span className="font-medium text-[#406A56]">{STEPS[step].title}</span>
            <span className="text-gray-500">{step + 1} of {STEPS.length}</span>
          </div>
          <div className="h-1.5 bg-white/50 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#406A56] transition-all duration-300"
              style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Card */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-gray-100 shadow-sm">
          {renderStep()}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
            <button
              onClick={() => { saveProfile(); setStep(s => s - 1) }}
              disabled={step === 0}
              className="flex items-center gap-2 px-4 py-2 text-gray-500 hover:text-[#406A56] disabled:opacity-0 transition-colors"
            >
              <ChevronLeft size={16} />
              Back
            </button>

            {step < STEPS.length - 1 ? (
              <button
                onClick={() => { saveProfile(); setStep(s => s + 1) }}
                className="flex items-center gap-2 px-6 py-2.5 bg-[#406A56] text-white rounded-xl font-medium hover:bg-[#355a48] transition-all"
              >
                Continue
                <ChevronRight size={16} />
              </button>
            ) : (
              <Link
                href="/dashboard"
                onClick={() => saveProfile()}
                className="flex items-center gap-2 px-6 py-2.5 bg-[#406A56] text-white rounded-xl font-medium hover:bg-[#355a48] transition-all"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                Done
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
