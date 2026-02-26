import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/memories/mood-stats - Get mood statistics
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const searchParams = request.nextUrl.searchParams
  const view = searchParams.get('view') || 'distribution' // distribution | journey

  if (view === 'journey') {
    // Get emotional journey (mood timeline by month)
    const { data, error } = await supabase.rpc('get_emotional_journey', {
      p_user_id: user.id
    })

    if (error) {
      // Fallback if function doesn't exist yet
      const { data: memories } = await supabase
        .from('memories')
        .select('mood, memory_date')
        .eq('user_id', user.id)
        .not('mood', 'is', null)
        .not('memory_date', 'is', null)
        .order('memory_date', { ascending: false })

      // Group by month manually
      const byMonth: Record<string, Record<string, number>> = {}
      for (const m of memories || []) {
        const month = m.memory_date?.substring(0, 7) // YYYY-MM
        if (!month) continue
        if (!byMonth[month]) byMonth[month] = {}
        byMonth[month][m.mood] = (byMonth[month][m.mood] || 0) + 1
      }

      const journey = Object.entries(byMonth)
        .sort(([a], [b]) => b.localeCompare(a))
        .map(([period, moods]) => ({ period, moods }))

      return NextResponse.json({ journey })
    }

    return NextResponse.json({ journey: data })
  }

  // Get mood distribution
  const { data, error } = await supabase.rpc('get_mood_distribution', {
    p_user_id: user.id
  })

  if (error) {
    // Fallback if function doesn't exist yet
    const { data: memories } = await supabase
      .from('memories')
      .select('mood')
      .eq('user_id', user.id)
      .not('mood', 'is', null)

    const counts: Record<string, number> = {}
    let total = 0
    for (const m of memories || []) {
      counts[m.mood] = (counts[m.mood] || 0) + 1
      total++
    }

    const distribution = Object.entries(counts)
      .map(([mood, count]) => ({
        mood,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100 * 100) / 100 : 0
      }))
      .sort((a, b) => b.count - a.count)

    return NextResponse.json({ distribution, total })
  }

  // Calculate total
  const total = (data || []).reduce((sum: number, d: any) => sum + parseInt(d.count), 0)

  return NextResponse.json({ distribution: data, total })
}
