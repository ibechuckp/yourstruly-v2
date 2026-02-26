// Memory Album Types

export interface MemoryAlbum {
  id: string
  user_id: string
  name: string
  description: string | null
  cover_image_url: string | null
  memory_ids: string[]
  theme: AlbumTheme
  created_at: string
  updated_at: string
}

export type AlbumTheme = 'travel' | 'milestone' | 'relationship' | 'custom'

export interface AlbumWithMemories extends MemoryAlbum {
  memories?: AlbumMemory[]
}

export interface AlbumMemory {
  id: string
  title: string | null
  description: string | null
  memory_date: string | null
  memory_type: string
  location_name: string | null
  ai_summary: string | null
  ai_mood: string | null
  ai_category: string | null
  is_favorite: boolean
  memory_media?: {
    id: string
    file_url: string
    file_type: string
    is_cover: boolean
  }[]
}

export const CAPSULE_THEMES: { value: AlbumTheme; label: string; icon: string; color: string }[] = [
  { value: 'travel', label: 'Travel', icon: '✈️', color: 'from-blue-500/20 to-cyan-500/20' },
  { value: 'milestone', label: 'Milestone', icon: '🏆', color: 'from-amber-500/20 to-yellow-500/20' },
  { value: 'relationship', label: 'Relationship', icon: '💕', color: 'from-pink-500/20 to-rose-500/20' },
  { value: 'custom', label: 'Custom', icon: '✨', color: 'from-purple-500/20 to-indigo-500/20' },
]
