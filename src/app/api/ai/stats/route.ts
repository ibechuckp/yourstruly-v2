import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// Get user stats for AI context
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get counts
  const [memoriesRes, contactsRes, postscriptsRes, albumsRes, interviewsRes] = await Promise.all([
    supabase.from('memories').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('contacts').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('postscripts').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('memory_albums').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('interview_sessions').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
  ])

  // Get recent memories
  const { data: recentMemories } = await supabase
    .from('memories')
    .select('id, title, memory_date, ai_category')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5)

  // Get memory categories
  const { data: categories } = await supabase
    .from('memories')
    .select('ai_category')
    .eq('user_id', user.id)
    .not('ai_category', 'is', null)

  const categoryCounts: Record<string, number> = {}
  categories?.forEach(m => {
    if (m.ai_category) {
      categoryCounts[m.ai_category] = (categoryCounts[m.ai_category] || 0) + 1
    }
  })

  // Get earliest and latest memory
  const { data: dateRange } = await supabase
    .from('memories')
    .select('memory_date')
    .eq('user_id', user.id)
    .not('memory_date', 'is', null)
    .order('memory_date', { ascending: true })

  const stats = {
    counts: {
      memories: memoriesRes.count || 0,
      contacts: contactsRes.count || 0,
      postscripts: postscriptsRes.count || 0,
      albums: albumsRes.count || 0,
      interviews: interviewsRes.count || 0,
    },
    recentMemories: recentMemories || [],
    categories: categoryCounts,
    dateRange: {
      earliest: dateRange?.[0]?.memory_date || null,
      latest: dateRange?.[dateRange.length - 1]?.memory_date || null,
    },
  }

  return NextResponse.json({ stats })
}
