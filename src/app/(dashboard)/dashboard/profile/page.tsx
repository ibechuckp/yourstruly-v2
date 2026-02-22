'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Save, Plus, X, ChevronLeft, Edit2, Camera, User, Phone, MapPin, Briefcase, GraduationCap, Users, Heart, Star, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import '@/styles/page-styles.css'

interface Profile {
  id: string
  full_name: string
  email: string
  date_of_birth: string
  gender: string
  phone: string
  address: string
  city: string
  state: string
  country: string
  zipcode: string
  avatar_url: string
  cover_photo_url: string
  biography: string
  personal_motto: string
  personality_type: string
  personality_traits: string[]
  interests: string[]
  skills: string[]
  hobbies: string[]
  life_goals: string[]
  religion: string
  languages: string[]
  nationality: string
  occupation: string
  company: string
  industry: string
  years_experience: number
  education_level: string
  school_name: string
  degree: string
  graduation_year: string
  favorite_quote: string
  favorite_books: string[]
  favorite_movies: string[]
  favorite_music: string[]
  favorite_foods: string[]
  marital_status: string
  number_of_children: number
  blood_type: string
}

const defaultProfile: Profile = {
  id: '',
  full_name: '',
  email: '',
  date_of_birth: '',
  gender: '',
  phone: '',
  address: '',
  city: '',
  state: '',
  country: '',
  zipcode: '',
  avatar_url: '',
  cover_photo_url: '',
  biography: '',
  personal_motto: '',
  personality_type: '',
  personality_traits: [],
  interests: [],
  skills: [],
  hobbies: [],
  life_goals: [],
  religion: '',
  languages: [],
  nationality: '',
  occupation: '',
  company: '',
  industry: '',
  years_experience: 0,
  education_level: '',
  school_name: '',
  degree: '',
  graduation_year: '',
  favorite_quote: '',
  favorite_books: [],
  favorite_movies: [],
  favorite_music: [],
  favorite_foods: [],
  marital_status: '',
  number_of_children: 0,
  blood_type: '',
}

type TabId = 'personal' | 'contact' | 'education' | 'work' | 'family' | 'favorites'

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'personal', label: 'Personal', icon: <User size={16} /> },
  { id: 'contact', label: 'Contact', icon: <Phone size={16} /> },
  { id: 'education', label: 'Education', icon: <GraduationCap size={16} /> },
  { id: 'work', label: 'Work', icon: <Briefcase size={16} /> },
  { id: 'family', label: 'Family', icon: <Users size={16} /> },
  { id: 'favorites', label: 'Favorites', icon: <Star size={16} /> },
]

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile>(defaultProfile)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [activeTab, setActiveTab] = useState<TabId>('personal')
  const [editingSection, setEditingSection] = useState<string | null>(null)
  const supabase = createClient()

  // Calculate profile completion percentage
  const completionPercentage = useMemo(() => {
    const fields = [
      profile.full_name, profile.date_of_birth, profile.gender, profile.phone,
      profile.city, profile.country, profile.biography, profile.occupation,
      profile.interests.length > 0, profile.skills.length > 0, profile.religion,
      profile.education_level, profile.marital_status
    ]
    const filled = fields.filter(Boolean).length
    return Math.round((filled / fields.length) * 100)
  }, [profile])

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
        email: user.email || '',
        date_of_birth: data.date_of_birth || '',
        personality_traits: data.personality_traits || [],
        interests: data.interests || [],
        skills: data.skills || [],
        hobbies: data.hobbies || [],
        life_goals: data.life_goals || [],
        languages: data.languages || [],
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
        years_experience: profile.years_experience || null,
        number_of_children: profile.number_of_children || null,
      })
      .eq('id', user.id)

    if (error) {
      setMessage('Error saving profile')
    } else {
      setMessage('Profile saved!')
      setEditingSection(null)
      setTimeout(() => setMessage(''), 3000)
    }
    setSaving(false)
  }

  const updateField = (field: keyof Profile, value: any) => {
    setProfile(prev => ({ ...prev, [field]: value }))
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const fileExt = file.name.split('.').pop()
    const filePath = `avatars/${user.id}-${Date.now()}.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file)

    if (!uploadError) {
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath)
      updateField('avatar_url', publicUrl)
      handleSave()
    }
  }

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const fileExt = file.name.split('.').pop()
    const filePath = `covers/${user.id}-${Date.now()}.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file)

    if (!uploadError) {
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath)
      updateField('cover_photo_url', publicUrl)
      handleSave()
    }
  }

  const getAge = () => {
    if (!profile.date_of_birth) return null
    const birth = new Date(profile.date_of_birth)
    const today = new Date()
    let age = today.getFullYear() - birth.getFullYear()
    if (today.getMonth() < birth.getMonth() || 
        (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())) {
      age--
    }
    return age
  }

  if (loading) {
    return (
      <div className="page-container">
        <div className="page-background">
          <div className="page-blob page-blob-1" />
          <div className="page-blob page-blob-2" />
        </div>
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="text-gray-500">Loading profile...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="page-container pb-24">
      <div className="page-background">
        <div className="page-blob page-blob-1" />
        <div className="page-blob page-blob-2" />
        <div className="page-blob page-blob-3" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto">
        {/* Back Button */}
        <div className="p-4">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900">
            <ChevronLeft size={20} />
            <span>Back to Dashboard</span>
          </Link>
        </div>

        {/* Hero Section */}
        <div className="relative mb-6">
          {/* Cover Photo */}
          <div className="h-48 bg-gradient-to-r from-[#406A56] to-[#8DACAB] rounded-t-3xl overflow-hidden relative">
            {profile.cover_photo_url && (
              <img src={profile.cover_photo_url} alt="" className="w-full h-full object-cover" />
            )}
            <label className="absolute bottom-3 right-3 p-2 bg-white/80 hover:bg-white rounded-lg cursor-pointer transition-colors">
              <input type="file" accept="image/*" onChange={handleCoverUpload} className="hidden" />
              <Camera size={18} className="text-gray-600" />
            </label>
          </div>

          {/* Avatar & Name */}
          <div className="bg-white/90 backdrop-blur-sm rounded-b-3xl px-6 pb-6 pt-16 relative">
            <div className="absolute -top-12 left-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-full border-4 border-white shadow-lg overflow-hidden bg-gradient-to-br from-[#406A56] to-[#8DACAB]">
                  {profile.avatar_url ? (
                    <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white text-3xl font-semibold">
                      {profile.full_name?.charAt(0) || '?'}
                    </div>
                  )}
                </div>
                <label className="absolute bottom-0 right-0 p-1.5 bg-[#406A56] hover:bg-[#4a7a64] text-white rounded-full cursor-pointer transition-colors">
                  <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                  <Camera size={14} />
                </label>
              </div>
            </div>

            <div className="flex items-start justify-between">
              <div className="ml-28">
                <h1 className="text-2xl font-bold text-gray-900">{profile.full_name || 'Your Name'}</h1>
                <p className="text-[#406A56]">{profile.occupation || 'Add your occupation'}</p>
                {profile.city && <p className="text-gray-500 text-sm">{profile.city}{profile.country ? `, ${profile.country}` : ''}</p>}
              </div>

              {/* Profile Completion */}
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-2xl font-bold text-[#406A56]">{completionPercentage}%</div>
                  <div className="text-xs text-gray-500">Complete</div>
                </div>
                <div className="w-16 h-16 relative">
                  <svg className="w-full h-full -rotate-90">
                    <circle cx="32" cy="32" r="28" fill="none" stroke="#e5e7eb" strokeWidth="4" />
                    <circle 
                      cx="32" cy="32" r="28" fill="none" stroke="#406A56" strokeWidth="4"
                      strokeDasharray={`${completionPercentage * 1.76} 176`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <CheckCircle size={20} className="absolute inset-0 m-auto text-[#406A56]" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className={`mx-6 mb-4 p-3 rounded-xl text-sm ${message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {message}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="px-6 mb-6">
          <div className="flex gap-1 bg-white/80 backdrop-blur-sm rounded-xl p-1 overflow-x-auto">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all
                  ${activeTab === tab.id 
                    ? 'bg-[#406A56] text-white' 
                    : 'text-gray-600 hover:bg-gray-100'}`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="px-6">
          {activeTab === 'personal' && (
            <div className="grid md:grid-cols-2 gap-6">
              {/* Personal Information */}
              <ProfileCard 
                title="Personal Information" 
                editing={editingSection === 'personal'}
                onEdit={() => setEditingSection(editingSection === 'personal' ? null : 'personal')}
                onSave={handleSave}
              >
                <InfoRow label="Full Name" value={profile.full_name} editing={editingSection === 'personal'} onChange={v => updateField('full_name', v)} />
                <InfoRow label="Date of Birth" value={profile.date_of_birth} type="date" editing={editingSection === 'personal'} onChange={v => updateField('date_of_birth', v)} />
                <InfoRow label="Age" value={getAge() ? `${getAge()} years` : '-'} readOnly />
                <InfoRow label="Gender" value={profile.gender} editing={editingSection === 'personal'} onChange={v => updateField('gender', v)} 
                  options={['', 'Male', 'Female', 'Non-binary', 'Prefer not to say']} />
                <InfoRow label="Nationality" value={profile.nationality} editing={editingSection === 'personal'} onChange={v => updateField('nationality', v)} />
                <InfoRow label="Religion" value={profile.religion} editing={editingSection === 'personal'} onChange={v => updateField('religion', v)} />
                <InfoRow label="Blood Type" value={profile.blood_type} editing={editingSection === 'personal'} onChange={v => updateField('blood_type', v)}
                  options={['', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']} />
              </ProfileCard>

              {/* Bio & Personality */}
              <ProfileCard 
                title="About Me" 
                editing={editingSection === 'bio'}
                onEdit={() => setEditingSection(editingSection === 'bio' ? null : 'bio')}
                onSave={handleSave}
              >
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-500 uppercase">Biography</label>
                    {editingSection === 'bio' ? (
                      <textarea 
                        value={profile.biography} 
                        onChange={e => updateField('biography', e.target.value)}
                        className="w-full p-2 border border-gray-200 rounded-lg text-gray-900 text-sm mt-1"
                        rows={3}
                        placeholder="Tell your story..."
                      />
                    ) : (
                      <p className="text-gray-900 text-sm">{profile.biography || '-'}</p>
                    )}
                  </div>
                  <InfoRow label="Personal Motto" value={profile.personal_motto} editing={editingSection === 'bio'} onChange={v => updateField('personal_motto', v)} />
                  <InfoRow label="Personality Type" value={profile.personality_type} editing={editingSection === 'bio'} onChange={v => updateField('personality_type', v)} placeholder="e.g., INTJ, Enneagram 5" />
                </div>
              </ProfileCard>
            </div>
          )}

          {activeTab === 'contact' && (
            <div className="grid md:grid-cols-2 gap-6">
              <ProfileCard 
                title="Contact Information" 
                editing={editingSection === 'contact'}
                onEdit={() => setEditingSection(editingSection === 'contact' ? null : 'contact')}
                onSave={handleSave}
              >
                <InfoRow label="Email" value={profile.email} readOnly />
                <InfoRow label="Phone" value={profile.phone} type="tel" editing={editingSection === 'contact'} onChange={v => updateField('phone', v)} />
              </ProfileCard>

              <ProfileCard 
                title="Address" 
                editing={editingSection === 'address'}
                onEdit={() => setEditingSection(editingSection === 'address' ? null : 'address')}
                onSave={handleSave}
              >
                <InfoRow label="Street Address" value={profile.address} editing={editingSection === 'address'} onChange={v => updateField('address', v)} />
                <InfoRow label="City" value={profile.city} editing={editingSection === 'address'} onChange={v => updateField('city', v)} />
                <InfoRow label="State" value={profile.state} editing={editingSection === 'address'} onChange={v => updateField('state', v)} />
                <InfoRow label="Country" value={profile.country} editing={editingSection === 'address'} onChange={v => updateField('country', v)} />
                <InfoRow label="Zip Code" value={profile.zipcode} editing={editingSection === 'address'} onChange={v => updateField('zipcode', v)} />
              </ProfileCard>
            </div>
          )}

          {activeTab === 'education' && (
            <div className="grid md:grid-cols-2 gap-6">
              <ProfileCard 
                title="Education" 
                editing={editingSection === 'education'}
                onEdit={() => setEditingSection(editingSection === 'education' ? null : 'education')}
                onSave={handleSave}
              >
                <InfoRow label="Education Level" value={profile.education_level} editing={editingSection === 'education'} onChange={v => updateField('education_level', v)}
                  options={['', 'High School', 'Some College', 'Associate Degree', 'Bachelor\'s Degree', 'Master\'s Degree', 'Doctorate', 'Trade School', 'Other']} />
                <InfoRow label="School/University" value={profile.school_name} editing={editingSection === 'education'} onChange={v => updateField('school_name', v)} />
                <InfoRow label="Degree" value={profile.degree} editing={editingSection === 'education'} onChange={v => updateField('degree', v)} />
                <InfoRow label="Graduation Year" value={profile.graduation_year} editing={editingSection === 'education'} onChange={v => updateField('graduation_year', v)} />
              </ProfileCard>

              <ProfileCard 
                title="Languages" 
                editing={editingSection === 'languages'}
                onEdit={() => setEditingSection(editingSection === 'languages' ? null : 'languages')}
                onSave={handleSave}
              >
                <TagSection 
                  tags={profile.languages} 
                  editing={editingSection === 'languages'}
                  onAdd={v => updateField('languages', [...profile.languages, v])}
                  onRemove={i => updateField('languages', profile.languages.filter((_, idx) => idx !== i))}
                  placeholder="Add a language..."
                />
              </ProfileCard>
            </div>
          )}

          {activeTab === 'work' && (
            <div className="grid md:grid-cols-2 gap-6">
              <ProfileCard 
                title="Career" 
                editing={editingSection === 'career'}
                onEdit={() => setEditingSection(editingSection === 'career' ? null : 'career')}
                onSave={handleSave}
              >
                <InfoRow label="Occupation" value={profile.occupation} editing={editingSection === 'career'} onChange={v => updateField('occupation', v)} />
                <InfoRow label="Company" value={profile.company} editing={editingSection === 'career'} onChange={v => updateField('company', v)} />
                <InfoRow label="Industry" value={profile.industry} editing={editingSection === 'career'} onChange={v => updateField('industry', v)} />
                <InfoRow label="Years of Experience" value={profile.years_experience?.toString() || ''} type="number" editing={editingSection === 'career'} onChange={v => updateField('years_experience', parseInt(v) || 0)} />
              </ProfileCard>

              <ProfileCard 
                title="Skills" 
                editing={editingSection === 'skills'}
                onEdit={() => setEditingSection(editingSection === 'skills' ? null : 'skills')}
                onSave={handleSave}
              >
                <TagSection 
                  tags={profile.skills} 
                  editing={editingSection === 'skills'}
                  onAdd={v => updateField('skills', [...profile.skills, v])}
                  onRemove={i => updateField('skills', profile.skills.filter((_, idx) => idx !== i))}
                  placeholder="Add a skill..."
                />
              </ProfileCard>
            </div>
          )}

          {activeTab === 'family' && (
            <div className="grid md:grid-cols-2 gap-6">
              <ProfileCard 
                title="Family Status" 
                editing={editingSection === 'family'}
                onEdit={() => setEditingSection(editingSection === 'family' ? null : 'family')}
                onSave={handleSave}
              >
                <InfoRow label="Marital Status" value={profile.marital_status} editing={editingSection === 'family'} onChange={v => updateField('marital_status', v)}
                  options={['', 'Single', 'Married', 'Divorced', 'Widowed', 'Separated', 'Domestic Partnership']} />
                <InfoRow label="Number of Children" value={profile.number_of_children?.toString() || '0'} type="number" editing={editingSection === 'family'} onChange={v => updateField('number_of_children', parseInt(v) || 0)} />
              </ProfileCard>

              <ProfileCard 
                title="Interests & Hobbies" 
                editing={editingSection === 'interests'}
                onEdit={() => setEditingSection(editingSection === 'interests' ? null : 'interests')}
                onSave={handleSave}
              >
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-gray-500 uppercase mb-2 block">Interests</label>
                    <TagSection 
                      tags={profile.interests} 
                      editing={editingSection === 'interests'}
                      onAdd={v => updateField('interests', [...profile.interests, v])}
                      onRemove={i => updateField('interests', profile.interests.filter((_, idx) => idx !== i))}
                      placeholder="Add interest..."
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 uppercase mb-2 block">Hobbies</label>
                    <TagSection 
                      tags={profile.hobbies} 
                      editing={editingSection === 'interests'}
                      onAdd={v => updateField('hobbies', [...profile.hobbies, v])}
                      onRemove={i => updateField('hobbies', profile.hobbies.filter((_, idx) => idx !== i))}
                      placeholder="Add hobby..."
                    />
                  </div>
                </div>
              </ProfileCard>
            </div>
          )}

          {activeTab === 'favorites' && (
            <div className="grid md:grid-cols-2 gap-6">
              <ProfileCard 
                title="Favorite Quote" 
                editing={editingSection === 'quote'}
                onEdit={() => setEditingSection(editingSection === 'quote' ? null : 'quote')}
                onSave={handleSave}
              >
                {editingSection === 'quote' ? (
                  <textarea 
                    value={profile.favorite_quote} 
                    onChange={e => updateField('favorite_quote', e.target.value)}
                    className="w-full p-2 border border-gray-200 rounded-lg text-gray-900 text-sm"
                    rows={3}
                    placeholder="A quote that inspires you..."
                  />
                ) : profile.favorite_quote ? (
                  <blockquote className="italic text-gray-700 border-l-2 border-[#406A56] pl-3">{profile.favorite_quote}</blockquote>
                ) : (
                  <p className="text-gray-400 text-sm">No quote added yet</p>
                )}
              </ProfileCard>

              <ProfileCard 
                title="Favorite Books" 
                editing={editingSection === 'books'}
                onEdit={() => setEditingSection(editingSection === 'books' ? null : 'books')}
                onSave={handleSave}
              >
                <TagSection 
                  tags={profile.favorite_books} 
                  editing={editingSection === 'books'}
                  onAdd={v => updateField('favorite_books', [...profile.favorite_books, v])}
                  onRemove={i => updateField('favorite_books', profile.favorite_books.filter((_, idx) => idx !== i))}
                  placeholder="Add a book..."
                />
              </ProfileCard>

              <ProfileCard 
                title="Favorite Movies" 
                editing={editingSection === 'movies'}
                onEdit={() => setEditingSection(editingSection === 'movies' ? null : 'movies')}
                onSave={handleSave}
              >
                <TagSection 
                  tags={profile.favorite_movies} 
                  editing={editingSection === 'movies'}
                  onAdd={v => updateField('favorite_movies', [...profile.favorite_movies, v])}
                  onRemove={i => updateField('favorite_movies', profile.favorite_movies.filter((_, idx) => idx !== i))}
                  placeholder="Add a movie..."
                />
              </ProfileCard>

              <ProfileCard 
                title="Favorite Music" 
                editing={editingSection === 'music'}
                onEdit={() => setEditingSection(editingSection === 'music' ? null : 'music')}
                onSave={handleSave}
              >
                <TagSection 
                  tags={profile.favorite_music} 
                  editing={editingSection === 'music'}
                  onAdd={v => updateField('favorite_music', [...profile.favorite_music, v])}
                  onRemove={i => updateField('favorite_music', profile.favorite_music.filter((_, idx) => idx !== i))}
                  placeholder="Add artist or song..."
                />
              </ProfileCard>

              <ProfileCard 
                title="Favorite Foods" 
                editing={editingSection === 'foods'}
                onEdit={() => setEditingSection(editingSection === 'foods' ? null : 'foods')}
                onSave={handleSave}
              >
                <TagSection 
                  tags={profile.favorite_foods} 
                  editing={editingSection === 'foods'}
                  onAdd={v => updateField('favorite_foods', [...profile.favorite_foods, v])}
                  onRemove={i => updateField('favorite_foods', profile.favorite_foods.filter((_, idx) => idx !== i))}
                  placeholder="Add a food..."
                />
              </ProfileCard>

              <ProfileCard 
                title="Life Goals" 
                editing={editingSection === 'goals'}
                onEdit={() => setEditingSection(editingSection === 'goals' ? null : 'goals')}
                onSave={handleSave}
              >
                <TagSection 
                  tags={profile.life_goals} 
                  editing={editingSection === 'goals'}
                  onAdd={v => updateField('life_goals', [...profile.life_goals, v])}
                  onRemove={i => updateField('life_goals', profile.life_goals.filter((_, idx) => idx !== i))}
                  placeholder="Add a goal..."
                />
              </ProfileCard>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Profile Card Component
function ProfileCard({ 
  title, 
  children, 
  editing, 
  onEdit, 
  onSave 
}: { 
  title: string
  children: React.ReactNode
  editing: boolean
  onEdit: () => void
  onSave: () => void
}) {
  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-5 border border-gray-100 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">{title}</h3>
        <div className="flex items-center gap-2">
          {editing && (
            <button 
              onClick={onSave}
              className="px-3 py-1.5 bg-[#406A56] text-white text-xs font-medium rounded-lg hover:bg-[#4a7a64] transition-colors"
            >
              Save
            </button>
          )}
          <button 
            onClick={onEdit}
            className="p-1.5 text-[#C35F33] hover:bg-[#C35F33]/10 rounded-lg transition-colors"
          >
            <Edit2 size={16} />
          </button>
        </div>
      </div>
      <div className="space-y-3">
        {children}
      </div>
    </div>
  )
}

// Info Row Component
function InfoRow({ 
  label, 
  value, 
  editing = false, 
  onChange, 
  type = 'text',
  options,
  readOnly = false,
  placeholder = ''
}: { 
  label: string
  value: string
  editing?: boolean
  onChange?: (v: string) => void
  type?: string
  options?: string[]
  readOnly?: boolean
  placeholder?: string
}) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
      <span className="text-xs text-gray-500 uppercase">{label}</span>
      {editing && !readOnly ? (
        options ? (
          <select 
            value={value} 
            onChange={e => onChange?.(e.target.value)}
            className="text-sm text-gray-900 font-medium bg-gray-50 border border-gray-200 rounded px-2 py-1"
          >
            {options.map(opt => <option key={opt} value={opt}>{opt || 'Select...'}</option>)}
          </select>
        ) : (
          <input 
            type={type}
            value={value} 
            onChange={e => onChange?.(e.target.value)}
            placeholder={placeholder}
            className="text-sm text-gray-900 font-medium bg-gray-50 border border-gray-200 rounded px-2 py-1 w-40 text-right"
          />
        )
      ) : (
        <span className="text-sm text-gray-900 font-medium">{value || '-'}</span>
      )}
    </div>
  )
}

// Tag Section Component
function TagSection({ 
  tags, 
  editing, 
  onAdd, 
  onRemove,
  placeholder 
}: { 
  tags: string[]
  editing: boolean
  onAdd: (v: string) => void
  onRemove: (i: number) => void
  placeholder: string
}) {
  const [input, setInput] = useState('')

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ',') && input.trim()) {
      e.preventDefault()
      onAdd(input.trim())
      setInput('')
    }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag, i) => (
          <span key={i} className="inline-flex items-center gap-1 px-3 py-1 bg-[#406A56]/10 text-[#406A56] rounded-full text-sm">
            {tag}
            {editing && (
              <button onClick={() => onRemove(i)} className="hover:text-[#C35F33]">
                <X size={12} />
              </button>
            )}
          </span>
        ))}
        {tags.length === 0 && !editing && (
          <span className="text-gray-400 text-sm">None added yet</span>
        )}
      </div>
      {editing && (
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="mt-2 w-full p-2 border border-gray-200 rounded-lg text-sm"
        />
      )}
    </div>
  )
}
