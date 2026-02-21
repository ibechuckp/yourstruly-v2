import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { XP_REWARDS } from '@/lib/xp/xpService'

/**
 * POST /api/media/[id]/caption - Add caption/backstory to media
 * 
 * Awards:
 * - XP_REWARDS.ADD_PHOTO_BACKSTORY (15 XP) for full backstory only
 * - No XP for caption alone
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: mediaId } = await params
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { caption, backstory, mood, significance, peopleMentioned } = body

  // Verify media belongs to user
  const { data: media } = await supabase
    .from('memory_media')
    .select('id, user_id')
    .eq('id', mediaId)
    .single()

  if (!media || media.user_id !== user.id) {
    return NextResponse.json({ error: 'Media not found' }, { status: 404 })
  }

  // Check existing backstory record
  const { data: existing } = await supabase
    .from('media_backstories')
    .select('id, xp_awarded')
    .eq('media_id', mediaId)
    .single()

  const existingXP = existing?.xp_awarded || 0

  // Upsert backstory
  const backstoryData = {
    media_id: mediaId,
    user_id: user.id,
    caption: caption || null,
    backstory: backstory || null,
    mood: mood || null,
    significance: significance || null,
    people_mentioned: peopleMentioned || null,
    updated_at: new Date().toISOString(),
  }

  const { error } = existing
    ? await supabase
        .from('media_backstories')
        .update(backstoryData)
        .eq('id', existing.id)
    : await supabase
        .from('media_backstories')
        .insert(backstoryData)

  if (error) {
    console.error('Backstory error:', error)
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
  }

  // Calculate XP to award - ONLY backstory earns XP
  let xpToAward = 0
  let newXPLevel = existingXP

  // Has full backstory? Award up to 15 XP
  if (backstory && backstory.length > 20 && existingXP < XP_REWARDS.ADD_PHOTO_BACKSTORY) {
    xpToAward = XP_REWARDS.ADD_PHOTO_BACKSTORY - existingXP
    newXPLevel = XP_REWARDS.ADD_PHOTO_BACKSTORY
  }
  // No XP for just caption

  if (xpToAward > 0) {
    await supabase.rpc('award_xp', {
      p_user_id: user.id,
      p_amount: xpToAward,
      p_action: backstory ? 'photo_backstory' : 'photo_caption',
      p_description: backstory ? 'Added backstory to photo' : 'Added caption to photo',
      p_reference_type: 'media',
      p_reference_id: mediaId,
    })

    // Update XP awarded tracking
    await supabase
      .from('media_backstories')
      .update({ xp_awarded: newXPLevel })
      .eq('media_id', mediaId)
  }

  // Also mark media as having backstory
  await supabase
    .from('media_items')
    .update({ has_backstory: true })
    .eq('id', mediaId)

  return NextResponse.json({
    success: true,
    xpAwarded: xpToAward,
  })
}

/**
 * GET /api/media/[id]/caption - Get caption/backstory for media
 */
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

  const { data: backstory } = await supabase
    .from('media_backstories')
    .select('*')
    .eq('media_id', mediaId)
    .eq('user_id', user.id)
    .single()

  return NextResponse.json({ backstory: backstory || null })
}
