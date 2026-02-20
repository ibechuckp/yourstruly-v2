'use client'

import { useState, useEffect, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ChevronLeft, Sparkles, Trash2, Plus, Image as ImageIcon, Check, X } from 'lucide-react'
import Link from 'next/link'
import MemoryCard from '@/components/memories/MemoryCard'

interface Album {
  id: string
  name: string
  description: string
  is_smart: boolean
  smart_criteria: {
    type: string
    value?: string
    contact_id?: string
    year?: number
    location?: string
    category?: string
  } | null
}

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
  memory_media: {
    id: string
    file_url: string
    file_type: string
    is_cover: boolean
  }[]
}

export default function AlbumDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [album, setAlbum] = useState<Album | null>(null)
  const [memories, setMemories] = useState<Memory[]>([])
  const [allMemories, setAllMemories] = useState<Memory[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedMemories, setSelectedMemories] = useState<Set<string>>(new Set())
  const [addingMemories, setAddingMemories] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    loadAlbum()
  }, [id])

  const loadAlbum = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Load album
    const { data: albumData } = await supabase
      .from('memory_albums')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (!albumData) {
      setLoading(false)
      return
    }

    setAlbum(albumData)

    // Load memories based on album type
    if (albumData.is_smart && albumData.smart_criteria) {
      // Smart album - query based on criteria
      let memoriesQuery = supabase
        .from('memories')
        .select(`*, memory_media(id, file_url, file_type, is_cover)`)
        .eq('user_id', user.id)

      const criteria = albumData.smart_criteria

      if (criteria.type === 'year' && criteria.year) {
        const start = `${criteria.year}-01-01`
        const end = `${criteria.year}-12-31`
        memoriesQuery = memoriesQuery.gte('memory_date', start).lte('memory_date', end)
      } else if (criteria.type === 'category' && criteria.category) {
        memoriesQuery = memoriesQuery.eq('ai_category', criteria.category)
      } else if (criteria.type === 'location' && criteria.location) {
        memoriesQuery = memoriesQuery.ilike('location_name', `%${criteria.location}%`)
      }

      const { data: memoriesData } = await memoriesQuery.order('memory_date', { ascending: false })
      setMemories(memoriesData || [])
    } else {
      // Manual album - query album_memories junction
      const { data: albumMemories } = await supabase
        .from('album_memories')
        .select('memory_id')
        .eq('album_id', id)

      const memoryIds = albumMemories?.map(am => am.memory_id) || []

      if (memoryIds.length > 0) {
        const { data: memoriesData } = await supabase
          .from('memories')
          .select(`*, memory_media(id, file_url, file_type, is_cover)`)
          .in('id', memoryIds)
          .order('memory_date', { ascending: false })
        
        setMemories(memoriesData || [])
      } else {
        setMemories([])
      }
    }

    setLoading(false)
  }

  const loadAllMemories = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Get memories already in this album
    const { data: albumMemories } = await supabase
      .from('album_memories')
      .select('memory_id')
      .eq('album_id', id)

    const existingIds = new Set(albumMemories?.map(am => am.memory_id) || [])

    // Load all memories not in this album
    const { data } = await supabase
      .from('memories')
      .select(`*, memory_media(id, file_url, file_type, is_cover)`)
      .eq('user_id', user.id)
      .order('memory_date', { ascending: false })

    setAllMemories((data || []).filter(m => !existingIds.has(m.id)))
  }

  const handleOpenAddModal = () => {
    loadAllMemories()
    setSelectedMemories(new Set())
    setShowAddModal(true)
  }

  const toggleMemorySelection = (memoryId: string) => {
    setSelectedMemories(prev => {
      const next = new Set(prev)
      if (next.has(memoryId)) {
        next.delete(memoryId)
      } else {
        next.add(memoryId)
      }
      return next
    })
  }

  const handleAddMemories = async () => {
    if (selectedMemories.size === 0) return
    setAddingMemories(true)

    const records = Array.from(selectedMemories).map(memoryId => ({
      album_id: id,
      memory_id: memoryId,
    }))

    await supabase.from('album_memories').insert(records)

    setShowAddModal(false)
    setSelectedMemories(new Set())
    setAddingMemories(false)
    loadAlbum()
  }

  const handleRemoveFromAlbum = async (memoryId: string) => {
    if (!confirm('Remove this memory from the album?')) return

    await supabase
      .from('album_memories')
      .delete()
      .eq('album_id', id)
      .eq('memory_id', memoryId)

    loadAlbum()
  }

  const handleDeleteAlbum = async () => {
    if (!confirm('Delete this album? Memories will not be deleted.')) return

    await supabase.from('memory_albums').delete().eq('id', id)
    window.location.href = '/dashboard/albums'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white/60">Loading album...</div>
      </div>
    )
  }

  if (!album) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-white/60 mb-4">Album not found</p>
          <Link href="/dashboard/albums" className="text-amber-500 hover:underline">
            Back to albums
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-6">
      {/* Header */}
      <header className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              href="/dashboard/albums" 
              className="p-2 bg-gray-900/90 rounded-xl text-white/70 hover:text-white transition-all border border-white/10"
            >
              <ChevronLeft size={20} />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-white">{album.name}</h1>
                {album.is_smart && (
                  <span className="px-2 py-0.5 bg-amber-600/80 rounded-full text-white text-xs flex items-center gap-1">
                    <Sparkles size={10} />
                    Smart
                  </span>
                )}
              </div>
              <p className="text-white/50 text-sm">
                {memories.length} {memories.length === 1 ? 'memory' : 'memories'}
                {album.description && ` · ${album.description}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!album.is_smart && (
              <button
                onClick={handleOpenAddModal}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-xl transition-all"
              >
                <Plus size={18} />
                <span className="hidden sm:inline">Add Memories</span>
              </button>
            )}
            <button
              onClick={handleDeleteAlbum}
              className="p-2.5 bg-gray-900/90 text-white/50 hover:text-red-500 rounded-xl transition-all border border-white/10"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* Memories Grid */}
      <main>
        {memories.length === 0 ? (
          <div className="bg-gray-900/90 rounded-2xl p-12 border border-white/10 text-center">
            <ImageIcon size={48} className="text-white/20 mb-4 mx-auto" />
            <h3 className="text-lg font-medium text-white mb-2">No memories in this album</h3>
            <p className="text-white/50 mb-4">
              {album.is_smart 
                ? 'Memories matching the criteria will appear here automatically.'
                : 'Add memories to this album to see them here.'}
            </p>
            {!album.is_smart && (
              <button
                onClick={handleOpenAddModal}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl transition-all"
              >
                <Plus size={18} />
                Add Memories
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {memories.map((memory) => (
              <div key={memory.id} className="relative group">
                <MemoryCard memory={memory} />
                {!album.is_smart && (
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleRemoveFromAlbum(memory.id); }}
                    className="absolute top-2 right-2 p-1.5 bg-red-500/80 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Add Memories Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900/95 rounded-2xl p-6 border border-white/10 w-full max-w-4xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">Add Memories to Album</h2>
              <button onClick={() => setShowAddModal(false)} className="p-2 text-white/50 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <p className="text-white/50 text-sm mb-4">
              Select memories to add. Selected: {selectedMemories.size}
            </p>

            <div className="flex-1 overflow-y-auto">
              {allMemories.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-white/50">No memories available to add.</p>
                  <Link href="/dashboard/memories" className="text-amber-500 hover:underline mt-2 inline-block">
                    Create some memories first
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  {allMemories.map((memory) => {
                    const isSelected = selectedMemories.has(memory.id)
                    const coverMedia = memory.memory_media?.find(m => m.is_cover) || memory.memory_media?.[0]
                    
                    return (
                      <button
                        key={memory.id}
                        onClick={() => toggleMemorySelection(memory.id)}
                        className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                          isSelected ? 'border-amber-500 ring-2 ring-amber-500/50' : 'border-transparent hover:border-white/30'
                        }`}
                      >
                        {coverMedia ? (
                          <img src={coverMedia.file_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                            <ImageIcon size={24} className="text-white/30" />
                          </div>
                        )}
                        
                        {isSelected && (
                          <div className="absolute inset-0 bg-amber-500/30 flex items-center justify-center">
                            <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center">
                              <Check size={20} className="text-white" />
                            </div>
                          </div>
                        )}
                        
                        <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                          <p className="text-white text-xs truncate">{memory.title || 'Untitled'}</p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-white/10">
              <button onClick={() => setShowAddModal(false)} className="px-4 py-2 text-white/50 hover:text-white">
                Cancel
              </button>
              <button
                onClick={handleAddMemories}
                disabled={selectedMemories.size === 0 || addingMemories}
                className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl disabled:opacity-50 transition-all"
              >
                {addingMemories ? 'Adding...' : `Add ${selectedMemories.size} ${selectedMemories.size === 1 ? 'Memory' : 'Memories'}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
