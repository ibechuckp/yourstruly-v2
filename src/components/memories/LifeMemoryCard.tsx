'use client'

import Link from 'next/link'
import { MapPin, Calendar } from 'lucide-react'
import { MoodType } from '@/lib/ai/moodAnalysis'
import { getCategoryIcon } from '@/lib/dashboard/icons'

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
  mood?: MoodType | null
  memory_media?: {
    id: string
    file_url: string
    file_type: string
    is_cover: boolean
  }[]
}

interface LifeMemoryCardProps {
  memory: Memory
}

// Warm gradient palettes for text-only cards — varied by category/mood
const TEXT_CARD_THEMES: Record<string, { bg: string; accent: string; text: string }> = {
  family:      { bg: 'linear-gradient(135deg, #FDF8F3 0%, #F5EDE4 100%)', accent: '#C35F33', text: '#3d2d20' },
  travel:      { bg: 'linear-gradient(135deg, #EDF6F4 0%, #D4EDE8 100%)', accent: '#406A56', text: '#1d3028' },
  celebration: { bg: 'linear-gradient(135deg, #FFFBEA 0%, #FFF3B0 100%)', accent: '#8a7c08', text: '#3d3000' },
  career:      { bg: 'linear-gradient(135deg, #F0EDF8 0%, #E4DCF0 100%)', accent: '#4A3552', text: '#241a30' },
  nature:      { bg: 'linear-gradient(135deg, #EDF6EE 0%, #D4EBDA 100%)', accent: '#2d6a34', text: '#1a3a1e' },
  food:        { bg: 'linear-gradient(135deg, #FFF0EA 0%, #FFE0D0 100%)', accent: '#C35F33', text: '#4d2010' },
  friends:     { bg: 'linear-gradient(135deg, #FFF0F8 0%, #FFD9EE 100%)', accent: '#9b3569', text: '#4d1535' },
  everyday:    { bg: 'linear-gradient(135deg, #F5F5F0 0%, #EAEAE0 100%)', accent: '#555545', text: '#333320' },
  default:     { bg: 'linear-gradient(135deg, #FDF8F3 0%, #F0EBE2 100%)', accent: '#C35F33', text: '#3d2d20' },
}

const MOOD_THEMES: Record<string, { bg: string; accent: string; text: string }> = {
  joyful:      { bg: 'linear-gradient(135deg, #FFFBEA 0%, #FFF3B0 100%)', accent: '#D9A000', text: '#4d3800' },
  loving:      { bg: 'linear-gradient(135deg, #FFF0F5 0%, #FFD9E8 100%)', accent: '#C03070', text: '#4d1535' },
  grateful:    { bg: 'linear-gradient(135deg, #F0F8EE 0%, #DCF0D5 100%)', accent: '#3d7a30', text: '#1a3515' },
  peaceful:    { bg: 'linear-gradient(135deg, #EDF4FB 0%, #D5E8F5 100%)', accent: '#2d6090', text: '#0d2535' },
  nostalgic:   { bg: 'linear-gradient(135deg, #F5F0FA 0%, #E8DCFA 100%)', accent: '#6040a0', text: '#281545' },
  proud:       { bg: 'linear-gradient(135deg, #FFFBEA 0%, #FFE9A0 100%)', accent: '#9a7800', text: '#4d3a00' },
  bittersweet: { bg: 'linear-gradient(135deg, #F5F0EA 0%, #E8DDD0 100%)', accent: '#906040', text: '#3d2510' },
  reflective:  { bg: 'linear-gradient(135deg, #F0EDF8 0%, #E0DBF0 100%)', accent: '#504070', text: '#20163a' },
}

function getTheme(memory: Memory) {
  if (memory.mood && MOOD_THEMES[memory.mood]) return MOOD_THEMES[memory.mood]
  if (memory.ai_category && TEXT_CARD_THEMES[memory.ai_category]) return TEXT_CARD_THEMES[memory.ai_category]
  return TEXT_CARD_THEMES.default
}

function formatDate(dateStr: string) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

export default function LifeMemoryCard({ memory }: LifeMemoryCardProps) {
  const coverMedia = memory.memory_media?.find(m => m.is_cover) || memory.memory_media?.[0]
  const hasMedia = !!(coverMedia?.file_url)

  // ── Photo card ────────────────────────────────────────
  if (hasMedia) {
    return (
      <Link href={`/dashboard/memories/${memory.id}`} className="block group">
        <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-100">
          <img
            src={coverMedia!.file_url}
            alt={memory.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          {/* Title at bottom */}
          <div className="absolute bottom-0 left-0 right-0 p-2">
            <p className="text-white text-[11px] font-medium leading-tight line-clamp-2 drop-shadow">
              {memory.title}
            </p>
          </div>
          {/* Category badge */}
          {memory.ai_category && (
            <div className="absolute top-1.5 right-1.5 bg-black/30 backdrop-blur-sm rounded-full px-1.5 py-0.5 text-[9px] text-white/90">
              {getCategoryIcon(memory.ai_category)} {memory.ai_category}
            </div>
          )}
        </div>
      </Link>
    )
  }

  // ── Text-only card (wisdom-style) ────────────────────
  const theme = getTheme(memory)
  const snippet = memory.ai_summary || memory.description || ''
  const displayText = snippet.length > 100 ? snippet.slice(0, 97) + '…' : snippet

  return (
    <Link href={`/dashboard/memories/${memory.id}`} className="block group">
      <div
        className="relative aspect-square rounded-xl overflow-hidden flex flex-col justify-between p-3 transition-transform duration-200 group-hover:scale-[1.02]"
        style={{ background: theme.bg }}
      >
        {/* Top accent bar */}
        <div
          className="absolute top-0 left-0 right-0 h-[3px] rounded-t-xl"
          style={{ background: `linear-gradient(90deg, ${theme.accent}99, ${theme.accent}33)` }}
        />

        {/* Quote mark */}
        <div
          className="absolute top-2 left-2 text-4xl leading-none select-none"
          style={{ color: `${theme.accent}20`, fontFamily: 'Georgia, serif' }}
        >
          ❝
        </div>

        {/* Content */}
        <div className="relative z-10 flex-1 flex flex-col pt-4">
          <p
            className="text-[11px] leading-relaxed line-clamp-4 flex-1"
            style={{
              color: theme.text,
              fontFamily: 'Georgia, serif',
              fontStyle: 'italic',
            }}
          >
            {displayText || memory.title}
          </p>
        </div>

        {/* Footer */}
        <div className="relative z-10 mt-2 space-y-1">
          <p
            className="text-[10px] font-semibold line-clamp-1"
            style={{ color: theme.accent }}
          >
            {memory.title}
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            {memory.memory_date && (
              <span className="flex items-center gap-0.5 text-[9px]" style={{ color: `${theme.text}99` }}>
                <Calendar size={8} />
                {formatDate(memory.memory_date)}
              </span>
            )}
            {memory.location_name && (
              <span className="flex items-center gap-0.5 text-[9px]" style={{ color: `${theme.text}99` }}>
                <MapPin size={8} />
                {memory.location_name.split(',')[0]}
              </span>
            )}
          </div>
        </div>

        {/* Bottom accent */}
        <div
          className="absolute bottom-0 right-0 text-5xl leading-none select-none"
          style={{ color: `${theme.accent}10`, fontFamily: 'Georgia, serif' }}
        >
          ❞
        </div>
      </div>
    </Link>
  )
}
