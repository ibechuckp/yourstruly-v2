'use client'

import { useState, useEffect, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  ChevronLeft, User, Mail, Phone, MapPin, Calendar,
  Video, Image as ImageIcon, Gift, Edit2, Trash2,
  Heart, Mic, MessageSquare, Plus
} from 'lucide-react'
import Link from 'next/link'

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
}

interface Interview {
  id: string
  title: string
  status: string
  created_at: string
  session_questions: { id: string }[]
  video_responses: { id: string }[]
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
  const [interviews, setInterviews] = useState<Interview[]>([])
  const [memories, setMemories] = useState<Memory[]>([])
  const [postscripts, setPostscripts] = useState<PostScript[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

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

    // Load interviews with this contact
    const { data: interviewsData } = await supabase
      .from('interview_sessions')
      .select('id, title, status, created_at, session_questions(id), video_responses(id)')
      .eq('contact_id', id)
      .order('created_at', { ascending: false })
      .limit(10)

    setInterviews(interviewsData || [])

    // Load memories where this contact is tagged
    const { data: tagsData } = await supabase
      .from('memory_face_tags')
      .select('memory_id')
      .eq('contact_id', id)

    const memoryIds = [...new Set(tagsData?.map(t => t.memory_id) || [])]
    
    if (memoryIds.length > 0) {
      const { data: memoriesData } = await supabase
        .from('memories')
        .select('id, title, memory_date')
        .in('id', memoryIds)
        .order('memory_date', { ascending: false })
        .limit(10)
      
      setMemories(memoriesData || [])
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

  const getCoverImage = (memory: Memory) => {
    const cover = memory.memory_media?.find(m => m.is_cover) || memory.memory_media?.[0]
    return cover?.file_url
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500/20 text-green-400'
      case 'recording': return 'bg-blue-500/20 text-blue-400'
      case 'sent': return 'bg-amber-500/20 text-amber-400'
      case 'scheduled': return 'bg-blue-500/20 text-blue-400'
      default: return 'bg-gray-500/20 text-gray-400'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white/60">Loading...</div>
      </div>
    )
  }

  if (!contact) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-white/60 mb-4">Contact not found</p>
          <Link href="/dashboard/contacts" className="text-amber-500 hover:underline">
            Back to contacts
          </Link>
        </div>
      </div>
    )
  }

  const age = getAge(contact.date_of_birth)

  return (
    <div className="min-h-screen p-6">
      {/* Header */}
      <header className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              href="/dashboard/contacts" 
              className="p-2 bg-gray-900/90 rounded-xl text-white/70 hover:text-white transition-all border border-white/10"
            >
              <ChevronLeft size={20} />
            </Link>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white text-2xl font-medium">
                {contact.full_name.charAt(0)}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">{contact.full_name}</h1>
                <p className="text-white/50 text-sm capitalize">{contact.relationship_type?.replace('_', ' ')}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/dashboard/contacts?edit=${id}`}
              className="p-2.5 bg-gray-900/90 text-white/50 hover:text-white rounded-xl transition-all border border-white/10"
            >
              <Edit2 size={18} />
            </Link>
            <button
              onClick={handleDelete}
              className="p-2.5 bg-gray-900/90 text-white/50 hover:text-red-500 rounded-xl transition-all border border-white/10"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto grid gap-6 lg:grid-cols-3">
        {/* Contact Info */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-gray-900/90 rounded-xl p-5 border border-white/10 space-y-4">
            <h3 className="text-white font-medium">Contact Info</h3>
            
            {contact.email && (
              <div className="flex items-center gap-3 text-white/70">
                <Mail size={16} className="text-amber-500" />
                <a href={`mailto:${contact.email}`} className="text-sm hover:text-amber-500">{contact.email}</a>
              </div>
            )}
            
            {contact.phone && (
              <div className="flex items-center gap-3 text-white/70">
                <Phone size={16} className="text-amber-500" />
                <a href={`tel:${contact.phone}`} className="text-sm hover:text-amber-500">{contact.phone}</a>
              </div>
            )}
            
            {contact.date_of_birth && (
              <div className="flex items-center gap-3 text-white/70">
                <Calendar size={16} className="text-amber-500" />
                <span className="text-sm">
                  {formatDate(contact.date_of_birth)}
                  {age && ` (${age} years old)`}
                </span>
              </div>
            )}
            
            {(contact.address || contact.city) && (
              <div className="flex items-start gap-3 text-white/70">
                <MapPin size={16} className="text-amber-500 mt-0.5" />
                <span className="text-sm">
                  {[contact.address, contact.city, contact.state, contact.zipcode, contact.country].filter(Boolean).join(', ')}
                </span>
              </div>
            )}
          </div>

          {contact.notes && (
            <div className="bg-gray-900/90 rounded-xl p-5 border border-white/10">
              <h3 className="text-white font-medium mb-2">Notes</h3>
              <p className="text-white/60 text-sm">{contact.notes}</p>
            </div>
          )}

          {/* Quick Actions */}
          <div className="bg-gray-900/90 rounded-xl p-5 border border-white/10">
            <h3 className="text-white font-medium mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <Link
                href={`/dashboard/journalist?contact=${id}`}
                className="flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-colors"
              >
                <Mic size={18} className="text-pink-400" />
                <span className="text-white/80 text-sm">Start Interview</span>
              </Link>
              <Link
                href={`/dashboard/postscripts?contact=${id}`}
                className="flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-colors"
              >
                <Gift size={18} className="text-purple-400" />
                <span className="text-white/80 text-sm">Send PostScript</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Activity */}
        <div className="lg:col-span-2 space-y-6">
          {/* Interviews */}
          <div className="bg-gray-900/90 rounded-xl p-5 border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-medium flex items-center gap-2">
                <Mic size={16} className="text-pink-400" />
                Interviews
              </h3>
              <Link
                href={`/dashboard/journalist?contact=${id}`}
                className="text-amber-500 text-sm hover:underline"
              >
                New Interview
              </Link>
            </div>

            {interviews.length === 0 ? (
              <p className="text-white/40 text-sm text-center py-4">No interviews yet</p>
            ) : (
              <div className="space-y-3">
                {interviews.map((interview) => (
                  <Link
                    key={interview.id}
                    href={`/dashboard/journalist/${interview.id}`}
                    className="block p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white text-sm">{interview.title}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-white/40 text-xs">{formatDate(interview.created_at)}</span>
                          <span className="text-white/40 text-xs">
                            {interview.video_responses?.length || 0}/{interview.session_questions?.length || 0} responses
                          </span>
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${getStatusColor(interview.status)}`}>
                        {interview.status}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Memories */}
          <div className="bg-gray-900/90 rounded-xl p-5 border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-medium flex items-center gap-2">
                <ImageIcon size={16} className="text-blue-400" />
                Memories Together
              </h3>
              <Link href="/dashboard/memories" className="text-amber-500 text-sm hover:underline">
                View All
              </Link>
            </div>

            {memories.length === 0 ? (
              <p className="text-white/40 text-sm text-center py-4">No memories tagged with {contact.full_name}</p>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {memories.map((memory) => {
                  const coverUrl = getCoverImage(memory)
                  return (
                    <Link
                      key={memory.id}
                      href={`/dashboard/memories/${memory.id}`}
                      className="aspect-square rounded-xl overflow-hidden bg-white/5 hover:ring-2 hover:ring-amber-500/50 transition-all"
                    >
                      {coverUrl ? (
                        <img src={coverUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon size={20} className="text-white/30" />
                        </div>
                      )}
                    </Link>
                  )
                })}
              </div>
            )}
          </div>

          {/* PostScripts */}
          <div className="bg-gray-900/90 rounded-xl p-5 border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-medium flex items-center gap-2">
                <Gift size={16} className="text-purple-400" />
                PostScripts
              </h3>
              <Link
                href={`/dashboard/postscripts?contact=${id}`}
                className="text-amber-500 text-sm hover:underline"
              >
                New PostScript
              </Link>
            </div>

            {postscripts.length === 0 ? (
              <p className="text-white/40 text-sm text-center py-4">No PostScripts scheduled</p>
            ) : (
              <div className="space-y-3">
                {postscripts.map((ps) => (
                  <Link
                    key={ps.id}
                    href="/dashboard/postscripts"
                    className="block p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white text-sm">{ps.title}</p>
                        <span className="text-white/40 text-xs capitalize">
                          {ps.delivery_type === 'date' && ps.delivery_date 
                            ? formatDate(ps.delivery_date)
                            : ps.delivery_type}
                        </span>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${getStatusColor(ps.status)}`}>
                        {ps.status}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
