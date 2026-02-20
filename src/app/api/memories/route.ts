import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/memories - List memories
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const searchParams = request.nextUrl.searchParams
  const limit = parseInt(searchParams.get('limit') || '50')
  const offset = parseInt(searchParams.get('offset') || '0')
  const category = searchParams.get('category')
  const year = searchParams.get('year')

  let query = supabase
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
    .order('memory_date', { ascending: false, nullsFirst: false })
    .range(offset, offset + limit - 1)

  if (category) {
    query = query.eq('ai_category', category)
  }

  if (year) {
    const startDate = `${year}-01-01`
    const endDate = `${year}-12-31`
    query = query.gte('memory_date', startDate).lte('memory_date', endDate)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ memories: data })
}

// POST /api/memories - Create memory
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const {
    title,
    description,
    memory_date,
    memory_type = 'moment',
    location_name,
    location_lat,
    location_lng,
  } = body

  const { data, error } = await supabase
    .from('memories')
    .insert({
      user_id: user.id,
      title,
      description,
      memory_date,
      memory_type,
      location_name,
      location_lat,
      location_lng,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ memory: data })
}
