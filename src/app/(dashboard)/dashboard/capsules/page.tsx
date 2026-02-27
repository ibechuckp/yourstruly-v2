'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Sparkles, Search, Filter } from 'lucide-react'
import AlbumCard from '@/components/albums/AlbumCard'
import CreateAlbumModal from '@/components/albums/CreateAlbumModal'
import { MemoryAlbum, AlbumTheme, CAPSULE_THEMES } from '@/types/album'
import '@/styles/page-styles.css'

export default function AlbumsPage() {
  const [albums, setAlbums] = useState<MemoryAlbum[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [themeFilter, setThemeFilter] = useState<AlbumTheme | 'all'>('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editAlbum, setEditAlbum] = useState<MemoryAlbum | null>(null)
  
  const supabase = createClient()

  const loadAlbums = useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    let query = supabase
      .from('memory_albums')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })

    if (themeFilter !== 'all') {
      query = query.eq('theme', themeFilter)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error loading albums:', error)
    } else {
      setAlbums(data || [])
    }
    setLoading(false)
  }, [supabase, themeFilter])

  useEffect(() => {
    loadAlbums()
  }, [loadAlbums])

  const filteredAlbums = albums.filter(c => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      c.name.toLowerCase().includes(query) ||
      c.description?.toLowerCase().includes(query)
    )
  })

  const handleSaveAlbum = (album: MemoryAlbum) => {
    if (editAlbum) {
      setAlbums(prev => prev.map(c => c.id === album.id ? album : c))
    } else {
      setAlbums(prev => [album, ...prev])
    }
    setEditAlbum(null)
    setShowCreateModal(false)
  }

  const handleDeleteAlbum = async (album: MemoryAlbum) => {
    if (!confirm(`Delete "${album.name}"? This cannot be undone.`)) return
    
    const { error } = await supabase
      .from('memory_albums')
      .delete()
      .eq('id', album.id)

    if (!error) {
      setAlbums(prev => prev.filter(c => c.id !== album.id))
    }
  }

  const handleEditAlbum = (album: MemoryAlbum) => {
    setEditAlbum(album)
    setShowCreateModal(true)
  }

  return (
    <div className="pb-8 pb-24">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-[#2d2d2d] mb-2">Memory Albums</h1>
            <p className="text-gray-600">Curated collections of your precious memories</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => { setEditAlbum(null); setShowCreateModal(true) }}
            className="px-5 py-3 bg-[#406A56] hover:bg-[#4a7a64] text-white rounded-xl font-medium transition-colors flex items-center gap-2 shadow-lg shadow-[#406A56]/20"
          >
            <Plus size={20} />
            Create Album
          </motion.button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search albums..."
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 bg-white/70 backdrop-blur-sm focus:border-[#406A56] focus:ring-2 focus:ring-[#406A56]/20 outline-none transition-all"
            />
          </div>

          {/* Theme Filter */}
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-gray-500" />
            <select
              value={themeFilter}
              onChange={e => setThemeFilter(e.target.value as AlbumTheme | 'all')}
              className="px-4 py-3 rounded-xl border border-gray-200 bg-white/70 backdrop-blur-sm focus:border-[#406A56] outline-none cursor-pointer"
            >
              <option value="all">All Themes</option>
              {CAPSULE_THEMES.map(theme => (
                <option key={theme.value} value={theme.value}>{theme.icon} {theme.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="aspect-[4/5] rounded-xl bg-white/50 animate-pulse" />
          ))}
        </div>
      ) : filteredAlbums.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-20"
        >
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
            <Sparkles size={40} className="text-amber-500" />
          </div>
          {searchQuery || themeFilter !== 'all' ? (
            <>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No albums found</h3>
              <p className="text-gray-500 mb-6">Try adjusting your search or filters</p>
              <button
                onClick={() => { setSearchQuery(''); setThemeFilter('all') }}
                className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors"
              >
                Clear Filters
              </button>
            </>
          ) : (
            <>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">Create your first album</h3>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">
                Memory albums let you curate and organize your favorite memories into themed collections — perfect for reliving your best moments.
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-6 py-3 bg-[#406A56] hover:bg-[#4a7a64] text-white rounded-xl font-medium transition-colors inline-flex items-center gap-2"
              >
                <Plus size={20} />
                Create Your First Album
              </button>
            </>
          )}
        </motion.div>
      ) : (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
        >
          <AnimatePresence>
            {filteredAlbums.map((album, index) => (
              <motion.div
                key={album.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.05 }}
              >
                <AlbumCard
                  album={album}
                  onEdit={handleEditAlbum}
                  onDelete={handleDeleteAlbum}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateAlbumModal
            isOpen={showCreateModal}
            onClose={() => { setShowCreateModal(false); setEditAlbum(null) }}
            onCreated={handleSaveAlbum}
            editAlbum={editAlbum}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
