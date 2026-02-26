import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

interface YearlyStats {
  year: number
  count: number
}

interface MonthlyStats {
  month: string // YYYY-MM format
  count: number
}

interface PersonStats {
  id: string
  name: string
  avatar_url?: string
  memory_count: number
}

interface Milestone {
  type: 'first' | 'count' | 'anniversary'
  label: string
  memory_id?: string
  memory_title?: string
  memory_date?: string
  achieved: boolean
}

export async function GET() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Get all memories for the user (excluding wisdom)
    const { data: memories, error: memoriesError } = await supabase
      .from('memories')
      .select('id, title, memory_date, created_at')
      .eq('user_id', user.id)
      .neq('memory_type', 'wisdom')
      .order('memory_date', { ascending: true })

    if (memoriesError) throw memoriesError

    // Get all media counts
    const { count: mediaCount, error: mediaError } = await supabase
      .from('memory_media')
      .select('id', { count: 'exact', head: true })
      .in('memory_id', memories?.map(m => m.id) || [])

    if (mediaError) throw mediaError

    // Get video count specifically
    const { count: videoCount, error: videoError } = await supabase
      .from('memory_media')
      .select('id', { count: 'exact', head: true })
      .in('memory_id', memories?.map(m => m.id) || [])
      .eq('file_type', 'video')

    if (videoError) throw videoError

    // Calculate stats
    const totalMemories = memories?.length || 0
    const totalMedia = mediaCount || 0
    const totalPhotos = (mediaCount || 0) - (videoCount || 0)
    const totalVideos = videoCount || 0

    // Group by year
    const yearlyStats: Record<number, number> = {}
    const monthlyStats: Record<string, number> = {}
    
    memories?.forEach(m => {
      if (m.memory_date) {
        const date = new Date(m.memory_date)
        const year = date.getFullYear()
        const month = `${year}-${String(date.getMonth() + 1).padStart(2, '0')}`
        
        yearlyStats[year] = (yearlyStats[year] || 0) + 1
        monthlyStats[month] = (monthlyStats[month] || 0) + 1
      }
    })

    // Convert to arrays and sort
    const byYear: YearlyStats[] = Object.entries(yearlyStats)
      .map(([year, count]) => ({ year: parseInt(year), count }))
      .sort((a, b) => a.year - b.year)

    // Find memory-richest month
    const richestMonth = Object.entries(monthlyStats)
      .sort(([, a], [, b]) => b - a)[0]

    // Calculate streak (consecutive days with memories)
    let currentStreak = 0
    let maxStreak = 0
    
    if (memories && memories.length > 0) {
      const sortedByDate = [...memories]
        .filter(m => m.memory_date)
        .sort((a, b) => new Date(b.memory_date!).getTime() - new Date(a.memory_date!).getTime())
      
      if (sortedByDate.length > 0) {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        
        const uniqueDates = [...new Set(sortedByDate.map(m => {
          const d = new Date(m.memory_date!)
          d.setHours(0, 0, 0, 0)
          return d.getTime()
        }))].sort((a, b) => b - a)

        // Check if latest memory is today or yesterday for current streak
        const latestDate = new Date(uniqueDates[0])
        const daysDiff = Math.floor((today.getTime() - latestDate.getTime()) / (1000 * 60 * 60 * 24))
        
        if (daysDiff <= 1) {
          currentStreak = 1
          for (let i = 1; i < uniqueDates.length; i++) {
            const diff = (uniqueDates[i - 1] - uniqueDates[i]) / (1000 * 60 * 60 * 24)
            if (diff === 1) {
              currentStreak++
            } else {
              break
            }
          }
        }

        // Calculate max streak ever
        let tempStreak = 1
        for (let i = 1; i < uniqueDates.length; i++) {
          const diff = (uniqueDates[i - 1] - uniqueDates[i]) / (1000 * 60 * 60 * 24)
          if (diff === 1) {
            tempStreak++
            maxStreak = Math.max(maxStreak, tempStreak)
          } else {
            tempStreak = 1
          }
        }
        maxStreak = Math.max(maxStreak, tempStreak)
      }
    }

    // Get top people (from detected faces linked to contacts)
    const { data: topPeople, error: peopleError } = await supabase
      .from('detected_faces')
      .select(`
        contact_id,
        contacts (
          id,
          full_name,
          avatar_url
        ),
        memory_media!inner (
          memory_id
        )
      `)
      .not('contact_id', 'is', null)
      .in('memory_media.memory_id', memories?.map(m => m.id) || [])

    // Aggregate people counts
    const peopleCounts: Record<string, { name: string; avatar?: string; count: number }> = {}
    
    if (!peopleError && topPeople) {
      topPeople.forEach((face: any) => {
        if (face.contact_id && face.contacts) {
          const id = face.contact_id
          if (!peopleCounts[id]) {
            peopleCounts[id] = {
              name: face.contacts.full_name,
              avatar: face.contacts.avatar_url,
              count: 0
            }
          }
          peopleCounts[id].count++
        }
      })
    }

    const topPeopleList: PersonStats[] = Object.entries(peopleCounts)
      .map(([id, data]) => ({
        id,
        name: data.name,
        avatar_url: data.avatar,
        memory_count: data.count
      }))
      .sort((a, b) => b.memory_count - a.memory_count)
      .slice(0, 5)

    // Calculate milestones
    const milestones: Milestone[] = []
    
    // First memory
    if (memories && memories.length > 0) {
      const firstMemory = memories[0]
      milestones.push({
        type: 'first',
        label: '🎉 First Memory',
        memory_id: firstMemory.id,
        memory_title: firstMemory.title,
        memory_date: firstMemory.memory_date,
        achieved: true
      })
    }

    // Milestone counts
    const milestoneNumbers = [10, 25, 50, 100, 250, 500, 1000]
    milestoneNumbers.forEach(num => {
      if (totalMemories >= num) {
        const milestone = memories![num - 1]
        milestones.push({
          type: 'count',
          label: `🏆 ${num}th Memory`,
          memory_id: milestone?.id,
          memory_title: milestone?.title,
          memory_date: milestone?.memory_date,
          achieved: true
        })
      } else if (num === milestoneNumbers.find(n => n > totalMemories)) {
        // Next milestone to achieve
        milestones.push({
          type: 'count',
          label: `🎯 ${num}th Memory`,
          achieved: false
        })
      }
    })

    // Check for 1 year anniversary
    if (memories && memories.length > 0) {
      const firstDate = new Date(memories[0].memory_date || memories[0].created_at)
      const now = new Date()
      const yearsDiff = (now.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24 * 365)
      
      if (yearsDiff >= 1) {
        milestones.push({
          type: 'anniversary',
          label: '📅 1 Year of Memories',
          achieved: true
        })
      }
    }

    return NextResponse.json({
      totalMemories,
      totalMedia,
      totalPhotos,
      totalVideos,
      byYear,
      richestMonth: richestMonth ? {
        month: richestMonth[0],
        count: richestMonth[1],
        label: formatMonth(richestMonth[0])
      } : null,
      currentStreak,
      maxStreak,
      topPeople: topPeopleList,
      milestones,
      // Additional fun stats
      averagePerMonth: totalMemories > 0 && byYear.length > 0
        ? Math.round(totalMemories / (Object.keys(monthlyStats).length || 1))
        : 0,
      oldestMemoryYear: byYear.length > 0 ? byYear[0].year : null,
      newestMemoryYear: byYear.length > 0 ? byYear[byYear.length - 1].year : null
    })

  } catch (error) {
    console.error('Stats error:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}

function formatMonth(monthStr: string): string {
  const [year, month] = monthStr.split('-')
  const date = new Date(parseInt(year), parseInt(month) - 1)
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}
