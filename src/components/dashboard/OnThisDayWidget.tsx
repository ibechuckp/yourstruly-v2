'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getCache, setCache, CACHE_KEYS } from '@/lib/cache'
import { Calendar, ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react'
import Link from 'next/link'

interface Memory {
  id: string
  title: string
  memory_date: string
  location_name: string
  memory_media: {
    file_url: string
    is_cover: boolean
  }[]
}

export default function OnThisDayWidget() {
  const [memories, setMemories] = useState<Memory[]>(() => getCache<Memory[]>(CACHE_KEYS.ON_THIS_DAY) || [])
  const [loading, setLoading] = useState(() => !getCache<Memory[]>(CACHE_KEYS.ON_THIS_DAY))
  const [currentIndex, setCurrentIndex] = useState(0)
  const supabase = createClient()

  useEffect(() => {
    // Only fetch if no cache
    if (!getCache<Memory[]>(CACHE_KEYS.ON_THIS_DAY)) {
      loadOnThisDay()
    }
  }, [])

  const loadOnThisDay = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const today = new Date()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')

    // Fetch all user memories and filter client-side for "on this day"
    // (Supabase JS client doesn't support date::text casting for LIKE)
    const { data, error } = await supabase
      .from('memories')
      .select('id, title, memory_date, location_name')
      .eq('user_id', user.id)
      .order('memory_date', { ascending: false })

    if (error) {
      console.error('OnThisDay error:', error)
      setLoading(false)
      return
    }

    // Filter client-side for memories on this day in any year
    const pattern = `-${month}-${day}`
    const filtered = (data || []).filter(m => m.memory_date?.includes(pattern))

    // Map to include empty media array (we're not using photos in this widget for now)
    const memoriesWithMedia = filtered.map(m => ({
      ...m,
      memory_media: []
    }))

    setMemories(memoriesWithMedia)
    setCache(CACHE_KEYS.ON_THIS_DAY, memoriesWithMedia)
    setLoading(false)
  }

  const getYearsAgo = (dateStr: string) => {
    const memoryYear = new Date(dateStr).getFullYear()
    const currentYear = new Date().getFullYear()
    const diff = currentYear - memoryYear
    if (diff === 0) return 'Today'
    if (diff === 1) return '1 year ago'
    return `${diff} years ago`
  }

  const getCoverImage = (memory: Memory) => {
    const cover = memory.memory_media?.find(m => m.is_cover) || memory.memory_media?.[0]
    return cover?.file_url
  }

  if (loading) {
    return (
      <div className="bg-gray-900/90 rounded-2xl p-5 border border-white/10">
        <div className="animate-pulse">
          <div className="h-4 bg-white/10 rounded w-1/2 mb-4"></div>
          <div className="aspect-video bg-white/5 rounded-xl"></div>
        </div>
      </div>
    )
  }

  if (memories.length === 0) {
    return null // Don't show widget if no memories for this day
  }

  const currentMemory = memories[currentIndex]
  const coverImage = getCoverImage(currentMemory)

  return (
    <div className="bg-gray-900/90 rounded-2xl p-5 border border-white/10">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-amber-500" />
          <span className="text-white font-medium">On This Day</span>
        </div>
        {memories.length > 1 && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentIndex(i => (i === 0 ? memories.length - 1 : i - 1))}
              className="p-1 text-white/50 hover:text-white transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-white/40 text-xs">
              {currentIndex + 1}/{memories.length}
            </span>
            <button
              onClick={() => setCurrentIndex(i => (i === memories.length - 1 ? 0 : i + 1))}
              className="p-1 text-white/50 hover:text-white transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Memory Preview */}
      <Link href={`/dashboard/memories/${currentMemory.id}`} className="block group">
        <div className="relative aspect-video rounded-xl overflow-hidden mb-3">
          {coverImage ? (
            <img 
              src={coverImage} 
              alt={currentMemory.title || 'Memory'} 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
              <ImageIcon size={32} className="text-white/30" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <div className="absolute bottom-3 left-3 right-3">
            <span className="px-2 py-0.5 bg-amber-500 text-white text-xs rounded-full">
              {getYearsAgo(currentMemory.memory_date)}
            </span>
          </div>
        </div>

        <h3 className="text-white font-medium group-hover:text-amber-400 transition-colors">
          {currentMemory.title || 'Untitled Memory'}
        </h3>
        {currentMemory.location_name && (
          <p className="text-white/50 text-sm mt-1">{currentMemory.location_name}</p>
        )}
      </Link>
    </div>
  )
}
