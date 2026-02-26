'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import { X, Plus, Check, Sparkles, FolderPlus } from 'lucide-react'
import { MemoryAlbum, CAPSULE_THEMES } from '@/types/album'

interface AddToAlbumModalProps {
  isOpen: boolean
  onClose: () => void
  memoryId: string
  onAdded?: () => void
}

export default function AddToAlbumModal({ isOpen, onClose, memoryId, onAdded }: AddToAlbumModalProps) {
  const [albums, setAlbums] = useState<MemoryAlbum[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    if (!isOpen) return
    
    const loadAlbums = async () => {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('memory_albums')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })

      setAlbums(data || [])
      setLoading(false)
    }

    loadAlbums()
  }, [isOpen, supabase])

  const isInAlbum = (album: MemoryAlbum) => {
    return album.memory_ids?.includes(memoryId)
  }

  const toggleAlbum = async (album: MemoryAlbum) => {
    setSaving(album.id)
    
    try {
      const isCurrentlyIn = isInAlbum(album)
      const newMemoryIds = isCurrentlyIn
        ? album.memory_ids.filter(id => id !== memoryId)
        : [...(album.memory_ids || []), memoryId]

      const { error } = await supabase
        .from('memory_albums')
        .update({ memory_ids: newMemoryIds })
        .eq('id', album.id)

      if (error) throw error

      // Update local state
      setAlbums(prev => prev.map(c => 
        c.id === album.id ? { ...c, memory_ids: newMemoryIds } : c
      ))
      
      onAdded?.()
    } catch (error) {
      console.error('Error updating album:', error)
    } finally {
      setSaving(null)
    }
  }

  const createNewAlbum = async () => {
    if (!newName.trim()) return
    
    setCreating(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setCreating(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('memory_albums')
        .insert({
          user_id: user.id,
          name: newName.trim(),
          memory_ids: [memoryId],
          theme: 'custom',
        })
        .select()
        .single()

      if (error) throw error

      setAlbums(prev => [data, ...prev])
      setNewName('')
      setShowCreate(false)
      onAdded?.()
    } catch (error) {
      console.error('Error creating album:', error)
    } finally {
      setCreating(false)
    }
  }

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white/95 backdrop-blur-xl rounded-2xl border border-white/50 w-full max-w-md max-h-[80vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#406A56]/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
              <FolderPlus size={20} className="text-amber-600" />
            </div>
            <div>
              <h3 className="text-[#2d2d2d] font-semibold text-lg">Add to Album</h3>
              <p className="text-sm text-gray-500">Select albums or create new</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* Quick Create */}
          {showCreate ? (
            <div className="mb-4 p-4 bg-[#406A56]/5 rounded-xl">
              <input
                type="text"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="New album name..."
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#406A56] focus:ring-2 focus:ring-[#406A56]/20 outline-none transition-all mb-3"
                autoFocus
                onKeyDown={e => e.key === 'Enter' && createNewAlbum()}
              />
              <div className="flex items-center gap-2">
                <button
                  onClick={createNewAlbum}
                  disabled={creating || !newName.trim()}
                  className="flex-1 px-4 py-2 bg-[#406A56] hover:bg-[#4a7a64] text-white rounded-xl font-medium transition-colors disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Create & Add'}
                </button>
                <button
                  onClick={() => { setShowCreate(false); setNewName('') }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowCreate(true)}
              className="w-full mb-4 p-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-[#406A56] hover:text-[#406A56] transition-colors flex items-center justify-center gap-2"
            >
              <Plus size={18} />
              Create New Album
            </button>
          )}

          {/* Existing Albums */}
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 rounded-xl bg-gray-100 animate-pulse" />
              ))}
            </div>
          ) : albums.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Sparkles size={32} className="mx-auto mb-2 opacity-50" />
              <p>No albums yet</p>
              <p className="text-sm">Create your first album above!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {albums.map(album => {
                const theme = CAPSULE_THEMES.find(t => t.value === album.theme) || CAPSULE_THEMES[3]
                const isIn = isInAlbum(album)
                const isSaving = saving === album.id
                
                return (
                  <button
                    key={album.id}
                    onClick={() => toggleAlbum(album)}
                    disabled={isSaving}
                    className={`w-full p-4 rounded-xl border-2 transition-all flex items-center gap-4 text-left ${
                      isIn 
                        ? 'border-[#406A56] bg-[#406A56]/5' 
                        : 'border-gray-200 hover:border-gray-300'
                    } disabled:opacity-50`}
                  >
                    {/* Cover/Theme Icon */}
                    <div className={`w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 ${
                      !album.cover_image_url ? `bg-gradient-to-br ${theme.color}` : ''
                    } flex items-center justify-center`}>
                      {album.cover_image_url ? (
                        <img src={album.cover_image_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-2xl">{theme.icon}</span>
                      )}
                    </div>
                    
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 truncate">{album.name}</p>
                      <p className="text-xs text-gray-500">
                        {album.memory_ids?.length || 0} memories • {theme.label}
                      </p>
                    </div>
                    
                    {/* Status */}
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                      isIn ? 'bg-[#406A56] text-white' : 'border-2 border-gray-300'
                    }`}>
                      {isSaving ? (
                        <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : isIn ? (
                        <Check size={14} />
                      ) : null}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#406A56]/10">
          <button
            onClick={onClose}
            className="w-full px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors"
          >
            Done
          </button>
        </div>
      </motion.div>
    </div>
  )
}
