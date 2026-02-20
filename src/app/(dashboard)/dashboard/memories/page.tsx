'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Image as ImageIcon, Calendar, MapPin, Sparkles, Grid, List, Globe, ChevronLeft } from 'lucide-react'
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
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const supabase = createClient()

  const loadMemories = useCallback(async () => {
    setLoading(true)
    
    let url = '/api/memories?limit=100'
    if (selectedCategory) {
      url += `&category=${selectedCategory}`
    }

    const response = await fetch(url)
    const data = await response.json()
    
    setMemories(data.memories || [])
    setLoading(false)
  }, [selectedCategory])

  useEffect(() => {
    loadMemories()
  }, [loadMemories])

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
  const groupedMemories = memories.reduce((acc, memory) => {
    const date = memory.memory_date ? new Date(memory.memory_date) : new Date()
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    if (!acc[key]) acc[key] = []
    acc[key].push(memory)
    return acc
  }, {} as Record<string, Memory[]>)

  const sortedGroups = Object.keys(groupedMemories).sort().reverse()

  return (
    <div className="min-h-screen p-6">
      {/* Header */}
      <header className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="p-2 bg-black/40 rounded-xl text-white/70 hover:bg-white/20 hover:text-white transition-all">
              <ChevronLeft size={20} />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white">Memories</h1>
              <p className="text-white/50 text-sm">{memories.length} moments captured</p>
            </div>
          </div>

            <div className="flex items-center gap-3">
              {/* View Mode Toggle */}
              <div className="flex items-center bg-black/40 rounded-xl p-1">
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
                  <List size={18} />
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

          {/* Category Filters */}
          <div className="flex items-center gap-2 mt-4 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id === 'all' ? null : cat.id)}
                className={`px-4 py-2 rounded-xl whitespace-nowrap transition-all text-sm ${
                  (cat.id === 'all' && !selectedCategory) || selectedCategory === cat.id
                    ? 'bg-amber-500 text-white'
                    : 'bg-black/40 text-white/70 hover:bg-white/20 hover:text-white'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
      </header>

      {/* Content */}
      <main>
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-white/60">Loading memories...</div>
          </div>
        ) : memories.length === 0 ? (
          <div className="bg-black/40 rounded-2xl p-12 border border-white/20 text-center">
            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-4 mx-auto">
              <ImageIcon size={32} className="text-white/40" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">No memories yet</h3>
            <p className="text-white/50 mb-4">Start capturing your life's moments</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl transition-all mx-auto"
            >
              <Plus size={18} />
              Create your first memory
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          /* Grid View */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {memories.map((memory) => (
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
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 rounded-full">
                      <Calendar size={14} className="text-amber-500" />
                      <span className="text-white font-medium">{monthName} {year}</span>
                    </div>
                    <div className="flex-1 h-px bg-gray-800" />
                    <span className="text-gray-500 text-sm">{groupedMemories[groupKey].length} memories</span>
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
            memories={memories} 
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
