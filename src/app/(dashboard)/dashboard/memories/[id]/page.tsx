'use client'

import { useState, useEffect, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  ChevronLeft, Heart, MapPin, Calendar, Sparkles, 
  Tag, Trash2, Edit2, X, Plus, User, Check
} from 'lucide-react'
import Link from 'next/link'
import Modal from '@/components/ui/Modal'

interface Memory {
  id: string
  title: string
  description: string
  memory_date: string
  memory_type: string
  location_name: string
  location_lat: number
  location_lng: number
  ai_summary: string
  ai_mood: string
  ai_category: string
  ai_labels: string[]
  is_favorite: boolean
  created_at: string
}

interface Media {
  id: string
  file_url: string
  file_type: string
  mime_type: string
  width: number
  height: number
  ai_labels: any[]
  ai_faces: any[]
  is_cover: boolean
}

interface FaceTag {
  id: string
  media_id: string
  contact_id: string
  box_left: number
  box_top: number
  box_width: number
  box_height: number
  is_confirmed: boolean
  contact?: {
    id: string
    full_name: string
  }
}

interface Contact {
  id: string
  full_name: string
}

export default function MemoryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [memory, setMemory] = useState<Memory | null>(null)
  const [media, setMedia] = useState<Media[]>([])
  const [faceTags, setFaceTags] = useState<FaceTag[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMedia, setSelectedMedia] = useState<Media | null>(null)
  const [showTagModal, setShowTagModal] = useState(false)
  const [taggingFace, setTaggingFace] = useState<any>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({ title: '', description: '', memory_date: '', location_name: '' })
  
  const supabase = createClient()

  useEffect(() => {
    loadMemory()
    loadContacts()
  }, [id])

  const loadMemory = async () => {
    setLoading(true)
    
    // Load memory
    const { data: memoryData } = await supabase
      .from('memories')
      .select('*')
      .eq('id', id)
      .single()

    if (memoryData) {
      setMemory(memoryData)
      setEditForm({
        title: memoryData.title || '',
        description: memoryData.description || '',
        memory_date: memoryData.memory_date || '',
        location_name: memoryData.location_name || '',
      })
    }

    // Load media
    const { data: mediaData } = await supabase
      .from('memory_media')
      .select('*')
      .eq('memory_id', id)
      .order('sort_order')

    setMedia(mediaData || [])
    if (mediaData?.length) {
      setSelectedMedia(mediaData.find(m => m.is_cover) || mediaData[0])
    }

    // Load face tags
    const { data: tagData } = await supabase
      .from('memory_face_tags')
      .select('*, contact:contacts(id, full_name)')
      .eq('media_id', mediaData?.[0]?.id || '')

    setFaceTags(tagData || [])
    setLoading(false)
  }

  const loadContacts = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('contacts')
      .select('id, full_name')
      .eq('user_id', user.id)
      .order('full_name')

    setContacts(data || [])
  }

  const loadFaceTags = async (mediaId: string) => {
    const { data } = await supabase
      .from('memory_face_tags')
      .select('*, contact:contacts(id, full_name)')
      .eq('media_id', mediaId)

    setFaceTags(data || [])
  }

  const handleSelectMedia = (m: Media) => {
    setSelectedMedia(m)
    loadFaceTags(m.id)
  }

  const toggleFavorite = async () => {
    if (!memory) return
    
    const { error } = await supabase
      .from('memories')
      .update({ is_favorite: !memory.is_favorite })
      .eq('id', memory.id)

    if (!error) {
      setMemory({ ...memory, is_favorite: !memory.is_favorite })
    }
  }

  const handleSaveEdit = async () => {
    if (!memory) return

    const { error } = await supabase
      .from('memories')
      .update(editForm)
      .eq('id', memory.id)

    if (!error) {
      setMemory({ ...memory, ...editForm })
      setIsEditing(false)
    }
  }

  const handleTagFace = async (contactId: string) => {
    if (!selectedMedia || !taggingFace) return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('memory_face_tags').insert({
      media_id: selectedMedia.id,
      user_id: user.id,
      contact_id: contactId,
      box_left: taggingFace.boundingBox.left,
      box_top: taggingFace.boundingBox.top,
      box_width: taggingFace.boundingBox.width,
      box_height: taggingFace.boundingBox.height,
      is_auto_detected: true,
      is_confirmed: true,
    })

    setShowTagModal(false)
    setTaggingFace(null)
    loadFaceTags(selectedMedia.id)
  }

  const handleDeleteTag = async (tagId: string) => {
    await supabase.from('memory_face_tags').delete().eq('id', tagId)
    if (selectedMedia) loadFaceTags(selectedMedia.id)
  }

  const handleDelete = async () => {
    if (!confirm('Delete this memory? This cannot be undone.')) return

    // Delete media files from storage
    for (const m of media) {
      await supabase.storage.from('memories').remove([m.file_url.split('/memories/')[1]])
    }

    // Delete memory (cascades to media and tags)
    await supabase.from('memories').delete().eq('id', id)

    window.location.href = '/dashboard/memories'
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleDateString('en-US', { 
      weekday: 'long',
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-gray-400">Loading memory...</div>
      </div>
    )
  }

  if (!memory) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 mb-4">Memory not found</p>
          <Link href="/dashboard/memories" className="text-amber-500 hover:underline">
            Back to memories
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-gray-950/90 backdrop-blur-md border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/dashboard/memories" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
            <ChevronLeft size={20} />
            <span>Back</span>
          </Link>
          
          <div className="flex items-center gap-2">
            <button
              onClick={toggleFavorite}
              className={`p-2 rounded-lg transition-colors ${memory.is_favorite ? 'text-red-500' : 'text-gray-400 hover:text-red-500'}`}
            >
              <Heart size={20} fill={memory.is_favorite ? 'currentColor' : 'none'} />
            </button>
            <button
              onClick={() => setIsEditing(true)}
              className="p-2 text-gray-400 hover:text-white rounded-lg transition-colors"
            >
              <Edit2 size={20} />
            </button>
            <button
              onClick={handleDelete}
              className="p-2 text-gray-400 hover:text-red-500 rounded-lg transition-colors"
            >
              <Trash2 size={20} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Image */}
          <div className="lg:col-span-2">
            {selectedMedia && (
              <div className="relative rounded-xl overflow-hidden bg-gray-900">
                <img
                  src={selectedMedia.file_url}
                  alt={memory.title || 'Memory'}
                  className="w-full h-auto"
                />
                
                {/* Face boxes */}
                {selectedMedia.ai_faces?.map((face: any, i: number) => {
                  const tag = faceTags.find(t => 
                    Math.abs(t.box_left - face.boundingBox.left) < 0.05 &&
                    Math.abs(t.box_top - face.boundingBox.top) < 0.05
                  )
                  
                  return (
                    <div
                      key={i}
                      className="absolute border-2 border-amber-500/70 rounded cursor-pointer hover:border-amber-500 transition-colors group"
                      style={{
                        left: `${face.boundingBox.left * 100}%`,
                        top: `${face.boundingBox.top * 100}%`,
                        width: `${face.boundingBox.width * 100}%`,
                        height: `${face.boundingBox.height * 100}%`,
                      }}
                      onClick={() => {
                        if (!tag) {
                          setTaggingFace(face)
                          setShowTagModal(true)
                        }
                      }}
                    >
                      {tag ? (
                        <div className="absolute -bottom-6 left-0 px-2 py-0.5 bg-amber-600 text-white text-xs rounded whitespace-nowrap">
                          {tag.contact?.full_name}
                        </div>
                      ) : (
                        <div className="absolute -bottom-6 left-0 px-2 py-0.5 bg-gray-800 text-gray-300 text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                          Click to tag
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {/* Thumbnail Strip */}
            {media.length > 1 && (
              <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
                {media.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => handleSelectMedia(m)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                      selectedMedia?.id === m.id ? 'border-amber-500' : 'border-transparent hover:border-gray-600'
                    }`}
                  >
                    <img src={m.file_url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details Sidebar */}
          <div className="space-y-4">
            {/* Title & Description */}
            <div className="bg-gray-900 rounded-xl p-4">
              <h1 className="text-xl font-semibold text-white mb-2">
                {memory.title || 'Untitled Memory'}
              </h1>
              {memory.description && (
                <p className="text-gray-400 text-sm">{memory.description}</p>
              )}
            </div>

            {/* Date & Location */}
            <div className="bg-gray-900 rounded-xl p-4 space-y-3">
              {memory.memory_date && (
                <div className="flex items-center gap-3 text-gray-300">
                  <Calendar size={18} className="text-amber-500" />
                  <span className="text-sm">{formatDate(memory.memory_date)}</span>
                </div>
              )}
              {memory.location_name && (
                <div className="flex items-center gap-3 text-gray-300">
                  <MapPin size={18} className="text-amber-500" />
                  <span className="text-sm">{memory.location_name}</span>
                </div>
              )}
            </div>

            {/* AI Insights */}
            {(memory.ai_summary || memory.ai_labels?.length > 0) && (
              <div className="bg-gray-900 rounded-xl p-4">
                <div className="flex items-center gap-2 text-amber-500 text-sm mb-3">
                  <Sparkles size={14} />
                  AI Insights
                </div>
                
                {memory.ai_summary && (
                  <p className="text-gray-400 text-sm mb-3">{memory.ai_summary}</p>
                )}

                {memory.ai_mood && (
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-gray-500 text-xs">Mood:</span>
                    <span className="px-2 py-0.5 bg-amber-600/20 text-amber-400 text-xs rounded-full capitalize">
                      {memory.ai_mood}
                    </span>
                  </div>
                )}

                {memory.ai_labels?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {memory.ai_labels.slice(0, 8).map((label, i) => (
                      <span key={i} className="px-2 py-0.5 bg-gray-800 text-gray-400 text-xs rounded-full">
                        {label}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tagged People */}
            {faceTags.length > 0 && (
              <div className="bg-gray-900 rounded-xl p-4">
                <div className="flex items-center gap-2 text-white text-sm mb-3">
                  <User size={14} />
                  People in this photo
                </div>
                <div className="space-y-2">
                  {faceTags.map((tag) => (
                    <div key={tag.id} className="flex items-center justify-between">
                      <span className="text-gray-300 text-sm">{tag.contact?.full_name}</span>
                      <button
                        onClick={() => handleDeleteTag(tag.id)}
                        className="text-gray-500 hover:text-red-500 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Tag Face Modal */}
      <Modal isOpen={showTagModal} onClose={() => { setShowTagModal(false); setTaggingFace(null); }} title="Tag Person" maxWidth="max-w-sm" showDone={false}>
        <p className="text-gray-400 text-sm mb-4">Who is this?</p>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {contacts.map((contact) => (
            <button
              key={contact.id}
              onClick={() => handleTagFace(contact.id)}
              className="w-full flex items-center gap-3 p-3 bg-gray-800 hover:bg-gray-700 rounded-xl transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-amber-600 flex items-center justify-center text-white text-sm">
                {contact.full_name.charAt(0)}
              </div>
              <span className="text-white text-sm">{contact.full_name}</span>
            </button>
          ))}
          {contacts.length === 0 && (
            <p className="text-gray-500 text-sm text-center py-4">
              No contacts yet. Add contacts first to tag people.
            </p>
          )}
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={isEditing} onClose={() => setIsEditing(false)} title="Edit Memory" showDone={false}>
        <div className="space-y-4">
          <div>
            <label className="block text-gray-400 text-sm mb-1">Title</label>
            <input
              type="text"
              value={editForm.title}
              onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <div>
            <label className="block text-gray-400 text-sm mb-1">Description</label>
            <textarea
              value={editForm.description}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
            />
          </div>
          <div>
            <label className="block text-gray-400 text-sm mb-1">Date</label>
            <input
              type="date"
              value={editForm.memory_date}
              onChange={(e) => setEditForm({ ...editForm, memory_date: e.target.value })}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <div>
            <label className="block text-gray-400 text-sm mb-1">Location</label>
            <input
              type="text"
              value={editForm.location_name}
              onChange={(e) => setEditForm({ ...editForm, location_name: e.target.value })}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button onClick={() => setIsEditing(false)} className="flex-1 py-3 text-gray-400">
              Cancel
            </button>
            <button onClick={handleSaveEdit} className="flex-1 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl transition-colors">
              Save Changes
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
