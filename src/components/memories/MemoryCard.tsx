'use client'

import { useState } from 'react'
import { Heart, MapPin, Users, Sparkles } from 'lucide-react'
import Link from 'next/link'

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

interface MemoryCardProps {
  memory: Memory
}

const MOOD_COLORS: Record<string, string> = {
  joyful: 'from-yellow-500/20 to-orange-500/20',
  peaceful: 'from-blue-500/20 to-cyan-500/20',
  adventurous: 'from-green-500/20 to-emerald-500/20',
  nostalgic: 'from-purple-500/20 to-pink-500/20',
  excited: 'from-red-500/20 to-orange-500/20',
  neutral: 'from-gray-500/20 to-gray-600/20',
}

export default function MemoryCard({ memory }: MemoryCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  const coverMedia = memory.memory_media?.find(m => m.is_cover) || memory.memory_media?.[0]
  const mediaCount = memory.memory_media?.length || 0
  const moodGradient = MOOD_COLORS[memory.ai_mood] || MOOD_COLORS.neutral

  const formatDate = (dateStr: string) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  return (
    <Link href={`/dashboard/memories/${memory.id}`}>
      <div
        className="group relative aspect-square rounded-xl overflow-hidden bg-gray-800 cursor-pointer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Image */}
        {coverMedia ? (
          <img
            src={coverMedia.file_url}
            alt={memory.title || 'Memory'}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${moodGradient} flex items-center justify-center`}>
            <Sparkles size={32} className="text-white/50" />
          </div>
        )}

        {/* Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

        {/* Media Count Badge */}
        {mediaCount > 1 && (
          <div className="absolute top-2 right-2 px-2 py-1 bg-black/60 rounded-full text-white text-xs flex items-center gap-1">
            <Users size={12} />
            {mediaCount}
          </div>
        )}

        {/* Favorite Heart */}
        {memory.is_favorite && (
          <div className="absolute top-2 left-2">
            <Heart size={18} className="text-red-500 fill-red-500" />
          </div>
        )}

        {/* AI Category Tag */}
        {memory.ai_category && (
          <div className="absolute top-2 left-2 px-2 py-0.5 bg-amber-600/80 rounded-full text-white text-xs flex items-center gap-1">
            <Sparkles size={10} />
            {memory.ai_category}
          </div>
        )}

        {/* Bottom Info */}
        <div className="absolute bottom-0 left-0 right-0 p-3">
          {memory.title && (
            <h3 className="text-white font-medium text-sm truncate mb-1">
              {memory.title}
            </h3>
          )}
          
          <div className="flex items-center gap-2 text-white/70 text-xs">
            {memory.memory_date && (
              <span>{formatDate(memory.memory_date)}</span>
            )}
            {memory.location_name && (
              <span className="flex items-center gap-1 truncate">
                <MapPin size={10} />
                {memory.location_name}
              </span>
            )}
          </div>

          {/* AI Summary on hover */}
          {isHovered && memory.ai_summary && (
            <p className="text-white/60 text-xs mt-2 line-clamp-2 animate-in fade-in duration-200">
              {memory.ai_summary}
            </p>
          )}
        </div>
      </div>
    </Link>
  )
}
