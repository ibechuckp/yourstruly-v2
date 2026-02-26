import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/memories/search - Search memories using smart tags
 * 
 * Query params:
 * - q: search query (searches tags, caption, title, description)
 * - tags: comma-separated specific tags to filter by
 * - mood: filter by mood (joyful, peaceful, adventurous, etc.)
 * - category: filter by category
 * - limit: max results (default 50)
 * - offset: pagination offset
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get('q')?.toLowerCase().trim()
  const tags = searchParams.get('tags')?.split(',').map(t => t.trim().toLowerCase())
  const mood = searchParams.get('mood')?.toLowerCase()
  const category = searchParams.get('category')?.toLowerCase()
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
  const offset = parseInt(searchParams.get('offset') || '0')

  // If no search criteria, return empty
  if (!query && !tags && !mood && !category) {
    return NextResponse.json({ 
      memories: [], 
      total: 0,
      hint: 'Provide a search query (q), tags, mood, or category parameter' 
    })
  }

  // Build search - we need to search in memory_media.ai_labels
  // First, find media with matching tags
  let mediaQuery = supabase
    .from('memory_media')
    .select('memory_id, ai_labels')
    .eq('user_id', user.id)
    .not('ai_labels', 'is', null)

  const { data: allMedia, error: mediaError } = await mediaQuery

  if (mediaError) {
    return NextResponse.json({ error: mediaError.message }, { status: 500 })
  }

  // Filter media by search criteria
  const matchingMemoryIds = new Set<string>()
  const memoryScores = new Map<string, number>()

  for (const media of allMedia || []) {
    const labels = media.ai_labels as Record<string, unknown>
    if (!labels) continue

    let score = 0
    const allTags = (labels.allTags as string[]) || []
    const caption = (labels.caption as string)?.toLowerCase() || ''
    const mediaCategory = (labels.category as string)?.toLowerCase() || ''
    const mediaMood = ((labels.mood as string[]) || [])[0]?.toLowerCase() || ''

    // Check query against all tags and caption
    if (query) {
      const queryWords = query.split(/\s+/)
      for (const word of queryWords) {
        // Exact tag match = high score
        if (allTags.includes(word)) {
          score += 10
        }
        // Partial tag match = medium score
        else if (allTags.some(t => t.includes(word) || word.includes(t))) {
          score += 5
        }
        // Caption contains word = lower score
        if (caption.includes(word)) {
          score += 3
        }
      }
    }

    // Check specific tags filter
    if (tags) {
      const matchCount = tags.filter(t => allTags.includes(t)).length
      if (matchCount > 0) {
        score += matchCount * 15
      }
    }

    // Check mood filter
    if (mood && mediaMood === mood) {
      score += 20
    }

    // Check category filter
    if (category && mediaCategory === category) {
      score += 20
    }

    // If score > 0, this memory matches
    if (score > 0) {
      matchingMemoryIds.add(media.memory_id)
      const existing = memoryScores.get(media.memory_id) || 0
      memoryScores.set(media.memory_id, Math.max(existing, score))
    }
  }

  // Also search memory title/description
  if (query) {
    const { data: textMatches } = await supabase
      .from('memories')
      .select('id, title, description')
      .eq('user_id', user.id)
      .or(`title.ilike.%${query}%,description.ilike.%${query}%`)

    for (const memory of textMatches || []) {
      matchingMemoryIds.add(memory.id)
      const existing = memoryScores.get(memory.id) || 0
      memoryScores.set(memory.id, existing + 5) // Boost for text match
    }
  }

  if (matchingMemoryIds.size === 0) {
    return NextResponse.json({ memories: [], total: 0 })
  }

  // Sort by score and paginate
  const sortedIds = [...matchingMemoryIds]
    .sort((a, b) => (memoryScores.get(b) || 0) - (memoryScores.get(a) || 0))
  
  const paginatedIds = sortedIds.slice(offset, offset + limit)

  // Fetch full memories
  const { data: memories, error } = await supabase
    .from('memories')
    .select(`
      *,
      memory_media (
        id,
        file_url,
        file_type,
        is_cover,
        ai_labels,
        width,
        height
      )
    `)
    .eq('user_id', user.id)
    .in('id', paginatedIds)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Sort by our scoring
  const sortedMemories = paginatedIds
    .map(id => memories?.find(m => m.id === id))
    .filter(Boolean)

  return NextResponse.json({
    memories: sortedMemories,
    total: matchingMemoryIds.size,
    offset,
    limit,
  })
}
