'use client'

import { useState, useEffect, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  ChevronLeft, Edit2, Trash2, Heart, Calendar, Camera,
  Image as ImageIcon, PawPrint, Upload, AlertCircle, User
} from 'lucide-react'
import Link from 'next/link'
import '@/styles/home.css'

interface Pet {
  id: string
  name: string
  species: string
  breed?: string
  date_of_birth?: string
  adoption_date?: string
  color?: string
  personality?: string
  favorite_things?: string[]
  medical_notes?: string
  emergency_caretaker?: string
  emergency_caretaker_phone?: string
  is_deceased: boolean
  date_of_passing?: string
  profile_photo_url?: string
}

interface TaggedMedia {
  id: string
  file_url: string
  memory_id: string
  memory_title?: string
}

export default function PetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [pet, setPet] = useState<Pet | null>(null)
  const [taggedPhotos, setTaggedPhotos] = useState<TaggedMedia[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadPet()
  }, [id])

  const loadPet = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Load pet
    const { data: petData } = await supabase
      .from('pets')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (!petData) {
      setLoading(false)
      return
    }
    setPet(petData)

    // Load tagged photos (if pet_tags table exists)
    // For now, we'll check memories where pet is mentioned in title/description
    const { data: memoriesData } = await supabase
      .from('memories')
      .select('id, title, memory_media(id, file_url)')
      .eq('user_id', user.id)
      .or(`title.ilike.%${petData.name}%,description.ilike.%${petData.name}%`)
      .limit(20)

    if (memoriesData) {
      const photos: TaggedMedia[] = []
      memoriesData.forEach(m => {
        (m.memory_media || []).forEach((media: any) => {
          photos.push({
            id: media.id,
            file_url: media.file_url,
            memory_id: m.id,
            memory_title: m.title
          })
        })
      })
      setTaggedPhotos(photos)
    }

    setLoading(false)
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const getAge = (dob: string) => {
    if (!dob) return null
    const birth = new Date(dob)
    const today = new Date()
    let years = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      years--
    }
    if (years < 1) {
      // Calculate months
      let months = (today.getFullYear() - birth.getFullYear()) * 12
      months += today.getMonth() - birth.getMonth()
      if (today.getDate() < birth.getDate()) months--
      return `${months} months`
    }
    return `${years} years`
  }

  const handleDelete = async () => {
    if (!confirm('Delete this pet? This cannot be undone.')) return
    await supabase.from('pets').delete().eq('id', id)
    window.location.href = '/dashboard/contacts'
  }

  const [uploading, setUploading] = useState(false)
  
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !pet) return
    
    setUploading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `pet-${pet.id}-${Date.now()}.${fileExt}`
      const filePath = `pets/${fileName}`
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file)
      
      if (uploadError) throw uploadError
      
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)
      
      await supabase
        .from('pets')
        .update({ profile_photo_url: publicUrl })
        .eq('id', pet.id)
      
      setPet({ ...pet, profile_photo_url: publicUrl })
    } catch (err) {
      console.error('Upload error:', err)
      alert('Failed to upload photo')
    }
    setUploading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen relative">
        <div className="home-background">
          <div className="home-blob home-blob-1" />
          <div className="home-blob home-blob-2" />
        </div>
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="text-gray-500">Loading...</div>
        </div>
      </div>
    )
  }

  if (!pet) {
    return (
      <div className="min-h-screen relative">
        <div className="home-background">
          <div className="home-blob home-blob-1" />
          <div className="home-blob home-blob-2" />
        </div>
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p className="text-gray-500 mb-4">Pet not found</p>
            <Link href="/dashboard/contacts" className="text-[#C35F33] hover:underline">
              Back to contacts
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const age = pet.date_of_birth ? getAge(pet.date_of_birth) : null

  return (
    <div className="min-h-screen relative pb-24">
      {/* Warm background */}
      <div className="home-background">
        <div className="home-blob home-blob-1" />
        <div className="home-blob home-blob-2" />
        <div className="home-blob home-blob-3" />
      </div>

      <div className="relative z-10 p-6">
        {/* Header */}
        <header className="mb-6 max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link 
                href="/dashboard/contacts" 
                className="p-2 bg-white/80 backdrop-blur-sm rounded-xl text-gray-600 hover:text-gray-900 transition-all border border-gray-200"
              >
                <ChevronLeft size={20} />
              </Link>
              <div className="flex items-center gap-4">
                {pet.profile_photo_url ? (
                  <img 
                    src={pet.profile_photo_url} 
                    alt={pet.name}
                    className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-md"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#C35F33] to-[#D87A55] flex items-center justify-center text-white text-2xl font-medium shadow-md">
                    <PawPrint size={28} />
                  </div>
                )}
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{pet.name}</h1>
                  <p className="text-[#C35F33] text-sm capitalize font-medium">
                    {pet.species}{pet.breed ? ` • ${pet.breed}` : ''}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href={`/dashboard/contacts?editPet=${id}`}
                className="p-2.5 bg-white/80 backdrop-blur-sm text-gray-500 hover:text-[#C35F33] rounded-xl transition-all border border-gray-200"
              >
                <Edit2 size={18} />
              </Link>
              <button
                onClick={handleDelete}
                className="p-2.5 bg-white/80 backdrop-blur-sm text-gray-500 hover:text-red-500 rounded-xl transition-all border border-gray-200"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto grid gap-6 lg:grid-cols-3">
          {/* Pet Info */}
          <div className="lg:col-span-1 space-y-4">
            {/* Deceased Banner */}
            {pet.is_deceased && (
              <div className="bg-[#4A3552]/10 border border-[#4A3552]/20 rounded-2xl p-4">
                <p className="text-[#4A3552] text-center">
                  🌈 Rainbow Bridge
                  {pet.date_of_passing && (
                    <span className="block text-sm mt-1 text-[#4A3552]/70">
                      {formatDate(pet.date_of_passing)}
                    </span>
                  )}
                </p>
              </div>
            )}

            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-5 border border-gray-100 shadow-sm space-y-4">
              <h3 className="text-gray-900 font-semibold">Pet Info</h3>
              
              {pet.color && (
                <div className="flex items-center gap-3 text-gray-600">
                  <div className="w-4 h-4 rounded-full bg-gradient-to-r from-gray-300 to-gray-400" />
                  <span className="text-sm">Color: {pet.color}</span>
                </div>
              )}
              
              {pet.date_of_birth && (
                <div className="flex items-center gap-3 text-gray-600">
                  <Calendar size={16} className="text-[#C35F33]" />
                  <span className="text-sm">
                    Born {formatDate(pet.date_of_birth)}
                    {age && ` (${age} old)`}
                  </span>
                </div>
              )}
              
              {pet.adoption_date && (
                <div className="flex items-center gap-3 text-gray-600">
                  <Heart size={16} className="text-[#C35F33]" />
                  <span className="text-sm">
                    Adopted {formatDate(pet.adoption_date)}
                  </span>
                </div>
              )}
            </div>

            {pet.personality && (
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-5 border border-gray-100 shadow-sm">
                <h3 className="text-gray-900 font-semibold mb-2">Personality</h3>
                <p className="text-gray-600 text-sm">{pet.personality}</p>
              </div>
            )}

            {pet.favorite_things && pet.favorite_things.length > 0 && (
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-5 border border-gray-100 shadow-sm">
                <h3 className="text-gray-900 font-semibold mb-2">Favorite Things</h3>
                <div className="flex flex-wrap gap-2">
                  {pet.favorite_things.map((thing, i) => (
                    <span key={i} className="px-3 py-1 bg-[#C35F33]/10 text-[#C35F33] rounded-full text-sm">
                      {thing}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Medical Notes - Always show */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-5 border border-gray-100 shadow-sm">
              <h3 className="text-gray-900 font-semibold mb-2 flex items-center gap-2">
                <AlertCircle size={16} className="text-[#C35F33]" />
                Medical Notes
              </h3>
              {pet.medical_notes ? (
                <p className="text-gray-600 text-sm whitespace-pre-wrap">{pet.medical_notes}</p>
              ) : (
                <p className="text-gray-400 text-sm italic">No medical notes recorded</p>
              )}
            </div>

            {/* Emergency Caretaker */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-5 border border-gray-100 shadow-sm">
              <h3 className="text-gray-900 font-semibold mb-2 flex items-center gap-2">
                <User size={16} className="text-[#406A56]" />
                Emergency Caretaker
              </h3>
              {pet.emergency_caretaker ? (
                <div className="space-y-1">
                  <p className="text-gray-900 text-sm font-medium">{pet.emergency_caretaker}</p>
                  {pet.emergency_caretaker_phone && (
                    <a href={`tel:${pet.emergency_caretaker_phone}`} className="text-[#406A56] text-sm hover:underline">
                      {pet.emergency_caretaker_phone}
                    </a>
                  )}
                </div>
              ) : (
                <p className="text-gray-400 text-sm italic">Not specified - add someone who can care for {pet.name} in an emergency</p>
              )}
            </div>
          </div>

          {/* Right Column - Photos */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Photo Upload */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-5 border border-gray-100 shadow-sm">
              <h3 className="text-gray-900 font-semibold mb-4">Profile Photo</h3>
              <div className="flex items-center gap-4">
                {pet.profile_photo_url ? (
                  <img src={pet.profile_photo_url} alt={pet.name} className="w-20 h-20 rounded-full object-cover" />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#C35F33] to-[#D87A55] flex items-center justify-center">
                    <PawPrint size={32} className="text-white" />
                  </div>
                )}
                <label className="flex items-center gap-2 px-4 py-2 bg-[#C35F33]/10 text-[#C35F33] rounded-xl cursor-pointer hover:bg-[#C35F33]/20 transition-colors">
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" disabled={uploading} />
                  <Upload size={16} />
                  {uploading ? 'Uploading...' : 'Upload Photo'}
                </label>
              </div>
            </div>

            {/* Photos Section */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-5 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-900 font-semibold flex items-center gap-2">
                  <Camera size={18} className="text-[#D9C61A]" />
                  Photos of {pet.name}
                </h3>
                <span className="text-sm text-gray-500">{taggedPhotos.length} photos</span>
              </div>
              
              {taggedPhotos.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                    <ImageIcon size={24} className="text-gray-400" />
                  </div>
                  <p className="text-gray-500 text-sm mb-2">No photos yet</p>
                  <p className="text-gray-400 text-xs">Add memories featuring {pet.name} to see photos here</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {taggedPhotos.slice(0, 8).map(photo => (
                    <Link 
                      key={photo.id} 
                      href={`/dashboard/memories/${photo.memory_id}`}
                      className="aspect-square rounded-xl overflow-hidden hover:ring-2 hover:ring-[#C35F33] transition-all"
                    >
                      <img 
                        src={photo.file_url} 
                        alt="" 
                        className="w-full h-full object-cover"
                      />
                    </Link>
                  ))}
                  {taggedPhotos.length > 8 && (
                    <div className="aspect-square rounded-xl bg-gray-100 flex items-center justify-center">
                      <span className="text-gray-500 font-medium">+{taggedPhotos.length - 8}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
