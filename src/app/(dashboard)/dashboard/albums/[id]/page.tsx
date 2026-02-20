'use client'

import { useState, useEffect, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ChevronLeft, Sparkles, Edit2, Trash2, Plus, Image as ImageIcon } from 'lucide-react'
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
  const [loading, setLoading] = useState(true)
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
    let memoriesQuery

    if (albumData.is_smart && albumData.smart_criteria) {
      // Smart album - query based on criteria
      memoriesQuery = supabase
        .from('memories')
        .select(`
          *,
          memory_media(id, file_url, file_type, is_cover)
        `)
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
      // Person-based smart albums would need face tags query
    } else {
      // Manual album - query album_memories junction
      const { data: albumMemories } = await supabase
        .from('album_memories')
        .select('memory_id')
        .eq('album_id', id)

      const memoryIds = albumMemories?.map(am => am.memory_id) || []

      if (memoryIds.length > 0) {
        memoriesQuery = supabase
          .from('memories')
          .select(`
            *,
            memory_media(id, file_url, file_type, is_cover)
          `)
          .in('id', memoryIds)
      }
    }

    if (memoriesQuery) {
      const { data: memoriesData } = await memoriesQuery.order('memory_date', { ascending: false })
      setMemories(memoriesData || [])
    }

    setLoading(false)
  }

  const handleDelete = async () => {
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
              className="p-2 bg-gray-900/80 backdrop-blur-md rounded-xl text-white/70 hover:text-white transition-all border border-white/10"
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
                {album.description && ` • ${album.description}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!album.is_smart && (
              <button
                className="p-2.5 bg-gray-900/80 backdrop-blur-md text-white/50 hover:text-white rounded-xl transition-all border border-white/10"
              >
                <Plus size={18} />
              </button>
            )}
            <button
              onClick={handleDelete}
              className="p-2.5 bg-gray-900/80 backdrop-blur-md text-white/50 hover:text-red-500 rounded-xl transition-all border border-white/10"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* Memories Grid */}
      <main>
        {memories.length === 0 ? (
          <div className="bg-gray-900/80 backdrop-blur-md rounded-2xl p-12 border border-white/10 text-center">
            <ImageIcon size={48} className="text-white/20 mb-4 mx-auto" />
            <h3 className="text-lg font-medium text-white mb-2">No memories in this album</h3>
            <p className="text-white/50 mb-4">
              {album.is_smart 
                ? 'Memories matching the criteria will appear here automatically.'
                : 'Add memories to this album to see them here.'}
            </p>
            {!album.is_smart && (
              <Link
                href="/dashboard/memories"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl transition-all"
              >
                <Plus size={18} />
                Browse Memories
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {memories.map((memory) => (
              <MemoryCard key={memory.id} memory={memory} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
