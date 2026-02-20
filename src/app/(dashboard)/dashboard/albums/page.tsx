'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, FolderOpen, Sparkles, User, MapPin, Calendar, ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import Modal from '@/components/ui/Modal'

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
  cover_media?: {
    file_url: string
  } | null
  memory_count?: number
}

interface Contact {
  id: string
  full_name: string
}

const SMART_ALBUM_TYPES = [
  { id: 'person', label: 'By Person', icon: User, description: 'All photos with a specific person' },
  { id: 'year', label: 'By Year', icon: Calendar, description: 'All photos from a specific year' },
  { id: 'location', label: 'By Location', icon: MapPin, description: 'All photos from a place' },
  { id: 'category', label: 'By Category', icon: Sparkles, description: 'Travel, Family, Celebrations, etc.' },
]

const CATEGORIES = ['travel', 'family', 'celebration', 'nature', 'food', 'everyday']

export default function AlbumsPage() {
  const [albums, setAlbums] = useState<Album[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [albumType, setAlbumType] = useState<'manual' | 'smart'>('manual')
  const [smartType, setSmartType] = useState<string | null>(null)
  const [newAlbum, setNewAlbum] = useState({ name: '', description: '' })
  const [smartValue, setSmartValue] = useState('')
  const supabase = createClient()

  useEffect(() => {
    loadAlbums()
    loadContacts()
  }, [])

  const loadAlbums = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('memory_albums')
      .select(`
        *,
        cover_media:memory_media(file_url)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    // Get memory counts
    const albumsWithCounts = await Promise.all((data || []).map(async (album) => {
      if (album.is_smart) {
        // For smart albums, count matching memories
        let query = supabase.from('memories').select('id', { count: 'exact', head: true }).eq('user_id', user.id)
        
        if (album.smart_criteria?.type === 'year' && album.smart_criteria?.year) {
          const start = `${album.smart_criteria.year}-01-01`
          const end = `${album.smart_criteria.year}-12-31`
          query = query.gte('memory_date', start).lte('memory_date', end)
        } else if (album.smart_criteria?.type === 'category') {
          query = query.eq('ai_category', album.smart_criteria.category)
        } else if (album.smart_criteria?.type === 'location') {
          query = query.ilike('location_name', `%${album.smart_criteria.location}%`)
        }
        
        const { count } = await query
        return { ...album, memory_count: count || 0 }
      } else {
        // Manual album - count linked memories
        const { count } = await supabase
          .from('album_memories')
          .select('memory_id', { count: 'exact', head: true })
          .eq('album_id', album.id)
        return { ...album, memory_count: count || 0 }
      }
    }))

    setAlbums(albumsWithCounts)
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

  const handleCreate = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    let albumData: any = {
      user_id: user.id,
      name: newAlbum.name,
      description: newAlbum.description,
      is_smart: albumType === 'smart',
    }

    if (albumType === 'smart' && smartType) {
      let criteria: any = { type: smartType }
      
      if (smartType === 'person') {
        criteria.contact_id = smartValue
        const contact = contacts.find(c => c.id === smartValue)
        albumData.name = albumData.name || `Photos with ${contact?.full_name}`
      } else if (smartType === 'year') {
        criteria.year = parseInt(smartValue)
        albumData.name = albumData.name || `${smartValue}`
      } else if (smartType === 'location') {
        criteria.location = smartValue
        albumData.name = albumData.name || smartValue
      } else if (smartType === 'category') {
        criteria.category = smartValue
        albumData.name = albumData.name || smartValue.charAt(0).toUpperCase() + smartValue.slice(1)
      }
      
      albumData.smart_criteria = criteria
    }

    if (!albumData.name) {
      alert('Please enter an album name')
      return
    }

    await supabase.from('memory_albums').insert(albumData)
    
    setShowCreateModal(false)
    setNewAlbum({ name: '', description: '' })
    setAlbumType('manual')
    setSmartType(null)
    setSmartValue('')
    loadAlbums()
  }

  const years = Array.from({ length: 20 }, (_, i) => new Date().getFullYear() - i)

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-gray-950/90 backdrop-blur-md border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/memories" className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
              <ChevronLeft size={20} className="text-gray-400" />
            </Link>
            <div>
              <h1 className="text-xl font-semibold text-white">Albums</h1>
              <p className="text-sm text-gray-400">{albums.length} albums</p>
            </div>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">New Album</span>
          </button>
        </div>
      </header>

      {/* Albums Grid */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-400">Loading albums...</div>
          </div>
        ) : albums.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <FolderOpen size={48} className="text-gray-600 mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No albums yet</h3>
            <p className="text-gray-400 mb-4">Create albums to organize your memories</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors"
            >
              <Plus size={18} />
              Create your first album
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {albums.map((album) => (
              <Link
                key={album.id}
                href={`/dashboard/albums/${album.id}`}
                className="group"
              >
                <div className="aspect-square rounded-xl overflow-hidden bg-gray-800 relative">
                  {album.cover_media?.file_url ? (
                    <img
                      src={album.cover_media.file_url}
                      alt={album.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-600/20 to-orange-600/20">
                      {album.is_smart ? (
                        <Sparkles size={32} className="text-amber-500" />
                      ) : (
                        <FolderOpen size={32} className="text-gray-500" />
                      )}
                    </div>
                  )}
                  
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  
                  {album.is_smart && (
                    <div className="absolute top-2 left-2 px-2 py-0.5 bg-amber-600/80 rounded-full text-white text-xs flex items-center gap-1">
                      <Sparkles size={10} />
                      Smart
                    </div>
                  )}
                  
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <h3 className="text-white font-medium truncate">{album.name}</h3>
                    <p className="text-gray-400 text-sm">{album.memory_count} memories</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      {/* Create Album Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create Album" showDone={false}>
        {/* Album Type Selection */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => { setAlbumType('manual'); setSmartType(null); }}
            className={`flex-1 py-3 rounded-xl text-sm font-medium transition-colors ${
              albumType === 'manual' ? 'bg-amber-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            Manual Album
          </button>
          <button
            onClick={() => setAlbumType('smart')}
            className={`flex-1 py-3 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
              albumType === 'smart' ? 'bg-amber-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            <Sparkles size={14} />
            Smart Album
          </button>
        </div>

        {albumType === 'manual' ? (
          /* Manual Album Form */
          <div className="space-y-4">
            <div>
              <label className="block text-gray-400 text-sm mb-1">Album Name</label>
              <input
                type="text"
                value={newAlbum.name}
                onChange={(e) => setNewAlbum({ ...newAlbum, name: e.target.value })}
                placeholder="Summer 2024, Family Vacation..."
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-1">Description (optional)</label>
              <textarea
                value={newAlbum.description}
                onChange={(e) => setNewAlbum({ ...newAlbum, description: e.target.value })}
                rows={2}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
              />
            </div>
          </div>
        ) : !smartType ? (
          /* Smart Album Type Selection */
          <div className="space-y-2">
            <p className="text-gray-400 text-sm mb-4">Choose how to auto-organize:</p>
            {SMART_ALBUM_TYPES.map((type) => {
              const Icon = type.icon
              return (
                <button
                  key={type.id}
                  onClick={() => setSmartType(type.id)}
                  className="w-full flex items-center gap-4 p-4 bg-gray-800 hover:bg-gray-700 rounded-xl transition-colors text-left"
                >
                  <div className="w-10 h-10 bg-amber-600/20 rounded-lg flex items-center justify-center">
                    <Icon size={20} className="text-amber-500" />
                  </div>
                  <div>
                    <p className="text-white font-medium">{type.label}</p>
                    <p className="text-gray-400 text-sm">{type.description}</p>
                  </div>
                </button>
              )
            })}
          </div>
        ) : (
          /* Smart Album Value Selection */
          <div className="space-y-4">
            <button
              onClick={() => setSmartType(null)}
              className="text-amber-500 text-sm hover:underline"
            >
              ← Back to types
            </button>

            {smartType === 'person' && (
              <div>
                <label className="block text-gray-400 text-sm mb-2">Select Person</label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {contacts.map((contact) => (
                    <button
                      key={contact.id}
                      onClick={() => setSmartValue(contact.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${
                        smartValue === contact.id ? 'bg-amber-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-full bg-amber-600/50 flex items-center justify-center text-white text-sm">
                        {contact.full_name.charAt(0)}
                      </div>
                      {contact.full_name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {smartType === 'year' && (
              <div>
                <label className="block text-gray-400 text-sm mb-2">Select Year</label>
                <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                  {years.map((year) => (
                    <button
                      key={year}
                      onClick={() => setSmartValue(year.toString())}
                      className={`py-2 rounded-lg text-sm transition-colors ${
                        smartValue === year.toString() ? 'bg-amber-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      {year}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {smartType === 'location' && (
              <div>
                <label className="block text-gray-400 text-sm mb-1">Location Name</label>
                <input
                  type="text"
                  value={smartValue}
                  onChange={(e) => setSmartValue(e.target.value)}
                  placeholder="Paris, New York, Beach..."
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            )}

            {smartType === 'category' && (
              <div>
                <label className="block text-gray-400 text-sm mb-2">Select Category</label>
                <div className="grid grid-cols-2 gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSmartValue(cat)}
                      className={`py-3 rounded-xl text-sm capitalize transition-colors ${
                        smartValue === cat ? 'bg-amber-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Custom name override */}
            <div>
              <label className="block text-gray-400 text-sm mb-1">Album Name (optional)</label>
              <input
                type="text"
                value={newAlbum.name}
                onChange={(e) => setNewAlbum({ ...newAlbum, name: e.target.value })}
                placeholder="Auto-generated if empty"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>
        )}

        {/* Create Button */}
        <button
          onClick={handleCreate}
          disabled={albumType === 'smart' && !smartType}
          className="w-full mt-6 py-3 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-colors"
        >
          Create Album
        </button>
      </Modal>
    </div>
  )
}
