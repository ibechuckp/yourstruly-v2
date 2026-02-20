'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Image as ImageIcon, Calendar, MapPin, Sparkles, Grid, List, Globe, ChevronLeft, Search, X, Clock } from 'lucide-react'
import Link from 'next/link'
import CreateMemoryModal from '@/components/memories/CreateMemoryModal'
import MemoryCard from '@/components/memories/MemoryCard'
import GlobeView from '@/components/memories/GlobeView'

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
  memory_media: {
    id: string
    file_url: string
    file_type: string
    is_cover: boolean
  }[]
}

type ViewMode = 'grid' | 'timeline' | 'globe'

export default function MemoriesPage() {
  const [memories, setMemories] = useState<Memory[]>([])
  const [filteredMemories, setFilteredMemories] = useState<Memory[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [dateFilter, setDateFilter] = useState<{ start: string; end: string }>({ start: '', end: '' })
  const [showFilters, setShowFilters] = useState(false)
  const supabase = createClient()

  const loadMemories = useCallback(async () => {
    setLoading(true)
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    let query = supabase
      .from('memories')
      .select(`*, memory_media(id, file_url, file_type, is_cover)`)
      .eq('user_id', user.id)
      .order('memory_date', { ascending: false })

    if (selectedCategory && selectedCategory !== 'all') {
      query = query.eq('ai_category', selectedCategory)
    }

    if (dateFilter.start) {
      query = query.gte('memory_date', dateFilter.start)
    }
    if (dateFilter.end) {
      query = query.lte('memory_date', dateFilter.end)
    }

    const { data } = await query
    setMemories(data || [])
    setFilteredMemories(data || [])
    setLoading(false)
  }, [selectedCategory, dateFilter, supabase])

  useEffect(() => {
    loadMemories()
  }, [loadMemories])

  // Filter by search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredMemories(memories)
      return
    }

    const query = searchQuery.toLowerCase()
    const filtered = memories.filter(m => 
      m.title?.toLowerCase().includes(query) ||
      m.description?.toLowerCase().includes(query) ||
      m.location_name?.toLowerCase().includes(query) ||
      m.ai_labels?.some(l => l.toLowerCase().includes(query))
    )
    setFilteredMemories(filtered)
  }, [searchQuery, memories])

  const categories = [
    { id: 'all', label: 'All' },
    { id: 'travel', label: 'Travel' },
    { id: 'family', label: 'Family' },
    { id: 'celebration', label: 'Celebrations' },
    { id: 'nature', label: 'Nature' },
    { id: 'food', label: 'Food' },
    { id: 'everyday', label: 'Everyday' },
  ]

  // Group memories by year/month for timeline
  const groupedMemories = filteredMemories.reduce((acc, memory) => {
    const date = memory.memory_date ? new Date(memory.memory_date) : new Date()
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    if (!acc[key]) acc[key] = []
    acc[key].push(memory)
    return acc
  }, {} as Record<string, Memory[]>)

  const sortedGroups = Object.keys(groupedMemories).sort().reverse()

  const clearFilters = () => {
    setSearchQuery('')
    setSelectedCategory(null)
    setDateFilter({ start: '', end: '' })
  }

  const hasActiveFilters = searchQuery || selectedCategory || dateFilter.start || dateFilter.end

  return (
    <div className="min-h-screen p-6">
      {/* Header */}
      <header className="mb-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="p-2 bg-gray-900/90 rounded-xl text-white/70 hover:text-white transition-all border border-white/10">
              <ChevronLeft size={20} />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white">Memories</h1>
              <p className="text-white/50 text-sm">{filteredMemories.length} of {memories.length} moments</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search memories..."
                className="pl-10 pr-4 py-2.5 bg-gray-900/90 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-amber-500/50 w-48 sm:w-64"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white">
                  <X size={16} />
                </button>
              )}
            </div>

            {/* View Mode Toggle */}
            <div className="hidden sm:flex items-center bg-gray-900/90 rounded-xl p-1 border border-white/10">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-amber-500 text-white' : 'text-white/50 hover:text-white'}`}
              >
                <Grid size={18} />
              </button>
              <button
                onClick={() => setViewMode('timeline')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'timeline' ? 'bg-amber-500 text-white' : 'text-white/50 hover:text-white'}`}
              >
                <Clock size={18} />
              </button>
              <button
                onClick={() => setViewMode('globe')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'globe' ? 'bg-amber-500 text-white' : 'text-white/50 hover:text-white'}`}
              >
                <Globe size={18} />
              </button>
            </div>

            {/* Create Button */}
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-xl transition-all"
            >
              <Plus size={18} />
              <span className="hidden sm:inline">Add Memory</span>
            </button>
          </div>
        </div>

        {/* Filters Row */}
        <div className="flex items-center gap-2 mt-4 overflow-x-auto pb-2">
          {/* Category Filters */}
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id === 'all' ? null : cat.id)}
              className={`px-4 py-2 rounded-xl whitespace-nowrap transition-all text-sm ${
                (cat.id === 'all' && !selectedCategory) || selectedCategory === cat.id
                  ? 'bg-amber-500 text-white'
                  : 'bg-gray-900/90 text-white/70 hover:text-white border border-white/10'
              }`}
            >
              {cat.label}
            </button>
          ))}

          {/* Date Filter */}
          <div className="flex items-center gap-2 ml-2">
            <input
              type="date"
              value={dateFilter.start}
              onChange={(e) => setDateFilter({ ...dateFilter, start: e.target.value })}
              className="px-3 py-2 bg-gray-900/90 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            />
            <span className="text-white/50">to</span>
            <input
              type="date"
              value={dateFilter.end}
              onChange={(e) => setDateFilter({ ...dateFilter, end: e.target.value })}
              className="px-3 py-2 bg-gray-900/90 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            />
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="px-3 py-2 text-amber-500 hover:text-amber-400 text-sm whitespace-nowrap"
            >
              Clear filters
            </button>
          )}
        </div>
      </header>

      {/* Content */}
      <main>
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-white/60">Loading memories...</div>
          </div>
        ) : filteredMemories.length === 0 ? (
          <div className="bg-gray-900/90 rounded-2xl p-12 border border-white/10 text-center">
            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-4 mx-auto">
              <ImageIcon size={32} className="text-white/40" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">
              {memories.length === 0 ? 'No memories yet' : 'No memories match your filters'}
            </h3>
            <p className="text-white/50 mb-4">
              {memories.length === 0 ? 'Start capturing your life\'s moments' : 'Try adjusting your search or filters'}
            </p>
            {memories.length === 0 ? (
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl transition-all mx-auto"
              >
                <Plus size={18} />
                Create your first memory
              </button>
            ) : (
              <button onClick={clearFilters} className="text-amber-500 hover:underline">
                Clear all filters
              </button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          /* Grid View */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {filteredMemories.map((memory) => (
              <MemoryCard key={memory.id} memory={memory} />
            ))}
          </div>
        ) : viewMode === 'timeline' ? (
          /* Timeline View */
          <div className="space-y-8">
            {sortedGroups.map((groupKey) => {
              const [year, month] = groupKey.split('-')
              const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleString('default', { month: 'long' })
              
              return (
                <div key={groupKey}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-900/90 rounded-full border border-white/10">
                      <Calendar size={14} className="text-amber-500" />
                      <span className="text-white font-medium">{monthName} {year}</span>
                    </div>
                    <div className="flex-1 h-px bg-white/10" />
                    <span className="text-white/40 text-sm">{groupedMemories[groupKey].length} memories</span>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {groupedMemories[groupKey].map((memory) => (
                      <MemoryCard key={memory.id} memory={memory} />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          /* Globe View */
          <GlobeView 
            memories={filteredMemories} 
            onSelectMemory={(memory) => {
              window.location.href = `/dashboard/memories/${memory.id}`
            }}
          />
        )}
      </main>

      {/* Create Memory Modal */}
      <CreateMemoryModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={() => {
          loadMemories()
          setShowCreateModal(false)
        }}
      />
    </div>
  )
}
