'use client'

import { useState, useEffect, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  ChevronLeft, User, Mail, Phone, MapPin, Calendar,
  Video, Image as ImageIcon, Gift, Edit2, Trash2,
  Heart, Mic, MessageSquare, Plus, Camera, Upload
} from 'lucide-react'
import Link from 'next/link'
import '@/styles/home.css'

interface Contact {
  id: string
  full_name: string
  nickname: string
  email: string
  phone: string
  relationship_type: string
  relationship_details: string
  date_of_birth: string
  address: string
  city: string
  state: string
  country: string
  zipcode: string
  notes: string
  profile_photo_url?: string
}

interface TaggedMedia {
  id: string
  file_url: string
  memory_id: string
  memory_title?: string
}

interface Memory {
  id: string
  title: string
  memory_date: string
  memory_media: { file_url: string; is_cover: boolean }[]
}

interface PostScript {
  id: string
  title: string
  delivery_type: string
  delivery_date: string
  status: string
}

export default function ContactDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [contact, setContact] = useState<Contact | null>(null)
  const [taggedPhotos, setTaggedPhotos] = useState<TaggedMedia[]>([])
  const [memories, setMemories] = useState<Memory[]>([])
  const [postscripts, setPostscripts] = useState<PostScript[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const supabase = createClient()

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !contact) return
    
    setUploading(true)
    try {
      // Upload to storage
      const fileExt = file.name.split('.').pop()
      const fileName = `contact-${contact.id}-${Date.now()}.${fileExt}`
      const filePath = `contacts/${fileName}`
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file)
      
      if (uploadError) throw uploadError
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)
      
      // Update contact with new photo
      await supabase
        .from('contacts')
        .update({ profile_photo_url: publicUrl })
        .eq('id', contact.id)
      
      setContact({ ...contact, profile_photo_url: publicUrl })
    } catch (err) {
      console.error('Upload error:', err)
      alert('Failed to upload photo')
    }
    setUploading(false)
  }

  useEffect(() => {
    loadContact()
  }, [id])

  const loadContact = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Load contact
    const { data: contactData } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (!contactData) {
      setLoading(false)
      return
    }
    setContact(contactData)

    // Load tagged photos (face tags)
    const { data: tagsData } = await supabase
      .from('face_tags')
      .select('memory_media_id, memory_media(id, file_url, memory_id, memory:memories(title))')
      .eq('contact_id', id)
      .limit(20)

    if (tagsData) {
      const photos = tagsData
        .filter(t => t.memory_media)
        .map(t => {
          // Handle both array and object return types from Supabase
          const mm = t.memory_media as any
          const media = Array.isArray(mm) ? mm[0] : mm
          const memory = media?.memory
          const memoryTitle = Array.isArray(memory) ? memory[0]?.title : memory?.title
          return {
            id: media?.id,
            file_url: media?.file_url,
            memory_id: media?.memory_id,
            memory_title: memoryTitle
          }
        })
        .filter(p => p.id) // Filter out any with missing data
      setTaggedPhotos(photos)
    }

    // Load postscripts to this contact
    const { data: postscriptsData } = await supabase
      .from('postscripts')
      .select('id, title, delivery_type, delivery_date, status')
      .eq('recipient_contact_id', id)
      .order('created_at', { ascending: false })
      .limit(10)

    setPostscripts(postscriptsData || [])
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
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    return age
  }

  const handleDelete = async () => {
    if (!confirm('Delete this contact? This cannot be undone.')) return
    await supabase.from('contacts').delete().eq('id', id)
    window.location.href = '/dashboard/contacts'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'bg-blue-100 text-blue-700'
      case 'scheduled': return 'bg-amber-100 text-amber-700'
      case 'opened': return 'bg-green-100 text-green-700'
      default: return 'bg-gray-100 text-gray-600'
    }
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

  if (!contact) {
    return (
      <div className="min-h-screen relative">
        <div className="home-background">
          <div className="home-blob home-blob-1" />
          <div className="home-blob home-blob-2" />
        </div>
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p className="text-gray-500 mb-4">Contact not found</p>
            <Link href="/dashboard/contacts" className="text-[#406A56] hover:underline">
              Back to contacts
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const age = getAge(contact.date_of_birth)

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
                {contact.profile_photo_url ? (
                  <img 
                    src={contact.profile_photo_url} 
                    alt={contact.full_name}
                    className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-md"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#406A56] to-[#8DACAB] flex items-center justify-center text-white text-2xl font-medium shadow-md">
                    {contact.full_name.charAt(0)}
                  </div>
                )}
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{contact.full_name}</h1>
                  <p className="text-[#406A56] text-sm capitalize font-medium">{contact.relationship_type?.replace('_', ' ')}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href={`/dashboard/contacts?edit=${id}`}
                className="p-2.5 bg-white/80 backdrop-blur-sm text-gray-500 hover:text-[#406A56] rounded-xl transition-all border border-gray-200"
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
          {/* Contact Info */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-5 border border-gray-100 shadow-sm space-y-4">
              <h3 className="text-gray-900 font-semibold">Contact Info</h3>
              
              {contact.email && (
                <div className="flex items-center gap-3 text-gray-600">
                  <Mail size={16} className="text-[#406A56]" />
                  <a href={`mailto:${contact.email}`} className="text-sm hover:text-[#406A56]">{contact.email}</a>
                </div>
              )}
              
              {contact.phone && (
                <div className="flex items-center gap-3 text-gray-600">
                  <Phone size={16} className="text-[#406A56]" />
                  <a href={`tel:${contact.phone}`} className="text-sm hover:text-[#406A56]">{contact.phone}</a>
                </div>
              )}
              
              {contact.date_of_birth && (
                <div className="flex items-center gap-3 text-gray-600">
                  <Calendar size={16} className="text-[#406A56]" />
                  <span className="text-sm">
                    {formatDate(contact.date_of_birth)}
                    {age && ` (${age} years old)`}
                  </span>
                </div>
              )}
              
              {(contact.address || contact.city) && (
                <div className="flex items-start gap-3 text-gray-600">
                  <MapPin size={16} className="text-[#406A56] mt-0.5" />
                  <span className="text-sm">
                    {[contact.address, contact.city, contact.state, contact.zipcode, contact.country].filter(Boolean).join(', ')}
                  </span>
                </div>
              )}
            </div>

            {contact.notes && (
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-5 border border-gray-100 shadow-sm">
                <h3 className="text-gray-900 font-semibold mb-2">Notes</h3>
                <p className="text-gray-600 text-sm">{contact.notes}</p>
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-5 border border-gray-100 shadow-sm">
              <h3 className="text-gray-900 font-semibold mb-3">Quick Actions</h3>
              <div className="space-y-2">
                <Link
                  href={`/dashboard/journalist?contact=${id}`}
                  className="flex items-center gap-3 p-3 bg-[#4A3552]/5 hover:bg-[#4A3552]/10 rounded-xl transition-colors"
                >
                  <Mic size={18} className="text-[#4A3552]" />
                  <span className="text-gray-700 text-sm font-medium">Start Interview</span>
                </Link>
                <Link
                  href={`/dashboard/postscripts/new?contact=${id}`}
                  className="flex items-center gap-3 p-3 bg-[#C35F33]/5 hover:bg-[#C35F33]/10 rounded-xl transition-colors"
                >
                  <Gift size={18} className="text-[#C35F33]" />
                  <span className="text-gray-700 text-sm font-medium">Send Future Message</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Right Column - Photos & PostScripts */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tagged Photos Section */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-5 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-900 font-semibold flex items-center gap-2">
                  <Camera size={18} className="text-[#D9C61A]" />
                  Photos with {contact.full_name.split(' ')[0]}
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">{taggedPhotos.length} photos</span>
                  <label className="cursor-pointer p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                      disabled={uploading}
                    />
                    <Upload size={16} className={`${uploading ? 'text-gray-300' : 'text-[#406A56]'}`} />
                  </label>
                </div>
              </div>
              
              {taggedPhotos.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                    <ImageIcon size={24} className="text-gray-400" />
                  </div>
                  <p className="text-gray-500 text-sm mb-2">No tagged photos yet</p>
                  <p className="text-gray-400 text-xs mb-4">Tag {contact.full_name.split(' ')[0]} in your memories to see photos here</p>
                  <label className="inline-flex items-center gap-2 px-4 py-2 bg-[#406A56]/10 text-[#406A56] rounded-lg cursor-pointer hover:bg-[#406A56]/20 transition-colors text-sm font-medium">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                      disabled={uploading}
                    />
                    <Upload size={16} />
                    {uploading ? 'Uploading...' : 'Upload Profile Photo'}
                  </label>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {taggedPhotos.slice(0, 8).map(photo => (
                    <Link 
                      key={photo.id} 
                      href={`/dashboard/memories/${photo.memory_id}`}
                      className="aspect-square rounded-xl overflow-hidden hover:ring-2 hover:ring-[#406A56] transition-all"
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

            {/* Future Messages (PostScripts) */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-5 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-900 font-semibold flex items-center gap-2">
                  <Gift size={18} className="text-[#C35F33]" />
                  Future Messages
                </h3>
                <Link 
                  href={`/dashboard/postscripts/new?contact=${id}`}
                  className="text-sm text-[#C35F33] hover:underline flex items-center gap-1"
                >
                  <Plus size={14} /> Create
                </Link>
              </div>
              
              {postscripts.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-gray-500 text-sm">No scheduled messages</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {postscripts.map(ps => (
                    <Link 
                      key={ps.id}
                      href={`/dashboard/postscripts/${ps.id}`}
                      className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
                    >
                      <div>
                        <p className="text-gray-900 font-medium text-sm">{ps.title}</p>
                        <p className="text-gray-500 text-xs">
                          {ps.delivery_type === 'date' && ps.delivery_date 
                            ? formatDate(ps.delivery_date)
                            : ps.delivery_type
                          }
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(ps.status)}`}>
                        {ps.status}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
