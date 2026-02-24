import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// PATCH /api/media/[id] - Update media metadata (date, location)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: mediaId } = await params
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verify media belongs to user
  const { data: existingMedia } = await supabase
    .from('memory_media')
    .select('id, memory_id')
    .eq('id', mediaId)
    .eq('user_id', user.id)
    .single()

  if (!existingMedia) {
    return NextResponse.json({ error: 'Media not found' }, { status: 404 })
  }

  const body = await request.json()
  console.log('PATCH /api/media - received body:', body)
  
  const { taken_at, exif_lat, exif_lng, location_name } = body

  const updates: Record<string, unknown> = {}
  
  if (taken_at !== undefined) {
    updates.taken_at = taken_at
  }
  if (exif_lat !== undefined) {
    updates.exif_lat = exif_lat
  }
  if (exif_lng !== undefined) {
    updates.exif_lng = exif_lng
  }

  console.log('PATCH /api/media - updates to apply:', updates)

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No updates provided' }, { status: 400 })
  }

  const { data: media, error } = await supabase
    .from('memory_media')
    .update(updates)
    .eq('id', mediaId)
    .select()
    .single()

  if (error) {
    console.error('Media update error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Also update parent memory if this is the cover photo or memory has no date/location
  const memoryUpdates: Record<string, unknown> = {}
  
  if (taken_at) {
    const { data: currentMemory } = await supabase
      .from('memories')
      .select('memory_date')
      .eq('id', existingMedia.memory_id)
      .single()
    
    // Update memory date if it's today's date (placeholder)
    if (currentMemory?.memory_date === new Date().toISOString().split('T')[0]) {
      memoryUpdates.memory_date = taken_at.split('T')[0]
    }
  }
  
  if (exif_lat && exif_lng) {
    // Always update memory location when photo location is set
    memoryUpdates.location_lat = exif_lat
    memoryUpdates.location_lng = exif_lng
    if (location_name) {
      memoryUpdates.location_name = location_name
    }
  }

  if (Object.keys(memoryUpdates).length > 0) {
    await supabase.from('memories').update(memoryUpdates).eq('id', existingMedia.memory_id)
  }

  // Award XP for adding metadata
  if ((taken_at || exif_lat) && user.id) {
    try {
      await supabase.rpc('award_xp', { 
        p_user_id: user.id, 
        p_amount: 10, 
        p_reason: 'Added photo metadata' 
      })
    } catch (e) {
      // XP function might not exist, ignore
    }
  }

  return NextResponse.json({ media })
}

// GET /api/media/[id] - Get single media item
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: mediaId } = await params
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: media, error } = await supabase
    .from('memory_media')
    .select(`
      *,
      memory:memories(id, title, memory_date, location_name)
    `)
    .eq('id', mediaId)
    .eq('user_id', user.id)
    .single()

  if (error || !media) {
    return NextResponse.json({ error: 'Media not found' }, { status: 404 })
  }

  return NextResponse.json({ media })
}
