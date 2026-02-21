'use client'

import React, { useState, useEffect, use, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  ChevronLeft, Heart, MapPin, Calendar, Sparkles, 
  Trash2, Edit2, X, Plus, Image as ImageIcon, Upload, Zap
} from 'lucide-react'
import Link from 'next/link'
import Modal from '@/components/ui/Modal'
import FaceTagger from '@/components/media/FaceTagger'
import CaptionEditor from '@/components/media/CaptionEditor'
import { motion, AnimatePresence } from 'framer-motion'

interface Memory {
  id: string
  title: string
  description: string
  memory_date: string
  memory_type: string
  location_name: string
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
  is_cover: boolean
}

// Toast Component (for XP and info messages)
function Toast({ amount, message, onComplete }: { amount?: number; message?: string; onComplete?: () => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onComplete?.(), 2500)
    return () => clearTimeout(timer)
  }, [onComplete])

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.9 }}
      className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50"
    >
      <div className="flex items-center gap-3 px-5 py-3 bg-gradient-to-r from-amber-600 to-orange-600 rounded-full shadow-lg shadow-amber-500/30">
        {amount && amount > 0 && (
          <>
            <motion.div animate={{ rotate: [0, -10, 10, -10, 10, 0] }} transition={{ duration: 0.5, delay: 0.2 }}>
              <Zap size={20} className="text-white fill-white" />
            </motion.div>
            <span className="text-white font-bold text-lg">+{amount} XP</span>
          </>
        )}
        {message && <span className="text-white/80 text-sm">{message}</span>}
      </div>
    </motion.div>
  )
}

export default function MemoryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [memory, setMemory] = useState<Memory | null>(null)
  const [media, setMedia] = useState<Media[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMedia, setSelectedMedia] = useState<Media | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({ title: '', description: '', memory_date: '', location_name: '' })
  const [uploading, setUploading] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deletingMediaId, setDeletingMediaId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'faces' | 'caption'>('faces')
  const [xpToasts, setXpToasts] = useState<Array<{ id: number; amount?: number; message?: string }>>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const toastIdRef = useRef(0)
  
  const supabase = createClient()

  const showXP = (amount?: number, message?: string) => {
    const id = toastIdRef.current++
    setXpToasts(prev => [...prev, { id, amount, message }])
  }

  const removeToast = (id: number) => {
    setXpToasts(prev => prev.filter(t => t.id !== id))
  }

  useEffect(() => {
    loadMemory()
  }, [id])

  const loadMemory = async () => {
    setLoading(true)
    
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

    const { data: mediaData } = await supabase
      .from('memory_media')
      .select('*')
      .eq('memory_id', id)
      .order('sort_order')

    setMedia(mediaData || [])
    if (mediaData?.length) {
      setSelectedMedia(mediaData.find(m => m.is_cover) || mediaData[0])
    }

    setLoading(false)
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

  const handleDelete = async () => {
    if (!confirm('Delete this memory? This cannot be undone.')) return

    for (const m of media) {
      const key = m.file_url.split('/memories/')[1]
      if (key) {
        await supabase.storage.from('memories').remove([key])
      }
    }

    await supabase.from('memories').delete().eq('id', id)
    window.location.href = '/dashboard/memories'
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0 || !memory) return

    setUploading(true)

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        
        if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) continue
        if (file.size > 50 * 1024 * 1024) {
          alert(`File ${file.name} is too large (max 50MB)`)
          continue
        }

        // Use our API that handles face detection and XP
        const formData = new FormData()
        formData.append('file', file)

        const res = await fetch(`/api/memories/${id}/media`, {
          method: 'POST',
          body: formData,
        })

        if (res.ok) {
          const data = await res.json()
          
          // Show face detection results (no XP for upload)
          if (data.faces?.length > 0) {
            showXP(undefined, `👤 ${data.faces.length} face${data.faces.length > 1 ? 's' : ''} detected`)
          }
        }
      }

      // Reload media
      await loadMemory()
      
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleDeleteMedia = async () => {
    if (!deletingMediaId) return

    const mediaToDelete = media.find(m => m.id === deletingMediaId)
    if (!mediaToDelete) return

    const key = mediaToDelete.file_url.split('/memories/')[1]
    if (key) {
      await supabase.storage.from('memories').remove([key])
    }

    await supabase.from('memory_media').delete().eq('id', deletingMediaId)

    const newMedia = media.filter(m => m.id !== deletingMediaId)
    setMedia(newMedia)

    if (selectedMedia?.id === deletingMediaId) {
      setSelectedMedia(newMedia[0] || null)
    }

    if (mediaToDelete.is_cover && newMedia.length > 0) {
      await supabase.from('memory_media').update({ is_cover: true }).eq('id', newMedia[0].id)
      newMedia[0].is_cover = true
    }

    setShowDeleteConfirm(false)
    setDeletingMediaId(null)
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleDateString('en-US', { 
      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' 
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white/60">Loading memory...</div>
      </div>
    )
  }

  if (!memory) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-white/60 mb-4">Memory not found</p>
          <Link href="/dashboard/memories" className="text-amber-500 hover:underline">
            Back to memories
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-6">
      {/* Toasts */}
      <AnimatePresence>
        {xpToasts.map(toast => (
          <Toast
            key={toast.id}
            amount={toast.amount}
            message={toast.message}
            onComplete={() => removeToast(toast.id)}
          />
        ))}
      </AnimatePresence>

      {/* Header */}
      <header className="mb-6 flex items-center justify-between">
        <Link href="/dashboard/memories" className="flex items-center gap-2 px-3 py-2 bg-gray-900/90 rounded-xl text-white/70 hover:text-white transition-all border border-white/10">
          <ChevronLeft size={18} />
          <span>Back</span>
        </Link>
        
        <div className="flex items-center gap-2">
          <button
            onClick={toggleFavorite}
            className={`p-2.5 bg-gray-900/90 rounded-xl transition-all border border-white/10 ${memory.is_favorite ? 'text-red-500' : 'text-white/50 hover:text-red-500'}`}
          >
            <Heart size={18} fill={memory.is_favorite ? 'currentColor' : 'none'} />
          </button>
          <button
            onClick={() => setIsEditing(true)}
            className="p-2.5 bg-gray-900/90 text-white/50 hover:text-white rounded-xl transition-all border border-white/10"
          >
            <Edit2 size={18} />
          </button>
          <button
            onClick={handleDelete}
            className="p-2.5 bg-gray-900/90 text-white/50 hover:text-red-500 rounded-xl transition-all border border-white/10"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Image & Face Tagging */}
          <div className="lg:col-span-2 space-y-4">
            {selectedMedia ? (
              <>
                {/* Tab buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setActiveTab('faces')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === 'faces' 
                        ? 'bg-amber-600 text-white' 
                        : 'bg-gray-800 text-white/50 hover:text-white'
                    }`}
                  >
                    👤 Tag People
                  </button>
                  <button
                    onClick={() => setActiveTab('caption')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === 'caption' 
                        ? 'bg-amber-600 text-white' 
                        : 'bg-gray-800 text-white/50 hover:text-white'
                    }`}
                  >
                    ✏️ Add Story
                  </button>
                </div>

                {/* Content based on tab */}
                {activeTab === 'faces' ? (
                  <FaceTagger
                    mediaId={selectedMedia.id}
                    imageUrl={selectedMedia.file_url}
                    onXPEarned={showXP}
                  />
                ) : (
                  <div className="space-y-4">
                    <div className="rounded-xl overflow-hidden bg-black">
                      <img src={selectedMedia.file_url} alt="" className="w-full" />
                    </div>
                    <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                      <CaptionEditor
                        mediaId={selectedMedia.id}
                        onXPEarned={showXP}
                      />
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="aspect-video flex flex-col items-center justify-center bg-gray-900/90 rounded-xl border border-white/10">
                <ImageIcon size={48} className="text-white/30 mb-4" />
                <p className="text-white/50 mb-4">No photos yet</p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg"
                >
                  <Upload size={18} />
                  Upload Photos
                </button>
              </div>
            )}

            {/* Media thumbnails */}
            {media.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {media.map(m => (
                  <button
                    key={m.id}
                    onClick={() => setSelectedMedia(m)}
                    className={`relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                      selectedMedia?.id === m.id ? 'border-amber-500' : 'border-transparent hover:border-white/30'
                    }`}
                  >
                    <img src={m.file_url} alt="" className="w-full h-full object-cover" />
                    {m.is_cover && (
                      <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-amber-600 rounded-full flex items-center justify-center">
                        <Sparkles size={10} className="text-white" />
                      </div>
                    )}
                  </button>
                ))}
                
                {/* Add more photos button */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="flex-shrink-0 w-16 h-16 rounded-lg border-2 border-dashed border-white/20 hover:border-amber-500 flex items-center justify-center transition-colors"
                >
                  {uploading ? (
                    <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Plus size={20} className="text-white/50" />
                  )}
                </button>
              </div>
            )}

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={handlePhotoUpload}
              className="hidden"
            />
          </div>

          {/* Sidebar - Memory Details */}
          <div className="space-y-4">
            {/* Title & Description */}
            <div className="bg-gray-900/90 rounded-xl p-4 border border-white/10">
              <h1 className="text-xl font-bold text-white mb-2">
                {memory.title || 'Untitled Memory'}
              </h1>
              
              {memory.description && (
                <p className="text-white/70 text-sm mb-4">{memory.description}</p>
              )}

              <div className="space-y-2 text-sm">
                {memory.memory_date && (
                  <div className="flex items-center gap-2 text-white/60">
                    <Calendar size={14} />
                    {formatDate(memory.memory_date)}
                  </div>
                )}
                {memory.location_name && (
                  <div className="flex items-center gap-2 text-white/60">
                    <MapPin size={14} />
                    {memory.location_name}
                  </div>
                )}
              </div>
            </div>

            {/* AI Insights */}
            {(memory.ai_summary || memory.ai_mood || memory.ai_category) && (
              <div className="bg-gray-900/90 rounded-xl p-4 border border-white/10">
                <h3 className="text-sm font-medium text-amber-500 flex items-center gap-2 mb-3">
                  <Sparkles size={14} />
                  AI Insights
                </h3>
                
                {memory.ai_summary && (
                  <p className="text-white/70 text-sm mb-3">{memory.ai_summary}</p>
                )}
                
                <div className="flex flex-wrap gap-2">
                  {memory.ai_mood && (
                    <span className="px-2 py-1 bg-purple-600/30 text-purple-300 rounded-full text-xs capitalize">
                      {memory.ai_mood}
                    </span>
                  )}
                  {memory.ai_category && (
                    <span className="px-2 py-1 bg-blue-600/30 text-blue-300 rounded-full text-xs capitalize">
                      {memory.ai_category}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Delete selected media */}
            {selectedMedia && (
              <button
                onClick={() => {
                  setDeletingMediaId(selectedMedia.id)
                  setShowDeleteConfirm(true)
                }}
                className="w-full py-2 text-red-400 hover:text-red-300 text-sm flex items-center justify-center gap-2"
              >
                <Trash2 size={14} />
                Delete this photo
              </button>
            )}
          </div>
        </div>
      </main>

      {/* Edit Modal */}
      <Modal isOpen={isEditing} onClose={() => setIsEditing(false)} title="Edit Memory">
        <div className="space-y-4">
          <div>
            <label className="block text-white/50 text-sm mb-1">Title</label>
            <input
              type="text"
              value={editForm.title}
              onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
            />
          </div>
          <div>
            <label className="block text-white/50 text-sm mb-1">Description</label>
            <textarea
              value={editForm.description}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white resize-none"
            />
          </div>
          <div>
            <label className="block text-white/50 text-sm mb-1">Date</label>
            <input
              type="date"
              value={editForm.memory_date}
              onChange={(e) => setEditForm({ ...editForm, memory_date: e.target.value })}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
            />
          </div>
          <div>
            <label className="block text-white/50 text-sm mb-1">Location</label>
            <input
              type="text"
              value={editForm.location_name}
              onChange={(e) => setEditForm({ ...editForm, location_name: e.target.value })}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
            />
          </div>
          <button
            onClick={handleSaveEdit}
            className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium"
          >
            Save Changes
          </button>
        </div>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal isOpen={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} title="Delete Photo">
        <p className="text-white/70 mb-6">Are you sure you want to delete this photo?</p>
        <div className="flex gap-3">
          <button
            onClick={() => setShowDeleteConfirm(false)}
            className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={handleDeleteMedia}
            className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
          >
            Delete
          </button>
        </div>
      </Modal>
    </div>
  )
}
