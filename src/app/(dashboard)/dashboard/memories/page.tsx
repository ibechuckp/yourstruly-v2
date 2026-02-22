'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Image as ImageIcon, Calendar, MapPin, Sparkles, Grid, List, Globe, ChevronLeft, Search, X, Clock } from 'lucide-react'
import Link from 'next/link'
import CreateMemoryModal from '@/components/memories/CreateMemoryModal'
import MemoryCard from '@/components/memories/MemoryCard'
import GlobeView from '@/components/memories/GlobeView'
import { MemoryTimeline } from '@/components/memories/MemoryTimeline'
import '@/styles/page-styles.css'

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
  memory_media?: {
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
      .neq('memory_type', 'wisdom') // Filter out wisdom - those belong on /wisdom page
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
    <div className="page-container">
      {/* Warm gradient background with blobs */}
      <div className="page-background">
        <div className="page-blob page-blob-1" />
        <div className="page-blob page-blob-2" />
        <div className="page-blob page-blob-3" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <header className="mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="page-header-back">
                <ChevronLeft size={20} />
              </Link>
              <div>
                <h1 className="page-header-title">Memories</h1>
                <p className="page-header-subtitle">{filteredMemories.length} of {memories.length} moments</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#406A56]/50" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search memories..."
                  className="form-input pl-10 pr-10 w-48 sm:w-64"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#406A56]/50 hover:text-[#406A56]">
                    <X size={16} />
                  </button>
                )}
              </div>

              {/* View Mode Toggle */}
              <div className="hidden sm:flex items-center glass-card-page p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-[#406A56] text-white' : 'text-[#406A56]/60 hover:text-[#406A56]'}`}
                >
                  <Grid size={18} />
                </button>
                <button
                  onClick={() => setViewMode('timeline')}
                  className={`p-2 rounded-lg transition-all ${viewMode === 'timeline' ? 'bg-[#406A56] text-white' : 'text-[#406A56]/60 hover:text-[#406A56]'}`}
                >
                  <Clock size={18} />
                </button>
                <button
                  onClick={() => setViewMode('globe')}
                  className={`p-2 rounded-lg transition-all ${viewMode === 'globe' ? 'bg-[#406A56] text-white' : 'text-[#406A56]/60 hover:text-[#406A56]'}`}
                >
                  <Globe size={18} />
                </button>
              </div>

              {/* Create Button */}
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn-primary"
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
                className={`filter-btn ${(cat.id === 'all' && !selectedCategory) || selectedCategory === cat.id ? 'filter-btn-active' : ''}`}
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
                className="form-input text-sm py-2"
              />
              <span className="text-[#406A56]/60">to</span>
              <input
                type="date"
                value={dateFilter.end}
                onChange={(e) => setDateFilter({ ...dateFilter, end: e.target.value })}
                className="form-input text-sm py-2"
              />
            </div>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-[#C35F33] hover:text-[#a84d28] text-sm whitespace-nowrap font-medium"
              >
                Clear filters
              </button>
            )}
          </div>
        </header>

        {/* Horizontal Timeline (always visible when there are memories) */}
        {!loading && memories.length > 0 && (
          <MemoryTimeline 
            memories={memories.map(m => ({
              id: m.id,
              title: m.title,
              memory_date: m.memory_date,
              cover_url: m.memory_media?.find(mm => mm.is_cover)?.file_url || m.memory_media?.[0]?.file_url,
              memory_type: m.memory_type
            }))}
          />
        )}

        {/* Content */}
        <main>
          {loading ? (
            <div className="loading-container">
              <div className="loading-text">Loading memories...</div>
            </div>
          ) : filteredMemories.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <ImageIcon size={32} className="text-[#406A56]/50" />
              </div>
              <h3 className="empty-state-title">
                {memories.length === 0 ? 'No memories yet' : 'No memories match your filters'}
              </h3>
              <p className="empty-state-text">
                {memories.length === 0 ? 'Start capturing your life\'s moments' : 'Try adjusting your search or filters'}
              </p>
              {memories.length === 0 ? (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="btn-primary mx-auto"
                >
                  <Plus size={18} />
                  Create your first memory
                </button>
              ) : (
                <button onClick={clearFilters} className="btn-secondary">
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
                      <div className="flex items-center gap-2 px-3 py-1.5 glass-card-page">
                        <Calendar size={14} className="text-[#D9C61A]" />
                        <span className="text-[#2d2d2d] font-medium">{monthName} {year}</span>
                      </div>
                      <div className="flex-1 h-px bg-[#406A56]/10" />
                      <span className="text-[#406A56]/60 text-sm">{groupedMemories[groupKey].length} memories</span>
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
      </div>

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
