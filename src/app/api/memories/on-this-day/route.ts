import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/memories/on-this-day - Fetch memories from the same date in previous years
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get current month and day
  const today = new Date()
  const month = today.getMonth() + 1 // 1-12
  const day = today.getDate()
  const currentYear = today.getFullYear()

  // Query memories where memory_date matches the same month and day (any year except current)
  // Using Postgres date functions to extract month and day
  const { data, error } = await supabase
    .from('memories')
    .select(`
      id,
      title,
      description,
      memory_date,
      memory_type,
      ai_summary,
      ai_mood,
      ai_category,
      created_at,
      memory_media (
        id,
        file_url,
        file_type,
        is_cover
      )
    `)
    .eq('user_id', user.id)
    .not('memory_date', 'is', null)
    .order('memory_date', { ascending: false })

  if (error) {
    console.error('Error fetching on-this-day memories:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Filter memories that match the same month and day but different year
  const matchingMemories = (data || []).filter(memory => {
    if (!memory.memory_date) return false
    const memoryDate = new Date(memory.memory_date)
    const memoryMonth = memoryDate.getMonth() + 1
    const memoryDay = memoryDate.getDate()
    const memoryYear = memoryDate.getFullYear()
    
    // Match same month and day, but not current year
    return memoryMonth === month && memoryDay === day && memoryYear < currentYear
  })

  // Add years_ago field to each memory
  const memoriesWithYearsAgo = matchingMemories.map(memory => {
    const memoryYear = new Date(memory.memory_date).getFullYear()
    const yearsAgo = currentYear - memoryYear
    return {
      ...memory,
      years_ago: yearsAgo
    }
  })

  // Sort by years_ago (most recent first)
  memoriesWithYearsAgo.sort((a, b) => a.years_ago - b.years_ago)

  return NextResponse.json({ 
    memories: memoriesWithYearsAgo,
    date: {
      month,
      day,
      formatted: today.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
    }
  })
}
