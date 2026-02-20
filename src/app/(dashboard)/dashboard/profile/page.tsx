'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Save, Plus, X, ChevronLeft } from 'lucide-react'
import Link from 'next/link'

interface Profile {
  full_name: string
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
  favorite_quote: string
  favorite_books: string[]
  favorite_movies: string[]
  favorite_music: string[]
  favorite_foods: string[]
}

const defaultProfile: Profile = {
  full_name: '',
  date_of_birth: '',
  gender: '',
  phone: '',
  address: '',
  city: '',
  state: '',
  country: '',
  zipcode: '',
  biography: '',
  personal_motto: '',
  personality_type: '',
  personality_traits: [],
  interests: [],
  skills: [],
  hobbies: [],
  life_goals: [],
  religions: [],
  occupation: '',
  company: '',
  favorite_quote: '',
  favorite_books: [],
  favorite_movies: [],
  favorite_music: [],
  favorite_foods: [],
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile>(defaultProfile)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
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
        ...defaultProfile,
        ...data,
        date_of_birth: data.date_of_birth || '',
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
      })
    }
    setLoading(false)
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('profiles')
      .update({
        ...profile,
        date_of_birth: profile.date_of_birth || null,
      })
      .eq('id', user.id)

    if (error) {
      setMessage('Error saving profile')
    } else {
      setMessage('Profile saved!')
      setTimeout(() => setMessage(''), 3000)
    }
    setSaving(false)
  }

  const updateField = (field: keyof Profile, value: string | string[]) => {
    setProfile(prev => ({ ...prev, [field]: value }))
  }

  const addToArray = (field: keyof Profile, value: string) => {
    if (!value.trim()) return
    const current = (profile[field] as string[]) || []
    if (!current.includes(value.trim())) {
      updateField(field, [...current, value.trim()])
    }
  }

  const removeFromArray = (field: keyof Profile, index: number) => {
    const current = (profile[field] as string[]) || []
    updateField(field, current.filter((_, i) => i !== index))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white/50">Loading profile...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-6 max-w-4xl space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="p-2 bg-gray-900/80 backdrop-blur-md rounded-xl text-white/70 hover:bg-white/20 hover:text-white transition-all border border-white/20">
            <ChevronLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">My Profile</h1>
            <p className="text-white/50 text-sm">Tell your story. This is who you are.</p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-xl font-medium transition-all disabled:opacity-50"
        >
          <Save size={18} />
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-xl backdrop-blur-md ${message.includes('Error') ? 'bg-red-500/20 border border-red-500/30 text-red-400' : 'bg-green-500/20 border border-green-500/30 text-green-400'}`}>
          {message}
        </div>
      )}

      {/* Basic Info */}
      <Section title="Basic Information" icon="person">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Full Name" value={profile.full_name} onChange={v => updateField('full_name', v)} />
          <Input label="Date of Birth" type="date" value={profile.date_of_birth} onChange={v => updateField('date_of_birth', v)} />
          <Select label="Gender" value={profile.gender} onChange={v => updateField('gender', v)} options={['', 'Male', 'Female', 'Non-binary', 'Prefer not to say']} />
          <Input label="Phone" type="tel" value={profile.phone} onChange={v => updateField('phone', v)} />
        </div>
      </Section>

      {/* Location */}
      <Section title="Location" icon="location">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Address" value={profile.address} onChange={v => updateField('address', v)} className="sm:col-span-2" />
          <Input label="City" value={profile.city} onChange={v => updateField('city', v)} />
          <Input label="State" value={profile.state} onChange={v => updateField('state', v)} />
          <Input label="Country" value={profile.country} onChange={v => updateField('country', v)} />
          <Input label="Zipcode" value={profile.zipcode} onChange={v => updateField('zipcode', v)} />
        </div>
      </Section>

      {/* About Me */}
      <Section title="About Me" icon="sparkles">
        <div className="space-y-4">
          <Textarea label="Biography" value={profile.biography} onChange={v => updateField('biography', v)} placeholder="Tell your life story..." rows={4} />
          <Textarea label="Personal Motto / Credo" value={profile.personal_motto} onChange={v => updateField('personal_motto', v)} placeholder="What do you live by?" rows={2} />
          <Input label="Personality Type" value={profile.personality_type} onChange={v => updateField('personality_type', v)} placeholder="e.g., INTJ, Enneagram 5" />
        </div>
      </Section>

      {/* Interests & Skills */}
      <Section title="Interests & Skills" icon="target">
        <div className="space-y-4">
          <TagInput label="Interests" tags={profile.interests} onAdd={v => addToArray('interests', v)} onRemove={i => removeFromArray('interests', i)} placeholder="Add an interest..." />
          <TagInput label="Skills" tags={profile.skills} onAdd={v => addToArray('skills', v)} onRemove={i => removeFromArray('skills', i)} placeholder="Add a skill..." />
          <TagInput label="Hobbies" tags={profile.hobbies} onAdd={v => addToArray('hobbies', v)} onRemove={i => removeFromArray('hobbies', i)} placeholder="Add a hobby..." />
        </div>
      </Section>

      {/* Life Goals */}
      <Section title="Life Goals" icon="rocket">
        <TagInput label="Goals & Dreams" tags={profile.life_goals} onAdd={v => addToArray('life_goals', v)} onRemove={i => removeFromArray('life_goals', i)} placeholder="Add a life goal..." />
      </Section>

      {/* Beliefs */}
      <Section title="Beliefs & Values" icon="heart">
        <TagInput label="Religion / Spirituality" tags={profile.religions} onAdd={v => addToArray('religions', v)} onRemove={i => removeFromArray('religions', i)} placeholder="Add belief system..." />
      </Section>

      {/* Career */}
      <Section title="Career" icon="briefcase">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Occupation" value={profile.occupation} onChange={v => updateField('occupation', v)} />
          <Input label="Company" value={profile.company} onChange={v => updateField('company', v)} />
        </div>
      </Section>

      {/* Favorites */}
      <Section title="Favorites" icon="star">
        <div className="space-y-4">
          <Textarea label="Favorite Quote" value={profile.favorite_quote} onChange={v => updateField('favorite_quote', v)} placeholder="A quote that inspires you..." rows={2} />
          <TagInput label="Favorite Books" tags={profile.favorite_books} onAdd={v => addToArray('favorite_books', v)} onRemove={i => removeFromArray('favorite_books', i)} placeholder="Add a book..." />
          <TagInput label="Favorite Movies" tags={profile.favorite_movies} onAdd={v => addToArray('favorite_movies', v)} onRemove={i => removeFromArray('favorite_movies', i)} placeholder="Add a movie..." />
          <TagInput label="Favorite Music" tags={profile.favorite_music} onAdd={v => addToArray('favorite_music', v)} onRemove={i => removeFromArray('favorite_music', i)} placeholder="Add artist or song..." />
          <TagInput label="Favorite Foods" tags={profile.favorite_foods} onAdd={v => addToArray('favorite_foods', v)} onRemove={i => removeFromArray('favorite_foods', i)} placeholder="Add a food..." />
        </div>
      </Section>
    </div>
  )
}

// Components with glassmorphism theme
function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  const getIcon = () => {
    switch (icon) {
      case 'person': return '👤'
      case 'location': return '📍'
      case 'sparkles': return '✨'
      case 'target': return '🎯'
      case 'rocket': return '🚀'
      case 'heart': return '🙏'
      case 'briefcase': return '💼'
      case 'star': return '❤️'
      default: return '📝'
    }
  }
  
  return (
    <div className="bg-gray-900/80 backdrop-blur-md rounded-xl p-6 border border-white/20">
      <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
        <span>{getIcon()}</span> {title}
      </h2>
      {children}
    </div>
  )
}

function Input({ label, value, onChange, type = 'text', placeholder = '', className = '' }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string; className?: string }) {
  return (
    <div className={className}>
      <label className="block text-sm text-white/50 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-2.5 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
      />
    </div>
  )
}

function Textarea({ label, value, onChange, placeholder = '', rows = 3 }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) {
  return (
    <div>
      <label className="block text-sm text-white/50 mb-1">{label}</label>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full px-4 py-2.5 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 resize-none transition-all"
      />
    </div>
  )
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div>
      <label className="block text-sm text-white/50 mb-1">{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full px-4 py-2.5 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
      >
        {options.map(opt => (
          <option key={opt} value={opt} className="bg-gray-900">{opt || 'Select...'}</option>
        ))}
      </select>
    </div>
  )
}

function TagInput({ label, tags, onAdd, onRemove, placeholder }: { label: string; tags: string[]; onAdd: (v: string) => void; onRemove: (i: number) => void; placeholder: string }) {
  const [input, setInput] = useState('')

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      onAdd(input)
      setInput('')
    }
  }

  return (
    <div>
      <label className="block text-sm text-white/50 mb-1">{label}</label>
      <div className="flex flex-wrap gap-2 p-3 bg-white/5 border border-white/20 rounded-xl min-h-[48px]">
        {tags.map((tag, i) => (
          <span key={i} className="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-amber-500/30 to-orange-600/30 text-amber-200 rounded-lg text-sm border border-amber-500/30">
            {tag}
            <button onClick={() => onRemove(i)} className="hover:text-red-400 transition-colors">
              <X size={14} />
            </button>
          </span>
        ))}
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={tags.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[120px] bg-transparent text-white placeholder-white/30 focus:outline-none"
        />
      </div>
      <p className="text-xs text-white/30 mt-1">Press Enter to add</p>
    </div>
  )
}
