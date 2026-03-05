import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * GET /api/intelligence
 * Returns the current user's intelligence profile for RAG context injection
 */
export async function GET() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: intelligence, error } = await supabase
    .from('user_intelligence')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
    console.error('Error fetching intelligence:', error)
    return NextResponse.json({ error: 'Failed to fetch intelligence' }, { status: 500 })
  }

  if (!intelligence) {
    return NextResponse.json({ 
      exists: false,
      message: 'No intelligence profile computed yet. POST to /api/intelligence/compute to generate.'
    })
  }

  // Check if stale (older than 7 days)
  const lastComputed = intelligence.last_computed_at ? new Date(intelligence.last_computed_at) : null
  const isStale = lastComputed ? (Date.now() - lastComputed.getTime()) > 7 * 24 * 60 * 60 * 1000 : true

  return NextResponse.json({
    exists: true,
    isStale,
    intelligence: {
      personalitySummary: intelligence.personality_summary,
      communicationStyle: intelligence.communication_style,
      coreValues: intelligence.core_values,
      topicInterests: intelligence.topic_interests,
      expertiseAreas: intelligence.expertise_areas,
      importantPeople: intelligence.important_people,
      lifeChapters: intelligence.life_chapters,
      keyLifeEvents: intelligence.key_life_events,
      commonPhrases: intelligence.common_phrases,
      storytellingStyle: intelligence.storytelling_style,
      humorStyle: intelligence.humor_style,
      lastComputedAt: intelligence.last_computed_at,
      version: intelligence.version,
    }
  })
}
